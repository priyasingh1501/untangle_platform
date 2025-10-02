const bcrypt = require('bcryptjs');

async function testBcrypt() {
  try {
    console.log('🧪 Testing bcrypt Functionality');
    console.log('================================\n');

    const password = 'testpass123';
    console.log(`🔐 Testing password: "${password}"`);

    // Create hash
    const hash = await bcrypt.hash(password, 10);
    console.log(`📝 Generated hash: ${hash}`);

    // Test comparison
    const isValid = await bcrypt.compare(password, hash);
    console.log(`✅ Comparison result: ${isValid}`);

    // Test with different password
    const wrongPassword = 'wrongpass';
    const isInvalid = await bcrypt.compare(wrongPassword, hash);
    console.log(`❌ Wrong password result: ${isInvalid}`);

    // Test with the exact hash from database
    const dbHash = '$2a$10$CBMkknD7x6jQ0TQlGa4Tk.NFsN2Yf6MenbJ1sSyyJ43opqCuGj9Rm';
    const dbTest = await bcrypt.compare(password, dbHash);
    console.log(`🗄️ Database hash test: ${dbTest}`);

  } catch (error) {
    console.error('❌ Error testing bcrypt:', error);
    console.error('Stack trace:', error.stack);
  }
}

testBcrypt();
