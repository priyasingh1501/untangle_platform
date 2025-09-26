/**
 * Badge inference logic for meal analysis
 */

/**
 * Infer badges based on nutrient totals and food items
 * @param {Object} totals - Aggregated nutrient totals
 * @param {Array} items - Array of FoodItem objects
 * @returns {Object} - Badge information
 */
function inferBadges(totals, items) {
  if (!totals || !Array.isArray(items)) {
    return getEmptyBadges();
  }

  return {
    protein: inferProteinBadge(totals),
    veg: inferVegBadge(totals, items),
    gi: inferGIBadge(items),
    fodmap: inferFODMAPBadge(items),
    nova: inferNOVABadge(items)
  };
}

/**
 * Get empty badge object
 * @returns {Object} - Empty badges
 */
function getEmptyBadges() {
  return {
    protein: false,
    veg: false,
    gi: null,
    fodmap: 'Unknown',
    nova: 1
  };
}

/**
 * Infer protein badge
 * @param {Object} totals - Nutrient totals
 * @returns {boolean} - True if protein requirements met
 */
function inferProteinBadge(totals) {
  if (!totals) return false;
  
  // Protein badge: >= 20g OR protein density >= 0.12 g/g
  const proteinGrams = totals.protein || 0;
  const proteinDensity = totals.kcal > 0 ? (proteinGrams / totals.kcal) * 100 : 0;
  
  return proteinGrams >= 20 || proteinDensity >= 0.12;
}

/**
 * Infer vegetable badge
 * @param {Object} totals - Nutrient totals
 * @param {Array} items - Food items
 * @returns {boolean} - True if vegetable requirements met
 */
function inferVegBadge(totals, items) {
  if (!totals || !Array.isArray(items)) return false;
  
  // Check for vegetable tags
  const hasVegTag = items.some(item => 
    item.tags && (
      item.tags.includes('veg') || 
      item.tags.includes('leafy') ||
      item.tags.includes('vegetable')
    )
  );
  
  // Check fiber content
  const hasFiber = (totals.fiber || 0) >= 5;
  
  return hasVegTag || hasFiber;
}

/**
 * Infer GI badge (carbohydrate-weighted mean)
 * @param {Array} items - Food items
 * @returns {number|null} - GI value or null if insufficient data
 */
function inferGIBadge(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  
  // Only consider items with GI data
  const itemsWithGI = items.filter(item => 
    item.gi !== undefined && item.gi !== null
  );
  
  if (itemsWithGI.length === 0) return null;
  
  // Calculate carb-weighted mean GI
  let totalCarbWeight = 0;
  let weightedGISum = 0;
  
  itemsWithGI.forEach(item => {
    const carbs = item.nutrients?.carbs || 0;
    const gi = item.gi;
    
    if (carbs > 0 && gi > 0) {
      totalCarbWeight += carbs;
      weightedGISum += carbs * gi;
    }
  });
  
  if (totalCarbWeight === 0) return null;
  
  return Math.round(weightedGISum / totalCarbWeight);
}

/**
 * Infer FODMAP badge (worst rating among items)
 * @param {Array} items - Food items
 * @returns {string} - FODMAP rating
 */
function inferFODMAPBadge(items) {
  if (!Array.isArray(items) || items.length === 0) return 'Unknown';
  
  // FODMAP hierarchy: Unknown < Low < Medium < High
  const fodmapLevels = {
    'Unknown': 0,
    'Low': 1,
    'Medium': 2,
    'High': 3
  };
  
  let worstLevel = 0;
  let worstRating = 'Unknown';
  
  items.forEach(item => {
    if (item.fodmap && fodmapLevels[item.fodmap] > worstLevel) {
      worstLevel = fodmapLevels[item.fodmap];
      worstRating = item.fodmap;
    }
  });
  
  return worstRating;
}

/**
 * Infer NOVA badge (highest class among items)
 * @param {Array} items - Food items
 * @returns {number} - NOVA classification
 */
function inferNOVABadge(items) {
  if (!Array.isArray(items) || items.length === 0) return 1;
  
  // Find highest NOVA class among items
  let maxNova = 1;
  
  items.forEach(item => {
    if (item.novaClass && item.novaClass > maxNova) {
      maxNova = item.novaClass;
    }
  });
  
  return maxNova;
}

/**
 * Get badge descriptions for UI display
 * @param {Object} badges - Badge information
 * @returns {Object} - Badge descriptions
 */
function getBadgeDescriptions(badges) {
  return {
    protein: {
      value: badges.protein,
      label: 'Protein',
      description: badges.protein ? 
        'Good protein content (≥20g or high density)' : 
        'Consider adding protein sources',
      icon: badges.protein ? '💪' : '💪',
      color: badges.protein ? 'green' : 'gray'
    },
    veg: {
      value: badges.veg,
      label: 'Vegetables',
      description: badges.veg ? 
        'Contains vegetables or good fiber' : 
        'Add vegetables or fiber-rich foods',
      icon: badges.veg ? '🥬' : '🥬',
      color: badges.veg ? 'green' : 'gray'
    },
    gi: {
      value: badges.gi,
      label: 'Glycemic Index',
      description: badges.gi ? 
        `GI: ${badges.gi} (${getGIDescription(badges.gi)})` : 
        'GI data not available',
      icon: '📊',
      color: getGIColor(badges.gi)
    },
    fodmap: {
      value: badges.fodmap,
      label: 'FODMAP',
      description: `FODMAP: ${badges.fodmap}`,
      icon: '🌱',
      color: getFODMAPColor(badges.fodmap)
    },
    nova: {
      value: badges.nova,
      label: 'Processing',
      description: `NOVA ${badges.nova}: ${getNOVADescription(badges.nova)}`,
      icon: '🏭',
      color: getNOVAColor(badges.nova)
    }
  };
}

/**
 * Get GI description
 * @param {number} gi - GI value
 * @returns {string} - GI description
 */
function getGIDescription(gi) {
  if (!gi) return 'Unknown';
  if (gi <= 55) return 'Low';
  if (gi <= 69) return 'Medium';
  return 'High';
}

/**
 * Get GI color for UI
 * @param {number} gi - GI value
 * @returns {string} - Color class
 */
function getGIColor(gi) {
  if (!gi) return 'gray';
  if (gi <= 55) return 'green';
  if (gi <= 69) return 'yellow';
  return 'red';
}

/**
 * Get FODMAP color for UI
 * @param {string} fodmap - FODMAP rating
 * @returns {string} - Color class
 */
function getFODMAPColor(fodmap) {
  switch (fodmap) {
    case 'Low': return 'green';
    case 'Medium': return 'yellow';
    case 'High': return 'red';
    default: return 'gray';
  }
}

/**
 * Get NOVA description
 * @param {number} nova - NOVA class
 * @returns {string} - NOVA description
 */
function getNOVADescription(nova) {
  switch (nova) {
    case 1: return 'Unprocessed';
    case 2: return 'Minimally processed';
    case 3: return 'Processed';
    case 4: return 'Ultra-processed';
    default: return 'Unknown';
  }
}

/**
 * Get NOVA color for UI
 * @param {number} nova - NOVA class
 * @returns {string} - Color class
 */
function getNOVAColor(nova) {
  switch (nova) {
    case 1: return 'green';
    case 2: return 'blue';
    case 3: return 'yellow';
    case 4: return 'red';
    default: return 'gray';
  }
}

module.exports = {
  inferBadges,
  getEmptyBadges,
  getBadgeDescriptions,
  getGIDescription,
  getGIColor,
  getFODMAPColor,
  getNOVADescription,
  getNOVAColor
};
