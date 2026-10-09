const express = require('express');
const router = express.Router();
const {
  getWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  cancelWorkshop
} = require('../controllers/workshopController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All workshop routes require authentication and strictly allow ONLY manager and staff
router.use(protect);

// Workshop browsing - restricted to Manager and Staff only (Admin blocked with 403)
router.get('/', authorize('manager', 'staff'), getWorkshops);
router.get('/:id', authorize('manager', 'staff'), getWorkshopById);

// Manager-only routes for workshop creation, modification, and cancellation
router.post('/', authorize('manager'), createWorkshop);
router.put('/:id', authorize('manager'), updateWorkshop);
router.delete('/:id', authorize('manager'), cancelWorkshop);

module.exports = router;
