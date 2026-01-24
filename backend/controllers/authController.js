// backend/controllers/authController.js
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Clerk = require('../models/clerkModel');

/**
 * POST /api/auth/set-password/:token
 * Body: { password, password2 }
 *
 * Used by the one-time link we email to the clerk.
 * - Validates token + expiry
 * - Checks mustChangePasswordBy
 * - Sets new password
 * - Clears reset fields
 * - Returns JWT + clerk object so they’re logged in
 */
const setPasswordWithToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, password2 } = req.body;

  if (!password || !password2) {
    return res.status(400).json({ message: 'Password and confirmation are required.' });
  }

  if (password !== password2) {
    return res.status(400).json({ message: 'Passwords do not match.' });
  }

  // Hash the token we received in the URL
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Look for a clerk with that token and a valid expiry
  const clerk = await Clerk.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!clerk) {
    return res.status(400).json({
      message: 'Password reset link is invalid or has expired.',
    });
  }

  // If they missed the deadline, pause account and require admin help
  if (clerk.mustChangePasswordBy && clerk.mustChangePasswordBy < new Date()) {
    clerk.isActive = false;
    clerk.needsPasswordReset = true;
    await clerk.save();

    return res.status(403).json({
      message:
        'This password link has expired and your account is paused. Please contact an admin for a new reset.',
    });
  }

  // Set new password (hashing happens in clerkSchema.pre('save'))
  clerk.password = password;

  // Clear reset-related fields so this token can’t be reused
  clerk.passwordResetToken = undefined;
  clerk.passwordResetExpires = undefined;
  clerk.mustChangePasswordBy = undefined;
  clerk.needsPasswordReset = false;
  clerk.isActive = true; // make sure they’re active after successful update

  await clerk.save();

  // Issue a JWT so they’re logged in right away
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error('JWT_SECRET is not set in environment variables.');
    return res.status(500).json({ message: 'Server configuration error.' });
  }

  const authToken = jwt.sign({ id: clerk._id }, jwtSecret, {
    expiresIn: '30d',
  });

  return res.status(200).json({
    message: 'Password updated successfully.',
    token: authToken,
    clerk: {
      _id: clerk._id,
      name: clerk.name,
      email: clerk.email,
      role: clerk.role,
      clerkID: clerk.clerkID,
      isActive: clerk.isActive,
      createdAt: clerk.createdAt,
    },
  });
});

module.exports = {
  setPasswordWithToken,
};
