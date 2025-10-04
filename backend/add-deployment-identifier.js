#!/usr/bin/env node

// Add Deployment Identifier to Verify Deployment
const fs = require('fs');
const path = require('path');

async function addDeploymentIdentifier() {
  console.log('🔧 Adding Deployment Identifier');
  console.log('===============================\n');

  try {
    // Read the whatsappAuthService.js file
    const filePath = path.join(__dirname, 'server/services/whatsappAuthService.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // Add a unique deployment identifier
    const deploymentId = `DEPLOYMENT_${Date.now()}`;
    const identifierCode = `
// DEPLOYMENT IDENTIFIER: ${deploymentId}
// This unique identifier proves our changes are deployed
`;

    // Insert the identifier at the top
    content = content.replace(
      /(const User = require\('\.\.\/models\/User'\);)/,
      `$1${identifierCode}`
    );

    // Modify the error messages to include the deployment ID
    const errorMessageUpdates = [
      {
        old: '❌ Invalid password. Please check your credentials.',
        new: `❌ Invalid password. Please check your credentials. [${deploymentId}]`
      },
      {
        old: '❌ No account found with this email. Please register on the web platform first.',
        new: `❌ No account found with this email. Please register on the web platform first. [${deploymentId}]`
      },
      {
        old: '❌ Account is temporarily locked due to multiple failed login attempts. Please try again later.',
        new: `❌ Account is temporarily locked due to multiple failed login attempts. Please try again later. [${deploymentId}]`
      },
      {
        old: '❌ Two-factor authentication is enabled for your account. Please use the web platform to log in with 2FA, or disable 2FA in your account settings.',
        new: `❌ Two-factor authentication is enabled for your account. Please use the web platform to log in with 2FA, or disable 2FA in your account settings. [${deploymentId}]`
      }
    ];

    // Apply all error message updates
    errorMessageUpdates.forEach(update => {
      content = content.replace(update.old, update.new);
    });

    // Write the file back
    fs.writeFileSync(filePath, content);

    console.log('✅ Added deployment identifier to whatsappAuthService.js');
    console.log(`📋 Deployment ID: ${deploymentId}`);
    console.log('\n📋 Changes made:');
    console.log('1. Added unique deployment identifier');
    console.log('2. Modified error messages to include deployment ID');
    console.log('3. This will prove our changes are deployed');
    console.log('\n📋 Next steps:');
    console.log('1. Commit this change: git add . && git commit -m "Add deployment identifier"');
    console.log('2. Push to trigger deployment: git push');
    console.log('3. Wait for Railway to deploy (2-3 minutes)');
    console.log('4. Test WhatsApp bot login - error messages should include deployment ID');

  } catch (error) {
    console.error('❌ Failed to add deployment identifier:', error.message);
  }
}

// Run the fix
addDeploymentIdentifier().catch(console.error);
