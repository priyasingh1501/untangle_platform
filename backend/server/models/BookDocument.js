const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    trim: true
  }, // page number, chapter, etc.
  tags: [{
    type: String,
    trim: true
  }],
  isImportant: {
    type: Boolean,
    default: false
  },
  isQuote: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const bookDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    trim: true
  },
  isbn: {
    type: String,
    trim: true
  },
  coverImage: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['not_started', 'currently_reading', 'completed', 'paused'],
    default: 'not_started'
  },
  progress: {
    type: Number, // percentage 0-100
    min: 0,
    max: 100,
    default: 0
  },
  totalPages: {
    type: Number,
    min: 1
  },
  currentPage: {
    type: Number,
    min: 0,
    default: 0
  },
  startDate: {
    type: Date
  },
  completionDate: {
    type: Date
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['fiction', 'non_fiction', 'self_help', 'business', 'health', 'technology', 'science', 'history', 'philosophy', 'art', 'travel', 'cooking', 'fitness', 'education', 'biography', 'memoir', 'poetry', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: [noteSchema],
  isDefault: {
    type: Boolean,
    default: false
  }, // For user's journal
  externalLinks: [{
    platform: String, // "amazon", "goodreads", "library", etc.
    url: String,
    price: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  }],
  readingTime: {
    estimatedHours: Number,
    actualHours: Number
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  language: {
    type: String,
    default: 'English'
  },
  publicationYear: {
    type: Number
  },
  publisher: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
bookDocumentSchema.index({ userId: 1, status: 1 });
bookDocumentSchema.index({ userId: 1, category: 1 });
bookDocumentSchema.index({ userId: 1, isDefault: 1 });

// Virtual for reading progress percentage
bookDocumentSchema.virtual('readingProgress').get(function() {
  if (this.totalPages && this.currentPage) {
    return Math.round((this.currentPage / this.totalPages) * 100);
  }
  return this.progress;
});

// Method to add a note
bookDocumentSchema.methods.addNote = function(content, location = '', tags = [], isImportant = false) {
  this.notes.push({
    content,
    location,
    tags,
    isImportant
  });
  return this.save();
};

// Method to update progress
bookDocumentSchema.methods.updateProgress = function(currentPage, totalPages = null) {
  this.currentPage = currentPage;
  if (totalPages) {
    this.totalPages = totalPages;
  }
  
  if (this.totalPages) {
    this.progress = Math.round((this.currentPage / this.totalPages) * 100);
  }
  
  if (this.progress === 100 && this.status !== 'completed') {
    this.status = 'completed';
    this.completionDate = new Date();
  }
  
  return this.save();
};

// Method to get notes by tag
bookDocumentSchema.methods.getNotesByTag = function(tag) {
  return this.notes.filter(note => note.tags.includes(tag));
};

// Method to get important notes
bookDocumentSchema.methods.getImportantNotes = function() {
  return this.notes.filter(note => note.isImportant);
};

// Method to get quote notes
bookDocumentSchema.methods.getQuoteNotes = function() {
  return this.notes.filter(note => note.isQuote);
};

module.exports = mongoose.model('BookDocument', bookDocumentSchema);
