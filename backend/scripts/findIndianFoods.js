#!/usr/bin/env node

const axios = require('axios');

// Find Indian food products in Open Food Facts
async function findIndianFoods() {
  console.log('🇮🇳 Searching for Indian food products in Open Food Facts...\n');
  
  const UA = "UntangleApp/1.0 (support@untangle.example)";
  const BASE = "https://world.openfoodfacts.org/api/v2";
  
  // Common Indian food terms to search for
  const searchTerms = [
    'parle-g biscuit',
    'britannia good day',
    'amul butter',
    'mother dairy curd',
    'kwality walls ice cream',
    'cadbury dairy milk chocolate',
    'nestle munch chocolate',
    'kurkure snack',
    'lays chips',
    'maggi noodles',
    'haldirams',
    'bikaner',
    'gujarat',
    'punjab',
    'kerala',
    'tamil nadu',
    'karnataka',
    'maharashtra',
    'west bengal',
    'assam'
  ];
  
  const foundProducts = [];
  
  for (const term of searchTerms.slice(0, 10)) { // Limit to first 10 for demo
    try {
      console.log(`🔍 Searching for: ${term}`);
      
      const res = await axios.get(`${BASE}/search?search_terms=${encodeURIComponent(term)}&json=1&page_size=5`, {
        headers: { "User-Agent": UA },
        timeout: 10000
      });
      
      if (res.data && res.data.products) {
        const products = res.data.products.filter(p => p.code && p.product_name);
        
        products.forEach(product => {
          foundProducts.push({
            barcode: product.code,
            name: product.product_name,
            brand: product.brands || 'Unknown',
            nova: product.nova_group || 'Unknown',
            nutriscore: product.nutriscore_grade || 'Unknown',
            categories: product.categories_tags_en ? product.categories_tags_en.slice(0, 3) : []
          });
        });
        
        console.log(`   Found ${products.length} products`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.log(`   ❌ Error searching for ${term}: ${error.message}`);
    }
  }
  
  console.log('\n📋 Found Products:');
  console.log('==================');
  
  foundProducts.forEach((product, index) => {
    console.log(`${index + 1}. ${product.name}`);
    console.log(`   Barcode: ${product.barcode}`);
    console.log(`   Brand: ${product.brand}`);
    console.log(`   NOVA: ${product.nova}`);
    console.log(`   Nutri-Score: ${product.nutriscore}`);
    console.log(`   Categories: ${product.categories.join(', ')}`);
    console.log('');
  });
  
  console.log(`\n🎯 Total products found: ${foundProducts.length}`);
  console.log('\n💡 You can use these barcodes in your seed upgrader:');
  console.log('OFF_BARCODES=' + foundProducts.map(p => p.barcode).join(','));
}

// Run the search
findIndianFoods();
