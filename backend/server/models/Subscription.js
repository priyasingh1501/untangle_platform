const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['trial', 'monthly', 'yearly'],
    default: 'trial'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'past_due'],
    default: 'active'
  },
  trialEndsAt: {
    type: Date,
    default: function() {
      if (this.plan === 'trial') {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      }
      return null;
    }
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now
  },
  currentPeriodEnd: {
    type: Date,
    default: function() {
      if (this.plan === 'monthly') {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
      } else if (this.plan === 'yearly') {
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 365 days from now
      }
      return null;
    }
  },
  amount: {
    type: Number,
    default: function() {
      if (this.plan === 'monthly') return 499;
      if (this.plan === 'yearly') return 4999;
      return 0; // trial
    }
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    default: null
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'razorpay', 'payu'],
    default: null
  },
  paymentId: {
    type: String,
    default: null
  },
  lastPaymentDate: {
    type: Date,
    default: null
  },
  nextBillingDate: {
    type: Date,
    default: function() {
      if (this.plan === 'monthly') {
        return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      } else if (this.plan === 'yearly') {
        return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
      return null;
    }
  },
  cancelledAt: {
    type: Date,
    default: null
  },
  cancellationReason: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
subscriptionSchema.index({ user: 1, status: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function() {
  if (this.status === 'cancelled' || this.status === 'expired') {
    return false;
  }
  
  if (this.plan === 'trial') {
    return this.trialEndsAt > new Date();
  }
  
  return this.currentPeriodEnd > new Date();
});

// Virtual for days remaining in trial
subscriptionSchema.virtual('trialDaysRemaining').get(function() {
  if (this.plan !== 'trial' || !this.trialEndsAt) {
    return 0;
  }
  
  const now = new Date();
  const diffTime = this.trialEndsAt - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
});

// Method to cancel subscription
subscriptionSchema.methods.cancel = function(reason = null) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  return this.save();
};

// Method to renew subscription
subscriptionSchema.methods.renew = function() {
  if (this.plan === 'monthly') {
    this.currentPeriodStart = new Date();
    this.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    this.nextBillingDate = this.currentPeriodEnd;
  } else if (this.plan === 'yearly') {
    this.currentPeriodStart = new Date();
    this.currentPeriodEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    this.nextBillingDate = this.currentPeriodEnd;
  }
  
  this.status = 'active';
  this.lastPaymentDate = new Date();
  return this.save();
};

// Static method to get active subscription for user
subscriptionSchema.statics.getActiveSubscription = function(userId) {
  return this.findOne({
    user: userId,
    status: { $in: ['active', 'trial'] }
  }).sort({ createdAt: -1 });
};

// Static method to create trial subscription
subscriptionSchema.statics.createTrial = function(userId) {
  return this.create({
    user: userId,
    plan: 'trial',
    status: 'active',
    trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });
};

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
