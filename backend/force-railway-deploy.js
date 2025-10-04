#!/usr/bin/env node

// Force Railway Deployment by making a small change
const fs = require('fs');
const path = require('path');

async function forceRailwayDeploy() {
  console.log('🚀 Forcing Railway Deployment');
  console.log('=============================\n');

  try {
    // Read the current whatsappAuthService.js file
    const filePath = path.join(__dirname, 'server/services/whatsappAuthService.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // Add a deployment timestamp comment
    const timestamp = new Date().toISOString();
    const deployComment = `\n// DEPLOYMENT TIMESTAMP: ${timestamp}\n`;
    
    // Insert the comment at the top of the file
    content = content.replace(
      /(const User = require\('\.\.\/models\/User'\);)/,
      `$1${deployComment}`
    );

    // Write the file back
    fs.writeFileSync(filePath, content);

    console.log('✅ Added deployment timestamp to whatsappAuthService.js');
    console.log(`📅 Timestamp: ${timestamp}`);
    console.log('\n📋 Next steps:');
    console.log('1. Commit this change: git add . && git commit -m "Force Railway deployment"');
    console.log('2. Push to trigger deployment: git push');
    console.log('3. Wait for Railway to deploy (usually 2-3 minutes)');
    console.log('4. Test WhatsApp bot login again');

  } catch (error) {
    console.error('❌ Failed to force deployment:', error.message);
  }
}

// Run the force deploy
forceRailwayDeploy().catch(console.error);
