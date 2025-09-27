const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Download media from WhatsApp
async function downloadMedia(mediaId) {
  try {
    // Get media URL
    const mediaUrlResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      }
    });
    
    if (!mediaUrlResponse.ok) {
      throw new Error(`Failed to get media URL: ${mediaUrlResponse.status}`);
    }
    
    const mediaData = await mediaUrlResponse.json();
    const mediaUrl = mediaData.url;
    
    // Download media content
    const mediaResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`
      }
    });
    
    if (!mediaResponse.ok) {
      throw new Error(`Failed to download media: ${mediaResponse.status}`);
    }
    
    const buffer = await mediaResponse.buffer();
    return buffer;
  } catch (error) {
    console.error('Error downloading media:', error);
    throw error;
  }
}

// Process image with OCR
async function processImageOCR(imageBuffer) {
  try {
    // For now, we'll use a simple approach
    // In production, you'd want to use a proper OCR service like Google Vision API or AWS Textract
    
    // This is a placeholder - you'd need to implement actual OCR
    // For now, return null to indicate OCR failed
    console.log('OCR processing not implemented yet');
    return null;
    
    // Example implementation with Google Vision API:
    /*
    const vision = require('@google-cloud/vision');
    const client = new vision.ImageAnnotatorClient();
    
    const [result] = await client.textDetection({
      image: { content: imageBuffer }
    });
    
    const detections = result.textAnnotations;
    if (detections.length > 0) {
      return detections[0].description;
    }
    
    return null;
    */
  } catch (error) {
    console.error('Error processing image OCR:', error);
    return null;
  }
}

// Convert voice to text
async function convertVoiceToText(audioBuffer) {
  try {
    // For now, we'll use a simple approach
    // In production, you'd want to use a proper speech-to-text service like Google Speech-to-Text or AWS Transcribe
    
    // This is a placeholder - you'd need to implement actual speech-to-text
    console.log('Speech-to-text processing not implemented yet');
    return null;
    
    // Example implementation with Google Speech-to-Text:
    /*
    const speech = require('@google-cloud/speech');
    const client = new speech.SpeechClient();
    
    const audio = {
      content: audioBuffer.toString('base64')
    };
    
    const config = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'en-US'
    };
    
    const request = {
      audio: audio,
      config: config
    };
    
    const [response] = await client.recognize(request);
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    
    return transcription;
    */
  } catch (error) {
    console.error('Error converting voice to text:', error);
    return null;
  }
}

// Send message via WhatsApp API
async function sendMessage(phoneNumber, message, messageType = 'text') {
  try {
    let messageBody;
    
    if (messageType === 'text') {
      messageBody = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      };
    } else if (messageType === 'template') {
      messageBody = {
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'template',
        template: {
          name: message.templateName,
          language: {
            code: message.languageCode || 'en'
          },
          components: message.components || []
        }
      };
    }
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`📤 Sent ${messageType} message to ${phoneNumber}: ${result.messages[0].id}`);
    return result;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Send interactive message with buttons
async function sendInteractiveMessage(phoneNumber, message, buttons) {
  try {
    const messageBody = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: message
        },
        action: {
          buttons: buttons.map((button, index) => ({
            type: 'reply',
            reply: {
              id: `btn_${index}`,
              title: button.title
            }
          }))
        }
      }
    };
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`📤 Sent interactive message to ${phoneNumber}: ${result.messages[0].id}`);
    return result;
  } catch (error) {
    console.error('Error sending interactive message:', error);
    throw error;
  }
}

// Send list message
async function sendListMessage(phoneNumber, message, sections) {
  try {
    const messageBody = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: {
          text: message
        },
        action: {
          button: 'View Options',
          sections: sections
        }
      }
    };
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`WhatsApp API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log(`📤 Sent list message to ${phoneNumber}: ${result.messages[0].id}`);
    return result;
  } catch (error) {
    console.error('Error sending list message:', error);
    throw error;
  }
}

// Verify webhook
function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed');
      res.status(403).json({ error: 'Forbidden' });
    }
  } else {
    res.status(400).json({ error: 'Bad Request' });
  }
}

// Process incoming message
async function processMessage(message, metadata) {
  try {
    const phoneNumber = message.from;
    const messageText = message.text?.body || '';
    const messageType = message.type;
    
    console.log(`📱 Received ${messageType} message from ${phoneNumber}: ${messageText}`);

    // Handle different message types
    if (messageType === 'text') {
      await handleTextMessage(phoneNumber, messageText);
    } else if (messageType === 'image' || messageType === 'document') {
      await handleMediaMessage(phoneNumber, message, metadata);
    } else if (messageType === 'audio') {
      await handleVoiceMessage(phoneNumber, message, metadata);
    } else if (messageType === 'interactive') {
      await handleInteractiveMessage(phoneNumber, message);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await sendMessage(message.from, 'Sorry, I encountered an error processing your message. Please try again.');
  }
}

// Handle text messages
async function handleTextMessage(phoneNumber, messageText) {
  // This will be implemented in the main route handler
  console.log(`📝 Processing text message: ${messageText}`);
}

// Handle media messages
async function handleMediaMessage(phoneNumber, message, metadata) {
  // This will be implemented in the main route handler
  console.log(`📷 Processing media message`);
}

// Handle voice messages
async function handleVoiceMessage(phoneNumber, message, metadata) {
  // This will be implemented in the main route handler
  console.log(`🎤 Processing voice message`);
}

// Handle interactive messages (buttons, lists)
async function handleInteractiveMessage(phoneNumber, message) {
  // This will be implemented in the main route handler
  console.log(`🔘 Processing interactive message`);
}

module.exports = {
  downloadMedia,
  processImageOCR,
  convertVoiceToText,
  sendMessage,
  sendInteractiveMessage,
  sendListMessage,
  verifyWebhook,
  processMessage
};

