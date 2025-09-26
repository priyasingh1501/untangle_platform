const mongoose = require('mongoose');

const contentItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['book', 'movie', 'tv_show', 'video', 'podcast', 'article', 'course', 'documentary'],
    required: true
  },
  category: {
    type: String,
    enum: ['self_help', 'fiction', 'non_fiction', 'business', 'health', 'technology', 'science', 'history', 'philosophy', 'art', 'travel', 'cooking', 'fitness', 'education', 'entertainment'],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  author: {
    type: String,
    trim: true
  },
  director: {
    type: String,
    trim: true
  },
  year: {
    type: Number
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 0
  },
  duration: {
    type: String // e.g., "2h 15m" for movies, "300 pages" for books
  },
  language: {
    type: String,
    default: 'English'
  },
  tags: [{
    type: String,
    trim: true
  }],
  coverImage: {
    type: String
  },
  externalLinks: [{
    platform: String, // "amazon", "netflix", "youtube", "goodreads", etc.
    url: String,
    price: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  }],
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userReview: {
    type: String
  },
  status: {
    type: String,
    enum: ['want_to_consume', 'currently_consuming', 'completed', 'abandoned'],
    default: 'want_to_consume'
  },
  progress: {
    type: Number, // percentage or current page/chapter
    min: 0,
    max: 100
  },
  startDate: Date,
  completionDate: Date,
  notes: [{
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: String // page number, timestamp, etc.
  }],
  isRecommended: {
    type: Boolean,
    default: false
  },
  recommendationReason: String,
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  timeInvestment: {
    type: String,
    enum: ['quick', 'moderate', 'extensive'],
    default: 'moderate'
  }
}, {
  timestamps: true
});

const contentCollectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['wishlist', 'favorites', 'completed', 'currently_reading', 'watchlist'],
    default: 'wishlist'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  items: [contentItemSchema],
  stats: {
    totalItems: {
      type: Number,
      default: 0
    },
    completedItems: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Update stats when items are added/modified
contentCollectionSchema.pre('save', function(next) {
  if (this.items.length > 0) {
    this.stats.totalItems = this.items.length;
    
    const completedItems = this.items.filter(item => item.status === 'completed');
    this.stats.completedItems = completedItems.length;
    
    const ratedItems = this.items.filter(item => item.userRating > 0);
    if (ratedItems.length > 0) {
      const totalRating = ratedItems.reduce((sum, item) => sum + item.userRating, 0);
      this.stats.averageRating = Math.round((totalRating / ratedItems.length) * 10) / 10;
    }
  }
  next();
});

module.exports = mongoose.model('ContentCollection', contentCollectionSchema);
