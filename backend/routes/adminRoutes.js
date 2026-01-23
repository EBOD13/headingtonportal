const express = require('express');
const router = express.Router();

const { protect, requireRole, requirePermission } = require('../middleware/authMiddleware');

const {
  getClerkRoster,
  getClerkDetailWithActivity,
  updateClerkStatus,
  deleteClerk
} = require('../controllers/adminClerkController');

const {
  getResidentRoster,
  updateResidentStatus,
  deleteResidentAdmin
} = require('../controllers/adminResidentController');

const { getActivityFeed } = require('../controllers/adminActivityController');
const { exportVisitationCsv } = require('../controllers/exportController');
const { getInbox, sendMessage, markMessageRead } = require('../controllers/mailboxController');
const {
  getProfile,
  updateProfile,
  changePassword
} = require('../controllers/adminProfileController');

const {
  importResidentsFromFile,
  importClerksFromFile
} = require('../controllers/adminImportController');

const { uploadSingleFile } = require('../middleware/uploadMiddleware');

// All admin routes require auth & at least 'admin' or 'supervisor'
router.use(protect, requireRole('admin', 'supervisor'));

// ----- Clerks -----
router.get('/clerks', requirePermission('manage_clerks'), getClerkRoster);
router.get('/clerks/:id', requirePermission('manage_clerks'), getClerkDetailWithActivity);
router.put('/clerks/:id/status', requirePermission('manage_clerks'), updateClerkStatus);
router.delete('/clerks/:id', requirePermission('manage_clerks'), deleteClerk);

// Batch import clerks (CSV/Excel)
router.post(
  '/clerks/import',
  requirePermission('manage_clerks'),
  uploadSingleFile,
  importClerksFromFile
);

// ----- Residents -----
router.get('/residents', requirePermission('view_residents'), getResidentRoster);
router.put('/residents/:id/status', requirePermission('edit_residents'), updateResidentStatus);
router.delete('/residents/:id', requirePermission('delete_residents'), deleteResidentAdmin);

// Batch import residents
router.post(
  '/residents/import',
  requirePermission('edit_residents'),
  uploadSingleFile,
  importResidentsFromFile
);

// ----- Activity feed -----
router.get('/activity', requirePermission('view_reports'), getActivityFeed);

// ----- Exports -----
router.get('/exports/visitation', requirePermission('generate_reports'), exportVisitationCsv);

// ----- Mailbox -----
router.get('/mail', getInbox);
router.post('/mail', sendMessage);
router.patch('/mail/:id/read', markMessageRead);

// ----- Profile -----
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/password', changePassword);

module.exports = router;
