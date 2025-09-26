/**
 * Nutrient aggregation logic for meal analysis
 */

/**
 * Aggregate nutrients from multiple food items
 * @param {Array} items - Array of {food: FoodItem, grams: number}
 * @returns {Object} - Aggregated nutrient totals
 */
function aggregateNutrients(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return getEmptyNutrients();
  }

  const totals = getEmptyNutrients();

  items.forEach(({ food, grams }) => {
    if (!food || !food.nutrients || typeof grams !== 'number' || grams <= 0) {
      return; // Skip invalid items
    }

    const factor = grams / 100; // Convert from per-100g to per-gram

    // Aggregate all nutrients
    Object.keys(totals).forEach(nutrient => {
      if (food.nutrients[nutrient] !== undefined && food.nutrients[nutrient] !== null) {
        totals[nutrient] += food.nutrients[nutrient] * factor;
      }
    });
  });

  // Round to 2 decimal places for display
  Object.keys(totals).forEach(nutrient => {
    totals[nutrient] = Math.round(totals[nutrient] * 100) / 100;
  });

  return totals;
}

/**
 * Get empty nutrient object with all fields set to 0
 * @returns {Object} - Empty nutrient totals
 */
function getEmptyNutrients() {
  return {
    kcal: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
    fiber: 0,
    sugar: 0,
    vitaminC: 0,
    zinc: 0,
    selenium: 0,
    iron: 0,
    omega3: 0
  };
}

/**
 * Calculate macronutrient percentages
 * @param {Object} totals - Nutrient totals
 * @returns {Object} - Macronutrient percentages
 */
function calculateMacroPercentages(totals) {
  const { kcal, protein, fat, carbs } = totals;
  
  if (kcal === 0) {
    return { protein: 0, fat: 0, carbs: 0 };
  }

  // Protein: 4 kcal/g, Fat: 9 kcal/g, Carbs: 4 kcal/g
  const proteinKcal = protein * 4;
  const fatKcal = fat * 9;
  const carbsKcal = carbs * 4;

  return {
    protein: Math.round((proteinKcal / kcal) * 100),
    fat: Math.round((fatKcal / kcal) * 100),
    carbs: Math.round((carbsKcal / kcal) * 100)
  };
}

/**
 * Calculate protein density (g protein per 100 kcal)
 * @param {Object} totals - Nutrient totals
 * @returns {number} - Protein density
 */
function calculateProteinDensity(totals) {
  if (totals.kcal === 0) return 0;
  return Math.round((totals.protein / totals.kcal) * 100 * 100) / 100;
}

/**
 * Calculate fiber density (g fiber per 100 kcal)
 * @param {Object} totals - Nutrient totals
 * @returns {number} - Fiber density
 */
function calculateFiberDensity(totals) {
  if (totals.kcal === 0) return 0;
  return Math.round((totals.fiber / totals.kcal) * 100 * 100) / 100;
}

/**
 * Calculate sugar percentage of total carbs
 * @param {Object} totals - Nutrient totals
 * @returns {number} - Sugar percentage of carbs
 */
function calculateSugarPercentage(totals) {
  if (totals.carbs === 0) return 0;
  return Math.round((totals.sugar / totals.carbs) * 100);
}

/**
 * Calculate total weight of all items
 * @param {Array} items - Array of {food: FoodItem, grams: number}
 * @returns {number} - Total weight in grams
 */
function calculateTotalWeight(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, { grams }) => {
    return total + (typeof grams === 'number' ? grams : 0);
  }, 0);
}

/**
 * Calculate average nutrient density per gram
 * @param {Object} totals - Nutrient totals
 * @param {number} totalWeight - Total weight in grams
 * @returns {Object} - Nutrient density per gram
 */
function calculateNutrientDensity(totals, totalWeight) {
  if (totalWeight === 0) return getEmptyNutrients();

  const density = {};
  Object.keys(totals).forEach(nutrient => {
    density[nutrient] = Math.round((totals[nutrient] / totalWeight) * 1000) / 1000;
  });

  return density;
}

/**
 * Validate nutrient totals for reasonable ranges
 * @param {Object} totals - Nutrient totals
 * @returns {Object} - Validation results
 */
function validateNutrients(totals) {
  const warnings = [];
  const errors = [];

  // Check for extreme values
  if (totals.kcal > 2000) {
    warnings.push('Very high calorie meal (>2000 kcal)');
  }
  if (totals.kcal < 50) {
    warnings.push('Very low calorie meal (<50 kcal)');
  }

  if (totals.protein > 100) {
    warnings.push('Very high protein meal (>100g)');
  }
  if (totals.fat > 100) {
    warnings.push('Very high fat meal (>100g)');
  }
  if (totals.carbs > 300) {
    warnings.push('Very high carb meal (>300g)');
  }

  if (totals.fiber > 50) {
    warnings.push('Very high fiber meal (>50g) - may cause digestive issues');
  }

  return { warnings, errors, isValid: errors.length === 0 };
}

module.exports = {
  aggregateNutrients,
  getEmptyNutrients,
  calculateMacroPercentages,
  calculateProteinDensity,
  calculateFiberDensity,
  calculateSugarPercentage,
  calculateTotalWeight,
  calculateNutrientDensity,
  validateNutrients
};
