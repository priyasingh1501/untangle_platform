/**
 * Mindful meal scoring logic
 */

/**
 * Calculate mindful meal score (0-5) with rationale and tips
 * @param {Object} totals - Nutrient totals
 * @param {Object} badges - Badge information
 * @param {Object} context - Meal context (optional)
 * @returns {Object} - Score, rationale, and tip
 */
function mindfulMealScore(totals, badges, context = {}) {
  if (!totals || !badges) {
    return getEmptyScore();
  }

  let score = 0;
  const rationale = [];
  const tips = [];

  // Protein bonus (+2 points)
  if (badges.protein) {
    score += 2;
    rationale.push('✅ Good protein content (≥20g or high density)');
  } else {
    rationale.push('❌ Low protein content');
    tips.push('Add 150g curd or 2 eggs for +12g protein');
  }

  // Vegetable bonus (+1 point)
  if (badges.veg) {
    score += 1;
    rationale.push('✅ Contains vegetables or good fiber');
  } else {
    rationale.push('❌ No vegetables or low fiber');
    tips.push('Add salad, dal, or leafy greens');
  }

  // Ultra-processed penalty (-1 point)
  if (badges.nova >= 4) {
    score -= 1;
    rationale.push('⚠️ Contains ultra-processed foods (NOVA 4)');
    tips.push('Swap one item for a whole-food equivalent');
  }

  // Sugar penalty (-1 point)
  const sugarGrams = totals.sugar || 0;
  if (sugarGrams >= 15) {
    score -= 1;
    rationale.push(`⚠️ High sugar content (${sugarGrams}g)`);
    tips.push('Choose unsweetened versions or reduce portion');
  }

  // GI penalty (-1 point)
  if (badges.gi && badges.gi >= 70) {
    score -= 1;
    rationale.push(`⚠️ High glycemic index (${badges.gi})`);
    if (!badges.veg) {
      tips.push('Add salad/dal or split portion to balance blood sugar');
    }
  }

  // Carbohydrate balance bonus (+1 point)
  const macroPercentages = calculateMacroPercentages(totals);
  const carbsPercentage = macroPercentages.carbs || 0;
  const fiberGrams = totals.fiber || 0;
  
  if (carbsPercentage <= 45 || fiberGrams >= 7) {
    score += 1;
    if (carbsPercentage <= 45) {
      rationale.push('✅ Balanced carbohydrate ratio (≤45% of calories)');
    } else {
      rationale.push('✅ Good fiber content (≥7g)');
    }
  } else {
    rationale.push('⚠️ High carbohydrate ratio or low fiber');
    tips.push('Add more vegetables or choose whole grains');
  }

  // Context-specific bonuses
  if (context.postWorkout && badges.protein) {
    score += 0.5;
    rationale.push('✅ Good post-workout protein');
  }

  if (context.fermented && badges.veg) {
    score += 0.5;
    rationale.push('✅ Fermented vegetables for gut health');
  }

  // Clamp score to 0-5 range
  score = Math.max(0, Math.min(5, score));

  // Generate primary tip
  const primaryTip = generatePrimaryTip(score, tips, badges, totals);

  return {
    score: Math.round(score * 10) / 10, // Round to 1 decimal place
    rationale,
    tip: primaryTip,
    tips, // All available tips
    quality: getQualityRating(score)
  };
}

/**
 * Get empty score object
 * @returns {Object} - Empty score
 */
function getEmptyScore() {
  return {
    score: 0,
    rationale: ['No meal data available'],
    tip: 'Add foods to start analyzing your meal',
    tips: [],
    quality: 'needs_improvement'
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
 * Generate primary tip based on score and context
 * @param {number} score - Meal score
 * @param {Array} tips - Available tips
 * @param {Object} badges - Badge information
 * @param {Object} totals - Nutrient totals
 * @returns {string} - Primary tip
 */
function generatePrimaryTip(score, tips, badges, totals) {
  if (tips.length === 0) {
    return 'Great meal! Keep up the good choices.';
  }

  // Prioritize tips based on impact
  const priorityTips = [];

  // High priority: NOVA 4 foods
  if (badges.nova >= 4) {
    priorityTips.push('Swap one ultra-processed item for a whole-food equivalent');
  }

  // High priority: Low protein
  if (!badges.protein) {
    priorityTips.push('Add protein: 150g curd, 2 eggs, or 100g paneer');
  }

  // High priority: No vegetables
  if (!badges.veg) {
    priorityTips.push('Add vegetables: salad, dal, or leafy greens');
  }

  // Medium priority: High sugar
  if ((totals.sugar || 0) >= 15) {
    priorityTips.push('Choose unsweetened versions or reduce portion size');
  }

  // Medium priority: High GI
  if (badges.gi && badges.gi >= 70) {
    priorityTips.push('Add fiber-rich foods to balance blood sugar');
  }

  // Return highest priority tip
  if (priorityTips.length > 0) {
    return priorityTips[0];
  }

  // Return first available tip
  return tips[0];
}

/**
 * Get quality rating based on score
 * @param {number} score - Meal score
 * @returns {string} - Quality rating
 */
function getQualityRating(score) {
  if (score >= 4.5) return 'excellent';
  if (score >= 3.5) return 'very_good';
  if (score >= 2.5) return 'good';
  if (score >= 1.5) return 'fair';
  if (score >= 0.5) return 'needs_improvement';
  return 'poor';
}

/**
 * Get quality description for UI
 * @param {string} quality - Quality rating
 * @returns {string} - Quality description
 */
function getQualityDescription(quality) {
  switch (quality) {
    case 'excellent':
      return 'Outstanding meal choice! 🎉';
    case 'very_good':
      return 'Great meal with room for small improvements 👍';
    case 'good':
      return 'Good meal, consider one or two tweaks 😊';
    case 'fair':
      return 'Decent meal, several areas to improve 🤔';
    case 'needs_improvement':
      return 'Meal needs significant improvements 💡';
    case 'poor':
      return 'Consider different food choices 🔄';
    default:
      return 'Meal quality unknown';
  }
}

/**
 * Get score color for UI
 * @param {number} score - Meal score
 * @returns {string} - Color class
 */
function getScoreColor(score) {
  if (score >= 4) return 'green';
  if (score >= 3) return 'blue';
  if (score >= 2) return 'yellow';
  if (score >= 1) return 'orange';
  return 'red';
}

/**
 * Get improvement suggestions based on score
 * @param {number} score - Meal score
 * @returns {Array} - Improvement suggestions
 */
function getImprovementSuggestions(score) {
  if (score >= 4) {
    return [
      'Maintain your excellent eating habits',
      'Consider adding variety for micronutrient diversity',
      'Share your meal wisdom with others!'
    ];
  }
  
  if (score >= 3) {
    return [
      'Focus on one improvement area at a time',
      'Small changes add up to big results',
      'Track your progress over time'
    ];
  }
  
  if (score >= 2) {
    return [
      'Start with protein and vegetables',
      'Choose whole foods over processed options',
      'Plan meals ahead for better choices'
    ];
  }
  
  return [
    'Begin with basic nutrition principles',
    'Focus on whole, unprocessed foods',
    'Consider consulting a nutritionist',
    'Every meal is a new opportunity to improve'
  ];
}

module.exports = {
  mindfulMealScore,
  getEmptyScore,
  getQualityRating,
  getQualityDescription,
  getScoreColor,
  getImprovementSuggestions
};
