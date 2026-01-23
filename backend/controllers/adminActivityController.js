const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/activityLogModel');
const Clerk = require('../models/clerkModel');

const getActivityFeed = asyncHandler(async (req, res) => {
  const { limit = 50, action, clerkId } = req.query;
  const filter = {};

  if (action) filter.action = action;
  if (clerkId) filter.actor = clerkId;

  const activity = await ActivityLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .populate('actor', 'name email role clerkID')
    .lean();

  res.status(200).json({
    count: activity.length,
    activity
  });
});

module.exports = { getActivityFeed };
