#!/usr/bin/env node

// Fix Password Comparison in WhatsApp Bot
const fs = require('fs');
const path = require('path');

async function fixPasswordComparison() {
  console.log('🔧 Fixing Password Comparison in WhatsApp Bot');
  console.log('============================================\n');

  try {
    // Read the whatsappAuthService.js file
    const filePath = path.join(__dirname, 'server/services/whatsappAuthService.js');
    let content = fs.readFileSync(filePath, 'utf8');

    // Add detailed logging for password comparison
    const passwordLoggingCode = `
    // Add detailed password comparison logging
    console.log(\`🔐 Password comparison details:\`);
    console.log(\`   - Input password: "\${password}"\`);
    console.log(\`   - Password length: \${password.length}\`);
    console.log(\`   - Password type: \${typeof password}\`);
    console.log(\`   - User password hash: \${user.password.substring(0, 20)}...\`);
    
    // Test both methods
    const method1 = await user.comparePassword(password);
    const bcrypt = require('bcrypt');
    const method2 = await bcrypt.compare(password, user.password);
    
    console.log(\`   - user.comparePassword(): \${method1}\`);
    console.log(\`   - bcrypt.compare(): \${method2}\`);
    
    // Use the more reliable method
    const isPasswordValid = method2; // Use direct bcrypt comparison
`;

    // Replace the password verification section
    content = content.replace(
      /(\/\/ Verify password using the same method as web authentication\s+const isPasswordValid = await user\.comparePassword\(password\);)/,
      `$1${passwordLoggingCode}`
    );

    // Write the file back
    fs.writeFileSync(filePath, content);

    console.log('✅ Added detailed password comparison logging');
    console.log('📋 Changes made:');
    console.log('1. Added detailed logging for password comparison');
    console.log('2. Test both user.comparePassword() and bcrypt.compare()');
    console.log('3. Use direct bcrypt comparison for reliability');
    console.log('\n📋 Next steps:');
    console.log('1. Commit this change: git add . && git commit -m "Fix password comparison with detailed logging"');
    console.log('2. Push to trigger deployment: git push');
    console.log('3. Wait for Railway to deploy (2-3 minutes)');
    console.log('4. Test WhatsApp bot login - check Railway logs for password details');

  } catch (error) {
    console.error('❌ Failed to fix password comparison:', error.message);
  }
}

// Run the fix
fixPasswordComparison().catch(console.error);
