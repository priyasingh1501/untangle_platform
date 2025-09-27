#!/usr/bin/env node

/**
 * Journal Encryption Migration Script
 * 
 * This script encrypts all existing journal entries in the database.
 * It should be run once after implementing journal encryption.
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const EncryptionService = require('../server/services/encryptionService');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const encryptionService = new EncryptionService();

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

// Encrypt journal entries
async function encryptJournalEntries() {
  try {
    const Journal = require('../server/models/Journal');
    
    console.log('🔍 Finding journals with unencrypted entries...');
    
    // Find all journals
    const journals = await Journal.find({});
    console.log(`📚 Found ${journals.length} journals`);
    
    let totalEntries = 0;
    let encryptedEntries = 0;
    let skippedEntries = 0;
    
    for (const journal of journals) {
      console.log(`\n📖 Processing journal for user: ${journal.userId}`);
      
      for (const entry of journal.entries) {
        totalEntries++;
        
        // Check if entry is already encrypted
        if (entry.encryptedContent || entry.encryptedTitle) {
          skippedEntries++;
          console.log(`  ⏭️  Entry ${entry._id} already encrypted, skipping`);
          continue;
        }
        
        try {
          // Encrypt content if it exists
          if (entry.content) {
            entry.encryptedContent = encryptionService.encrypt(entry.content);
            entry.content = undefined; // Clear plain text
          }
          
          // Encrypt title if it exists
          if (entry.title) {
            entry.encryptedTitle = encryptionService.encrypt(entry.title);
            entry.title = undefined; // Clear plain text
          }
          
          encryptedEntries++;
          console.log(`  🔒 Encrypted entry ${entry._id}`);
          
        } catch (error) {
          console.error(`  ❌ Error encrypting entry ${entry._id}:`, error.message);
        }
      }
      
      // Save the journal with encrypted entries
      try {
        await journal.save();
        console.log(`  💾 Saved journal for user ${journal.userId}`);
      } catch (error) {
        console.error(`  ❌ Error saving journal for user ${journal.userId}:`, error.message);
      }
    }
    
    console.log('\n📊 Migration Summary:');
    console.log(`  Total entries processed: ${totalEntries}`);
    console.log(`  Entries encrypted: ${encryptedEntries}`);
    console.log(`  Entries skipped (already encrypted): ${skippedEntries}`);
    console.log(`  Journals processed: ${journals.length}`);
    
    if (encryptedEntries > 0) {
      console.log('\n✅ Journal encryption migration completed successfully!');
    } else {
      console.log('\n✅ No entries needed encryption (all were already encrypted)');
    }
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Verify encryption
async function verifyEncryption() {
  try {
    const Journal = require('../server/models/Journal');
    
    console.log('\n🔍 Verifying encryption...');
    
    const journals = await Journal.find({});
    let verifiedEntries = 0;
    let unencryptedEntries = 0;
    
    for (const journal of journals) {
      for (const entry of journal.entries) {
        if (entry.encryptedContent || entry.encryptedTitle) {
          verifiedEntries++;
        } else if (entry.content || entry.title) {
          unencryptedEntries++;
          console.log(`  ⚠️  Found unencrypted entry: ${entry._id}`);
        }
      }
    }
    
    console.log(`\n📊 Verification Results:`);
    console.log(`  Encrypted entries: ${verifiedEntries}`);
    console.log(`  Unencrypted entries: ${unencryptedEntries}`);
    
    if (unencryptedEntries === 0) {
      console.log('✅ All entries are properly encrypted!');
    } else {
      console.log('⚠️  Some entries are still unencrypted. Please run the migration again.');
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Test decryption
async function testDecryption() {
  try {
    const Journal = require('../server/models/Journal');
    
    console.log('\n🧪 Testing decryption...');
    
    const journal = await Journal.findOne({});
    if (!journal || journal.entries.length === 0) {
      console.log('⚠️  No journals with entries found for testing');
      return;
    }
    
    const testEntry = journal.entries[0];
    console.log(`  Testing entry: ${testEntry._id}`);
    
    try {
      // Test decryption
      const decryptedEntry = testEntry.getDecryptedEntry();
      
      if (decryptedEntry.title || decryptedEntry.content) {
        console.log('✅ Decryption test successful!');
        console.log(`  Title: ${decryptedEntry.title ? decryptedEntry.title.substring(0, 50) + '...' : 'N/A'}`);
        console.log(`  Content: ${decryptedEntry.content ? decryptedEntry.content.substring(0, 100) + '...' : 'N/A'}`);
      } else {
        console.log('⚠️  Decrypted entry appears to be empty');
      }
      
    } catch (error) {
      console.error('❌ Decryption test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error during decryption test:', error);
  }
}

// Main function
async function main() {
  try {
    console.log('🔒 Starting Journal Encryption Migration...\n');
    
    // Connect to database
    await connectDB();
    
    // Check if encryption key is configured
    if (!process.env.ENCRYPTION_KEY) {
      console.error('❌ ENCRYPTION_KEY environment variable is required');
      console.log('💡 Run: node scripts/setup-security.js to generate encryption keys');
      process.exit(1);
    }
    
    // Run migration
    await encryptJournalEntries();
    
    // Verify encryption
    await verifyEncryption();
    
    // Test decryption
    await testDecryption();
    
    console.log('\n🎉 Migration process completed!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--verify-only')) {
  main = async () => {
    await connectDB();
    await verifyEncryption();
    await mongoose.connection.close();
  };
} else if (args.includes('--test-only')) {
  main = async () => {
    await connectDB();
    await testDecryption();
    await mongoose.connection.close();
  };
}

// Run the migration
if (require.main === module) {
  main();
}

module.exports = {
  encryptJournalEntries,
  verifyEncryption,
  testDecryption
};

