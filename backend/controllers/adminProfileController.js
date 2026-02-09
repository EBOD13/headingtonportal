const asyncHandler = require('express-async-handler');
const Clerk = require('../models/clerkModel');

// GET /api/admin/profile
const getProfile = asyncHandler(async (req, res) => {
  const clerk = await Clerk.findById(req.clerk._id).select(
    'name email role clerkID lastLogin'
  );
  res.status(200).json(clerk);
});

// PUT /api/admin/profile
// Body: { name?, email? }
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email } = req.body;

  const clerk = await Clerk.findById(req.clerk._id);
  if (!clerk) {
    return res.status(404).json({ message: 'Clerk not found' });
  }

  if (name) clerk.name = name;
  if (email) clerk.email = email;

  await clerk.save();

  res.status(200).json({
    message: 'Profile updated',
    clerk: { name: clerk.name, email: clerk.email }
  });
});

// PUT /api/admin/profile/password
// Body: { currentPassword, newPassword }
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: 'Current and new password are required' });
  }

  const clerk = await Clerk.findById(req.clerk._id);
  if (!clerk) {
    return res.status(404).json({ message: 'Clerk not found' });
  }

  const match = await clerk.matchPassword(currentPassword);
  if (!match) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }

  clerk.password = newPassword; 
  await clerk.save();

  res.status(200).json({ message: 'Password updated successfully' });
});

module.exports = {
  getProfile,
  updateProfile,
  changePassword
};
