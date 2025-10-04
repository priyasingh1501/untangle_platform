#!/usr/bin/env node

// Fix WhatsApp Bot Database Connection Issue
const fs = require('fs');
const path = require('path');

async function fixWhatsAppDbConnection() {
  console.log('🔧 Fixing WhatsApp Bot Database Connection');
  console.log('==========================================\n');

  try {
    // Read the whatsappAuthService.js file
    const filePath = path.join(__dirname, 'server/services/whatsappAuthService.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // Add explicit database connection check
    const dbCheckCode = `
// DEPLOYMENT TIMESTAMP: ${new Date().toISOString()}

// Add explicit database connection check
const mongoose = require('mongoose');

// Ensure database connection before authentication
async function ensureDbConnection() {
  if (mongoose.connection.readyState !== 1) {
    console.log('🔗 Reconnecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database reconnected');
  }
}
`;

    // Insert the database check code at the top
    content = content.replace(
      /(const User = require\('\.\.\/models\/User'\);)/,
      `$1${dbCheckCode}`
    );

    // Add database connection check to loginWithCredentials function
    const loginFunctionFix = `
    console.log(\`🔐 Attempting login for \${email} from phone \${phoneNumber}\`);
    
    // Ensure database connection
    await ensureDbConnection();
    
    // Log database connection status
    console.log(\`📊 Database connection status: \${mongoose.connection.readyState}\`);
    console.log(\`📊 Database name: \${mongoose.connection.name}\`);
`;

    content = content.replace(
      /(console\.log\(\`🔐 Attempting login for \${email} from phone \${phoneNumber}\`\);)/,
      `$1${loginFunctionFix}`
    );

    // Write the file back
    fs.writeFileSync(filePath, content);

    console.log('✅ Added database connection check to whatsappAuthService.js');
    console.log('📋 Changes made:');
    console.log('1. Added ensureDbConnection() function');
    console.log('2. Added database connection check before authentication');
    console.log('3. Added database status logging');
    console.log('\n📋 Next steps:');
    console.log('1. Commit this change: git add . && git commit -m "Fix WhatsApp bot database connection"');
    console.log('2. Push to trigger deployment: git push');
    console.log('3. Wait for Railway to deploy (2-3 minutes)');
    console.log('4. Test WhatsApp bot login again');

  } catch (error) {
    console.error('❌ Failed to fix database connection:', error.message);
  }
}

// Run the fix
fixWhatsAppDbConnection().catch(console.error);
