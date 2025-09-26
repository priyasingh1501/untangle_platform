#!/usr/bin/env node

const axios = require('axios');

// Test Open Food Facts API integration
async function testOffApi() {
  console.log('🧪 Testing Open Food Facts API integration...\n');
  
  const UA = "UntangleApp/1.0 (support@untangle.example)";
  const BASE = "https://world.openfoodfacts.org/api/v2";
  
  // Test with a real barcode from Open Food Facts
  const testBarcode = '7622210449283'; // Prince Chocolate Cookies
  
  const fields = [
    "code","product_name","brands","quantity","serving_size",
    "nutriments","nutrition_data_per","nova_group","nutriscore_grade",
    "categories_tags_en","countries_tags_en",
    "ingredients_text","ingredients_analysis_tags",
    "additives_tags","allergens_tags","images","last_modified_t"
  ].join(",");
  
  try {
    console.log(`🔍 Testing barcode: ${testBarcode}`);
    console.log(`🌐 API URL: ${BASE}/product/${testBarcode}.json?fields=${fields}`);
    
    const res = await axios.get(`${BASE}/product/${testBarcode}.json?fields=${fields}`, {
      headers: { "User-Agent": UA },
      timeout: 10000
    });
    
    console.log(`✅ Response status: ${res.status}`);
    
    if (res.data && res.data.product) {
      const product = res.data.product;
      console.log('\n📦 Product data received:');
      console.log(`   Name: ${product.product_name || 'N/A'}`);
      console.log(`   Brand: ${product.brands || 'N/A'}`);
      console.log(`   NOVA: ${product.nova_group || 'N/A'}`);
      console.log(`   Nutri-Score: ${product.nutriscore_grade || 'N/A'}`);
      
      if (product.nutriments) {
        console.log('\n🥗 Nutrition (per 100g):');
        console.log(`   Energy: ${product.nutriments['energy-kcal_100g'] || 'N/A'} kcal`);
        console.log(`   Protein: ${product.nutriments['proteins_100g'] || 'N/A'}g`);
        console.log(`   Fat: ${product.nutriments['fat_100g'] || 'N/A'}g`);
        console.log(`   Carbs: ${product.nutriments['carbohydrates_100g'] || 'N/A'}g`);
        console.log(`   Fiber: ${product.nutriments['fiber_100g'] || 'N/A'}g`);
        console.log(`   Sugar: ${product.nutriments['sugars_100g'] || 'N/A'}g`);
      }
      
      if (product.ingredients_analysis_tags) {
        console.log('\n🏷️  Analysis tags:');
        product.ingredients_analysis_tags.forEach(tag => {
          console.log(`   - ${tag}`);
        });
      }
      
      console.log('\n🎉 Open Food Facts API integration test successful!');
    } else {
      console.log('⚠️  No product data in response');
      console.log('Response data:', JSON.stringify(res.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testOffApi();
