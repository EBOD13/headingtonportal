// backend/routes/guestRoutes.js
const express = require('express')
const router = express.Router()
const { protect } = require("../middleware/authMiddleware")
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
} = require("../controllers/guestController")

// Existing routes
router.get('/', protect, getGuests);
router.get('/:id', protect, getGuestById);
router.post("/register", protect, registerGuest);
router.get("/allguests", protect, getCheckedInGuests);
router.put("/checkout/:guestId", protect, checkOutGuest);
router.put("/checkin/:guestId", protect, checkInGuest);
router.put("/:id", protect, updateGuest);
router.put("/flag/:id", protect, flagGuest);

// Analytics routes
router.get("/analytics/overview", protect, getAnalyticsOverview);
router.get("/analytics/rooms", protect, getRoomAnalytics);
router.get("/analytics/activity", protect, getActivityTimeline);
router.get("/analytics/timeline", protect, getTimelineAnalytics);
router.get("/analytics/export", protect, getExportData);

module.exports = router