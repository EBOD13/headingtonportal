const asyncHandler = require('express-async-handler');
const Clerk = require('../models/clerkModel');
const ActivityLog = require('../models/activityLogModel');
const { logActivity } = require('../utils/activityLogger');
const sendRegisteredClerkEmail = require('../notification/emails/registeredClerkEmail');
const crypto = require('crypto');

// Utility: generate a temp password (tweak pattern if you like)
function generateTempPassword() {
  // 10 chars: letters + numbers
  return crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10);
}

// POST /api/admin/clerks
// Body: { name, email, role?, permissions? }
// Admin creates a clerk; backend generates temp password + reset link
const createClerkAdmin = asyncHandler(async (req, res) => {
  const { name, email, role, permissions } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }

  const existing = await Clerk.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(400).json({ message: 'A clerk with this email already exists' });
  }

  const tempPassword = generateTempPassword();

  const clerk = new Clerk({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: tempPassword, // will be hashed in pre-save
    role: role || 'clerk',
    permissions: Array.isArray(permissions) ? permissions : undefined,
    createdBy: req.clerk?._id || null,
  });

  // configure 3-day window
  const resetToken = clerk.createPasswordResetToken(3 * 24 * 60 * 60 * 1000); // 3 days
  // clerk.needsPasswordReset = true; // set in createPasswordResetToken
  await clerk.save();

  // Build URL for setting password
  const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/set-password/${resetToken}`;

  try {
    await sendRegisteredClerkEmail({
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      tempPassword,
      resetLink,
      expiresInDays: 3,
      isReset: false,
    });
  } catch (err) {
    console.error('Failed to send registered clerk email:', err);
    // You might decide to still keep the clerk, but tell admin email failed
  }

  return res.status(201).json({
    message: 'Clerk created and email sent',
    clerk: {
      _id: clerk._id,
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      role: clerk.role,
      isActive: clerk.isActive,
    },
  });
});

// POST /api/admin/clerks/:id/reset-password
// Admin resets password: new temp password + new reset link
const resetClerkPasswordAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const clerk = await Clerk.findById(id);
  if (!clerk) {
    return res.status(404).json({ message: 'Clerk not found' });
  }

  if (!clerk.isActive) {
    // you can allow this anyway if you want
    console.warn(`Resetting password for inactive clerk ${clerk.email}`);
  }

  const tempPassword = generateTempPassword();
  clerk.password = tempPassword; // will hash
  const resetToken = clerk.createPasswordResetToken(3 * 24 * 60 * 60 * 1000);

  // When admin resets password, you probably want to reactivate so they can use link
  clerk.isActive = true;

  await clerk.save();

  const baseUrl = process.env.FRONTEND_BASE_URL || 'http://localhost:3000';
  const resetLink = `${baseUrl}/set-password/${resetToken}`;

  try {
    await sendRegisteredClerkEmail({
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      tempPassword,
      resetLink,
      expiresInDays: 3,
      isReset: true,
    });
  } catch (err) {
    console.error('Failed to send reset clerk email:', err);
  }

  return res.status(200).json({
    message: 'Temporary password generated and email sent',
  });
});



// GET /api/admin/clerks
// Query: search, role, isActive
const getClerkRoster = asyncHandler(async (req, res) => {
  const { search, role, isActive } = req.query;
  const filter = {};

  if (role) {
    filter.role = role;
  }

  if (isActive !== undefined) {
    filter.isActive = isActive === 'true';
  }

  if (search) {
    const q = search.trim();
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { clerkID: { $regex: q, $options: 'i' } }
    ];
  }

  const clerks = await Clerk.find(filter)
    .select('-password -clerkSecret -refreshTokens')
    .sort({ role: 1, createdAt: -1 });

  res.status(200).json({ count: clerks.length, clerks });
});

// GET /api/admin/clerks/:id
// Includes recent activity for modal
const getClerkDetailWithActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const clerk = await Clerk.findById(id).select(
    '-password -clerkSecret -refreshTokens'
  );
  if (!clerk) {
    return res.status(404).json({ message: 'Clerk not found' });
  }

  const recentActivity = await ActivityLog.find({ actor: clerk._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.status(200).json({ clerk, recentActivity });
});

// PUT /api/admin/clerks/:id/status
// Body: { isActive: boolean }
const updateClerkStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, reason } = req.body;

  const clerk = await Clerk.findById(id);
  if (!clerk) {
    return res.status(404).json({ message: 'Clerk not found' });
  }

  // You might want to prevent an admin from deactivating themselves:
  if (String(clerk._id) === String(req.clerk._id)) {
    return res.status(400).json({
      message: "You cannot change your own status from this screen."
    });
  }

  clerk.isActive = !!isActive;
  await clerk.save();

  await logActivity({
    actorId: req.clerk._id,
    action: 'clerk_status_changed',
    targetType: 'clerk',
    targetId: clerk._id,
    description: `Clerk status changed to ${clerk.isActive ? 'active' : 'deactivated'}${reason ? `: ${reason}` : ''}`,
    metadata: { isActive: clerk.isActive, reason }
  });

  res.status(200).json({
    message: 'Clerk status updated',
    clerk: {
      _id: clerk._id,
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      isActive: clerk.isActive,
      role: clerk.role
    }
  });
});

// DELETE /api/admin/clerks/:id
const deleteClerk = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const clerk = await Clerk.findById(id);
  if (!clerk) {
    return res.status(404).json({ message: 'Clerk not found' });
  }

  if (clerk.isSuperAdmin) {
    return res.status(403).json({
      message: 'Cannot delete a super admin from this screen'
    });
  }

  await Clerk.findByIdAndDelete(id);

  await logActivity({
    actorId: req.clerk._id,
    action: 'clerk_deleted',
    targetType: 'clerk',
    targetId: id,
    description: `Clerk ${clerk.email} deleted`
  });

  res.status(200).json({ message: 'Clerk deleted', id });
});

module.exports = {
  getClerkRoster,
  getClerkDetailWithActivity,
  updateClerkStatus,
  deleteClerk,
  createClerkAdmin,
  resetClerkPasswordAdmin
};
