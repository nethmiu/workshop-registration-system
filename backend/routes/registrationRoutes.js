const express = require('express');
const router = express.Router();
const {
  registerAttendee,
  cancelRegistration,
  getRegistrations,
  getRegistrationById
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All registration routes require authentication and strictly allow ONLY Staff and Manager
router.use(protect);
router.use(authorize('staff', 'manager'));

router.get('/', getRegistrations);
router.get('/:id', getRegistrationById);
router.post('/', registerAttendee);
router.patch('/:id/cancel', cancelRegistration);
router.delete('/:id', cancelRegistration);

module.exports = router;
