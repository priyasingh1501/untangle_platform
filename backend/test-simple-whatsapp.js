#!/usr/bin/env node

// Simple WhatsApp route test
const express = require('express');
const app = express();

app.use(express.json());

// Simple webhook endpoint
app.post('/test-webhook', (req, res) => {
  console.log('📱 Received webhook:', JSON.stringify(req.body, null, 2));
  
  try {
    const body = req.body;
    
    if (body.object === 'whatsapp_business_account') {
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value) {
        const value = body.entry[0].changes[0].value;
        
        if (value.messages) {
          for (const message of value.messages) {
            console.log(`📱 Processing message: ${message.text?.body} from ${message.from}`);
          }
        }
      }
      
      res.status(200).json({ status: 'success' });
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(5003, () => {
  console.log('🧪 Test server running on port 5003');
  console.log('📱 Test webhook: http://localhost:5003/test-webhook');
});
