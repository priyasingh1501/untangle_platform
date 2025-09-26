#!/usr/bin/env node

/**
 * Script to create a demo user with 30 days of data
 * Run with: node scripts/runDemoUser.js
 */

const { createDemoUser } = require('./createDemoUser');

console.log('🌱 Lyfe Demo User Creator');
console.log('========================\n');

createDemoUser()
  .then(() => {
    console.log('\n🎉 Demo user creation completed!');
    console.log('\nYou can now login with:');
    console.log('Email: demo@lyfe.app');
    console.log('Password: demo123456');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Demo user creation failed:', error.message);
    process.exit(1);
  });
