const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  preferences: {
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    health: {
      dietaryRestrictions: [String],
      fitnessGoals: [String],
      medicalConditions: [String]
    },
    lifestyle: {
      wakeUpTime: String,
      sleepTime: String,
      workHours: {
        start: String,
        end: String
      }
    }
  },
  emergencyContacts: [{
    name: String,
    relationship: String,
    phone: String,
    email: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  // Security fields
  role: {
    type: String,
    enum: ['user', 'premium', 'admin', 'superadmin'],
    default: 'user'
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  passwordHistory: [{
    password: String,
    createdAt: { type: Date, default: Date.now }
  }],
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  mustChangePassword: {
    type: Boolean,
    default: false
  },
  // 2FA fields
  twoFactorSecret: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorBackupCodes: [String],
  twoFactorEnabledAt: {
    type: Date,
    default: null
  },
  // Session management
  activeSessions: [{
    sessionId: String,
    userAgent: String,
    ip: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now }
  }],
  // GDPR compliance
  consentPreferences: {
    dataProcessing: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    marketing: { type: Boolean, default: false },
    thirdPartySharing: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
  },
  anonymizedAt: {
    type: Date,
    default: null
  },
  anonymizedId: {
    type: String,
    default: null
  },
  // Security logging
  lastPasswordChange: {
    type: Date,
    default: Date.now
  },
  failedLoginAttempts: [{
    ip: String,
    userAgent: String,
    attemptedAt: { type: Date, default: Date.now }
  }],
  // Email verification
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  // Password reset
  passwordResetToken: {
    type: String,
    default: null
  },
  passwordResetExpires: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    // Check password history
    if (this.passwordHistory && this.passwordHistory.length > 0) {
      const isRecentPassword = await this.checkPasswordHistory(this.password);
      if (isRecentPassword) {
        const error = new Error('Cannot reuse recent passwords');
        error.code = 'PASSWORD_REUSE';
        return next(error);
      }
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    
    // Add to password history
    this.passwordHistory = this.passwordHistory || [];
    this.passwordHistory.push({
      password: hashedPassword,
      createdAt: new Date()
    });
    
    // Keep only last 5 passwords
    if (this.passwordHistory.length > 5) {
      this.passwordHistory = this.passwordHistory.slice(-5);
    }
    
    this.password = hashedPassword;
    this.passwordChangedAt = new Date();
    this.mustChangePassword = false;
    
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if password was used recently
userSchema.methods.checkPasswordHistory = async function(candidatePassword) {
  if (!this.passwordHistory || this.passwordHistory.length === 0) {
    return false;
  }
  
  for (const historyItem of this.passwordHistory) {
    const isMatch = await bcrypt.compare(candidatePassword, historyItem.password);
    if (isMatch) {
      return true;
    }
  }
  
  return false;
};

// Method to get user profile (without sensitive data)
userSchema.methods.getProfile = function() {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.passwordHistory;
  delete userObject.twoFactorSecret;
  delete userObject.twoFactorBackupCodes;
  delete userObject.passwordResetToken;
  delete userObject.emailVerificationToken;
  delete userObject.failedLoginAttempts;
  return userObject;
};

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  return this.isLocked && this.lockedUntil && this.lockedUntil > Date.now();
};

// Method to lock account
userSchema.methods.lockAccount = function(lockDuration = 15 * 60 * 1000) { // 15 minutes default
  this.isLocked = true;
  this.lockedUntil = new Date(Date.now() + lockDuration);
  this.loginAttempts = 0;
};

// Method to unlock account
userSchema.methods.unlockAccount = function() {
  this.isLocked = false;
  this.lockedUntil = null;
  this.loginAttempts = 0;
};

// Method to increment login attempts
userSchema.methods.incrementLoginAttempts = function() {
  this.loginAttempts += 1;
  
  // Lock account after 5 failed attempts
  if (this.loginAttempts >= 5) {
    this.lockAccount();
  }
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  this.loginAttempts = 0;
  this.failedLoginAttempts = [];
};

// Method to add failed login attempt
userSchema.methods.addFailedLoginAttempt = function(ip, userAgent) {
  this.failedLoginAttempts = this.failedLoginAttempts || [];
  this.failedLoginAttempts.push({
    ip,
    userAgent,
    attemptedAt: new Date()
  });
  
  // Keep only last 10 failed attempts
  if (this.failedLoginAttempts.length > 10) {
    this.failedLoginAttempts = this.failedLoginAttempts.slice(-10);
  }
};

// Method to check if password needs to be changed
userSchema.methods.shouldChangePassword = function() {
  const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 days
  return Date.now() - this.passwordChangedAt.getTime() > maxAge;
};

// Method to generate password reset token
userSchema.methods.generatePasswordResetToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return token;
};

// Method to generate email verification token
userSchema.methods.generateEmailVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Method to verify email
userSchema.methods.verifyEmail = function() {
  this.emailVerified = true;
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
};

// Method to add active session
userSchema.methods.addActiveSession = function(sessionId, userAgent, ip) {
  this.activeSessions = this.activeSessions || [];
  this.activeSessions.push({
    sessionId,
    userAgent,
    ip,
    createdAt: new Date(),
    lastActivity: new Date()
  });
  
  // Keep only last 3 sessions
  if (this.activeSessions.length > 3) {
    this.activeSessions = this.activeSessions.slice(-3);
  }
};

// Method to remove active session
userSchema.methods.removeActiveSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(session => session.sessionId !== sessionId);
};

// Method to update session activity
userSchema.methods.updateSessionActivity = function(sessionId) {
  const session = this.activeSessions.find(s => s.sessionId === sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
};

// Method to clean up old sessions
userSchema.methods.cleanupOldSessions = function() {
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
  const now = Date.now();
  
  this.activeSessions = this.activeSessions.filter(session => {
    return now - session.lastActivity.getTime() < maxAge;
  });
};

// Method to check if user has too many sessions
userSchema.methods.hasTooManySessions = function() {
  return this.activeSessions && this.activeSessions.length >= 3;
};

// Method to get security status
userSchema.methods.getSecurityStatus = function() {
  return {
    isLocked: this.isAccountLocked(),
    loginAttempts: this.loginAttempts,
    twoFactorEnabled: this.twoFactorEnabled,
    emailVerified: this.emailVerified,
    passwordAge: Date.now() - this.passwordChangedAt.getTime(),
    shouldChangePassword: this.shouldChangePassword(),
    activeSessions: this.activeSessions ? this.activeSessions.length : 0,
    lastLogin: this.lastLogin
  };
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
