const mongoose = require('mongoose');

const emailForwardingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  forwardingEmail: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastEmailReceived: {
    type: Date,
    default: null
  },
  totalEmailsProcessed: {
    type: Number,
    default: 0
  },
  totalExpensesCreated: {
    type: Number,
    default: 0
  },
  settings: {
    autoParse: {
      type: Boolean,
      default: true
    },
    defaultCategory: {
      type: String,
      enum: [
        'food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment',
        'shopping', 'education', 'travel', 'insurance', 'taxes', 'debt', 'other'
      ],
      default: 'other'
    },
    defaultPaymentMethod: {
      type: String,
      enum: ['cash', 'credit-card', 'debit-card', 'bank-transfer', 'digital-wallet', 'other'],
      default: 'credit-card'
    },
    requireConfirmation: {
      type: Boolean,
      default: false
    },
    notificationOnSuccess: {
      type: Boolean,
      default: true
    },
    notificationOnFailure: {
      type: Boolean,
      default: true
    }
  },
  emailProvider: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo', 'custom'],
    default: 'gmail'
  },
  imapConfig: {
    host: String,
    port: Number,
    secure: Boolean,
    username: String,
    password: String
  }
}, {
  timestamps: true
});

// Generate unique forwarding email
emailForwardingSchema.statics.generateForwardingEmail = function(userId, baseEmail = 'expenses@untangle.app') {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${userId.toString().substring(0, 8)}+${timestamp}${randomSuffix}@${baseEmail.split('@')[1]}`;
};

// Method to get forwarding email for user
emailForwardingSchema.statics.getForwardingEmail = async function(userId) {
  let forwarding = await this.findOne({ userId, isActive: true });
  
  if (!forwarding) {
    const forwardingEmail = this.generateForwardingEmail(userId);
    forwarding = new this({
      userId,
      forwardingEmail,
      isActive: true
    });
    await forwarding.save();
  }
  
  return forwarding.forwardingEmail;
};

// Method to process incoming email
emailForwardingSchema.methods.processIncomingEmail = async function(emailData) {
  this.lastEmailReceived = new Date();
  this.totalEmailsProcessed += 1;
  await this.save();
  
  return {
    forwardingEmail: this.forwardingEmail,
    userId: this.userId,
    settings: this.settings
  };
};

module.exports = mongoose.model('EmailForwarding', emailForwardingSchema);
