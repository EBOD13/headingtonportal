const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Clerk',
      required: true
    }, // who did it

    action: {
      type: String,
      enum: [
        'guest_check_in',
        'guest_check_out',
        'guest_registered',
        'resident_created',
        'resident_updated',
        'resident_status_changed',
        'resident_deleted',
        'clerk_created',
        'clerk_status_changed',
        'clerk_deleted',
        'incident_created',
        'report_generated',
        'report_downloaded',
        'export_generated',
        'mail_sent',
        'mail_read',
        'login',
        'logout'
      ],
      required: true
    },

    targetType: {
      type: String,
      enum: ['guest', 'resident', 'clerk', 'report', 'system', 'mail'],
      required: true
    },

    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },

    description: {
      type: String,
      trim: true
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  {
    timestamps: true
  }
);

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ targetType: 1, targetId: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog;
