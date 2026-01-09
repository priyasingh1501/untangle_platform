import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

const MealAnalysis = ({ mealItems, context }) => {
  // Helper function to normalize nutrient data from different sources
  const getNormalizedNutrients = (food) => {
    if (!food) return null;
    
    // Handle local database format
    if (food.nutrients) {
      return food.nutrients;
    }
    
    // Handle Open Food Facts format
    if (food.nutriments100g) {
      return {
        kcal: food.nutriments100g.kcal || 0,
        protein: food.nutriments100g.protein || 0,
        fat: food.nutriments100g.fat || 0,
        carbs: food.nutriments100g.carbs || 0,
        fiber: food.nutriments100g.fiber || 0,
        sugar: food.nutriments100g.sugar || 0,
        vitaminC: 0, // Not available in OFF data
        zinc: 0,     // Not available in OFF data
        selenium: 0, // Not available in OFF data
        iron: 0,     // Not available in OFF data
        omega3: 0    // Not available in OFF data
      };
    }
    
    return null;
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (mealItems.length === 0) return null;
    
    const totals = {
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

    mealItems.forEach(item => {
      const nutrients = getNormalizedNutrients(item.food);
      if (nutrients) {
        const factor = item.grams / 100;
        Object.keys(totals).forEach(nutrient => {
          if (nutrients[nutrient] !== undefined && nutrients[nutrient] !== null) {
            totals[nutrient] += (nutrients[nutrient] || 0) * factor;
          }
        });
      }
    });

    // Round to 2 decimal places
    Object.keys(totals).forEach(nutrient => {
      totals[nutrient] = Math.round(totals[nutrient] * 100) / 100;
    });

    return totals;
  }, [mealItems]);

  // Calculate badges
  const badges = useMemo(() => {
    if (!totals || mealItems.length === 0) return null;
    
    // Protein badge
    const proteinBadge = totals.protein >= 20 || (totals.kcal > 0 && (totals.protein / totals.kcal) * 100 >= 0.12);
    
    // Vegetable badge
    const hasVegTag = mealItems.some(item => 
      item.food?.tags?.some(tag => ['veg', 'leafy', 'vegetable'].includes(tag))
    );
    const vegBadge = hasVegTag || totals.fiber >= 5;
    
    // GI badge (carb-weighted mean)
    let gi = null;
    let totalCarbWeight = 0;
    let weightedGISum = 0;
    
    mealItems.forEach(item => {
      const nutrients = getNormalizedNutrients(item.food);
      if (item.food?.gi && nutrients?.carbs) {
        const carbs = nutrients.carbs * item.grams / 100;
        totalCarbWeight += carbs;
        weightedGISum += carbs * item.food.gi;
      }
    });
    
    if (totalCarbWeight > 0) {
      gi = Math.round(weightedGISum / totalCarbWeight);
    }
    
    // FODMAP badge (worst rating)
    const fodmapLevels = { 'Unknown': 0, 'Low': 1, 'Medium': 2, 'High': 3 };
    let worstFodmap = 'Unknown';
    let worstLevel = 0;
    
    mealItems.forEach(item => {
      if (item.food?.fodmap && fodmapLevels[item.food.fodmap] > worstLevel) {
        worstLevel = fodmapLevels[item.food.fodmap];
        worstFodmap = item.food.fodmap;
      }
    });
    
    // NOVA badge (highest class)
    let nova = 1;
    mealItems.forEach(item => {
      if (item.food?.novaClass && item.food.novaClass > nova) {
        nova = item.food.novaClass;
      }
    });
    
    return {
      protein: proteinBadge,
      veg: vegBadge,
      gi,
      fodmap: worstFodmap,
      nova
    };
  }, [totals, mealItems]);


  // Calculate effects
  const effects = useMemo(() => {
    if (!totals) return null;
    
    // Calculate highest GI and NOVA from food items
    let highestGI = 0;
    let highestNOVA = 1;
    
    mealItems.forEach(item => {
      if (item.food?.gi && item.food.gi > highestGI) {
        highestGI = item.food.gi;
      }
      if (item.food?.novaClass && item.food.novaClass > highestNOVA) {
        highestNOVA = item.food.novaClass;
      }
    });
    
    // Debug logging removed for production
    
    // Fat-forming effect (0-10, lower is better)
    let fatFormingScore = 0;
    const fatFormingReasons = [];
    const fatFormingContributors = [];
    
    // High fat contributors
    if (totals.fat >= 50) {
      fatFormingScore += 3;
      const highFatItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.fat && (nutrients.fat * item.grams / 100) >= 15;
      });
      if (highFatItems.length > 0) {
        fatFormingContributors.push(...highFatItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).fat * item.grams / 100) * 10) / 10}g fat)`));
      }
    } else if (totals.fat >= 35) {
      fatFormingScore += 2;
      const mediumFatItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.fat && (nutrients.fat * item.grams / 100) >= 10;
      });
      if (mediumFatItems.length > 0) {
        fatFormingContributors.push(...mediumFatItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).fat * item.grams / 100) * 10) / 10}g fat)`));
      }
    } else if (totals.fat >= 25) {
      fatFormingScore += 1;
    }
    
    // High sugar contributors
    if (totals.sugar >= 30) {
      fatFormingScore += 3;
      const highSugarItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.sugar && (nutrients.sugar * item.grams / 100) >= 10;
      });
      if (highSugarItems.length > 0) {
        fatFormingContributors.push(...highSugarItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).sugar * item.grams / 100) * 10) / 10}g sugar)`));
      }
    } else if (totals.sugar >= 20) {
      fatFormingScore += 2;
      const mediumSugarItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.sugar && (nutrients.sugar * item.grams / 100) >= 7;
      });
      if (mediumSugarItems.length > 0) {
        fatFormingContributors.push(...mediumSugarItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).sugar * item.grams / 100) * 10) / 10}g sugar)`));
      }
    } else if (totals.sugar >= 15) {
      fatFormingScore += 1;
    }
    
    fatFormingScore = Math.min(10, fatFormingScore);
    
    // Strength effect (0-10)
    let strengthScore = 0;
    const strengthReasons = [];
    const strengthContributors = [];
    
    // Protein contribution (0-7 points)
    const proteinGrams = totals.protein || 0;
    if (proteinGrams >= 40) {
      strengthScore += 7;
      strengthReasons.push('Excellent protein content (≥40g) for muscle building');
      const highProteinItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.protein && (nutrients.protein * item.grams / 100) >= 15;
      });
      if (highProteinItems.length > 0) {
        strengthContributors.push(...highProteinItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).protein * item.grams / 100) * 10) / 10}g protein)`));
      }
    } else if (proteinGrams >= 30) {
      strengthScore += 6;
      strengthReasons.push('Very good protein content (≥30g) for strength');
      const mediumProteinItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.protein && (nutrients.protein * item.grams / 100) >= 10;
      });
      if (mediumProteinItems.length > 0) {
        strengthContributors.push(...mediumProteinItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).protein * item.grams / 100) * 10) / 10}g protein)`));
      }
    } else if (proteinGrams >= 20) {
      strengthScore += 5;
      strengthReasons.push('Good protein content (≥20g) for maintenance');
    } else if (proteinGrams >= 15) {
      strengthScore += 3;
      strengthReasons.push('Moderate protein content (≥15g)');
    } else if (proteinGrams >= 10) {
      strengthScore += 1;
      strengthReasons.push('Low protein content (≥10g)');
    } else {
      strengthReasons.push('Very low protein content (<10g)');
    }
    
    // Post-workout bonus (+2 points)
    if (context.postWorkout) {
      const carbsGrams = totals.carbs || 0;
      const bodyMassKg = context.bodyMassKg || 70;
      const requiredCarbs = Math.max(50, bodyMassKg * 0.8);
      
      if (carbsGrams >= requiredCarbs) {
        strengthScore += 2;
        strengthReasons.push(`Post-workout carbs (${carbsGrams}g) for glycogen replenishment`);
      } else {
        strengthReasons.push(`Post-workout carbs (${carbsGrams}g) below optimal (${requiredCarbs}g)`);
      }
    }
    
    // Iron contribution (+1 point)
    const ironMg = totals.iron || 0;
    if (ironMg >= 6) {
      strengthScore += 1;
      strengthReasons.push('Good iron content (≥6mg) for oxygen transport');
    } else if (ironMg >= 3) {
      strengthReasons.push('Moderate iron content (≥3mg)');
    } else {
      strengthReasons.push('Low iron content (<3mg)');
    }
    
    strengthScore = Math.min(10, strengthScore);
    
    // Immunity effect (0-10)
    let immunityScore = 0;
    const immunityReasons = [];
    const immunityContributors = [];
    
    // Fiber contribution (+3 points)
    const fiberGrams = totals.fiber || 0;
    if (fiberGrams >= 8) {
      immunityScore += 3;
      immunityReasons.push('Excellent fiber content (≥8g) for gut health');
      const highFiberItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.fiber && (nutrients.fiber * item.grams / 100) >= 2;
      });
      if (highFiberItems.length > 0) {
        immunityContributors.push(...highFiberItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).fiber * item.grams / 100) * 10) / 10}g fiber)`));
      }
    } else if (fiberGrams >= 5) {
      immunityScore += 2;
      immunityReasons.push('Good fiber content (≥5g) for immunity');
      const mediumFiberItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        return nutrients?.fiber && (nutrients.fiber * item.grams / 100) >= 1.5;
      });
      if (mediumFiberItems.length > 0) {
        immunityContributors.push(...mediumFiberItems.map(item => `${item.food.name} (${Math.round((getNormalizedNutrients(item.food).fiber * item.grams / 100) * 10) / 10}g fiber)`));
      }
    } else if (fiberGrams >= 3) {
      immunityScore += 1;
      immunityReasons.push('Moderate fiber content (≥3g)');
    } else {
      immunityReasons.push('Low fiber content (<3g)');
    }
    
    // Vitamin C contribution (+2 points)
    const vitaminCMg = totals.vitaminC || 0;
    if (vitaminCMg >= 60) {
      immunityScore += 2;
      immunityReasons.push('Excellent vitamin C (≥60mg) for immune function');
    } else if (vitaminCMg >= 30) {
      immunityScore += 1;
      immunityReasons.push('Good vitamin C (≥30mg)');
    } else {
      immunityReasons.push('Low vitamin C (<30mg)');
    }
    
    // Zinc/Selenium contribution (+2 points)
    const zincMg = totals.zinc || 0;
    const seleniumUg = totals.selenium || 0;
    
    if (zincMg >= 5 || seleniumUg >= 30) {
      immunityScore += 2;
      if (zincMg >= 5) {
        immunityReasons.push(`Good zinc content (${zincMg}mg) for immune cells`);
      }
      if (seleniumUg >= 30) {
        immunityReasons.push(`Good selenium content (${seleniumUg}µg) for antioxidant defense`);
      }
    } else if (zincMg >= 2 || seleniumUg >= 15) {
      immunityScore += 1;
      immunityReasons.push('Moderate zinc/selenium content');
    } else {
      immunityReasons.push('Low zinc/selenium content');
    }
    
    // Fermented foods bonus (+2 points)
    if (context.fermented) {
      immunityScore += 2;
      immunityReasons.push('Contains fermented foods for gut microbiome');
    }
    
    // Plant diversity bonus (+1 point)
    const plantDiversity = context.plantDiversity || 0;
    if (plantDiversity >= 5) {
      immunityScore += 1;
      immunityReasons.push('High plant diversity (≥5 types) for gut health');
    } else if (plantDiversity >= 3) {
      immunityScore += 1;
      immunityReasons.push('Moderate plant diversity (≥3 types) for gut health');
    }
    
    immunityScore = Math.min(10, immunityScore);
    
    // Inflammation effect (0-10, lower is better)
    let inflammationScore = 5; // Start neutral
    const inflammationContributors = [];
    
    // Inflammation calculation starting
    
    // Anti-inflammatory contributors (reduce score)
    if (totals.fiber >= 8) {
      inflammationScore -= 2;
      
      const highFiberItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        const fiberPerItem = nutrients?.fiber && (nutrients.fiber * item.grams / 100);
        return fiberPerItem && fiberPerItem >= 2;
      });
      
      if (highFiberItems.length > 0) {
        highFiberItems.forEach(item => {
          const fiberAmount = Math.round((getNormalizedNutrients(item.food).fiber * item.grams / 100) * 10) / 10;
          const contributor = `${item.food.name} (${fiberAmount}g fiber - anti-inflammatory)`;
          inflammationContributors.push(contributor);
        });
      }
    } else if (totals.fiber >= 5) {
      inflammationScore -= 1;
      
      const mediumFiberItems = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        const fiberPerItem = nutrients?.fiber && (nutrients.fiber * item.grams / 100);
        return fiberPerItem && fiberPerItem >= 1.5;
      });
      
      if (mediumFiberItems.length > 0) {
        mediumFiberItems.forEach(item => {
          const fiberAmount = Math.round((getNormalizedNutrients(item.food).fiber * item.grams / 100) * 10) / 10;
          const contributor = `${item.food.name} (${fiberAmount}g fiber - anti-inflammatory)`;
          inflammationContributors.push(contributor);
        });
      }
    }
    
    if (totals.omega3 >= 0.5) {
      inflammationScore -= 1;
      
      const omega3Items = mealItems.filter(item => {
        const nutrients = getNormalizedNutrients(item.food);
        const omega3PerItem = nutrients?.omega3 && (nutrients.omega3 * item.grams / 100);
        return omega3PerItem && omega3PerItem >= 0.1;
      });
      
      if (omega3Items.length > 0) {
        omega3Items.forEach(item => {
          const omega3Amount = Math.round((getNormalizedNutrients(item.food).omega3 * item.grams / 100) * 1000) / 1000;
          const contributor = `${item.food.name} (${omega3Amount}g omega-3 - anti-inflammatory)`;
          inflammationContributors.push(contributor);
        });
      }
    }
    
    // Pro-inflammatory contributors (increase score)
    if (highestNOVA >= 4) {
      inflammationScore += 2;
      const ultraProcessedItems = mealItems.filter(item => item.food?.novaClass && item.food.novaClass >= 4);
      if (ultraProcessedItems.length > 0) {
        inflammationContributors.push(...ultraProcessedItems.map(item => `${item.food.name} (NOVA ${item.food.novaClass} - pro-inflammatory)`));
      }
    } else if (highestNOVA >= 3) {
      inflammationScore += 1;
      const processedItems = mealItems.filter(item => item.food?.novaClass && item.food.novaClass >= 3);
      if (processedItems.length > 0) {
        inflammationContributors.push(...processedItems.map(item => `${item.food.name} (NOVA ${item.food.novaClass} - pro-inflammatory)`));
      }
    }
    
    if (context.addedSugar >= 15) {
      inflammationScore += 1;
      inflammationContributors.push('Added sugar (≥15g - pro-inflammatory)');
    }
    if (highestGI >= 70) {
      inflammationScore += 1;
      const highGIItems = mealItems.filter(item => item.food?.gi && item.food.gi >= 70);
      if (highGIItems.length > 0) {
        inflammationContributors.push(...highGIItems.map(item => `${item.food.name} (GI: ${item.food.gi} - pro-inflammatory)`));
      }
    }
    
    inflammationScore = Math.max(0, Math.min(10, inflammationScore));
    
    const inflammationLabel = inflammationScore <= 3 ? 'Low' : inflammationScore <= 6 ? 'Medium' : 'High';
    
    // Calculate additional effects
    
    // Energizing effect (0-10, higher is better)
    let energizingScore = 5; // Start neutral
    if (totals.fiber >= 8) energizingScore += 2;
    else if (totals.fiber >= 5) energizingScore += 1;
    
    if (totals.carbs >= 30 && totals.carbs <= 80) energizingScore += 2;
    else if (totals.carbs > 0) energizingScore += 1;
    
    if (context.fermented) energizingScore += 1;
    if (totals.omega3 >= 0.5) energizingScore += 1;
    
    energizingScore = Math.min(10, energizingScore);
    
    // Gut-friendly effect (0-10, higher is better)
    let gutFriendlyScore = 5; // Start neutral
    if (context.fermented) gutFriendlyScore += 3;
    if (totals.fiber >= 8) gutFriendlyScore += 2;
    else if (totals.fiber >= 5) gutFriendlyScore += 1;
    
    if (plantDiversity >= 5) gutFriendlyScore += 2;
    else if (plantDiversity >= 3) gutFriendlyScore += 1;
    
    // Penalize high fat and processed foods
    if (totals.fat >= 40) gutFriendlyScore -= 2;
    else if (totals.fat >= 25) gutFriendlyScore -= 1;
    
    if (highestNOVA >= 4) gutFriendlyScore -= 2;
    else if (highestNOVA >= 3) gutFriendlyScore -= 1;
    
    gutFriendlyScore = Math.max(0, Math.min(10, gutFriendlyScore));
    
    // Mood-lifting effect (0-10, higher is better)
    let moodLiftingScore = 5; // Start neutral
    if (totals.omega3 >= 0.5) moodLiftingScore += 2;
    if (context.fermented) moodLiftingScore += 1;
    if (totals.fiber >= 8) moodLiftingScore += 1;
    
    // Penalize high sugar and processed foods
    if (totals.sugar >= 25) moodLiftingScore -= 2;
    else if (totals.sugar >= 15) moodLiftingScore -= 1;
    
    if (highestNOVA >= 4) moodLiftingScore -= 2;
    else if (highestNOVA >= 3) moodLiftingScore -= 1;
    
    moodLiftingScore = Math.max(0, Math.min(10, moodLiftingScore));
    
    const effectsResult = {
      fatForming: { score: fatFormingScore, reasons: fatFormingReasons, contributors: fatFormingContributors },
      strength: { score: strengthScore, reasons: strengthReasons },
      immunity: { score: immunityScore, reasons: immunityReasons },
      inflammation: { score: inflammationScore, label: inflammationLabel, contributors: inflammationContributors },
      energizing: { score: energizingScore },
      gutFriendly: { score: gutFriendlyScore },
      moodLifting: { score: moodLiftingScore }
    };
    
    return effectsResult;
  }, [totals, mealItems, context]);

  if (!totals) {
    return (
      <div className="bg-background-secondary border border-border-primary rounded-xl p-6">
        <h2 className="font-jakarta text-2xl leading-normal text-text-primary font-bold mb-4">
          Meal Analysis
        </h2>
        <div className="text-center py-8 text-text-muted">
          <p>Add foods to see live analysis</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Totals */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-background-secondary border border-border-primary rounded-xl p-6"
      >
        <h2 className="font-jakarta text-2xl leading-normal text-text-primary font-bold mb-4">
          Nutritional Totals
        </h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-background-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent">{Math.round(totals.kcal)}</div>
            <div className="text-sm text-text-secondary">kcal</div>
          </div>
          <div className="text-center p-3 bg-background-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent">{totals.protein}g</div>
            <div className="text-sm text-text-secondary">Protein</div>
          </div>
          <div className="text-center p-3 bg-background-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent">{totals.carbs}g</div>
            <div className="text-sm text-text-secondary">Carbs</div>
          </div>
          <div className="text-center p-3 bg-background-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent">{totals.fat}g</div>
            <div className="text-sm text-text-secondary">Fat</div>
          </div>
        </div>
        
        {/* Additional nutrients */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="text-center p-2 bg-background-primary rounded">
            <div className="text-accent font-medium">Fiber</div>
            <div className="text-text-primary">{totals.fiber}g</div>
          </div>
          <div className="text-center p-2 bg-background-primary rounded">
            <div className="text-accent font-medium">Sugar</div>
            <div className="text-text-primary">{totals.sugar}g</div>
          </div>
          <div className="text-center p-2 bg-background-primary rounded">
            <div className="text-accent font-medium">Iron</div>
            <div className="text-text-primary">{totals.iron}mg</div>
          </div>
        </div>
      </motion.div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-background-secondary border border-border-primary rounded-xl p-6"
      >
        <h2 className="font-jakarta text-2xl leading-normal text-text-primary font-bold mb-4">
          Meal Badges
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className={`text-center p-3 rounded-lg border-2 ${
            badges.protein 
              ? 'bg-[#1E49C9]/30 border-[#1E49C9] text-[#1E49C9]' 
              : 'bg-gray-900/30 border-gray-600 text-gray-400'
          }`}>
            <div className="text-lg font-bold">{badges.protein ? '✓' : '✗'}</div>
            <div className="text-sm">Protein</div>
          </div>
          
          <div className={`text-center p-3 rounded-lg border-2 ${
            badges.veg 
              ? 'bg-[#1E49C9]/30 border-[#1E49C9] text-[#1E49C9]' 
              : 'bg-gray-900/30 border-gray-600 text-gray-400'
          }`}>
            <div className="text-lg font-bold">{badges.veg ? '✓' : '✗'}</div>
            <div className="text-sm">Vegetables</div>
          </div>
          
          <div className="text-center p-3 bg-[#2A313A] rounded-lg border-2 border-[#2A313A]">
            <div className="text-lg font-bold text-[#3EA6FF]">{badges.gi || '—'}</div>
            <div className="text-sm text-[#C9D1D9]">GI</div>
          </div>
          
          <div className={`text-center p-3 rounded-lg border-2 ${
            badges.fodmap === 'Low' 
              ? 'bg-[#1E49C9]/30 border-[#1E49C9] text-[#1E49C9]'
              : badges.fodmap === 'Medium'
              ? 'bg-yellow-900/30 border-yellow-600 text-yellow-300'
              : badges.fodmap === 'High'
              ? 'bg-red-900/30 border-red-600 text-red-300'
              : 'bg-gray-900/30 border-gray-600 text-gray-400'
          }`}>
            <div className="text-lg font-bold">{badges.fodmap}</div>
            <div className="text-sm">FODMAP</div>
          </div>
        </div>
        
        <div className="mt-3 text-center">
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            badges.nova === 1 
              ? 'bg-[#1E49C9]/30 text-[#1E49C9] border border-[#1E49C9]'
              : badges.nova === 2
              ? 'bg-blue-900/30 text-blue-300 border border-blue-600'
              : badges.nova === 3
              ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-600'
              : 'bg-red-900/30 text-red-300 border border-red-600'
          }`}>
            NOVA {badges.nova}: {badges.nova === 1 ? 'Unprocessed' : badges.nova === 2 ? 'Minimal' : badges.nova === 3 ? 'Processed' : 'Ultra-processed'}
          </div>
        </div>
      </motion.div>


      {/* Effects */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-background-secondary border border-border-primary rounded-xl p-6"
      >
        <h2 className="font-jakarta text-2xl leading-normal text-text-primary font-bold mb-4">
          Meal Effects
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Fat-forming */}
          <div className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-medium">🍔 Fat-forming</span>
              <span className="text-accent font-bold">{effects.fatForming.score}/10</span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(effects.fatForming.score / 10) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Strength */}
          <div className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-medium">💪 Strength</span>
              <span className="text-accent font-bold">{effects.strength.score}/10</span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(effects.strength.score / 10) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Immunity */}
          <div className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-medium">🌿 Immunity</span>
              <span className="text-accent font-bold">{effects.immunity.score}/10</span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(effects.immunity.score / 10) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Inflammation */}
          <div className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-medium">🔥 Inflammation</span>
              <span className={`font-bold ${
                effects.inflammation.label === 'Low' ? 'text-accent' :
                effects.inflammation.label === 'Medium' ? 'text-accent' :
                'text-accent'
              }`}>
                {effects.inflammation.label}
              </span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(effects.inflammation.score / 10) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Energizing */}
          <div className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-medium">⚡️ Energizing</span>
              <span className="text-accent font-bold">{effects.energizing.score}/10</span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(effects.energizing.score / 10) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Gut-friendly */}
          <div className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-medium">🌀 Gut-friendly</span>
              <span className="text-accent font-bold">{effects.gutFriendly.score}/10</span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(effects.gutFriendly.score / 10) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Mood-lifting */}
          <div className="p-3 bg-background-tertiary rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-text-secondary font-medium">😊 Mood-lifting</span>
              <span className="text-accent font-bold">{effects.moodLifting.score}/10</span>
            </div>
            <div className="w-full bg-background-primary rounded-full h-2">
              <div 
                className="bg-accent h-2 rounded-full transition-all duration-500"
                style={{ width: `${(effects.moodLifting.score / 10) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Effects Summary */}
        <div className="mt-4 p-3 bg-background-tertiary rounded-lg">
          <h3 className="text-sm font-medium text-text-secondary mb-2">Effects Summary</h3>
          <div className="text-xs text-text-muted space-y-1">
            {effects.fatForming.score > 5 && (
              <div>🍔 High fat-forming potential - consider lighter options</div>
            )}
            {effects.strength.score > 7 && (
              <div>💪 Excellent for muscle building and recovery</div>
            )}
            {effects.immunity.score > 7 && (
              <div>🌿 Great for immune system support</div>
            )}
            {effects.inflammation.score > 7 && (
              <div>🔥 May trigger inflammation - consider anti-inflammatory foods</div>
            )}
            {effects.energizing.score > 7 && (
              <div>⚡️ Very energizing - good for active periods</div>
            )}
            {effects.gutFriendly.score > 7 && (
              <div>🌀 Excellent for gut health</div>
            )}
            {effects.moodLifting.score > 7 && (
              <div>😊 Great for mood and mental well-being</div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MealAnalysis;
