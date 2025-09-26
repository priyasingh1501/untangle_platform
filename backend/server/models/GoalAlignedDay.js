const mongoose = require('mongoose');

const goalAlignedDaySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  // Goal-aligned metrics
  tasksGoalAligned: {
    type: Number,
    default: 0
  },
  blockMinutes: {
    type: Number,
    default: 0
  },
  habitMinutes: {
    type: Number,
    default: 0
  },
  taskMinutes: {
    type: Number,
    default: 0
  },
  totalGoalAlignedMinutes: {
    type: Number,
    default: 0
  },
  mindfulTasks: {
    type: Number,
    default: 0
  },
  mindfulMinutes: {
    type: Number,
    default: 0
  },
  averageMindfulRating: {
    type: Number,
    default: 0
  },
  // Scores
  score24: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },
  scorePercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Goal breakdown
  goalBreakdown: [{
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LifestyleGoal'
    },
    goalName: String,
    goalColor: String,
    minutes: Number,
    percentage: Number
  }],
  // Streak tracking
  currentStreak: {
    type: Number,
    default: 0
  },
  longestStreak: {
    type: Number,
    default: 0
  },
  targetHours: {
    type: Number,
    default: 8 // Default target for streak calculation
  },
  // Metadata
  notes: String,
  isComplete: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
goalAlignedDaySchema.index({ userId: 1, date: 1 });
goalAlignedDaySchema.index({ userId: 1, score24: 1 });
goalAlignedDaySchema.index({ userId: 1, currentStreak: 1 });

// Virtual for total hours
goalAlignedDaySchema.virtual('totalGoalAlignedHours').get(function() {
  return this.totalGoalAlignedMinutes / 60;
});

// Method to calculate scores
goalAlignedDaySchema.methods.calculateScores = function() {
  this.totalGoalAlignedMinutes = this.blockMinutes + this.habitMinutes + this.taskMinutes;
  // score24: Convert minutes to hours, capped at 24
  this.score24 = Math.min(24, Math.round((this.totalGoalAlignedMinutes / 60) * 10) / 10);
  // scorePercentage: What percentage of 24 hours did we achieve
  this.scorePercentage = this.totalGoalAlignedMinutes > 0 ? Math.round((this.score24 / 24) * 100 * 10) / 10 : 0;
  return this;
};

// Method to update streak
goalAlignedDaySchema.methods.updateStreak = function() {
  // Only update streak if we have meaningful progress (at least 1 hour)
  if (this.score24 >= 1) {
    if (this.score24 >= this.targetHours) {
      // Target achieved - increment streak
      this.currentStreak += 1;
      if (this.currentStreak > this.longestStreak) {
        this.longestStreak = this.currentStreak;
      }
    }
    // If below target but above 1 hour, maintain current streak (don't reset to 0)
  } else {
    // No meaningful progress - reset streak
    this.currentStreak = 0;
  }
  return this;
};

// Static method to get today's record
goalAlignedDaySchema.statics.getToday = function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
};

// Static method to get streak info
goalAlignedDaySchema.statics.getStreakInfo = function(userId) {
  return this.findOne({ userId })
    .sort({ date: -1 })
    .select('currentStreak longestStreak targetHours');
};

module.exports = mongoose.model('GoalAlignedDay', goalAlignedDaySchema);
