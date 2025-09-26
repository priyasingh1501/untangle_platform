const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    // For AI responses that create actions
    actions: [{
      type: {
        type: String,
        enum: ['create_task', 'create_journal_entry', 'add_expense', 'schedule_time', 'add_content', 'create_reminder', 'update_goal', 'recommend_content', 'set_goal', 'provide_insight']
      },
      data: mongoose.Schema.Types.Mixed,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    // For tracking user intent
    intent: String,
    confidence: Number,
    // For context tracking
    context: {
      currentGoal: String,
      mood: String,
      energyLevel: String,
      currentTask: String,
      location: String,
      timeOfDay: String
    }
  }
});

const aiChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  conversationId: {
    type: String,
    required: true,
    unique: true
  },
  messages: [messageSchema],
  userProfile: {
    // Learning from user interactions
    preferences: {
      communicationStyle: {
        type: String,
        enum: ['direct', 'encouraging', 'analytical', 'casual'],
        default: 'encouraging'
      },
      detailLevel: {
        type: String,
        enum: ['brief', 'moderate', 'detailed'],
        default: 'moderate'
      },
      reminderFrequency: {
        type: String,
        enum: ['minimal', 'moderate', 'frequent'],
        default: 'moderate'
      }
    },
    // User's goals and interests
    goals: [{
      title: String,
      description: String,
      category: String,
      priority: String,
      targetDate: Date,
      progress: Number,
      isActive: Boolean
    }],
    interests: [{
      category: String,
      topics: [String],
      intensity: Number // 1-10 scale
    }],
    // Behavioral patterns
    patterns: {
      productivityPeakHours: [String], // e.g., ["9:00", "14:00"]
      preferredWorkDuration: Number, // in minutes
      breakPreferences: String,
      stressTriggers: [String],
      copingStrategies: [String]
    },
    // Content preferences
    contentTaste: {
      bookGenres: [String],
      movieGenres: [String],
      podcastTopics: [String],
      learningStyle: String,
      preferredDifficulty: String
    }
  },
  // AI assistant personality and capabilities
  assistantConfig: {
    name: {
      type: String,
      default: 'Untangle'
    },
    personality: {
      type: String,
      enum: ['motivational', 'practical', 'analytical', 'creative', 'balanced'],
      default: 'balanced'
    },
    expertise: [String], // e.g., ['time_management', 'productivity', 'wellness', 'finance']
    tone: {
      type: String,
      enum: ['professional', 'friendly', 'casual', 'inspiring'],
      default: 'friendly'
    }
  },
  // Session management
  currentSession: {
    startTime: Date,
    context: {
      currentGoal: String,
      mood: String,
      energyLevel: String,
      currentTask: String,
      location: String,
      timeOfDay: String
    },
    focusArea: String // What the user is currently working on
  },
  // Analytics and insights
  insights: {
    totalConversations: {
      type: Number,
      default: 0
    },
    averageSessionLength: Number, // in minutes
    mostDiscussedTopics: [String],
    productivityTrends: [{
      date: Date,
      score: Number,
      factors: [String]
    }],
    goalProgress: [{
      goalId: String,
      progress: Number,
      lastUpdated: Date
    }]
  },
  // Integration settings
  integrations: {
    autoCreateTasks: {
      type: Boolean,
      default: true
    },
    autoCreateJournalEntries: {
      type: Boolean,
      default: true
    },
    autoScheduleTime: {
      type: Boolean,
      default: true
    },
    autoAddExpenses: {
      type: Boolean,
      default: true
    },
    autoSuggestContent: {
      type: Boolean,
      default: true
    },
    reminderPreferences: {
      type: String,
      enum: ['immediate', 'daily', 'weekly', 'never'],
      default: 'daily'
    }
  }
}, {
  timestamps: true
});

// Index for efficient querying
aiChatSchema.index({ userId: 1, conversationId: 1 });
aiChatSchema.index({ 'messages.timestamp': -1 });

// Method to add a new message
aiChatSchema.methods.addMessage = function(role, content, metadata = {}) {
  this.messages.push({
    role,
    content,
    metadata
  });
  
  // Keep only last 100 messages to prevent memory issues
  if (this.messages.length > 100) {
    this.messages = this.messages.slice(-100);
  }
  
  return this.save();
};

// Method to get conversation summary
aiChatSchema.methods.getConversationSummary = function() {
  const userMessages = this.messages.filter(msg => msg.role === 'user');
  const assistantMessages = this.messages.filter(msg => msg.role === 'assistant');
  
  return {
    totalMessages: this.messages.length,
    userMessages: userMessages.length,
    assistantMessages: assistantMessages.length,
    lastMessageTime: this.messages.length > 0 ? this.messages[this.messages.length - 1].timestamp : null,
    currentContext: this.currentSession?.context || {}
  };
};

// Method to update user profile based on conversation
aiChatSchema.methods.updateUserProfile = function(updates) {
  if (updates.goals) {
    this.userProfile.goals = updates.goals;
  }
  if (updates.interests) {
    this.userProfile.interests = updates.interests;
  }
  if (updates.patterns) {
    this.userProfile.patterns = updates.patterns;
  }
  if (updates.contentTaste) {
    this.userProfile.contentTaste = updates.contentTaste;
  }
  
  return this.save();
};

// Method to create action from AI response
aiChatSchema.methods.createAction = function(actionType, data) {
  const action = {
    type: actionType,
    data,
    status: 'pending'
  };
  
  // Add to the last assistant message
  if (this.messages.length > 0 && this.messages[this.messages.length - 1].role === 'assistant') {
    if (!this.messages[this.messages.length - 1].metadata.actions) {
      this.messages[this.messages.length - 1].metadata.actions = [];
    }
    this.messages[this.messages.length - 1].metadata.actions.push(action);
  }
  
  return this.save();
};

module.exports = mongoose.model('AiChat', aiChatSchema);
