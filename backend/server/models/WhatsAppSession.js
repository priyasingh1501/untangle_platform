const mongoose = require('mongoose');

const whatsappSessionSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  sessionToken: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  linkedAt: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Sessions expire after 30 days of inactivity
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Index for efficient lookups
whatsappSessionSchema.index({ userId: 1 });
whatsappSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Update lastActivity on every query
whatsappSessionSchema.pre('findOneAndUpdate', function() {
  this.set({ lastActivity: new Date() });
});

whatsappSessionSchema.pre('findOne', function() {
  this.set({ lastActivity: new Date() });
});

module.exports = mongoose.model('WhatsAppSession', whatsappSessionSchema);
