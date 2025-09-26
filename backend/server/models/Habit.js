const mongoose = require('mongoose');

const habitSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  valueMin: {
    type: Number, // Duration in minutes
    required: true,
    min: 1
  },
  notes: {
    type: String,
    trim: true
  },
  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LifestyleGoal'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true // Habit must have an end date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  tags: [{
    type: String,
    trim: true
  }],
  // Track daily check-ins
  checkins: [{
    date: {
      type: Date,
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number, // Actual duration completed
      min: 0
    },
    notes: {
      type: String,
      trim: true
    },
    quality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor']
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
habitSchema.index({ userId: 1, isActive: 1 });
habitSchema.index({ userId: 1, goalId: 1 });
habitSchema.index({ userId: 1, date: 1 });

// Virtual for value in hours
habitSchema.virtual('valueHours').get(function() {
  return this.valueMin / 60;
});

// Method to check if habit is active (within date range)
habitSchema.methods.isActiveToday = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const start = new Date(this.startDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(this.endDate);
  end.setHours(23, 59, 59, 999);
  
  return today >= start && today <= end;
};

// Method to check if habit is completed today
habitSchema.methods.isCompletedToday = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayCheckin = this.checkins.find(c => {
    const cDate = new Date(c.date);
    cDate.setHours(0, 0, 0, 0);
    return cDate.getTime() === today.getTime();
  });
  
  return todayCheckin ? todayCheckin.completed : false;
};

// Method to add a daily check-in
habitSchema.methods.addCheckin = function(date, completed, duration, notes, quality) {
  const checkinDate = new Date(date);
  checkinDate.setHours(0, 0, 0, 0);
  
  // Remove existing check-in for this date if it exists
  this.checkins = this.checkins.filter(c => {
    const cDate = new Date(c.date);
    cDate.setHours(0, 0, 0, 0);
    return cDate.getTime() !== checkinDate.getTime();
  });
  
  // Add new check-in
  this.checkins.push({
    date: checkinDate,
    completed,
    duration: duration || this.valueMin,
    notes,
    quality: quality || this.quality
  });
  
  return this;
};

// Method to get today's check-in
habitSchema.methods.getTodayCheckin = function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return this.checkins.find(c => {
    const cDate = new Date(c.date);
    cDate.setHours(0, 0, 0, 0);
    return cDate.getTime() === today.getTime();
  });
};

// Method to get check-in for a specific date
habitSchema.methods.getCheckinForDate = function(date) {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  return this.checkins.find(c => {
    const cDate = new Date(c.date);
    cDate.setHours(0, 0, 0, 0);
    return cDate.getTime() === checkDate.getTime();
  });
};

module.exports = mongoose.model('Habit', habitSchema);
