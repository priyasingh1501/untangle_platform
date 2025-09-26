const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

// Import the FoodItem model
const FoodItem = require('../server/models/FoodItem');

// Function to parse CSV data with proper quote handling
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = [];
  const data = [];
  
  // Parse headers
  let currentHeader = '';
  let inQuotes = false;
  let headerIndex = 0;
  
  for (let i = 0; i < lines[0].length; i++) {
    const char = lines[0][i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      headers.push(currentHeader.trim());
      currentHeader = '';
      headerIndex++;
    } else {
      currentHeader += char;
    }
  }
  headers.push(currentHeader.trim());
  
  // Parse data rows
  for (let rowIndex = 1; rowIndex < lines.length; rowIndex++) {
    if (lines[rowIndex].trim()) {
      const row = lines[rowIndex];
      const values = [];
      let currentValue = '';
      let inQuotes = false;
      let valueIndex = 0;
      
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
          valueIndex++;
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      
      if (values.length === headers.length) {
        const item = {};
        headers.forEach((header, index) => {
          item[header] = values[index];
        });
        data.push(item);
      }
    }
  }
  
  return data;
}

// Function to transform CSV data to FoodItem schema
function transformFoodData(csvData) {
  return csvData.map(item => ({
    name: item.name,
    source: item.source,
    portionGramsDefault: parseInt(item.portion_grams_default) || 100,
    nutrients: {
      kcal: parseFloat(item.kcal_per_100g) || 0,
      protein: parseFloat(item.protein_g_per_100g) || 0,
      fat: parseFloat(item.fat_g_per_100g) || 0,
      carbs: parseFloat(item.carbs_g_per_100g) || 0,
      fiber: parseFloat(item.fiber_g_per_100g) || 0,
      sugar: parseFloat(item.sugar_g_per_100g) || 0,
      vitaminC: parseFloat(item.vitaminC_mg_per_100g) || 0,
      zinc: parseFloat(item.zinc_mg_per_100g) || 0,
      selenium: parseFloat(item.selenium_ug_per_100g) || 0,
      iron: parseFloat(item.iron_mg_per_100g) || 0,
      omega3: parseFloat(item.omega3_g_per_100g) || 0
    },
    tags: item.tags ? item.tags.split('|') : [],
    // Add some default values for missing fields
    gi: null,
    fodmap: 'Unknown',
    novaClass: 1,
    aliases: [],
    nameFold: item.name.toLowerCase().replace(/[^a-z0-9]/g, '')
  }));
}

async function seedFoodData() {
  try {
    console.log('🌱 Starting food data seeding...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/untangle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, '../data/ifct_seed.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    console.log('✅ Read CSV file');
    
    // Parse CSV data
    const csvData = parseCSV(csvContent);
    console.log(`📊 Parsed ${csvData.length} food items`);
    
    // Log first few items for debugging
    console.log('🔍 First few parsed items:');
    csvData.slice(0, 3).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.name} (source: ${item.source})`);
    });
    
    // Transform data to match schema
    const foodItems = transformFoodData(csvData);
    console.log('✅ Transformed data to schema format');
    
    // Clear existing food items
    await FoodItem.deleteMany({});
    console.log('🗑️  Cleared existing food items');
    
    // Insert new food items
    const result = await FoodItem.insertMany(foodItems);
    console.log(`✅ Inserted ${result.length} food items`);
    
    // Create text index for search
    await FoodItem.createIndexes();
    console.log('✅ Created database indexes');
    
    console.log('🎉 Food data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding food data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeding
seedFoodData();
