require('dotenv').config();
const axios = require('axios');

async function testProductionMealEndpoint() {
  try {
    console.log('🔍 Testing production meal endpoint...\n');
    
    // Test data similar to what frontend sends
    const testMealData = {
      ts: new Date(),
      items: [
        {
          foodId: 'usda_2242545',
          customName: 'ROTI PRATHA',
          grams: 100
        }
      ],
      notes: 'Test meal from production test',
      context: {
        postWorkout: false,
        plantDiversity: 1,
        fermented: false,
        omega3Tag: false,
        addedSugar: 0
      }
    };
    
    console.log('📋 Test meal data:', JSON.stringify(testMealData, null, 2));
    
    try {
      const response = await axios.post('https://lyfe-production.up.railway.app/api/meals', testMealData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token' // This will fail auth, but we can see the error
        },
        timeout: 10000
      });
      
      console.log('✅ Meal created via production endpoint:', response.data);
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Production endpoint error:', error.response.status, error.response.data);
        
        // Check if it's the same "At least one food item is required" error
        if (error.response.data.message === 'At least one food item is required') {
          console.log('\n🔍 This confirms the issue is on the production server');
          console.log('📋 The items array being sent:', JSON.stringify(testMealData.items, null, 2));
          
          // Check if items array is empty or has invalid data
          if (!testMealData.items || testMealData.items.length === 0) {
            console.log('❌ Items array is empty!');
          } else {
            console.log('✅ Items array has data, checking individual items...');
            testMealData.items.forEach((item, index) => {
              console.log(`   Item ${index + 1}:`, {
                foodId: item.foodId,
                grams: item.grams,
                hasValidFoodId: !!item.foodId,
                hasValidGrams: !!(item.grams && item.grams > 0)
              });
            });
          }
        }
      } else if (error.code === 'ECONNREFUSED') {
        console.log('⚠️ Cannot connect to production server');
      } else {
        console.log('❌ Request error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProductionMealEndpoint();


