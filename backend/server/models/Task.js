const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'finance', 'home', 'relationship', 'learning', 'other'],
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
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: {
    type: Date
  },
  estimatedDuration: {
    type: Number, // in minutes
    default: 30
  },
  actualDuration: {
    type: Number // in minutes
  },
  tags: [String],
  goalIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  }],
  start: {
    type: Date
  },
  end: {
    type: Date
  },
  mindfulRating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  isHabit: {
    type: Boolean,
    default: false
  },
  habitCadence: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  habitEndDate: {
    type: Date,
    default: null
  },
  subtasks: [{
    title: String,
    completed: { type: Boolean, default: false }
  }],
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  notes: String,
  recurring: {
    isRecurring: { type: Boolean, default: false },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: Number,
    endDate: Date
  },
  reminders: [{
    time: Date,
    type: { type: String, enum: ['email', 'push', 'sms'] },
    sent: { type: Boolean, default: false }
  }],
  dependencies: [{
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    type: { type: String, enum: ['blocks', 'blocked-by'] }
  }],
  completionNotes: String,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ userId: 1, priority: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (!this.dueDate || this.status === 'completed') return false;
  return new Date() > this.dueDate;
});

// Virtual for duration in minutes
taskSchema.virtual('durationMinutes').get(function() {
  if (this.actualDuration) {
    return this.actualDuration;
  }
  if (this.start && this.end) {
    return Math.round((this.end - this.start) / (1000 * 60));
  }
  if (this.estimatedDuration) {
    return this.estimatedDuration;
  }
  return 25; // Default duration
});

// Virtual for mindfulness status
taskSchema.virtual('isMindful').get(function() {
  return this.mindfulRating >= 4; // Consider 4+ as mindful
});

// Method to mark as complete
taskSchema.methods.complete = function(notes = '') {
  this.status = 'completed';
  this.completedAt = new Date();
  this.completionNotes = notes;
  return this.save();
};

// Method to add subtask
taskSchema.methods.addSubtask = function(title) {
  this.subtasks.push({ title });
  return this.save();
};

// Method to update progress
taskSchema.methods.updateProgress = function(progress) {
  if (progress === 100) {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (progress > 0) {
    this.status = 'in-progress';
  }
  return this.save();
};

module.exports = mongoose.models.Task || mongoose.model('Task', taskSchema);
