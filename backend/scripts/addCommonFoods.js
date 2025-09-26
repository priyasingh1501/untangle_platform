const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import the FoodItem model
const FoodItem = require('../server/models/FoodItem');

// Common processed foods to add
const commonFoods = [
  {
    name: 'Coca-Cola',
    source: 'IFCT',
    externalId: 'coke_001',
    nameFold: 'cocacola',
    aliases: ['coke', 'cola', 'soft drink'],
    portionGramsDefault: 330,
    portionUnits: [
      { unit: 'can', grams: 330, description: 'Standard can' },
      { unit: 'bottle', grams: 500, description: 'Standard bottle' },
      { unit: 'glass', grams: 250, description: 'Standard glass' }
    ],
    nutrients: {
      kcal: 42,
      protein: 0,
      fat: 0,
      carbs: 10.6,
      fiber: 0,
      sugar: 10.6,
      vitaminC: 0,
      zinc: 0,
      selenium: 0,
      iron: 0,
      omega3: 0
    },
    tags: ['beverage', 'soft-drink', 'processed', 'sweet'],
    gi: 63,
    fodmap: 'Low',
    novaClass: 4,
    // provenance field removed to avoid schema issues
  },
  {
    name: 'Potato Chips',
    source: 'IFCT',
    externalId: 'chips_001',
    nameFold: 'potatochips',
    aliases: ['chips', 'crisps', 'snack'],
    portionGramsDefault: 30,
    portionUnits: [
      { unit: 'bag', grams: 30, description: 'Small snack bag' },
      { unit: 'handful', grams: 15, description: 'Handful of chips' }
    ],
    nutrients: {
      kcal: 536,
      protein: 7,
      fat: 35,
      carbs: 53,
      fiber: 4.4,
      sugar: 0.2,
      vitaminC: 0,
      zinc: 0.5,
      selenium: 0,
      iron: 1.2,
      omega3: 0
    },
    tags: ['snack', 'processed', 'fried', 'salty'],
    gi: 70,
    fodmap: 'Low',
    novaClass: 4,
    // provenance field removed to avoid schema issues
  },
  {
    name: 'Chocolate Chip Cookies',
    source: 'IFCT',
    externalId: 'cookies_001',
    nameFold: 'chocolatechipcookies',
    aliases: ['cookies', 'biscuits', 'sweet'],
    portionGramsDefault: 15,
    portionUnits: [
      { unit: 'cookie', grams: 15, description: 'Standard cookie' },
      { unit: 'piece', grams: 15, description: 'One cookie' }
    ],
    nutrients: {
      kcal: 502,
      protein: 5.7,
      fat: 25,
      carbs: 65,
      fiber: 2.1,
      sugar: 38,
      vitaminC: 0,
      zinc: 0.5,
      selenium: 0,
      iron: 2.1,
      omega3: 0
    },
    tags: ['dessert', 'processed', 'sweet', 'baked'],
    gi: 75,
    fodmap: 'Low',
    novaClass: 4,
    // provenance field removed to avoid schema issues
  },
  {
    name: 'White Bread',
    source: 'IFCT',
    externalId: 'bread_001',
    nameFold: 'whitebread',
    aliases: ['bread', 'sliced bread', 'toast'],
    portionGramsDefault: 30,
    portionUnits: [
      { unit: 'slice', grams: 30, description: 'Standard slice' },
      { unit: 'piece', grams: 30, description: 'One slice' }
    ],
    nutrients: {
      kcal: 265,
      protein: 9,
      fat: 3.2,
      carbs: 49,
      fiber: 2.7,
      sugar: 5,
      vitaminC: 0,
      zinc: 0.6,
      selenium: 0,
      iron: 3.6,
      omega3: 0
    },
    tags: ['bread', 'processed', 'grains', 'refined'],
    gi: 75,
    fodmap: 'Low',
    novaClass: 3,
    // provenance field removed to avoid schema issues
  },
  {
    name: 'Ice Cream (Vanilla)',
    source: 'IFCT',
    externalId: 'icecream_001',
    nameFold: 'icecreamvanilla',
    aliases: ['ice cream', 'dessert', 'frozen'],
    portionGramsDefault: 100,
    portionUnits: [
      { unit: 'scoop', grams: 50, description: 'Standard scoop' },
      { unit: 'cup', grams: 100, description: 'Standard cup' }
    ],
    nutrients: {
      kcal: 207,
      protein: 3.5,
      fat: 11,
      carbs: 24,
      fiber: 0,
      sugar: 21,
      vitaminC: 0,
      zinc: 0.5,
      selenium: 0,
      iron: 0.1,
      omega3: 0
    },
    tags: ['dessert', 'processed', 'sweet', 'frozen'],
    gi: 60,
    fodmap: 'Low',
    novaClass: 4,
    // provenance field removed to avoid schema issues
  }
];

async function addCommonFoods() {
  try {
    console.log('🌱 Adding common processed foods...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/untangle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Add each common food
    for (const foodData of commonFoods) {
      try {
        // Check if food already exists
        const existingFood = await FoodItem.findOne({ 
          nameFold: foodData.nameFold,
          source: foodData.source 
        });
        
        if (existingFood) {
          console.log(`⚠️  ${foodData.name} already exists, skipping...`);
          continue;
        }
        
        // Create new food item
        const foodItem = new FoodItem(foodData);
        await foodItem.save();
        console.log(`✅ Added: ${foodData.name}`);
        
      } catch (error) {
        console.error(`❌ Failed to add ${foodData.name}:`, error.message);
      }
    }
    
    // Get total count
    const totalFoods = await FoodItem.countDocuments();
    console.log(`\n🎉 Total foods in database: ${totalFoods}`);
    
    // Show sample of added foods
    const addedFoods = await FoodItem.find({ externalId: { $regex: /^(coke|chips|cookies|bread|icecream)_/ } }).select('name tags');
    console.log('\n📋 Added foods:');
    addedFoods.forEach(food => {
      console.log(`- ${food.name} (${food.tags.join(', ')})`);
    });
    
  } catch (error) {
    console.error('❌ Error adding common foods:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the script
addCommonFoods();
