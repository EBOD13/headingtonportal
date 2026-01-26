// backend/routes/guestRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  checkInGuest,
  checkOutGuest,
  registerGuest,
  getCheckedInGuests,
  getGuests,
  getGuestById,
  updateGuest,
  flagGuest,
  getAnalyticsOverview,
  getRoomAnalytics,
  getActivityTimeline,
  getTimelineAnalytics,
  getExportData
} = require("../controllers/guestController");

// List all guests
router.get('/', protect, getGuests);

// Checked-in guests (MUST be before "/:id")
router.get("/allguests", protect, getCheckedInGuests);

// Register guest
router.post("/register", protect, registerGuest);

// Check-in / check-out (more specific than "/:id")
router.put("/checkout/:guestId", protect, checkOutGuest);
router.put("/checkin/:guestId", protect, checkInGuest);

// Flag/unflag guest
router.put("/flag/:id", protect, flagGuest);

// Analytics routes
router.get("/analytics/overview", protect, getAnalyticsOverview);
router.get("/analytics/rooms", protect, getRoomAnalytics);
router.get("/analytics/activity", protect, getActivityTimeline);
router.get("/analytics/timeline", protect, getTimelineAnalytics);
router.get("/analytics/export", protect, getExportData);

// These should be put last they don't swallow everything:
router.get('/:id', protect, getGuestById);
router.put('/:id', protect, updateGuest);

module.exports = router;
