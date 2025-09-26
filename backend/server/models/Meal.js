const mongoose = require('mongoose');

const mealItemSchema = new mongoose.Schema({
  foodId: {
    type: mongoose.Schema.Types.Mixed, // Allow both ObjectId and String for external IDs
    required: true
  },
  customName: String,
  grams: {
    type: Number,
    required: true,
    min: 0,
    max: 1000
  }
});

const mealSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ts: {
    type: Date,
    default: Date.now
  },
  items: [mealItemSchema],
  presence: {
    type: String,
    enum: ['present', 'partial', 'absent'],
    default: 'present'
  },
  energy: {
    type: Number,
    min: 1,
    max: 10,
    description: 'Energy level 60-90 min after eating'
  },
  notes: String,
  context: {
    postWorkout: {
      type: Boolean,
      default: false
    },
    bodyMassKg: Number,
    plantDiversity: Number,
    fermented: Boolean,
    omega3Tag: Boolean,
    addedSugar: Number
  },
  computed: {
    totals: {
      kcal: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sugar: Number,
      vitaminC: Number,
      zinc: Number,
      selenium: Number,
      iron: Number,
      omega3: Number
    },
    badges: {
      protein: Boolean,
      veg: Boolean,
      gi: Number,
      fodmap: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Unknown']
      },
      nova: Number
    },
    mindfulMealScore: {
      type: Number,
      min: 0,
      max: 5
    },
    rationale: [String],
    tip: String,
    aiInsights: String,
    effects: {
      fatForming: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        level: String,
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      },
      strength: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        level: String,
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      },
      immunity: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        level: String,
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      },
      inflammation: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      },
      antiInflammatory: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      },
      energizing: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        level: String,
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      },
      gutFriendly: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        level: String,
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      },
      moodLifting: {
        score: {
          type: Number,
          min: 0,
          max: 10
        },
        why: [String],
        level: String,
        label: {
          type: String,
          enum: ['Very Low', 'Low', 'Medium', 'High', 'Very High']
        },
        aiInsights: String
      }
    }
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
mealSchema.index({ userId: 1, ts: -1 });
mealSchema.index({ userId: 1, 'computed.mindfulMealScore': -1 });

// Virtual for total weight
mealSchema.virtual('totalWeight').get(function() {
  return this.items.reduce((sum, item) => sum + item.grams, 0);
});

// Virtual for meal type based on time
mealSchema.virtual('mealType').get(function() {
  const hour = this.ts.getHours();
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 16 && hour < 21) return 'dinner';
  return 'snack';
});

// Method to get display name for meal
mealSchema.methods.getDisplayName = function() {
  if (this.items.length === 0) return 'Empty Meal';
  if (this.items.length === 1) return this.items[0].customName || 'Single Item';
  if (this.items.length === 2) {
    const names = this.items.map(item => item.customName || 'Unknown');
    return `${names[0]} + ${names[1]}`;
  }
  return `${this.items[0].customName || 'Meal'} + ${this.items.length - 1} more`;
};

// Method to check if meal has specific badge
mealSchema.methods.hasBadge = function(badgeName) {
  return this.computed.badges[badgeName];
};

// Method to get nutrient total
mealSchema.methods.getNutrientTotal = function(nutrient) {
  return this.computed.totals[nutrient] || 0;
};

// Method to get meal quality rating
mealSchema.methods.getQualityRating = function() {
  const score = this.computed.mindfulMealScore;
  if (score >= 4) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 2) return 'fair';
  return 'needs_improvement';
};

module.exports = mongoose.model('Meal', mealSchema);
