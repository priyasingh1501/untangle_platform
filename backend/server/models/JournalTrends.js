const mongoose = require('mongoose');

const journalTrendsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timeRange: {
    type: String,
    enum: ['week', 'month', 'quarter', 'year'],
    default: 'month'
  },
  trendAnalysis: {
    emotionTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable', 'volatile'],
      default: 'stable'
    },
    commonTopics: [{
      name: String,
      frequency: Number,
      confidence: Number
    }],
    evolvingBeliefs: [{
      belief: String,
      category: String,
      confidence: Number,
      trend: String // 'emerging', 'strengthening', 'weakening', 'stable'
    }],
    summary: String,
    insights: [String],
    sentimentTrend: {
      type: String,
      enum: ['improving', 'declining', 'stable', 'volatile'],
      default: 'stable'
    },
    emotionalRange: {
      min: Number,
      max: Number,
      average: Number
    },
    topicEvolution: [{
      topic: String,
      trend: String,
      confidence: Number
    }],
    beliefChanges: [{
      oldBelief: String,
      newBelief: String,
      confidence: Number,
      timeframe: String
    }]
  },
  metadata: {
    analyzedEntries: {
      type: Number,
      default: 0
    },
    totalEntries: {
      type: Number,
      default: 0
    },
    analysisDate: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    version: {
      type: String,
      default: '1.0'
    }
  },
  // Cache invalidation
  cacheKey: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    default: function() {
      // Cache for 24 hours by default
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
journalTrendsSchema.index({ userId: 1, timeRange: 1 });
journalTrendsSchema.index({ userId: 1, 'metadata.analysisDate': -1 });
journalTrendsSchema.index({ cacheKey: 1 });
journalTrendsSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate cache key
journalTrendsSchema.statics.generateCacheKey = function(userId, timeRange, limit) {
  return `trends_${userId}_${timeRange}_${limit}_${Math.floor(Date.now() / (1000 * 60 * 60))}`; // Hourly cache
};

// Static method to get or create trends
journalTrendsSchema.statics.getOrCreateTrends = async function(userId, timeRange = 'month', limit = 20) {
  const cacheKey = this.generateCacheKey(userId, timeRange, limit);
  
  // Try to find existing trends
  let trends = await this.findOne({ 
    userId, 
    timeRange, 
    cacheKey,
    expiresAt: { $gt: new Date() }
  });
  
  if (trends) {
    return trends;
  }
  
  // If no valid cache, return null to trigger regeneration
  return null;
};

// Method to check if trends need refresh
journalTrendsSchema.methods.needsRefresh = function() {
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  return this.metadata.lastUpdated < oneDayAgo || this.expiresAt < now;
};

module.exports = mongoose.model('JournalTrends', journalTrendsSchema);

