const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @route   POST /api/users/register
 * @desc    Register a new user (admin, manager, or staff)
 * @access  Public
 */
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Validate password complexity
    const hasMinLength = password.length >= 6;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasMinLength || !hasUppercase || !hasLowercase || !hasNumber || !hasSpecial) {
      return res.status(400).json({
        success: false,
        message:
          'Password must be at least 6 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special symbol'
      });
    }

    // Validate role if specified
    if (role && !['admin', 'manager', 'staff'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role '${role}'. Role must be one of: admin, manager, staff`
      });
    }

    // Check if email is already taken
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists'
      });
    }

    // Create user (password is automatically hashed via pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role || 'staff'
    });

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user & get JWT token
 * @access  Public
 */
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users/me
 * @desc    Get currently logged-in user profile
 * @access  Private
 */
const getCurrentUserProfile = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/users
 * @desc    Get all users list
 * @access  Private (Admin / Manager)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUserProfile,
  getAllUsers
};
