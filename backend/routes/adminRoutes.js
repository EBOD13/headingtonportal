// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const {
  protect,
  requireRole,
  requirePermission,
} = require('../middleware/authMiddleware');

const {
  adminCreateClerk,
  getClerkRoster,
  getClerkDetailWithActivity,
  updateClerkStatus,
  deleteClerk,
} = require('../controllers/adminClerkController');

const {
  getResidentRoster,
  updateResidentStatus,
  deleteResidentAdmin,
} = require('../controllers/adminResidentController');

const { getActivityFeed } = require('../controllers/adminActivityController');
const { exportVisitationCsv } = require('../controllers/exportController');
const {
  getInbox,
  sendMessage,
  markMessageRead,
} = require('../controllers/mailboxController');

const {
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/adminProfileController');

const {
  importResidentsFromFile,
  importClerksFromFile,
} = require('../controllers/adminImportController');

const { uploadSingleFile } = require('../middleware/uploadMiddleware');

// ============================================================
// Global guard: all admin routes require auth + admin/supervisor
// ============================================================
router.use(protect, requireRole('admin', 'supervisor'));

// ============================================================
// CLERKS
// Base path: /api/admin/clerks
// ============================================================

// Create a new clerk (used by adminCreateClerk thunk)
router.post(
  '/clerks',
  requirePermission('manage_clerks'),
  adminCreateClerk
);

// Get all clerks
router.get(
  '/clerks',
  requirePermission('manage_clerks'),
  getClerkRoster
);

// Get one clerk + recent activity
router.get(
  '/clerks/:id',
  requirePermission('manage_clerks'),
  getClerkDetailWithActivity
);

// Update clerk status (active / paused)
router.put(
  '/clerks/:id/status',
  requirePermission('manage_clerks'),
  updateClerkStatus
);

// Delete a clerk
router.delete(
  '/clerks/:id',
  requirePermission('manage_clerks'),
  deleteClerk
);

// Batch import clerks from CSV/Excel
router.post(
  '/clerks/import',
  requirePermission('manage_clerks'),
  uploadSingleFile,
  importClerksFromFile
);

// ============================================================
// RESIDENTS
// Base path: /api/admin/residents
// ============================================================

// Get full resident roster (admin view)
router.get(
  '/residents',
  requirePermission('view_residents'),
  getResidentRoster
);

// Update resident status (e.g., active / paused)
router.put(
  '/residents/:id/status',
  requirePermission('edit_residents'),
  updateResidentStatus
);

// Delete resident (admin-only destructive op)
router.delete(
  '/residents/:id',
  requirePermission('delete_residents'),
  deleteResidentAdmin
);

// Batch import residents from CSV/Excel
router.post(
  '/residents/import',
  requirePermission('edit_residents'),
  uploadSingleFile,
  importResidentsFromFile
);

// ============================================================
// ACTIVITY FEED
// Base path: /api/admin/activity
// ============================================================
router.get(
  '/activity',
  requirePermission('view_reports'),
  getActivityFeed
);

// ============================================================
// EXPORTS
// Base path: /api/admin/exports
// ============================================================

// Export visitation log as CSV
router.get(
  '/exports/visitation',
  requirePermission('generate_reports'),
  exportVisitationCsv
);

// ============================================================
// MAILBOX
// Base path: /api/admin/mail
// ============================================================

// Get mailbox/inbox
router.get('/mail', getInbox);

// Send a message
router.post('/mail', sendMessage);

// Mark a message as read
router.patch('/mail/:id/read', markMessageRead);

// ============================================================
// ADMIN PROFILE
// Base path: /api/admin/profile
// ============================================================

// Get admin profile
router.get('/profile', getProfile);

// Update admin profile
router.put('/profile', updateProfile);

// Change admin password
router.put('/profile/password', changePassword);

module.exports = router;
