const Workshop = require('../models/Workshop');
const Registration = require('../models/Registration');

/**
 * @route   GET /api/workshops
 * @desc    Get workshops with filters (date range, status, seat availability, search)
 * @access  Public
 */
const getWorkshops = async (req, res, next) => {
  try {
    const {
      status,
      startDate,
      endDate,
      search,
      onlyAvailable,
      sortBy = 'dateTime',
      sortOrder = 'asc'
    } = req.query;

    // Build query filter
    const query = {};

    // Filter by status if specified
    if (status) {
      query.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      query.dateTime = {};
      if (startDate) {
        query.dateTime.$gte = new Date(startDate);
      }
      if (endDate) {
        query.dateTime.$lte = new Date(endDate);
      }
    }

    // Search filter (code, title, instructor)
    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { code: searchRegex },
        { title: searchRegex },
        { instructor: searchRegex }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Fetch workshops matching criteria
    const workshops = await Workshop.find(query).sort(sortOptions).lean();

    // Compute active registration counts and seat availability for each workshop
    const workshopIds = workshops.map((w) => w._id);

    const activeRegistrations = await Registration.aggregate([
      {
        $match: {
          workshopId: { $in: workshopIds },
          status: 'active'
        }
      },
      {
        $group: {
          _id: '$workshopId',
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = {};
    activeRegistrations.forEach((item) => {
      countMap[item._id.toString()] = item.count;
    });

    let enrichedWorkshops = workshops.map((workshop) => {
      const activeCount = countMap[workshop._id.toString()] || 0;
      const availableSeats = Math.max(0, workshop.capacity - activeCount);
      return {
        ...workshop,
        activeRegistrationsCount: activeCount,
        availableSeats,
        isFull: availableSeats === 0
      };
    });

    // Filter by availability if requested
    if (onlyAvailable === 'true' || onlyAvailable === true) {
      enrichedWorkshops = enrichedWorkshops.filter(
        (w) => w.availableSeats > 0 && w.status === 'active'
      );
    }

    return res.status(200).json({
      success: true,
      count: enrichedWorkshops.length,
      data: enrichedWorkshops
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/workshops/:id
 * @desc    Get single workshop details by ID
 * @access  Public
 */
const getWorkshopById = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id).lean();

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    const activeCount = await Registration.countDocuments({
      workshopId: workshop._id,
      status: 'active'
    });

    const availableSeats = Math.max(0, workshop.capacity - activeCount);

    return res.status(200).json({
      success: true,
      data: {
        ...workshop,
        activeRegistrationsCount: activeCount,
        availableSeats,
        isFull: availableSeats === 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/workshops
 * @desc    Create a new workshop
 * @access  Private (Manager only)
 */
const createWorkshop = async (req, res, next) => {
  try {
    const { code, title, instructor, dateTime, capacity, status } = req.body;

    // Validate required fields
    if (!code || !title || !instructor || !dateTime || capacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: code, title, instructor, dateTime, capacity'
      });
    }

    const numCapacity = Number(capacity);
    if (isNaN(numCapacity) || numCapacity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Capacity must be a positive integer greater than or equal to 1'
      });
    }

    // Check if workshop code is already taken
    const existingWorkshop = await Workshop.findOne({
      code: code.toString().toUpperCase().trim()
    });

    if (existingWorkshop) {
      return res.status(400).json({
        success: false,
        message: `Workshop with code '${code.toUpperCase().trim()}' already exists`
      });
    }

    // Create workshop
    const workshop = await Workshop.create({
      code: code.toString().toUpperCase().trim(),
      title: title.trim(),
      instructor: instructor.trim(),
      dateTime: new Date(dateTime),
      capacity: numCapacity,
      status: status || 'active'
    });

    return res.status(201).json({
      success: true,
      message: 'Workshop created successfully',
      data: workshop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/workshops/:id
 * @desc    Update an existing workshop
 * @access  Private (Manager only)
 */
const updateWorkshop = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    const { code, title, instructor, dateTime, capacity, status } = req.body;

    // If updating code, ensure uniqueness
    if (code && code.toUpperCase().trim() !== workshop.code) {
      const codeExists = await Workshop.findOne({
        code: code.toUpperCase().trim(),
        _id: { $ne: workshop._id }
      });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: `Workshop code '${code.toUpperCase().trim()}' is already in use`
        });
      }
      workshop.code = code.toUpperCase().trim();
    }

    // If updating capacity, ensure it's not less than current active registrations
    if (capacity !== undefined) {
      const newCapacity = Number(capacity);
      if (isNaN(newCapacity) || newCapacity < 1) {
        return res.status(400).json({
          success: false,
          message: 'Capacity must be a positive integer of at least 1'
        });
      }

      const activeRegistrationsCount = await Registration.countDocuments({
        workshopId: workshop._id,
        status: 'active'
      });

      if (newCapacity < activeRegistrationsCount) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce capacity to ${newCapacity}. There are already ${activeRegistrationsCount} active registrations for this workshop`
        });
      }

      workshop.capacity = newCapacity;
    }

    if (title) workshop.title = title.trim();
    if (instructor) workshop.instructor = instructor.trim();
    if (dateTime) workshop.dateTime = new Date(dateTime);
    if (status) workshop.status = status;

    const updatedWorkshop = await workshop.save();

    return res.status(200).json({
      success: true,
      message: 'Workshop updated successfully',
      data: updatedWorkshop
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/workshops/:id
 * @desc    Cancel a workshop (soft cancel status)
 * @access  Private (Manager only)
 */
const cancelWorkshop = async (req, res, next) => {
  try {
    const workshop = await Workshop.findById(req.params.id);

    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    const { reason } = req.body || {};
    workshop.status = 'cancelled';
    workshop.cancelReason = (reason && reason.trim()) || 'Workshop cancelled by manager';
    workshop.cancelledBy = req.user._id;
    await workshop.save();

    return res.status(200).json({
      success: true,
      message: 'Workshop cancelled successfully',
      data: workshop
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  cancelWorkshop
};
