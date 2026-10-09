const mongoose = require('mongoose');
const Registration = require('../models/Registration');
const Workshop = require('../models/Workshop');

/**
 * @route   POST /api/registrations
 * @desc    Register an attendee for a workshop with atomic capacity checks
 * @access  Private (Staff, Manager, Admin)
 */
const registerAttendee = async (req, res, next) => {
  let session = null;
  const isReplicaSet = mongoose.connection.client?.topology?.description?.type !== 'Single';

  try {
    const { workshopId, attendeeName, attendeeEmail } = req.body;

    // Validate required fields
    if (!workshopId || !attendeeName || !attendeeEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide workshopId, attendeeName, and attendeeEmail'
      });
    }

    if (!mongoose.Types.ObjectId.isValid(workshopId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Workshop ID format'
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(attendeeEmail.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address for the attendee'
      });
    }

    const normalizedEmail = attendeeEmail.toLowerCase().trim();
    const normalizedName = attendeeName.trim();

    // Check if session/transaction can be used for concurrency protection
    if (isReplicaSet) {
      try {
        session = await mongoose.startSession();
        session.startTransaction();
      } catch (err) {
        session = null;
      }
    }

    const sessionOption = session ? { session } : {};

    // 1. Fetch workshop
    const workshop = await Workshop.findById(workshopId, null, sessionOption);

    if (!workshop) {
      if (session) await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    // 2. Check if workshop is active
    if (workshop.status === 'cancelled') {
      if (session) await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot register for a cancelled workshop'
      });
    }

    // 3. Check for duplicate active registration for the same attendee in this workshop
    const existingRegistration = await Registration.findOne(
      {
        workshopId: workshop._id,
        attendeeEmail: normalizedEmail,
        status: 'active'
      },
      null,
      sessionOption
    );

    if (existingRegistration) {
      if (session) await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Attendee '${normalizedEmail}' is already actively registered for this workshop`
      });
    }

    // 4. Critical Concurrency & Capacity check
    const activeRegistrationsCount = await Registration.countDocuments(
      {
        workshopId: workshop._id,
        status: 'active'
      },
      sessionOption
    );

    if (activeRegistrationsCount >= workshop.capacity) {
      if (session) await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Workshop is at full capacity (${activeRegistrationsCount}/${workshop.capacity} seats taken). No seats available`
      });
    }

    // 5. Create new registration
    const newRegistrationData = {
      workshopId: workshop._id,
      attendeeName: normalizedName,
      attendeeEmail: normalizedEmail,
      status: 'active',
      registeredBy: req.user._id,
      cancelledBy: null
    };

    let registration;
    if (session) {
      const created = await Registration.create([newRegistrationData], { session });
      registration = created[0];
      await session.commitTransaction();
    } else {
      registration = await Registration.create(newRegistrationData);
    }

    // Populate registration references for response
    const populatedRegistration = await Registration.findById(registration._id)
      .populate('workshopId', 'code title instructor dateTime capacity status')
      .populate('registeredBy', 'name email role')
      .populate('cancelledBy', 'name email role');

    return res.status(201).json({
      success: true,
      message: 'Attendee registered successfully',
      data: populatedRegistration
    });
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // ignore abort error
      }
    }
    next(error);
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * @route   PATCH /api/registrations/:id/cancel or DELETE /api/registrations/:id
 * @desc    Cancel a registration, free up the seat, and preserve audit history
 * @access  Private (Staff, Manager, Admin)
 */
const cancelRegistration = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Registration ID format'
      });
    }

    const registration = await Registration.findById(id);

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Registration is already cancelled'
      });
    }

    // Mark as cancelled and record who cancelled it with reason (preserves full history)
    const { reason } = req.body || {};
    registration.status = 'cancelled';
    registration.cancelledBy = req.user._id;
    registration.cancelReason = (reason && reason.trim()) || 'Seat cancelled by staff/manager';

    await registration.save();

    // Populate for complete audit trail in response
    const updatedRegistration = await Registration.findById(registration._id)
      .populate('workshopId', 'code title instructor dateTime capacity status')
      .populate('registeredBy', 'name email role')
      .populate('cancelledBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully and seat released',
      data: updatedRegistration
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/registrations
 * @desc    Get all registrations with optional query filters (workshopId, status, attendeeEmail)
 * @access  Private (Staff, Manager, Admin)
 */
const getRegistrations = async (req, res, next) => {
  try {
    const { workshopId, status, attendeeEmail, registeredBy } = req.query;

    const query = {};

    if (workshopId && mongoose.Types.ObjectId.isValid(workshopId)) {
      query.workshopId = workshopId;
    }

    if (status) {
      query.status = status;
    }

    if (attendeeEmail) {
      query.attendeeEmail = attendeeEmail.toLowerCase().trim();
    }

    if (registeredBy && mongoose.Types.ObjectId.isValid(registeredBy)) {
      query.registeredBy = registeredBy;
    }

    const registrations = await Registration.find(query)
      .populate('workshopId', 'code title instructor dateTime capacity status')
      .populate('registeredBy', 'name email role')
      .populate('cancelledBy', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/registrations/:id
 * @desc    Get single registration details with full audit info
 * @access  Private (Staff, Manager, Admin)
 */
const getRegistrationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Registration ID format'
      });
    }

    const registration = await Registration.findById(id)
      .populate('workshopId', 'code title instructor dateTime capacity status')
      .populate('registeredBy', 'name email role')
      .populate('cancelledBy', 'name email role');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: registration
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerAttendee,
  cancelRegistration,
  getRegistrations,
  getRegistrationById
};
