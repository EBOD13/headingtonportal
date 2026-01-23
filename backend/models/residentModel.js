// backend/models/residentModel.js
const mongoose = require('mongoose');

const residentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  roomNumber: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },
  studentID: {
    type: String,
    required: true,
  },
  flagged: {
    type: Boolean,
    default: false,
  },
  guests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
  }],
  wing: {
    type: String,
    enum: ['North', 'South'],
  },

  // NEW: lifecycle fields to allow batch archival / deletion
  active: {
    type: Boolean,
    default: true,
    index: true,
  },
  semester: {
    type: String,
    enum: ['Spring', 'Summer', 'Fall'],
    index: true,
  },
  year: {
    type: Number,
    min: 2000,
    max: 2100,
    index: true,
  },
}, {
  timestamps: true,
});

// Auto-calculate wing + normalize room
residentSchema.pre('save', function (next) {
  if (this.roomNumber) {
    const normalized = this.roomNumber.trim().toUpperCase();
    this.roomNumber = normalized;
    const firstChar = normalized.charAt(0);
    this.wing = firstChar === 'S' ? 'South' : 'North';
  }
  next();
});

const Resident = mongoose.model('Resident', residentSchema);
module.exports = Resident;
