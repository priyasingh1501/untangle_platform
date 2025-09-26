const mongoose = require('mongoose');

const foodTrackingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'snack', 'dinner'],
    required: true
  },
  
  // Context
  time: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  energy: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  hunger: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  
  // Choice
  plateTemplate: {
    type: String,
    required: true
  },
  proteinAnchor: {
    type: Boolean,
    default: false
  },
  plantColors: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  carbQuality: {
    type: String,
    enum: ['whole', 'fermented', 'refined'],
    required: true
  },
  friedOrUPF: {
    type: Boolean,
    required: true
  },
  addedSugar: {
    type: Boolean,
    required: true
  },
  
  // Awareness
  mindfulPractice: {
    type: String,
    enum: ['breath', 'no_screens', 'slow', 'none'],
    default: 'none'
  },
  
  // Outcome
  satiety: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  postMealCravings: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  
  // Nutrition Analysis (calculated)
  isCarbHeavy: {
    type: Boolean,
    default: false
  },
  isFatHeavy: {
    type: Boolean,
    default: false
  },
  isProcessed: {
    type: Boolean,
    default: false
  },
  isFiberRich: {
    type: Boolean,
    default: false
  },
  isProteinHeavy: {
    type: Boolean,
    default: false
  },
  isIronRich: {
    type: Boolean,
    default: false
  },
  isHighSugar: {
    type: Boolean,
    default: false
  },
  
  // Health Goals
  healthGoals: [{
    type: String,
    enum: ['steady_energy', 'muscle_building', 'gut_comfort', 'immunity_building']
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient querying
foodTrackingSchema.index({ userId: 1, date: 1, mealType: 1 });
foodTrackingSchema.index({ userId: 1, date: 1, healthGoals: 1 });

// Update timestamp on save
foodTrackingSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Virtual for week number
foodTrackingSchema.virtual('weekNumber').get(function() {
  const date = new Date(this.date);
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
});

// Method to calculate nutrition analysis
foodTrackingSchema.methods.calculateNutritionAnalysis = function() {
  // This would be enhanced with actual nutrition data
  // For now, using the input data to make educated guesses
  
  this.isCarbHeavy = this.carbQuality === 'refined' || this.carbQuality === 'whole';
  this.isFatHeavy = this.friedOrUPF;
  this.isProcessed = this.friedOrUPF || this.addedSugar;
  this.isFiberRich = this.plantColors >= 3;
  this.isProteinHeavy = this.proteinAnchor;
  this.isIronRich = this.plantColors >= 2 && this.proteinAnchor;
  this.isHighSugar = this.addedSugar;
  
  return this;
};

module.exports = mongoose.models.FoodTracking || mongoose.model('FoodTracking', foodTrackingSchema);
