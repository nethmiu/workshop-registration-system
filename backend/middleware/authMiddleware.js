const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Authenticate JWT token and attach user to req.user
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: No token provided'
        });
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'fallback_secret_key_12345'
      );

      // Fetch user from DB excluding password
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: User belonging to this token no longer exists'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Authentication error:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Invalid or expired token'
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Bearer token is required'
    });
  }
};

/**
 * Grant access to specific user roles (Role-Based Access Control)
 * @param  {...string} roles - Array of allowed roles (e.g., 'admin', 'manager', 'staff')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: User context is missing'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user.role}' is not authorized to access this resource. Allowed roles: [${roles.join(', ')}]`
      });
    }

    next();
  };
};

module.exports = {
  protect,
  authorize
};
