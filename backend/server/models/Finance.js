const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  category: {
    type: String,
    enum: [
      'food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment',
      'shopping', 'education', 'travel', 'insurance', 'taxes', 'debt', 'other'
    ],
    required: true
  },
  subcategory: String,
  description: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit-card', 'debit-card', 'bank-transfer', 'digital-wallet', 'other'],
    default: 'credit-card'
  },
  vendor: String,
  location: String,
  receipt: {
    filename: String,
    url: String
  },
  billImage: {
    filename: String,
    url: String,
    data: String // Base64 data for OCR analysis
  },
  tags: [String],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  notes: String,
  impulseBuy: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  }
}, {
  timestamps: true
});

const incomeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  source: {
    type: String,
    enum: ['salary', 'freelance', 'investment', 'business', 'gift', 'other'],
    required: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['weekly', 'bi-weekly', 'monthly', 'quarterly', 'yearly']
  },
  taxWithheld: Number,
  notes: String
}, {
  timestamps: true
});

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  categories: [{
    category: {
      type: String,
      enum: [
        'food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment',
        'shopping', 'education', 'travel', 'insurance', 'taxes', 'debt', 'other'
      ]
    },
    amount: Number,
    spent: { type: Number, default: 0 },
    color: String
  }],
  totalBudget: {
    type: Number,
    required: true
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  alerts: {
    warningThreshold: { type: Number, default: 80 }, // percentage
    criticalThreshold: { type: Number, default: 95 } // percentage
  },
  notes: String
}, {
  timestamps: true
});

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['checking', 'savings', 'credit-card', 'investment', 'loan', 'other'],
    required: true
  },
  institution: String,
  accountNumber: String,
  balance: {
    type: Number,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  interestRate: Number,
  creditLimit: Number,
  dueDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String
}, {
  timestamps: true
});

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['savings', 'debt-payoff', 'investment', 'emergency-fund', 'other'],
    required: true
  },
  targetAmount: {
    type: Number,
    required: true
  },
  currentAmount: {
    type: Number,
    default: 0
  },
  targetDate: Date,
  monthlyContribution: Number,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'completed', 'cancelled'],
    default: 'active'
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
incomeSchema.index({ userId: 1, date: -1 });
budgetSchema.index({ userId: 1, isActive: 1 });
accountSchema.index({ userId: 1, type: 1 });
goalSchema.index({ userId: 1, status: 1 });

// Virtual for expense amount in different currencies (basic implementation)
expenseSchema.virtual('amountFormatted').get(function() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency
  }).format(this.amount);
});

// Method to update budget spent amount
budgetSchema.methods.updateSpent = function(amount) {
  this.totalSpent += amount;
  return this.save();
};

// Method to check if budget is over
budgetSchema.methods.isOverBudget = function() {
  return this.totalSpent > this.totalBudget;
};

// Method to get budget progress percentage
budgetSchema.methods.getProgressPercentage = function() {
  return Math.round((this.totalSpent / this.totalBudget) * 100);
};

// Method to get goal progress percentage
goalSchema.methods.getProgressPercentage = function() {
  return Math.round((this.currentAmount / this.targetAmount) * 100);
};

// Method to add contribution to goal
goalSchema.methods.addContribution = function(amount) {
  this.currentAmount += amount;
  if (this.currentAmount >= this.targetAmount) {
    this.status = 'completed';
  }
  return this.save();
};

module.exports = {
  Expense: mongoose.model('Expense', expenseSchema),
  Income: mongoose.model('Income', incomeSchema),
  Budget: mongoose.model('Budget', budgetSchema),
  Account: mongoose.model('Account', accountSchema),
  Goal: mongoose.model('Goal', goalSchema)
};
