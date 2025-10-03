#!/usr/bin/env node

/**
 * Production Encryption Check Script
 * 
 * This script checks if the encryption service is properly configured
 * and can encrypt/decrypt data in the production environment.
 */

const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import services
const EncryptionService = require('../server/services/encryptionService');
const Journal = require('../server/models/Journal');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/untangle', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  }
}

// Test encryption service
async function testEncryptionService() {
  console.log('\n🔐 Testing Encryption Service...');
  
  try {
    const encryptionService = new EncryptionService();
    console.log('✅ Encryption service initialized successfully');
    
    // Test encryption/decryption
    const testData = 'This is a test journal entry for production validation';
    console.log('📝 Test data:', testData);
    
    const encrypted = encryptionService.encrypt(testData);
    console.log('🔒 Encrypted data structure:', {
      hasEncrypted: !!encrypted.encrypted,
      hasIV: !!encrypted.iv,
      hasTag: !!encrypted.tag,
      ivLength: encrypted.iv?.length,
      tagLength: encrypted.tag?.length
    });
    
    const decrypted = encryptionService.decrypt(encrypted);
    console.log('🔓 Decrypted data:', decrypted);
    
    if (decrypted === testData) {
      console.log('✅ Encryption/decryption test passed');
      return true;
    } else {
      console.log('❌ Encryption/decryption test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Encryption service test failed:', error.message);
    return false;
  }
}

// Test journal decryption
async function testJournalDecryption() {
  console.log('\n📖 Testing Journal Decryption...');
  
  try {
    // Find a journal with entries
    const journal = await Journal.findOne({ 
      'entries.0': { $exists: true } 
    }).limit(1);
    
    if (!journal) {
      console.log('⚠️ No journals with entries found for testing');
      return true;
    }
    
    console.log(`📚 Found journal with ${journal.entries.length} entries`);
    
    // Test decryption of first few entries
    const testEntries = journal.entries.slice(0, 3);
    let successCount = 0;
    
    for (let i = 0; i < testEntries.length; i++) {
      const entry = testEntries[i];
      try {
        const decryptedEntry = entry.getDecryptedEntry();
        console.log(`✅ Entry ${i + 1} decrypted successfully`);
        successCount++;
      } catch (error) {
        console.log(`❌ Entry ${i + 1} decryption failed:`, error.message);
      }
    }
    
    console.log(`📊 Decryption success rate: ${successCount}/${testEntries.length}`);
    return successCount === testEntries.length;
  } catch (error) {
    console.error('❌ Journal decryption test failed:', error.message);
    return false;
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  console.log('\n🌍 Checking Environment Variables...');
  
  const requiredVars = [
    'MONGODB_URI',
    'ENCRYPTION_KEY',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:', missingVars);
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  
  // Check encryption key format
  const encryptionKey = process.env.ENCRYPTION_KEY;
  if (encryptionKey.length < 32) {
    console.log('❌ ENCRYPTION_KEY is too short (minimum 32 characters)');
    return false;
  }
  
  if (!/^[0-9a-fA-F]+$/.test(encryptionKey)) {
    console.log('❌ ENCRYPTION_KEY must be a valid hexadecimal string');
    return false;
  }
  
  console.log('✅ ENCRYPTION_KEY format is valid');
  return true;
}

// Main function
async function main() {
  console.log('🚀 Production Encryption Check Starting...\n');
  
  try {
    // Check environment variables
    const envCheck = checkEnvironmentVariables();
    if (!envCheck) {
      console.log('\n❌ Environment check failed');
      process.exit(1);
    }
    
    // Connect to database
    await connectDB();
    
    // Test encryption service
    const encryptionTest = await testEncryptionService();
    if (!encryptionTest) {
      console.log('\n❌ Encryption service test failed');
      process.exit(1);
    }
    
    // Test journal decryption
    const journalTest = await testJournalDecryption();
    if (!journalTest) {
      console.log('\n❌ Journal decryption test failed');
      process.exit(1);
    }
    
    console.log('\n🎉 All tests passed! Production encryption is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Production encryption check failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  testEncryptionService,
  testJournalDecryption,
  checkEnvironmentVariables
};
