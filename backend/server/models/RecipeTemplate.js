const mongoose = require('mongoose');

const recipeIngredientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  grams: {
    type: Number,
    required: true,
    min: 0
  },
  foodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FoodItem'
  }
});

const recipeTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameFold: {
    type: String,
    required: true,
    trim: true
  },
  portionGramsDefault: {
    type: Number,
    required: true,
    min: 0
  },
  ingredients: [recipeIngredientSchema],
  cuisine: {
    type: String,
    enum: ['Indian', 'North Indian', 'South Indian', 'East Indian', 'West Indian', 'Fusion'],
    default: 'Indian'
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'any'],
    default: 'any'
  },
  tags: [String],
  notes: String,
  estimatedNutrition: {
    kcal: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'easy'
  },
  prepTime: {
    type: Number,
    description: 'Preparation time in minutes'
  },
  cookTime: {
    type: Number,
    description: 'Cooking time in minutes'
  },
  servings: {
    type: Number,
    min: 1,
    default: 1
  }
}, {
  timestamps: true
});

// Indexes for efficient searching
recipeTemplateSchema.index({ nameFold: 'text' });
recipeTemplateSchema.index({ cuisine: 1, mealType: 1 });
recipeTemplateSchema.index({ tags: 1 });

// Virtual for total time
recipeTemplateSchema.virtual('totalTime').get(function() {
  return (this.prepTime || 0) + (this.cookTime || 0);
});

// Method to get display name
recipeTemplateSchema.methods.getDisplayName = function() {
  return this.name;
};

// Method to check if recipe has specific tag
recipeTemplateSchema.methods.hasTag = function(tag) {
  return this.tags && this.tags.includes(tag);
};

// Method to get ingredient by name
recipeTemplateSchema.methods.getIngredient = function(name) {
  return this.ingredients.find(ing => ing.name === name);
};

// Method to calculate total weight
recipeTemplateSchema.methods.getTotalWeight = function() {
  return this.ingredients.reduce((sum, ing) => sum + ing.grams, 0);
};

// Method to scale recipe
recipeTemplateSchema.methods.scaleRecipe = function(factor) {
  const scaled = this.toObject();
  scaled.ingredients = this.ingredients.map(ing => ({
    ...ing.toObject(),
    grams: Math.round(ing.grams * factor)
  }));
  scaled.portionGramsDefault = Math.round(this.portionGramsDefault * factor);
  return scaled;
};

module.exports = mongoose.model('RecipeTemplate', recipeTemplateSchema);
