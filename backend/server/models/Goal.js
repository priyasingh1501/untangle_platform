const mongoose = require('mongoose');

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
  color: {
    type: String,
    required: true,
    default: '#10B981' // Default emerald color
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['sleep', 'partner', 'reading', 'deep-work', 'health', 'mindfulness', 'fitness', 'learning', 'social', 'other'],
    default: 'other'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  targetHours: {
    type: Number, // Daily target in hours
    default: 1
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
goalSchema.index({ userId: 1, isActive: 1 });
goalSchema.index({ userId: 1, category: 1 });

// Virtual for target minutes
goalSchema.virtual('targetMinutes').get(function() {
  return this.targetHours * 60;
});

module.exports = mongoose.models.LifestyleGoal || mongoose.model('LifestyleGoal', goalSchema);
