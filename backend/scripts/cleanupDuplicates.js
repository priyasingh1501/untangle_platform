#!/usr/bin/env node

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// Import models
const FoodItem = require('../server/models/FoodItem');

class DuplicateCleaner {
  constructor() {
    this.stats = {
      totalItems: 0,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
      errors: 0
    };
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/untangle', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      process.exit(1);
    }
  }

  async disconnectDB() {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }

  async cleanupDuplicates() {
    console.log('\n🧹 Starting duplicate cleanup...');
    
    try {
      // Get total count
      this.stats.totalItems = await FoodItem.countDocuments();
      console.log(`📊 Total food items: ${this.stats.totalItems}`);

      // Find duplicates by nameFold and source
      const duplicates = await FoodItem.aggregate([
        {
          $group: {
            _id: { nameFold: '$nameFold', source: '$source' },
            count: { $sum: 1 },
            items: { $push: '$_id' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      console.log(`🔍 Found ${duplicates.length} duplicate groups`);

      for (const group of duplicates) {
        const itemIds = group.items;
        const keepId = itemIds[0]; // Keep the first one (oldest)
        const removeIds = itemIds.slice(1);

        console.log(`\n📝 Processing: "${group._id.nameFold}" (${group._id.source})`);
        console.log(`   Keeping: ${keepId}`);
        console.log(`   Removing: ${removeIds.length} duplicates`);

        try {
          // Remove duplicate items
          const result = await FoodItem.deleteMany({ _id: { $in: removeIds } });
          this.stats.duplicatesRemoved += result.deletedCount;
          console.log(`   ✅ Removed ${result.deletedCount} duplicates`);
        } catch (error) {
          console.error(`   ❌ Error removing duplicates:`, error.message);
          this.stats.errors++;
        }
      }

      // Find duplicates by externalId and source
      const externalDuplicates = await FoodItem.aggregate([
        {
          $match: {
            externalId: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: { externalId: '$externalId', source: '$source' },
            count: { $sum: 1 },
            items: { $push: '$_id' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      console.log(`\n🔍 Found ${externalDuplicates.length} external ID duplicate groups`);

      for (const group of externalDuplicates) {
        const itemIds = group.items;
        const keepId = itemIds[0];
        const removeIds = itemIds.slice(1);

        console.log(`\n📝 Processing external ID: "${group._id.externalId}" (${group._id.source})`);
        console.log(`   Keeping: ${keepId}`);
        console.log(`   Removing: ${removeIds.length} duplicates`);

        try {
          const result = await FoodItem.deleteMany({ _id: { $in: removeIds } });
          this.stats.duplicatesRemoved += result.deletedCount;
          console.log(`   ✅ Removed ${result.deletedCount} duplicates`);
        } catch (error) {
          console.error(`   ❌ Error removing duplicates:`, error.message);
          this.stats.errors++;
        }
      }

      // Find similar names that might be duplicates
      const similarNames = await FoodItem.aggregate([
        {
          $group: {
            _id: '$nameFold',
            count: { $sum: 1 },
            items: { $push: { id: '$_id', name: '$name', source: '$source', relevanceScore: '$relevanceScore' } }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      console.log(`\n🔍 Found ${similarNames.length} similar name groups`);

      for (const group of similarNames) {
        if (group.items.length > 1) {
          // Sort by source priority and relevance
          const sortedItems = group.items.sort((a, b) => {
            const sourcePriority = { local: 1, usda: 2, off: 3 };
            const aPriority = sourcePriority[a.source] || 4;
            const bPriority = sourcePriority[b.source] || 4;
            
            if (aPriority !== bPriority) {
              return aPriority - bPriority;
            }
            
            return (b.relevanceScore || 0) - (a.relevanceScore || 0);
          });

          const keepId = sortedItems[0].id;
          const removeIds = sortedItems.slice(1).map(item => item.id);

          console.log(`\n📝 Processing similar names: "${group._id}"`);
          console.log(`   Keeping: ${sortedItems[0].name} (${sortedItems[0].source})`);
          console.log(`   Removing: ${removeIds.length} similar items`);

          try {
            const result = await FoodItem.deleteMany({ _id: { $in: removeIds } });
            this.stats.duplicatesRemoved += result.deletedCount;
            console.log(`   ✅ Removed ${result.deletedCount} similar items`);
          } catch (error) {
            console.error(`   ❌ Error removing similar items:`, error.message);
            this.stats.errors++;
          }
        }
      }

      // Final count
      const finalCount = await FoodItem.countDocuments();
      console.log(`\n📊 Final food items count: ${finalCount}`);
      console.log(`🗑️  Total duplicates removed: ${this.stats.duplicatesRemoved}`);
      console.log(`❌ Errors encountered: ${this.stats.errors}`);

    } catch (error) {
      console.error('❌ Cleanup failed:', error);
      this.stats.errors++;
    }
  }

  async run() {
    try {
      await this.connectDB();
      await this.cleanupDuplicates();
    } catch (error) {
      console.error('❌ Script failed:', error);
    } finally {
      await this.disconnectDB();
    }
  }
}

// Run the script
if (require.main === module) {
  const cleaner = new DuplicateCleaner();
  cleaner.run();
}

module.exports = DuplicateCleaner;
