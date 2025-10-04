#!/usr/bin/env node

// Check Deployment Status
const fetch = require('node-fetch');

async function checkDeploymentStatus() {
  console.log('🔍 Checking Deployment Status');
  console.log('=============================\n');

  try {
    // Check health endpoint for commit hash
    const healthResponse = await fetch('https://lyfe-production.up.railway.app/api/health');
    const healthData = await healthResponse.json();
    
    console.log('📊 Health Check Response:');
    console.log(`   - Status: ${healthData.status}`);
    console.log(`   - Message: ${healthData.message}`);
    console.log(`   - Timestamp: ${healthData.timestamp}`);
    console.log(`   - Environment: ${healthData.environment}`);
    console.log(`   - MongoDB: ${healthData.mongodb}`);
    console.log(`   - Uptime: ${healthData.uptime} seconds`);

    // Check server test endpoint
    const serverResponse = await fetch('https://lyfe-production.up.railway.app/api/server-test');
    const serverData = await serverResponse.json();
    
    console.log('\n📊 Server Test Response:');
    console.log(`   - Message: ${serverData.message}`);
    console.log(`   - Timestamp: ${serverData.timestamp}`);
    console.log(`   - Has Auth: ${serverData.hasAuth}`);

    console.log('\n💡 If the server is running but logs show old commit hash,');
    console.log('   Railway might still be deploying the latest changes.');
    console.log('   Wait a few more minutes and try again.');

  } catch (error) {
    console.error('❌ Error checking deployment status:', error.message);
  }
}

// Run the check
checkDeploymentStatus().catch(console.error);
