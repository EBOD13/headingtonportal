// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();

const {
  protect,
  requireRole,
  requirePermission,
} = require('../middleware/authMiddleware');

const {
  getClerkRoster,
  getClerkDetailWithActivity,
  updateClerkStatus,
  deleteClerk,
  createClerkAdmin,
  resetClerkPasswordAdmin
} = require('../controllers/adminClerkController');

const {
  getResidentRoster,
  updateResidentStatus,
  deleteResidentAdmin,
} = require('../controllers/adminResidentController');

const { getActivityFeed } = require('../controllers/adminActivityController');
const {
  exportVisitationCsv: rawExportVisitationCsv,
} = require('../controllers/exportController');

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

// ========================================================
// Auth: all /api/admin routes must be authenticated
// ========================================================
router.use(protect);
// When you’re ready to enforce roles, swap to:
// router.use(protect, requireRole('admin', 'supervisor'));

// ========================================================
// Safe wrapper for exportVisitationCsv
// (so Express never receives "undefined" as a handler)
// ========================================================
const exportVisitationCsv =
  typeof rawExportVisitationCsv === 'function'
    ? rawExportVisitationCsv
    : (req, res) => {
        return res.status(501).json({
          success: false,
          message:
            'Visitation CSV export is not implemented on the server yet.',
        });
      };

// ========================================================
// Clerks
// ========================================================

// GET /api/admin/clerks
router.get(
  '/clerks',
  requirePermission('manage_clerks'),
  getClerkRoster
);

// GET /api/admin/clerks/:id
router.get(
  '/clerks/:id',
  requirePermission('manage_clerks'),
  getClerkDetailWithActivity
);

// PUT /api/admin/clerks/:id/status
router.put(
  '/clerks/:id/status',
  requirePermission('manage_clerks'),
  updateClerkStatus
);

// DELETE /api/admin/clerks/:id
router.delete(
  '/clerks/:id',
  requirePermission('manage_clerks'),
  deleteClerk
);

// POST /api/admin/clerks/import  (CSV/Excel upload)
router.post(
  '/clerks/import',
  requirePermission('manage_clerks'),
  uploadSingleFile,
  importClerksFromFile
);

// ========================================================
// Residents (admin view)
// ========================================================

// GET /api/admin/residents
router.get(
  '/residents',
  requirePermission('view_residents'),
  getResidentRoster
);

// PUT /api/admin/residents/:id/status
router.put(
  '/residents/:id/status',
  requirePermission('edit_residents'),
  updateResidentStatus
);

// DELETE /api/admin/residents/:id
router.delete(
  '/residents/:id',
  requirePermission('delete_residents'),
  deleteResidentAdmin
);

// POST /api/admin/residents/import
router.post(
  '/residents/import',
  requirePermission('edit_residents'),
  uploadSingleFile,
  importResidentsFromFile
);

// ========================================================
// Activity Feed
// ========================================================

// GET /api/admin/activity
router.get(
  '/activity',
  requirePermission('view_reports'),
  getActivityFeed
);

// ========================================================
// Exports
// ========================================================

// GET /api/admin/exports/visitation
router.get(
  '/exports/visitation',
  requirePermission('generate_reports'),
  exportVisitationCsv
);

// ========================================================
// Mailbox
// ========================================================

// GET /api/admin/mail
router.get('/mail', getInbox);

// POST /api/admin/mail
router.post('/mail', sendMessage);

// PATCH /api/admin/mail/:id/read
router.patch('/mail/:id/read', markMessageRead);

// ========================================================
// Admin Profile
// ========================================================

// GET /api/admin/profile
router.get('/profile', getProfile);

// PUT /api/admin/profile
router.put('/profile', updateProfile);

// PUT /api/admin/profile/password
router.put('/profile/password', changePassword);

router.post('/clerks', requirePermission('manage_clerks'), createClerkAdmin);

//  admin-triggered reset
router.post('/clerks/:id/reset-password', requirePermission('manage_clerks'), resetClerkPasswordAdmin);

module.exports = router;
