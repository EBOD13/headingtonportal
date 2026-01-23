const asyncHandler = require('express-async-handler');
const MailMessage = require('../models/mailMessageModel');
const { logActivity } = require('../utils/activityLogger');

// GET /api/admin/mail
// Shows inbox for current user/admin
const getInbox = asyncHandler(async (req, res) => {
  const { type } = req.query; // optional filter: 'incident' | 'message'
  const filter = {
    $or: [
      { to: req.clerk._id },
      { toRole: { $in: ['admin', 'supervisor'] } }
    ]
  };

  if (type) filter.type = type;

  const messages = await MailMessage.find(filter)
    .sort({ createdAt: -1 })
    .populate('from', 'name email role clerkID')
    .lean();

  res.status(200).json({ count: messages.length, messages });
});

// POST /api/admin/mail
// Send message from admin to a clerk or all clerks
const sendMessage = asyncHandler(async (req, res) => {
  const { toClerkId, toRole, subject, body, type, relatedGuest, relatedResident } =
    req.body;

  if (!subject || !body) {
    return res.status(400).json({ message: 'Subject and body are required' });
  }

  if (!toClerkId && !toRole) {
    return res
      .status(400)
      .json({ message: 'Provide either toClerkId or toRole' });
  }

  const message = await MailMessage.create({
    from: req.clerk._id,
    to: toClerkId || undefined,
    toRole: toRole || undefined,
    subject,
    body,
    type: type || 'message',
    relatedGuest: relatedGuest || undefined,
    relatedResident: relatedResident || undefined
  });

  await logActivity({
    actorId: req.clerk._id,
    action: 'mail_sent',
    targetType: 'mail',
    targetId: message._id,
    description: `Mail sent: ${subject}`,
    metadata: { toClerkId, toRole }
  });

  res.status(201).json({ message: 'Message sent', mail: message });
});

// PATCH /api/admin/mail/:id/read
const markMessageRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const mail = await MailMessage.findById(id);
  if (!mail) {
    return res.status(404).json({ message: 'Message not found' });
  }

  // Basic authorization: recipient or admin-level
  const isRecipient =
    (mail.to && String(mail.to) === String(req.clerk._id)) ||
    ['admin', 'supervisor'].includes(req.clerk.role);

  if (!isRecipient) {
    return res.status(403).json({ message: 'Not allowed to read this message' });
  }

  mail.status = 'read';
  mail.readAt = new Date();
  mail.readBy = req.clerk._id;

  await mail.save();

  await logActivity({
    actorId: req.clerk._id,
    action: 'mail_read',
    targetType: 'mail',
    targetId: mail._id,
    description: `Message read: ${mail.subject}`
  });

  res.status(200).json({ message: 'Message marked as read', mail });
});

module.exports = {
  getInbox,
  sendMessage,
  markMessageRead
};
