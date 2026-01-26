// backend/models/guestModel.js
const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Resident',
    },

    // Handy denormalized info for reporting
    hostName: {
      type: String,
      trim: true,
    },
    hostRoom: {
      type: String,
      trim: true,
    },

    contact: {
      type: String,
      required: true,
      trim: true,
    },

    studentAtOU: {
      type: Boolean,
      required: true,
    },

    IDNumber: {
      type: String,
      trim: true,
    },

    flagged: {
      type: Boolean,
      default: false,
    },

    checkIn: {
      type: Date,
      default: Date.now,
    },

    checkout: {
      type: Date,
    },

    room: {
      type: String,
      trim: true,
    },

    wing: {
      type: String,
      enum: ['North', 'South'],
    },

    isCheckedIn: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-derive wing from room if present
guestSchema.pre('save', function (next) {
  if (this.room) {
    const firstChar = this.room.trim().charAt(0).toUpperCase();
    this.wing = firstChar === 'S' ? 'South' : 'North';
  }
  next();
});

const Guest = mongoose.model('Guest', guestSchema);

module.exports = Guest;
