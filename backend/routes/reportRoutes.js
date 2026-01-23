// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { 
    generateMonthlyReport, 
    sendReportByEmail, 
    getReportStats 
} = require('../controllers/reportController');

// All routes are protected
router.post('/generate', protect, generateMonthlyReport);
router.post('/email', protect, sendReportByEmail);
router.get('/stats', protect, getReportStats);

module.exports = router;