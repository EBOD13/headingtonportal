// backend/models/clerkModel.js 
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const clerkSchema = new mongoose.Schema({
  // Basic identity
  name: {
    type: String,
    required: true,
    trim: true,
  },

  // Authentication
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  clerkID: { type: String, unique: true },

  // Personal Info (encrypted blob for future PII)
  encryptedPersonalData: String,
  personalDataIV: String,
  personalDataAuthTag: String,

  // Roles & Permissions
  role: {
    type: String,
    enum: ['admin', 'supervisor', 'clerk', 'trainee'],
    default: 'clerk',
  },
  permissions: [
    {
      type: String,
      enum: [
        'view_residents',
        'edit_residents',
        'delete_residents',
        'view_guests',
        'check_in_guests',
        'check_out_guests',
        'view_reports',
        'generate_reports',
        'manage_clerks',
        'system_settings',
      ],
    },
  ],

  // Security
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,

  // Password lifecycle
  passwordChangedAt: Date,
  mustChangePasswordBy: Date, // deadline for first/next change
  passwordResetToken: String, // hashed token
  passwordResetExpires: Date, // token expiry
  needsPasswordReset: { type: Boolean, default: false }, // treat as “must change on next login”

  // Admin-specific fields
  isSuperAdmin: { type: Boolean, default: false },
  canCreateAdmins: { type: Boolean, default: false },
  managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Clerk' },

  // Session & Token Management
  refreshTokens: [
    {
      token: String,
      expires: Date,
      device: String,
      ipAddress: String,
    },
  ],

  // Audit
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Clerk' },

  // Clerk-specific encryption key
  clerkSecret: { type: String },
  secretRotatedAt: Date,
}, {
  timestamps: true,
});

// Password hashing
clerkSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    // whenever we set a new password
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Generate clerk ID + clerkSecret if missing
clerkSchema.pre('save', function (next) {
  if (!this.clerkID) {
    this.clerkID = 'CLK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  if (!this.clerkSecret) {
    this.clerkSecret = crypto.randomBytes(32).toString('hex');
    this.secretRotatedAt = new Date();
  }

  next();
});

// Compare password
clerkSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Check if account is locked
clerkSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
clerkSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }

  return this.updateOne(updates);
};

// Reset login attempts on successful login
clerkSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Generate a password-reset / initial-password token
clerkSchema.methods.createPasswordResetToken = function (expiresInMs = 3 * 24 * 60 * 60 * 1000) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  this.passwordResetToken = hashedToken;
  this.passwordResetExpires = new Date(Date.now() + expiresInMs);
  this.mustChangePasswordBy = new Date(Date.now() + expiresInMs);
  this.needsPasswordReset = true;

  return rawToken;
};

const Clerk = mongoose.model('Clerk', clerkSchema);
module.exports = Clerk;
