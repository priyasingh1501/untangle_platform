const mongoose = require('mongoose');

const habitCheckinSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habit: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  valueMin: {
    type: Number, // Duration in minutes
    required: true,
    min: 0
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LifestyleGoal'
  },
  notes: {
    type: String,
    trim: true
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
habitCheckinSchema.index({ userId: 1, date: 1 });
habitCheckinSchema.index({ userId: 1, goalId: 1 });
habitCheckinSchema.index({ userId: 1, habit: 1 });

// Virtual for value in hours
habitCheckinSchema.virtual('valueHours').get(function() {
  return this.valueMin / 60;
});

// Method to get today's checkins for a user
habitCheckinSchema.statics.getTodayCheckins = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  }).populate('goalId');
};

module.exports = mongoose.model('HabitCheckin', habitCheckinSchema);
