const mongoose = require('mongoose');

const calendarEventSchema = new mongoose.Schema({
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
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  allDay: {
    type: Boolean,
    default: false
  },
  location: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#1E49C9'
  },
  category: {
    type: String,
    enum: ['work', 'personal', 'health', 'finance', 'social', 'travel', 'other'],
    default: 'personal'
  },
  // Google Calendar integration
  googleCalendarId: {
    type: String, // Google Calendar event ID
    sparse: true
  },
  googleCalendarEventId: {
    type: String, // The actual event ID from Google Calendar API
    sparse: true
  },
  syncedWithGoogle: {
    type: Boolean,
    default: false
  },
  lastSyncedAt: {
    type: Date
  },
  // Recurring events
  recurring: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: {
      type: Date
    },
    occurrences: {
      type: Number // Max number of occurrences
    }
  },
  // Reminders
  reminders: [{
    method: {
      type: String,
      enum: ['email', 'popup', 'sms'],
      default: 'popup'
    },
    minutes: {
      type: Number,
      default: 15
    }
  }],
  // Attendees (for future use)
  attendees: [{
    email: String,
    name: String,
    responseStatus: {
      type: String,
      enum: ['needsAction', 'declined', 'tentative', 'accepted'],
      default: 'needsAction'
    }
  }],
  // Status
  status: {
    type: String,
    enum: ['confirmed', 'tentative', 'cancelled'],
    default: 'confirmed'
  },
  // Visibility
  visibility: {
    type: String,
    enum: ['default', 'public', 'private', 'confidential'],
    default: 'default'
  },
  // Notes
  notes: {
    type: String,
    trim: true
  },
  // Tags
  tags: [String]
}, {
  timestamps: true
});

// Indexes for efficient queries
calendarEventSchema.index({ userId: 1, start: 1 });
calendarEventSchema.index({ userId: 1, end: 1 });
calendarEventSchema.index({ googleCalendarEventId: 1 });
calendarEventSchema.index({ syncedWithGoogle: 1 });

module.exports = mongoose.model('CalendarEvent', calendarEventSchema);
