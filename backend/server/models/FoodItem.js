const mongoose = require('mongoose');

const provenanceSchema = new mongoose.Schema({
  source: { type: String, required: true }, // e.g., 'USDA', 'IFCT', 'OpenFoodFacts', 'Heuristic'
  sourceId: String, // Original ID from external source (e.g., FDC ID, OFF barcode)
  origin: { type: String, enum: ['measured', 'estimated', 'calculated', 'heuristic'], default: 'estimated' },
  lastVerifiedAt: Date,
  confidence: { type: Number, min: 0, max: 1, default: 0.5 }, // 0 to 1
  notes: String,
}, { _id: false });

const qualityFlagSchema = new mongoose.Schema({
  flag: { type: String, required: true }, // e.g., 'ATWATER_DEVIATION', 'PORTION_OUT_OF_BAND', 'GI_LOW_CARB'
  level: { type: String, enum: ['info', 'warn', 'error'], default: 'warn' },
  message: String,
  value: mongoose.Schema.Types.Mixed, // The value that triggered the flag
  threshold: mongoose.Schema.Types.Mixed, // The threshold that was exceeded
}, { _id: false });

const portionUnitSchema = new mongoose.Schema({
  unit: { type: String, required: true }, // e.g., 'katori', 'spoon', 'roti', 'idli', 'cup', 'handful'
  grams: { type: Number, required: true, min: 0 },
  description: String, // e.g., "Medium katori", "Standard roti"
  isDefault: { type: Boolean, default: false },
  commonFoods: [String], // Foods this unit is commonly used for
}, { _id: false });

const foodItemSchema = new mongoose.Schema({
  source: {
    type: String,
    enum: ['USDA', 'IFCT', 'SEED', 'OpenFoodFacts', 'CUSTOM'], // Expanded enum
    required: true
  },
  externalId: String,
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
  aliases: [String],
  // Legacy: Keep for backward compatibility
  portionGramsDefault: {
    type: Number,
    required: true,
    min: 0
  },
  // New: Multiple portion units for traditional measurements
  portionUnits: [portionUnitSchema],
  nutrients: {
    kcal: {
      type: Number,
      required: true,
      min: 0
    },
    protein: {
      type: Number,
      required: true,
      min: 0
    },
    fat: {
      type: Number,
      required: true,
      min: 0
    },
    carbs: {
      type: Number,
      required: true,
      min: 0
    },
    fiber: {
      type: Number,
      min: 0
    },
    sugar: {
      type: Number,
      min: 0
    },
    vitaminC: {
      type: Number,
      min: 0
    },
    zinc: {
      type: Number,
      min: 0
    },
    selenium: {
      type: Number,
      min: 0
    },
    iron: {
      type: Number,
      min: 0
    },
    omega3: {
      type: Number,
      min: 0
    }
  },
  gi: {
    type: Number,
    min: 0,
    max: 110 // Widened GI range
  },
  gl: {
    type: Number,
    min: 0
  },
  fodmap: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Unknown']
  },
  novaClass: {
    type: Number,
    min: 1,
    max: 4
  },
  tags: [String],
  provenance: { // New field
    type: Map,
    of: provenanceSchema,
    default: {}
  },
  qualityFlags: [qualityFlagSchema], // New field
}, {
  timestamps: true
});

foodItemSchema.index({ nameFold: 'text' });
foodItemSchema.index({ name: 1, source: 1 });

// Add unique constraints to prevent duplicates
foodItemSchema.index({ nameFold: 1, source: 1 }, { unique: true });
// Note: externalId uniqueness handled at application level for non-null values

// Add compound index for better search performance
foodItemSchema.index({ nameFold: 1, tags: 1, source: 1 });

// Add index for provenance queries
foodItemSchema.index({ 'provenance.source': 1 });

// Virtual for getting the default portion unit
foodItemSchema.virtual('defaultPortionUnit').get(function() {
  if (this.portionUnits && this.portionUnits.length > 0) {
    const defaultUnit = this.portionUnits.find(unit => unit.isDefault);
    return defaultUnit || this.portionUnits[0];
  }
  return null;
});

// Method to convert traditional units to grams
foodItemSchema.methods.convertUnitToGrams = function(unit, quantity = 1) {
  if (this.portionUnits && this.portionUnits.length > 0) {
    const portionUnit = this.portionUnits.find(u => u.unit === unit);
    if (portionUnit) {
      return portionUnit.grams * quantity;
    }
  }
  
  // Fallback to default conversion factors
  const conversionFactors = {
    'katori': 80,
    'spoon': 15,
    'roti': 45,
    'idli': 120,
    'cup': 200,
    'handful': 30,
    'teaspoon': 5,
    'tablespoon': 15
  };
  
  return (conversionFactors[unit] || this.portionGramsDefault) * quantity;
};

// Method to get suggested units for this food
foodItemSchema.methods.getSuggestedUnits = function() {
  if (this.portionUnits && this.portionUnits.length > 0) {
    return this.portionUnits.map(unit => ({
      unit: unit.unit,
      description: unit.description,
      grams: unit.grams
    }));
  }
  
  // Fallback based on food type
  const foodType = this.tags?.[0] || 'general';
  const unitSuggestions = {
    'dal': ['katori', 'cup'],
    'curry': ['katori', 'cup'],
    'rice': ['katori', 'cup'],
    'roti': ['roti', 'piece'],
    'idli': ['idli', 'piece'],
    'milk': ['cup', 'glass'],
    'ghee': ['spoon', 'teaspoon'],
    'curd': ['katori', 'cup'],
    'nuts': ['handful', 'spoon'],
    'fruits': ['piece', 'cup']
  };
  
  return unitSuggestions[foodType] || ['piece', 'cup'];
};

foodItemSchema.virtual('proteinDensity').get(function() {
  return this.nutrients.protein / 100;
});

foodItemSchema.methods.getDisplayName = function() {
  return this.name;
};

foodItemSchema.methods.hasTag = function(tag) {
  return this.tags && this.tags.includes(tag);
};

foodItemSchema.methods.getNutrientPerGram = function(nutrient) {
  if (this.nutrients[nutrient] !== undefined) {
    return this.nutrients[nutrient] / 100;
  }
  return 0;
};

module.exports = mongoose.models.FoodItem || mongoose.model('FoodItem', foodItemSchema);
