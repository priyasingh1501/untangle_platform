const mongoose = require('mongoose');

const expenseGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: [
      'food', 'transportation', 'housing', 'utilities', 'healthcare', 'entertainment',
      'shopping', 'education', 'travel', 'insurance', 'taxes', 'debt', 'other'
    ],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    enum: ['monthly', 'weekly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  notes: String,
  color: {
    type: String,
    default: '#1E49C9'
  }
}, {
  timestamps: true
});

// Compound index to ensure unique category goals per user
expenseGoalSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = mongoose.model('ExpenseGoal', expenseGoalSchema);
