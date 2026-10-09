const jwt = require('jsonwebtoken');

/**
 * Generate JSON Web Token (JWT)
 * @param {string} id - User ID
 * @param {string} role - User Role ('admin', 'manager', 'staff')
 * @returns {string} Signed JWT token
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'fallback_secret_key_12345',
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '30d'
    }
  );
};

module.exports = generateToken;
