const mongoose = require('mongoose');

const mindfulnessCheckinSchema = new mongoose.Schema({
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
  // 5 mindfulness dimensions with 5-step ratings (1-5)
  dimensions: {
    presence: {
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    },
    emotionAwareness: {
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    },
    intentionality: {
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    },
    attentionQuality: {
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    },
    compassion: {
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    }
  },
  
  // Day reflection that gets added to journal
  dayReflection: {
    type: String,
    trim: true
  },
  // Calculated total score (out of 25)
  totalScore: {
    type: Number,
    required: true,
    min: 5,
    max: 25
  },
  // Overall assessment
  overallAssessment: {
    type: String,
    enum: ['beginner', 'developing', 'intermediate', 'advanced', 'master'],
    required: true
  },
  // Notes for the day
  dailyNotes: {
    type: String,
    trim: true
  },
  // Journal entries created from this check-in
  journalEntries: [{
    entryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Journal'
    },
    type: {
      type: String,
      enum: ['mindful_moment', 'distracted_moment', 'day_reflection'],
      required: true
    },
    dimension: {
      type: String,
      enum: ['presence', 'emotionAwareness', 'intentionality', 'attentionQuality', 'compassion', 'general'],
      required: true
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to calculate total score and overall assessment
mindfulnessCheckinSchema.pre('save', function(next) {
  // Calculate total score
  const ratings = [
    this.dimensions.presence.rating,
    this.dimensions.emotionAwareness.rating,
    this.dimensions.intentionality.rating,
    this.dimensions.attentionQuality.rating,
    this.dimensions.compassion.rating
  ];
  
  this.totalScore = ratings.reduce((sum, rating) => sum + rating, 0);
  
  // Determine overall assessment based on total score
  if (this.totalScore >= 20) {
    this.overallAssessment = 'master';
  } else if (this.totalScore >= 17) {
    this.overallAssessment = 'advanced';
  } else if (this.totalScore >= 14) {
    this.overallAssessment = 'intermediate';
  } else if (this.totalScore >= 11) {
    this.overallAssessment = 'developing';
  } else {
    this.overallAssessment = 'beginner';
  }
  
  next();
});

// Indexes for efficient querying
mindfulnessCheckinSchema.index({ userId: 1, date: 1 });
mindfulnessCheckinSchema.index({ userId: 1, totalScore: -1 });
mindfulnessCheckinSchema.index({ userId: 1, overallAssessment: 1 });

module.exports = mongoose.model('MindfulnessCheckin', mindfulnessCheckinSchema);
