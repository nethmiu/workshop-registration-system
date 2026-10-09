const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getCurrentUserProfile,
  getAllUsers
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Public authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected user profile routes (Any authenticated user can view their own profile)
router.get('/me', protect, getCurrentUserProfile);
router.get('/profile', protect, getCurrentUserProfile);

// Admin-only User Directory management route (Manager and Staff blocked with 403)
router.get('/', protect, authorize('admin'), getAllUsers);

module.exports = router;
