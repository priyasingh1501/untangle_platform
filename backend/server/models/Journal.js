const mongoose = require('mongoose');
const EncryptionService = require('../services/encryptionService');

const encryptionService = new EncryptionService();

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
  // Encrypted fields
  encryptedTitle: {
    type: Object, // { encrypted: string, iv: string, tag: string }
    default: null
  },
  encryptedContent: {
    type: Object, // { encrypted: string, iv: string, tag: string }
    default: null
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

// Encrypt sensitive data before saving
journalEntrySchema.pre('save', async function(next) {
  try {
    // Only encrypt if content has changed and is not already encrypted
    if (this.isModified('content') && this.content && !this.encryptedContent) {
      this.encryptedContent = encryptionService.encrypt(this.content);
      // Clear plain text content after encryption
      this.content = undefined;
    }
    
    if (this.isModified('title') && this.title && !this.encryptedTitle) {
      this.encryptedTitle = encryptionService.encrypt(this.title);
      // Clear plain text title after encryption
      this.title = undefined;
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Decrypt sensitive data when retrieving
journalEntrySchema.post('init', function() {
  try {
    // Decrypt content if encrypted
    if (this.encryptedContent && !this.content) {
      this.content = encryptionService.decrypt(this.encryptedContent);
    }
    
    // Decrypt title if encrypted
    if (this.encryptedTitle && !this.title) {
      this.title = encryptionService.decrypt(this.encryptedTitle);
    }
  } catch (error) {
    console.error('Error decrypting journal entry:', error);
  }
});

// Method to get decrypted entry
journalEntrySchema.methods.getDecryptedEntry = function() {
  const entry = this.toObject();
  
  try {
    if (this.encryptedContent) {
      entry.content = encryptionService.decrypt(this.encryptedContent);
    }
    if (this.encryptedTitle) {
      entry.title = encryptionService.decrypt(this.encryptedTitle);
    }
  } catch (error) {
    console.error('Error decrypting journal entry:', error);
  }
  
  return entry;
};

// Method to encrypt entry before saving
journalEntrySchema.methods.encryptEntry = function() {
  try {
    if (this.content && !this.encryptedContent) {
      this.encryptedContent = encryptionService.encrypt(this.content);
      this.content = undefined;
    }
    if (this.title && !this.encryptedTitle) {
      this.encryptedTitle = encryptionService.encrypt(this.title);
      this.title = undefined;
    }
  } catch (error) {
    console.error('Error encrypting journal entry:', error);
    throw error;
  }
};

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

// Method to get all entries with decrypted content
journalSchema.methods.getDecryptedEntries = function() {
  return this.entries.map(entry => entry.getDecryptedEntry());
};

// Method to add a new entry with encryption
journalSchema.methods.addEncryptedEntry = function(entryData) {
  const entry = {
    ...entryData,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  // Encrypt sensitive fields
  if (entry.title) {
    entry.encryptedTitle = encryptionService.encrypt(entry.title);
    delete entry.title;
  }
  if (entry.content) {
    entry.encryptedContent = encryptionService.encrypt(entry.content);
    delete entry.content;
  }
  
  this.entries.push(entry);
  return this.save();
};

// Method to update an entry with encryption
journalSchema.methods.updateEncryptedEntry = function(entryId, updateData) {
  const entry = this.entries.id(entryId);
  if (!entry) {
    throw new Error('Entry not found');
  }
  
  // Encrypt sensitive fields if they're being updated
  if (updateData.title) {
    entry.encryptedTitle = encryptionService.encrypt(updateData.title);
    delete updateData.title;
  }
  if (updateData.content) {
    entry.encryptedContent = encryptionService.encrypt(updateData.content);
    delete updateData.content;
  }
  
  // Update other fields
  Object.assign(entry, updateData);
  entry.updatedAt = new Date();
  
  return this.save();
};

// Method to get a specific entry with decrypted content
journalSchema.methods.getDecryptedEntry = function(entryId) {
  const entry = this.entries.id(entryId);
  if (!entry) {
    return null;
  }
  return entry.getDecryptedEntry();
};

// Static method to find journal with decrypted entries
journalSchema.statics.findWithDecryptedEntries = function(query) {
  return this.find(query).then(journals => {
    return journals.map(journal => ({
      ...journal.toObject(),
      entries: journal.getDecryptedEntries()
    }));
  });
};

module.exports = mongoose.model('Journal', journalSchema);
