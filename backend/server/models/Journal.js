const mongoose = require('mongoose');

const journalEntrySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['daily', 'gratitude', 'reflection', 'goal', 'dream', 'memory', 'creative', 'work', 'health', 'relationship'],
    default: 'daily'
  },
  mood: {
    type: String,
    enum: ['excellent', 'good', 'neutral', 'bad', 'terrible'],
    default: 'neutral'
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  attachments: [{
    filename: String,
    url: String,
    type: String
  }],
  location: {
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  weather: {
    temperature: Number,
    condition: String,
    description: String
  },
  alfredAnalysis: {
    emotion: {
      primary: {
        type: String,
        enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'love', 'anxiety', 'excitement', 'contentment', 'frustration', 'gratitude', 'loneliness', 'hope', 'disappointment', 'pride', 'shame', 'relief', 'confusion', 'peace', 'overwhelmed', 'confident', 'vulnerable', 'motivated', 'tired', 'energetic', 'calm', 'stressed', 'curious', 'nostalgic', 'satisfaction', 'optimism', 'stability', 'despair']
      },
      secondary: {
        type: String,
        enum: ['joy', 'sadness', 'anger', 'fear', 'surprise', 'disgust', 'love', 'anxiety', 'excitement', 'contentment', 'frustration', 'gratitude', 'loneliness', 'hope', 'disappointment', 'pride', 'shame', 'relief', 'confusion', 'peace', 'overwhelmed', 'confident', 'vulnerable', 'motivated', 'tired', 'energetic', 'calm', 'stressed', 'curious', 'nostalgic', 'satisfaction', 'optimism', 'stability', 'despair']
      },
      intensity: {
        type: Number,
        min: 1,
        max: 10
      },
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    },
    topics: [{
      name: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      }
    }],
    beliefs: [{
      belief: String,
      confidence: {
        type: Number,
        min: 0,
        max: 1
      },
      category: {
        type: String,
        enum: ['personal_values', 'life_philosophy', 'relationships', 'work_ethics', 'spirituality', 'health_wellness', 'other']
      }
    }],
    summary: String,
    insights: [String],
    analyzedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

const journalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  entries: [journalEntrySchema],
  settings: {
    defaultPrivacy: {
      type: String,
      enum: ['public', 'private'],
      default: 'private'
    },
    reminderTime: {
      type: String,
      default: '20:00'
    },
    enableReminders: {
      type: Boolean,
      default: true
    },
    journalingPrompts: {
      type: Boolean,
      default: true
    }
  },
  stats: {
    totalEntries: {
      type: Number,
      default: 0
    },
    currentStreak: {
      type: Number,
      default: 0
    },
    longestStreak: {
      type: Number,
      default: 0
    },
    lastEntryDate: Date
  }
}, {
  timestamps: true
});

// Update stats when entries are added/modified
journalSchema.pre('save', function(next) {
  if (this.entries.length > 0) {
    this.stats.totalEntries = this.entries.length;
    
    // Calculate streak
    const sortedEntries = this.entries
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if (sortedEntries.length > 0) {
      this.stats.lastEntryDate = sortedEntries[0].createdAt;
      
      // Calculate current streak
      let currentStreak = 0;
      let currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < sortedEntries.length; i++) {
        const entryDate = new Date(sortedEntries[i].createdAt);
        entryDate.setHours(0, 0, 0, 0);
        
        const diffTime = currentDate - entryDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === currentStreak) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      this.stats.currentStreak = currentStreak;
      if (currentStreak > this.stats.longestStreak) {
        this.stats.longestStreak = currentStreak;
      }
    }
  }
  next();
});

module.exports = mongoose.model('Journal', journalSchema);
