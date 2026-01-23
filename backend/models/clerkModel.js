// backend/models/clerkModel.js - ENHANCED
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const clerkSchema = new mongoose.Schema({
    // Authentication
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    clerkID: { type: String, unique: true },
    
    // Personal Info (Encrypted)
    encryptedPersonalData: String,
    personalDataIV: String,
    personalDataAuthTag: String,
    
    // Roles & Permissions
    role: { 
        type: String, 
        enum: ['admin', 'supervisor', 'clerk', 'trainee'],
        default: 'clerk'
    },
    permissions: [{
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
            'system_settings'
        ]
    }],
    
    // Security
    isActive: { type: Boolean, default: true },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String,
    
    // Admin-specific fields
    isSuperAdmin: { type: Boolean, default: false },
    canCreateAdmins: { type: Boolean, default: false },
    managedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Clerk' },
    
    // Session & Token Management
    refreshTokens: [{
        token: String,
        expires: Date,
        device: String,
        ipAddress: String
    }],
    
    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Clerk' },
    
    // Clerk-specific encryption key (for resident data)
    clerkSecret: { type: String },
    secretRotatedAt: Date
}, {
    timestamps: true
});

// Password hashing
clerkSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password
clerkSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Generate clerk ID
clerkSchema.pre('save', function(next) {
    if (!this.clerkID) {
        this.clerkID = 'CLK-' + crypto.randomBytes(4).toString('hex').toUpperCase();
    }
    
    // Generate clerk secret for encryption if not exists
    if (!this.clerkSecret) {
        this.clerkSecret = crypto.randomBytes(32).toString('hex');
        this.secretRotatedAt = new Date();
    }
    
    next();
});

// Check if account is locked
clerkSchema.methods.isLocked = function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
clerkSchema.methods.incLoginAttempts = function() {
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $set: { loginAttempts: 1 },
            $unset: { lockUntil: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    if (this.loginAttempts + 1 >= 5) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
    }
    
    return this.updateOne(updates);
};

// Reset login attempts on successful login
clerkSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 }
    });
};

const Clerk = mongoose.model('Clerk', clerkSchema);
module.exports = Clerk;