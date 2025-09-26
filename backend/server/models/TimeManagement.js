const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  duration: Number, // in minutes
  type: {
    type: String,
    enum: ['work', 'personal', 'health', 'social', 'learning', 'rest', 'other'],
    default: 'personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  energyLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  description: String,
  location: String,
  attendees: [{
    name: String,
    email: String,
    role: String
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  recurringDays: [Number], // 0-6 for days of week
  recurringEndDate: Date,
  reminders: [{
    time: Date,
    type: { type: String, enum: ['email', 'push', 'sms'] },
    sent: { type: Boolean, default: false }
  }],
  status: {
    type: String,
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled'
  },
  notes: String,
  attachments: [{
    filename: String,
    url: String,
    type: String
  }]
}, {
  timestamps: true
});

const timeBlockSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  blocks: [{
    startTime: String,
    endTime: String,
    duration: Number, // in minutes
    type: {
      type: String,
      enum: ['deep-work', 'shallow-work', 'meeting', 'break', 'exercise', 'meal', 'other']
    },
            goalId: { type: mongoose.Schema.Types.ObjectId, ref: 'LifestyleGoal' },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule' },
    description: String,
    energyRequired: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    completed: { type: Boolean, default: false },
    notes: String
  }],
  totalWorkTime: Number,
  totalBreakTime: Number,
  productivity: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: String
}, {
  timestamps: true
});

const energyLogSchema = new mongoose.Schema({
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
  timeSlots: [{
    time: String,
    energyLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'neutral', 'down', 'anxious', 'stressed']
    },
    activities: [String],
    notes: String
  }],
  averageEnergy: Number,
  peakEnergyTime: String,
  lowEnergyTime: String,
  factors: {
    sleep: {
      hours: Number,
      quality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] }
    },
    nutrition: {
      meals: Number,
      hydration: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] }
    },
    exercise: {
      type: String,
      duration: Number,
      intensity: { type: String, enum: ['low', 'moderate', 'high'] }
    },
    stress: {
      level: { type: Number, min: 1, max: 10 },
      sources: [String]
    }
  },
  insights: [String],
  recommendations: [String]
}, {
  timestamps: true
});

const focusSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  duration: Number, // in minutes
  type: {
    type: String,
    enum: ['pomodoro', 'deep-work', 'meditation', 'reading', 'other']
  },
  taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  interruptions: [{
    time: Date,
    type: String,
    duration: Number,
    description: String
  }],
  focusScore: {
    type: Number,
    min: 1,
    max: 10
  },
  productivity: {
    type: Number,
    min: 0,
    max: 100
  },
  notes: String,
  completed: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
scheduleSchema.index({ userId: 1, date: 1 });
scheduleSchema.index({ userId: 1, startTime: 1 });
scheduleSchema.index({ userId: 1, type: 1 });
timeBlockSchema.index({ userId: 1, date: 1 });
energyLogSchema.index({ userId: 1, date: 1 });
focusSessionSchema.index({ userId: 1, startTime: 1 });

// Virtual for schedule duration
scheduleSchema.virtual('durationMinutes').get(function() {
  if (this.startTime && this.endTime) {
    const start = new Date(`2000-01-01T${this.startTime}`);
    const end = new Date(`2000-01-01T${this.endTime}`);
    return Math.round((end - start) / (1000 * 60));
  }
  return this.duration || 0;
});

// Virtual for time block total duration
timeBlockSchema.virtual('totalDuration').get(function() {
  return this.blocks.reduce((total, block) => total + (block.duration || 0), 0);
});

// Method to check if schedule conflicts with another
scheduleSchema.methods.hasConflict = function(otherSchedule) {
  if (this.date.toDateString() !== otherSchedule.date.toDateString()) return false;
  
  const thisStart = new Date(`2000-01-01T${this.startTime}`);
  const thisEnd = new Date(`2000-01-01T${this.endTime}`);
  const otherStart = new Date(`2000-01-01T${otherSchedule.startTime}`);
  const otherEnd = new Date(`2000-01-01T${otherSchedule.endTime}`);
  
  return (thisStart < otherEnd && thisEnd > otherStart);
};

// Method to add time block
timeBlockSchema.methods.addBlock = function(block) {
  this.blocks.push(block);
  this.blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
  this.calculateTotals();
  return this.save();
};

// Method to calculate totals
timeBlockSchema.methods.calculateTotals = function() {
  this.totalWorkTime = this.blocks
    .filter(block => ['deep-work', 'shallow-work', 'meeting'].includes(block.type))
    .reduce((total, block) => total + (block.duration || 0), 0);
  
  this.totalBreakTime = this.blocks
    .filter(block => ['break', 'meal'].includes(block.type))
    .reduce((total, block) => total + (block.duration || 0), 0);
};

// Method to start focus session
focusSessionSchema.methods.start = function() {
  this.startTime = new Date();
  return this.save();
};

// Method to end focus session
focusSessionSchema.methods.end = function() {
  this.endTime = new Date();
  this.duration = Math.round((this.endTime - this.startTime) / (1000 * 60));
  this.completed = true;
  return this.save();
};

// Method to add interruption
focusSessionSchema.methods.addInterruption = function(type, description, duration = 0) {
  this.interruptions.push({
    time: new Date(),
    type,
    description,
    duration
  });
  return this.save();
};

module.exports = {
  Schedule: mongoose.model('Schedule', scheduleSchema),
  TimeBlock: mongoose.model('TimeBlock', timeBlockSchema),
  EnergyLog: mongoose.model('EnergyLog', energyLogSchema),
  FocusSession: mongoose.model('FocusSession', focusSessionSchema)
};
