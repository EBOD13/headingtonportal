const ActivityLog = require('../models/activityLogModel');

async function logActivity({
  actorId,
  action,
  targetType,
  targetId,
  description,
  metadata
}) {
  try {
    await ActivityLog.create({
      actor: actorId,
      action,
      targetType,
      targetId,
      description,
      metadata
    });
  } catch (err) {
    console.error('Failed to log activity:', err.message);
  }
}

module.exports = { logActivity };
