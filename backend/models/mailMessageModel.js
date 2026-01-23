// backend/models/mailMessageModel.js

const mongoose = require('mongoose');

const mailMessageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clerk',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clerk',
      required: false
    },

    // For system-style addresses (e.g. "admin")
    toRole: {
      type: String,
      enum: ['admin', 'supervisor', 'all_clerks', 'system'],
      required: false
    },

    subject: {
      type: String,
      required: true,
      trim: true
    },

    body: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ['message', 'incident'],
      default: 'message'
    },

    relatedGuest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest'
    },
    relatedResident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident'
    },

    status: {
      type: String,
      enum: ['unread', 'read', 'archived'],
      default: 'unread'
    },

    readAt: Date,
    readBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clerk'
    }
  },
  {
    timestamps: true
  }
);

mailMessageSchema.index({ to: 1, createdAt: -1 });
mailMessageSchema.index({ toRole: 1, createdAt: -1 });
mailMessageSchema.index({ type: 1 });

const MailMessage = mongoose.model('MailMessage', mailMessageSchema);
module.exports = MailMessage;
