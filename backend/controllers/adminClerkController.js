// backend/controllers/adminClerkController.js
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const Clerk = require('../models/clerkModel');
const ActivityLog = require('../models/activityLogModel');
const { logActivity } = require('../utils/activityLogger');
const sendRegisteredClerkEmail = require('../notification/emails/registeredClerkEmail');

// Small helper to generate a strong temp password
function generateTempPassword(length = 12) {
  const chars =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@$%&*?';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, chars.length);
    pwd += chars[idx];
  }
  return pwd;
}

// ----------------------------------------
// Admin: Create a new clerk
// POST /api/admin/clerks
// Body: { name, email, role }
// ----------------------------------------
const adminCreateClerk = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      success: false,
      message: 'Name and email are required',
    });
  }

  const existing = await Clerk.findOne({ email });
  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'A clerk with this email already exists',
    });
  }

  // 1) Generate temp password
  const tempPassword = generateTempPassword();

  // 2) Create clerk
  const clerk = new Clerk({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password: tempPassword, // will be hashed in pre-save hook
    role: role || 'clerk',
    isActive: true,
    mustChangePassword: true,
    createdBy: req.clerk?._id || null,
  });

  // 3) Set a "must change by" deadline (3 days)
  const expires = Date.now() + 3 * 24 * 60 * 60 * 1000;
  clerk.passwordResetExpires = new Date(expires);

  // Optional: token for magic-link password set later
  const rawResetToken = crypto.randomBytes(32).toString('hex');
  clerk.passwordResetToken = crypto
    .createHash('sha256')
    .update(rawResetToken)
    .digest('hex');

  await clerk.save();

  // 4) Log activity
  await logActivity({
    actorId: req.clerk?._id,
    action: 'clerk_created',
    targetType: 'clerk',
    targetId: clerk._id,
    description: `Clerk ${clerk.email} created with role ${clerk.role}`,
    metadata: {
      name: clerk.name,
      role: clerk.role,
      clerkID: clerk.clerkID,
    },
  });

  // 5) Build optional set-password URL (for later when you add that page)
  const portalBaseUrl =
    process.env.PORTAL_BASE_URL || 'https://headingtonportal.danielesambu.com';
  const setPasswordUrl = `${portalBaseUrl}/set-password/${rawResetToken}`;

  // 6) Send welcome email with ClerkID + temp password
  try {
    await sendRegisteredClerkEmail({
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      tempPassword,
      setPasswordUrl,
    });
  } catch (err) {
    console.error('Failed to send registered clerk email:', err.message);
    // We don't fail the whole request if email fails; but you could choose to.
  }

  // 7) Respond with safe data (no password)
  return res.status(201).json({
    success: true,
    message: 'Clerk created and welcome email sent',
    clerk: {
      _id: clerk._id,
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      role: clerk.role,
      isActive: clerk.isActive,
      mustChangePassword: clerk.mustChangePassword,
      passwordResetExpires: clerk.passwordResetExpires,
    },
  });
});

// ----------------------------------------
// Your existing handlers
// ----------------------------------------

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
      { clerkID: { $regex: q, $options: 'i' } },
    ];
  }

  const clerks = await Clerk.find(filter)
    .select('-password -clerkSecret -refreshTokens -passwordResetToken')
    .sort({ role: 1, createdAt: -1 });

  res.status(200).json({ count: clerks.length, clerks });
});

// GET /api/admin/clerks/:id
// Includes recent activity for modal
const getClerkDetailWithActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const clerk = await Clerk.findById(id).select(
    '-password -clerkSecret -refreshTokens -passwordResetToken'
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
// Body: { isActive: boolean, reason?: string }
const updateClerkStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive, reason } = req.body;

  const clerk = await Clerk.findById(id);
  if (!clerk) {
    return res.status(404).json({ message: 'Clerk not found' });
  }

  // Prevent admin from changing their own status
  if (String(clerk._id) === String(req.clerk._id)) {
    return res.status(400).json({
      message: 'You cannot change your own status from this screen.',
    });
  }

  clerk.isActive = !!isActive;
  await clerk.save();

  await logActivity({
    actorId: req.clerk._id,
    action: 'clerk_status_changed',
    targetType: 'clerk',
    targetId: clerk._id,
    description: `Clerk status changed to ${
      clerk.isActive ? 'active' : 'deactivated'
    }${reason ? `: ${reason}` : ''}`,
    metadata: { isActive: clerk.isActive, reason },
  });

  res.status(200).json({
    message: 'Clerk status updated',
    clerk: {
      _id: clerk._id,
      name: clerk.name,
      email: clerk.email,
      clerkID: clerk.clerkID,
      isActive: clerk.isActive,
      role: clerk.role,
    },
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
      message: 'Cannot delete a super admin from this screen',
    });
  }

  await Clerk.findByIdAndDelete(id);

  await logActivity({
    actorId: req.clerk._id,
    action: 'clerk_deleted',
    targetType: 'clerk',
    targetId: id,
    description: `Clerk ${clerk.email} deleted`,
  });

  res.status(200).json({ message: 'Clerk deleted', id });
});

module.exports = {
  adminCreateClerk,
  getClerkRoster,
  getClerkDetailWithActivity,
  updateClerkStatus,
  deleteClerk,
};
