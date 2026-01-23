// backend/routes/residentRoutes.js
const express = require('express');
const router = express.Router();

const {
  registerResident,
  getResidents,
  updateResident,
  deleteResident,
  getResidentByRoom,
  getGuestsByHost,
  getResidentStats,
  searchResidents,
} = require('../controllers/residentController');

const { protect } = require('../middleware/authMiddleware');

// Order: more specific → less specific
router.get('/', protect, getResidents);
router.get('/search', protect, searchResidents);          // /api/residents/search
router.get('/stats', protect, getResidentStats);          // /api/residents/stats
router.get('/guests/:hostId', protect, getGuestsByHost);  // /api/residents/guests/:hostId
router.get('/:room', protect, getResidentByRoom);         // /api/residents/S222

router.post('/', protect, registerResident);
router.put('/:id', protect, updateResident);
router.delete('/:id', protect, deleteResident);

module.exports = router;
