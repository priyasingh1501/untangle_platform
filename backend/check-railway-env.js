require('dotenv').config({ path: './.env' });

console.log('🔍 Checking Environment Variables for Railway Deployment');
console.log('=======================================================\n');

const requiredVars = [
  'MONGODB_URI',
  'OPENAI_API_KEY', 
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_WEBHOOK_VERIFY_TOKEN',
  'JWT_SECRET',
  'NODE_ENV'
];

console.log('📋 Required Environment Variables:');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    const displayValue = varName.includes('SECRET') || varName.includes('TOKEN') || varName.includes('KEY') 
      ? `${value.substring(0, 10)}...` 
      : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n🔧 Railway Deployment Checklist:');
console.log('1. Make sure all environment variables are set in Railway dashboard');
console.log('2. Verify MONGODB_URI points to your production database');
console.log('3. Check WHATSAPP_ACCESS_TOKEN is valid and not expired');
console.log('4. Ensure WHATSAPP_PHONE_NUMBER_ID matches your WhatsApp Business Account');
console.log('5. Verify webhook URL is: https://lyfe-production.up.railway.app/api/whatsapp/webhook');
