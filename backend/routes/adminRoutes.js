// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const {
  protect,
  requireRole,
  requirePermission,
} = require('../middleware/authMiddleware');

// Import controllers (some of these may not yet export all functions)
const adminClerkController = require('../controllers/adminClerkController');
const residentAdminController = require('../controllers/adminResidentController');
const activityController = require('../controllers/adminActivityController');
const exportController = require('../controllers/exportController');
const mailboxController = require('../controllers/mailboxController');
const profileController = require('../controllers/adminProfileController');
const importController = require('../controllers/adminImportController');

const { uploadSingleFile } = require('../middleware/uploadMiddleware');

// Destructure with defaults (may be undefined if not exported)
const {
  adminCreateClerk,
  getClerkRoster,
  getClerkDetailWithActivity,
  updateClerkStatus,
  deleteClerk,
  resendClerkInvite,
  runExpiryCheck,
} = adminClerkController;

const {
  getResidentRoster,
  updateResidentStatus,
  deleteResidentAdmin,
} = residentAdminController;

const { getActivityFeed } = activityController;
const { exportVisitationCsv } = exportController;

const {
  getInbox,
  sendMessage,
  markMessageRead,
} = mailboxController;

const {
  getProfile,
  updateProfile,
  changePassword,
} = profileController;

const {
  importResidentsFromFile,
  importClerksFromFile,
} = importController;

// ---------------------------------------------------------------------------
// Helper: safely register routes so undefined handlers don't crash Express
// ---------------------------------------------------------------------------

function safeRoute(method, path, ...handlers) {
  // Last handler should be the actual controller function
  const last = handlers[handlers.length - 1];

  if (typeof last !== 'function') {
    console.warn(
      `[adminRoutes] Skipping route ${method.toUpperCase()} ${path} – handler is not a function (got: ${typeof last}).`
    );
    return;
  }

  if (typeof router[method] !== 'function') {
    console.warn(
      `[adminRoutes] Invalid HTTP method "${method}" for path ${path}`
    );
    return;
  }

  router[method](path, ...handlers);
}

// ============================================================
// Global guard: all admin routes require auth + admin/supervisor
// ============================================================
router.use(protect, requireRole('admin', 'supervisor'));

// ============================================================
// CLERKS
// Base path: /api/admin/clerks
// ============================================================

// Create a new clerk (used by adminCreateClerk thunk)
safeRoute(
  'post',
  '/clerks',
  requirePermission('manage_clerks'),
  adminCreateClerk
);

// Get all clerks
safeRoute(
  'get',
  '/clerks',
  requirePermission('manage_clerks'),
  getClerkRoster
);

// Get one clerk + recent activity
safeRoute(
  'get',
  '/clerks/:id',
  requirePermission('manage_clerks'),
  getClerkDetailWithActivity
);

// Update clerk status (active / paused)
safeRoute(
  'put',
  '/clerks/:id/status',
  requirePermission('manage_clerks'),
  updateClerkStatus
);

// Delete a clerk
safeRoute(
  'delete',
  '/clerks/:id',
  requirePermission('manage_clerks'),
  deleteClerk
);

// Batch import clerks from CSV/Excel
safeRoute(
  'post',
  '/clerks/import',
  requirePermission('manage_clerks'),
  uploadSingleFile,
  importClerksFromFile
);

// Resend clerk registration link
safeRoute(
  'post',
  '/clerks/:id/resend-invite',
  requirePermission('manage_clerks'),
  resendClerkInvite
);

// Run clerk expiry check manually (optional)
safeRoute(
  'post',
  '/clerks/run-expiry-check',
  requirePermission('manage_clerks'),
  runExpiryCheck
);

// ============================================================
// RESIDENTS
// Base path: /api/admin/residents
// ============================================================

// Get full resident roster (admin view)
safeRoute(
  'get',
  '/residents',
  requirePermission('view_residents'),
  getResidentRoster
);

// Update resident status (e.g., active / paused)
safeRoute(
  'put',
  '/residents/:id/status',
  requirePermission('edit_residents'),
  updateResidentStatus
);

// Delete resident (admin-only destructive op)
safeRoute(
  'delete',
  '/residents/:id',
  requirePermission('delete_residents'),
  deleteResidentAdmin
);

// Batch import residents from CSV/Excel
safeRoute(
  'post',
  '/residents/import',
  requirePermission('edit_residents'),
  uploadSingleFile,
  importResidentsFromFile
);

// ============================================================
// ACTIVITY FEED
// Base path: /api/admin/activity
// ============================================================
safeRoute(
  'get',
  '/activity',
  requirePermission('view_reports'),
  getActivityFeed
);

// ============================================================
// EXPORTS
// Base path: /api/admin/exports
// ============================================================

// Export visitation log as CSV
safeRoute(
  'get',
  '/exports/visitation',
  requirePermission('generate_reports'),
  exportVisitationCsv
);

// ============================================================
// MAILBOX
// Base path: /api/admin/mail
// ============================================================

// Get mailbox/inbox
safeRoute('get', '/mail', getInbox);

// Send a message
safeRoute('post', '/mail', sendMessage);

// Mark a message as read
safeRoute('patch', '/mail/:id/read', markMessageRead);

// ============================================================
// ADMIN PROFILE
// Base path: /api/admin/profile
// ============================================================

// Get admin profile
safeRoute('get', '/profile', getProfile);

// Update admin profile
safeRoute('put', '/profile', updateProfile);

// Change admin password
safeRoute('put', '/profile/password', changePassword);

module.exports = router;
