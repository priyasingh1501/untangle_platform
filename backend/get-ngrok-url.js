const https = require('https');

async function getNgrokUrl() {
  try {
    console.log('🔍 Getting ngrok URL...');
    
    const response = await fetch('http://localhost:4040/api/tunnels');
    const data = await response.json();
    
    if (data.tunnels && data.tunnels.length > 0) {
      const httpsTunnel = data.tunnels.find(tunnel => tunnel.proto === 'https');
      if (httpsTunnel) {
        console.log('✅ ngrok HTTPS URL:', httpsTunnel.public_url);
        console.log('📱 Use this URL in Facebook Developer Console:');
        console.log(`   ${httpsTunnel.public_url}/api/whatsapp/webhook`);
        return httpsTunnel.public_url;
      }
    }
    
    console.log('❌ No ngrok tunnels found. Make sure ngrok is running on port 5002');
  } catch (error) {
    console.log('❌ Error getting ngrok URL:', error.message);
    console.log('💡 Make sure ngrok is running: ngrok http 5002');
  }
}

getNgrokUrl();
