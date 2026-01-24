// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { setPasswordWithToken } = require('../controllers/authController');

// POST /api/auth/set-password/:token
router.post('/set-password/:token', setPasswordWithToken);

module.exports = router;
