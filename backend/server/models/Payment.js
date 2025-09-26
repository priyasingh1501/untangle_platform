const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'upi', 'netbanking', 'wallet'],
    required: true
  },
  paymentProvider: {
    type: String,
    enum: ['stripe', 'razorpay', 'payu'],
    required: true
  },
  providerPaymentId: {
    type: String,
    required: true
  },
  providerOrderId: {
    type: String,
    default: null
  },
  providerSignature: {
    type: String,
    default: null
  },
  description: {
    type: String,
    default: null
  },
  receipt: {
    type: String,
    default: null
  },
  failureReason: {
    type: String,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ user: 1, status: 1 });
paymentSchema.index({ subscription: 1 });
paymentSchema.index({ providerPaymentId: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount}`;
});

// Method to mark payment as completed
paymentSchema.methods.markCompleted = function(webhookData = {}) {
  this.status = 'completed';
  this.webhookData = webhookData;
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(reason) {
  this.status = 'failed';
  this.failureReason = reason;
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(amount, reason) {
  this.status = 'refunded';
  this.refundAmount = amount;
  this.refundReason = reason;
  this.refundedAt = new Date();
  return this.save();
};

// Static method to get payments for user
paymentSchema.statics.getUserPayments = function(userId, limit = 10, skip = 0) {
  return this.find({ user: userId })
    .populate('subscription', 'plan status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to get payment by provider ID
paymentSchema.statics.getByProviderId = function(providerPaymentId) {
  return this.findOne({ providerPaymentId });
};

module.exports = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);
