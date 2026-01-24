const asyncHandler = require('express-async-handler');
const Clerk = require('../models/clerkModel');
const ActivityLog = require('../models/activityLogModel');
const { logActivity } = require('../utils/activityLogger');

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
  deleteClerk
};
