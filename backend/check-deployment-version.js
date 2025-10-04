#!/usr/bin/env node

// Check if Railway deployment has our latest code
const fetch = require('node-fetch');

async function checkDeploymentVersion() {
  console.log('🔍 Checking Railway Deployment Version');
  console.log('=====================================\n');

  try {
    // Test if our deployment timestamp is in the response
    const response = await fetch('https://lyfe-production.up.railway.app/api/health');
    const data = await response.json();
    
    console.log('📊 Health check response:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if we can see any signs of our deployment
    console.log('\n🔍 Looking for deployment indicators...');
    
    // Test a simple endpoint that might show our changes
    const testResponse = await fetch('https://lyfe-production.up.railway.app/api/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{
          id: 'version_check',
          changes: [{
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '15556324225',
                phone_number_id: '796369900227467'
              },
              messages: [{
                from: '919805153470',
                id: 'version_check_' + Date.now(),
                timestamp: Math.floor(Date.now() / 1000).toString(),
                text: {
                  body: 'version check'
                },
                type: 'text'
              }]
            },
            field: 'messages'
          }]
        }]
      })
    });
    
    const testData = await testResponse.json();
    console.log('\n📤 WhatsApp webhook test response:');
    console.log(JSON.stringify(testData, null, 2));
    
    console.log('\n💡 If the responses look the same as before, Railway might not have deployed our changes yet.');
    console.log('💡 Railway deployments can take 5-10 minutes sometimes.');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

// Run the check
checkDeploymentVersion().catch(console.error);
