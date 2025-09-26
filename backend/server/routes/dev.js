const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const csv = require('csv-parser');
const { Readable } = require('stream');
const FoodItem = require('../models/FoodItem');
const RecipeTemplate = require('../models/RecipeTemplate');
const auth = require('../middleware/auth');
const { foldName, parseTags } = require('../lib/meal/norm');

/**
 * Seed database with food data (DEV ONLY)
 * POST /api/dev/seed
 */
router.post('/seed', auth, async (req, res) => {
  try {
    // Check if dev endpoints are enabled
    if (process.env.NEXT_PUBLIC_ENABLE_DEV_ENDPOINTS !== 'true') {
      return res.status(403).json({
        message: 'Dev endpoints are disabled'
      });
    }

    const dataDir = path.join(__dirname, '../../data');
    const results = {
      foodsUpserted: 0,
      recipesUpserted: 0,
      errors: []
    };

    // 1. Load IFCT seed data (CSV)
    try {
      const ifctPath = path.join(dataDir, 'ifct_seed.csv');
      const ifctData = await fs.readFile(ifctPath, 'utf-8');
      
      const foods = await parseCSV(ifctData);
      
      for (const food of foods) {
        try {
          const foodData = {
            source: 'SEED',
            name: food.name,
            nameFold: foldName(food.name),
            portionGramsDefault: parseFloat(food.portion_grams_default) || 100,
            nutrients: {
              kcal: parseFloat(food.kcal_per_100g) || 0,
              protein: parseFloat(food.protein_g_per_100g) || 0,
              fat: parseFloat(food.fat_g_per_100g) || 0,
              carbs: parseFloat(food.carbs_g_per_100g) || 0,
              fiber: parseFloat(food.fiber_g_per_100g) || 0,
              sugar: parseFloat(food.sugar_g_per_100g) || 0,
              vitaminC: parseFloat(food.vitaminC_mg_per_100g) || 0,
              zinc: parseFloat(food.zinc_mg_per_100g) || 0,
              selenium: parseFloat(food.selenium_ug_per_100g) || 0,
              iron: parseFloat(food.iron_mg_per_100g) || 0,
              omega3: parseFloat(food.omega3_g_per_100g) || 0
            },
            tags: parseTags(food.tags)
          };

          await FoodItem.findOneAndUpdate(
            { name: foodData.name, source: 'SEED' },
            foodData,
            { upsert: true, new: true }
          );

          results.foodsUpserted++;
        } catch (error) {
          results.errors.push(`Error processing food ${food.name}: ${error.message}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error loading IFCT data: ${error.message}`);
    }

    // 2. Load GI seed data (CSV)
    try {
      const giPath = path.join(dataDir, 'gi_seed.csv');
      const giData = await fs.readFile(giPath, 'utf-8');
      
      const giFoods = await parseCSV(giData);
      
      for (const giFood of giFoods) {
        try {
          const foodName = giFood.name;
          const normalizedName = foldName(foodName);
          
          // Find food by name or aliases
          const food = await FoodItem.findOne({
            $or: [
              { nameFold: normalizedName },
              { aliases: { $regex: normalizedName, $options: 'i' } }
            ]
          });

          if (food) {
            food.gi = parseFloat(giFood.gi) || null;
            food.gl = parseFloat(giFood.gl_reference_serving) || null;
            await food.save();
          }
        } catch (error) {
          results.errors.push(`Error updating GI for ${giFood.name}: ${error.message}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error loading GI data: ${error.message}`);
    }

    // 3. Load FODMAP data (JSON)
    try {
      const fodmapPath = path.join(dataDir, 'fodmap_seed.json');
      const fodmapData = await fs.readFile(fodmapPath, 'utf-8');
      const fodmapMap = JSON.parse(fodmapData);

      for (const [ingredient, rating] of Object.entries(fodmapMap)) {
        try {
          const normalizedName = foldName(ingredient);
          
          // Find foods that contain this ingredient
          const foods = await FoodItem.find({
            $or: [
              { nameFold: { $regex: normalizedName, $options: 'i' } },
              { tags: { $regex: normalizedName, $options: 'i' } }
            ]
          });

          for (const food of foods) {
            food.fodmap = rating;
            await food.save();
          }
        } catch (error) {
          results.errors.push(`Error updating FODMAP for ${ingredient}: ${error.message}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error loading FODMAP data: ${error.message}`);
    }

    // 4. Load NOVA rules (JSON)
    try {
      const novaPath = path.join(dataDir, 'nova_rules.json');
      const novaData = await fs.readFile(novaPath, 'utf-8');
      const novaRules = JSON.parse(novaData);

      for (const rule of novaRules) {
        try {
          const pattern = rule.pattern;
          const novaClass = rule.nova;
          
          // Find foods that match this pattern
          const foods = await FoodItem.find({
            $or: [
              { nameFold: { $regex: pattern, $options: 'i' } },
              { aliases: { $regex: pattern, $options: 'i' } }
            ]
          });

          for (const food of foods) {
            // Only update if current NOVA class is lower (keep highest)
            if (!food.novaClass || food.novaClass < novaClass) {
              food.novaClass = novaClass;
              await food.save();
            }
          }
        } catch (error) {
          results.errors.push(`Error updating NOVA for pattern ${rule.pattern}: ${error.message}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error loading NOVA data: ${error.message}`);
    }

    // 5. Load aliases (JSON)
    try {
      const aliasesPath = path.join(dataDir, 'aliases.json');
      const aliasesData = await fs.readFile(aliasesPath, 'utf-8');
      const aliasesMap = JSON.parse(aliasesData);

      for (const [canonical, aliases] of Object.entries(aliasesMap)) {
        try {
          const normalizedCanonical = foldName(canonical);
          
          // Find the canonical food
          const food = await FoodItem.findOne({
            $or: [
              { nameFold: normalizedCanonical },
              { name: { $regex: canonical, $options: 'i' } }
            ]
          });

          if (food) {
            food.aliases = aliases;
            // Also create entries for aliases if they don't exist
            for (const alias of aliases) {
              const aliasFood = await FoodItem.findOne({
                nameFold: foldName(alias)
              });

              if (!aliasFood) {
                const aliasFoodData = {
                  ...food.toObject(),
                  _id: undefined, // Remove _id for new document
                  name: alias,
                  nameFold: foldName(alias),
                  aliases: [food.name, ...aliases.filter(a => a !== alias)]
                };
                
                const newAliasFood = new FoodItem(aliasFoodData);
                await newAliasFood.save();
                results.foodsUpserted++;
              }
            }
            await food.save();
          }
        } catch (error) {
          results.errors.push(`Error processing aliases for ${canonical}: ${error.message}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error loading aliases data: ${error.message}`);
    }

    // 6. Load portion norms (JSON)
    try {
      const portionPath = path.join(dataDir, 'portion_norms.json');
      const portionData = await fs.readFile(portionPath, 'utf-8');
      const portionNorms = JSON.parse(portionData);

      for (const [foodName, portionGrams] of Object.entries(portionNorms)) {
        try {
          const normalizedName = foldName(foodName);
          
          const food = await FoodItem.findOne({
            $or: [
              { nameFold: normalizedName },
              { name: { $regex: foodName, $options: 'i' } }
            ]
          });

          if (food) {
            food.portionGramsDefault = portionGrams;
            await food.save();
          }
        } catch (error) {
          results.errors.push(`Error updating portion for ${foodName}: ${error.message}`);
        }
      }
    } catch (error) {
      results.errors.push(`Error loading portion norms: ${error.message}`);
    }

    // 7. Load recipes if they exist (JSON)
    try {
      const recipesPath = path.join(dataDir, 'recipes_seed.json');
      await fs.access(recipesPath); // Check if file exists
      
      const recipesData = await fs.readFile(recipesPath, 'utf-8');
      const recipes = JSON.parse(recipesData);
      
      for (const recipe of recipes) {
        try {
          const recipeData = {
            name: recipe.name,
            nameFold: foldName(recipe.name),
            portionGramsDefault: recipe.portionGramsDefault || 200,
            ingredients: recipe.ingredients || [],
            cuisine: recipe.cuisine || 'Indian',
            mealType: recipe.mealType || 'any',
            tags: recipe.tags || [],
            notes: recipe.notes || '',
            difficulty: recipe.difficulty || 'easy',
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            servings: recipe.servings || 1
          };

          await RecipeTemplate.findOneAndUpdate(
            { name: recipeData.name },
            recipeData,
            { upsert: true, new: true }
          );

          results.recipesUpserted++;
        } catch (error) {
          results.errors.push(`Error processing recipe ${recipe.name}: ${error.message}`);
        }
      }
    } catch (error) {
      // Recipes file doesn't exist, which is fine
      console.log('No recipes file found, skipping recipe seeding');
    }

    res.json({
      message: 'Database seeded successfully',
      results
    });

  } catch (error) {
    console.error('Error seeding database:', error);
    res.status(500).json({
      message: 'Error seeding database',
      error: error.message
    });
  }
});

/**
 * Parse CSV data
 * @param {string} csvData - CSV string data
 * @returns {Promise<Array>} - Parsed CSV rows
 */
async function parseCSV(csvData) {
  return new Promise((resolve, reject) => {
    const results = [];
    const stream = Readable.from(csvData);
    
    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}

module.exports = router;
