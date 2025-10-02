const commonTokens = [
  'test123',
  'untangle_webhook_2024',
  'webhook_verify_token',
  'whatsapp_bot_token',
  'untangle_bot',
  'webhook_token',
  'verify_token'
];

async function testWebhookTokens() {
  console.log('🔍 Testing Common Webhook Verify Tokens');
  console.log('=======================================\n');

  const baseUrl = 'https://lyfe-production.up.railway.app/api/whatsapp/webhook';
  
  for (const token of commonTokens) {
    try {
      const url = `${baseUrl}?hub.mode=subscribe&hub.challenge=test123&hub.verify_token=${token}`;
      
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      
      if (response.ok && text === 'test123') {
        console.log(`✅ FOUND MATCHING TOKEN: ${token}`);
        console.log(`   This token works! Use this in Railway: WHATSAPP_WEBHOOK_VERIFY_TOKEN=${token}`);
        return;
      } else {
        console.log(`❌ ${token}: ${response.status} - ${text}`);
      }
    } catch (error) {
      console.log(`❌ ${token}: Error - ${error.message}`);
    }
  }
  
  console.log('\n🔧 If no token worked, you need to:');
  console.log('1. Check Facebook Developer Console for your webhook verify token');
  console.log('2. Or set a new token in both Facebook and Railway');
}

testWebhookTokens();
