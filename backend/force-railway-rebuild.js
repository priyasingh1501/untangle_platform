#!/usr/bin/env node

// Force Railway Rebuild
const fs = require('fs');
const path = require('path');

async function forceRailwayRebuild() {
  console.log('🔧 Forcing Railway Rebuild');
  console.log('==========================\n');

  try {
    // Read the whatsappAuthService.js file
    const filePath = path.join(__dirname, 'server/services/whatsappAuthService.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // Add a unique timestamp to force rebuild
    const timestamp = new Date().toISOString();
    const rebuildCode = `
// FORCE REBUILD TIMESTAMP: ${timestamp}
// This timestamp forces Railway to rebuild and deploy latest changes
`;

    // Insert the timestamp at the top
    content = content.replace(
      /(const User = require\('\.\.\/models\/User'\);)/,
      `$1${rebuildCode}`
    );

    // Write the file back
    fs.writeFileSync(filePath, content);

    console.log('✅ Added force rebuild timestamp');
    console.log(`📋 Timestamp: ${timestamp}`);
    console.log('\n📋 Next steps:');
    console.log('1. Commit this change: git add . && git commit -m "Force Railway rebuild"');
    console.log('2. Push to trigger deployment: git push');
    console.log('3. Wait for Railway to rebuild and deploy (3-5 minutes)');
    console.log('4. Test WhatsApp bot login with enhanced logging');

  } catch (error) {
    console.error('❌ Failed to force rebuild:', error.message);
  }
}

// Run the force rebuild
forceRailwayRebuild().catch(console.error);
