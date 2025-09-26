#!/usr/bin/env node

const axios = require('axios');

// Test with known Indian food product barcodes
async function testKnownBarcodes() {
  console.log('🇮🇳 Testing known Indian food product barcodes...\n');
  
  const UA = "UntangleApp/1.0 (support@untangle.example)";
  const BASE = "https://world.openfoodfacts.org/api/v2";
  
  // Known Indian food product barcodes (these are examples - you should verify with real products)
  const knownBarcodes = [
    '8901012000000', // Parle-G (example)
    '8901012000001', // Britannia Good Day (example)
    '8901012000002', // Kurkure (example)
    '8901012000003', // Lay's (example)
    '8901012000004', // Maggi (example)
    '8901012000005', // Amul Butter (example)
    '8901012000006', // Mother Dairy Curd (example)
    '8901012000007', // Kwality Walls (example)
    '8901012000008', // Cadbury Dairy Milk (example)
    '8901012000009'  // Nestle Munch (example)
  ];
  
  const fields = [
    "code","product_name","brands","quantity","serving_size",
    "nutriments","nutrition_data_per","nova_group","nutriscore_grade",
    "categories_tags_en","countries_tags_en",
    "ingredients_text","ingredients_analysis_tags",
    "additives_tags","allergens_tags","images","last_modified_t"
  ].join(",");
  
  const foundProducts = [];
  
  for (const barcode of knownBarcodes) {
    try {
      console.log(`🔍 Testing barcode: ${barcode}`);
      
      const res = await axios.get(`${BASE}/product/${barcode}.json?fields=${fields}`, {
        headers: { "User-Agent": UA },
        timeout: 10000
      });
      
      if (res.data && res.data.product) {
        const product = res.data.product;
        foundProducts.push({
          barcode: product.code,
          name: product.product_name || 'Unknown',
          brand: product.brands || 'Unknown',
          nova: product.nova_group || 'Unknown',
          nutriscore: product.nutriscore_grade || 'Unknown',
          hasNutrition: !!product.nutriments,
          hasIngredients: !!product.ingredients_text
        });
        
        console.log(`   ✅ Found: ${product.product_name || 'Unknown'}`);
      } else {
        console.log(`   ⚠️  No product found`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log(`   ❌ Product not found (404)`);
      } else {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n📋 Results Summary:');
  console.log('==================');
  
  if (foundProducts.length > 0) {
    foundProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.name}`);
      console.log(`   Barcode: ${product.barcode}`);
      console.log(`   Brand: ${product.brand}`);
      console.log(`   NOVA: ${product.nova}`);
      console.log(`   Nutri-Score: ${product.nutriscore}`);
      console.log(`   Has Nutrition: ${product.hasNutrition ? 'Yes' : 'No'}`);
      console.log(`   Has Ingredients: ${product.hasIngredients ? 'Yes' : 'No'}`);
      console.log('');
    });
    
    console.log(`\n🎯 Working barcodes: ${foundProducts.length}/${knownBarcodes.length}`);
    console.log('\n💡 You can use these working barcodes in your seed upgrader:');
    console.log('OFF_BARCODES=' + foundProducts.map(p => p.barcode).join(','));
  } else {
    console.log('❌ No products found with the test barcodes');
    console.log('\n💡 The barcodes used are examples and may not exist in the database.');
    console.log('💡 You should scan real Indian food products to get actual barcodes.');
  }
  
  console.log('\n🔍 To find real Indian food product barcodes:');
  console.log('1. Look at the packaging of Indian food products');
  console.log('2. Scan the barcode with a barcode scanner app');
  console.log('3. Use the barcode number in your seed upgrader');
  console.log('4. Or search for specific brands on Open Food Facts website');
}

// Run the test
testKnownBarcodes();
