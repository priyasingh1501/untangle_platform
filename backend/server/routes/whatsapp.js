const express = require('express');
const router = express.Router();
const { verifyWebhook, processMessage } = require('../services/whatsappService');
const { classifyMessage, parseExpense, parseFood, parseHabit, parseJournal } = require('../services/messageParsingService');
const { saveExpense, saveFood, saveHabit, saveJournal } = require('../services/dataService');

// Webhook verification endpoint
router.get('/webhook', (req, res) => {
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
});

// Webhook endpoint for receiving messages
router.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value) {
        const value = body.entry[0].changes[0].value;
        
        if (value.messages) {
          for (const message of value.messages) {
            await processIncomingMessage(message, value.metadata);
          }
        }
      }
      
      res.status(200).json({ status: 'success' });
    } else {
      res.status(404).json({ error: 'Not Found' });
    }
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Process incoming WhatsApp message
async function processIncomingMessage(message, metadata) {
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
    }
  } catch (error) {
    console.error('Error processing incoming message:', error);
    await sendMessage(message.from, 'Sorry, I encountered an error processing your message. Please try again.');
  }
}

// Handle text messages
async function handleTextMessage(phoneNumber, messageText) {
  try {
    // Check for special commands first
    if (messageText.toLowerCase().includes('undo')) {
      await handleUndoCommand(phoneNumber);
      return;
    }
    
    if (messageText.toLowerCase().includes('last expenses') || messageText.toLowerCase().includes('weekly summary')) {
      await handleSummaryCommand(phoneNumber, messageText);
      return;
    }

    // Classify the message
    const classification = await classifyMessage(messageText);
    console.log(`🔍 Classified message as: ${classification.type} (confidence: ${classification.confidence})`);

    let response = '';

    switch (classification.type) {
      case 'expense':
        const expenseData = await parseExpense(messageText);
        if (expenseData) {
          const savedExpense = await saveExpense(phoneNumber, expenseData);
          response = `💰 Logged expense: ${expenseData.currency}${expenseData.amount} — ${expenseData.vendor} — ${expenseData.date.toLocaleDateString()}. Category: ${expenseData.category}. Want to change category? (1) Yes (2) No`;
        } else {
          response = 'I couldn\'t parse that expense. Please try again with format: "₹450 Uber 2025-09-27"';
        }
        break;

      case 'food':
        const foodData = await parseFood(messageText);
        if (foodData) {
          const savedFood = await saveFood(phoneNumber, foodData);
          response = `🍽️ Logged food: ${foodData.mealType} - ${foodData.description}. Edit? [Edit] [OK]`;
        } else {
          response = 'I couldn\'t parse that food entry. Please try again with format: "ate breakfast - toast and eggs"';
        }
        break;

      case 'habit':
        const habitData = await parseHabit(messageText);
        if (habitData) {
          const savedHabit = await saveHabit(phoneNumber, habitData);
          response = `✅ Nice — ${habitData.habit} marked ${habitData.status} for ${new Date().toLocaleDateString()}. Streak: ${habitData.streak} days.`;
        } else {
          response = 'I couldn\'t parse that habit. Please try again with format: "meditation done"';
        }
        break;

      case 'journal':
        const journalData = await parseJournal(messageText);
        if (journalData) {
          const savedJournal = await saveJournal(phoneNumber, journalData);
          response = `📝 Saved journal entry. Mood detected: ${journalData.mood}.`;
        } else {
          response = 'I couldn\'t parse that journal entry. Please try again.';
        }
        break;

      default:
        response = 'I\'m not sure what you want to log. Try: "₹450 Uber" for expenses, "ate breakfast" for food, "meditation done" for habits, or just write your thoughts for journaling.';
    }

    // Send response
    await sendMessage(phoneNumber, response);

  } catch (error) {
    console.error('Error handling text message:', error);
    await sendMessage(phoneNumber, 'Sorry, I encountered an error. Please try again.');
  }
}

// Handle media messages (images, documents)
async function handleMediaMessage(phoneNumber, message, metadata) {
  try {
    const mediaId = message.image?.id || message.document?.id;
    const mediaType = message.image ? 'image' : 'document';
    
    if (mediaId) {
      // Download and process the media
      const mediaData = await downloadMedia(mediaId);
      
      if (mediaType === 'image') {
        // OCR processing for receipts
        const ocrResult = await processImageOCR(mediaData);
        if (ocrResult) {
          const expenseData = await parseExpense(ocrResult);
          if (expenseData) {
            const savedExpense = await saveExpense(phoneNumber, expenseData);
            await sendMessage(phoneNumber, `📷 Got it — found ${expenseData.currency}${expenseData.amount} at ${expenseData.vendor} on ${expenseData.date.toLocaleDateString()}. Logged as ${expenseData.category}. Edit? [Edit] [OK]`);
          } else {
            await sendMessage(phoneNumber, 'I couldn\'t extract expense information from this image. Please try again or send a clearer receipt.');
          }
        } else {
          await sendMessage(phoneNumber, 'I couldn\'t read the text in this image. Please try again with a clearer receipt.');
        }
      } else if (mediaType === 'document') {
        await sendMessage(phoneNumber, 'I received your document. I\'m still learning to process documents, but I can help with images and text messages!');
      }
    }
  } catch (error) {
    console.error('Error handling media message:', error);
    await sendMessage(phoneNumber, 'Sorry, I couldn\'t process that media. Please try again.');
  }
}

// Handle voice messages
async function handleVoiceMessage(phoneNumber, message, metadata) {
  try {
    const mediaId = message.audio?.id;
    
    if (mediaId) {
      // Download and convert voice to text
      const mediaData = await downloadMedia(mediaId);
      const transcription = await convertVoiceToText(mediaData);
      
      if (transcription) {
        await sendMessage(phoneNumber, `🎤 I heard: "${transcription}". Let me process that...`);
        await handleTextMessage(phoneNumber, transcription);
      } else {
        await sendMessage(phoneNumber, 'I couldn\'t understand your voice message. Please try again or send a text message.');
      }
    }
  } catch (error) {
    console.error('Error handling voice message:', error);
    await sendMessage(phoneNumber, 'Sorry, I couldn\'t process your voice message. Please try again.');
  }
}

// Handle undo command
async function handleUndoCommand(phoneNumber) {
  try {
    // Find and remove the most recent entry
    const result = await removeLastEntry(phoneNumber);
    
    if (result) {
      await sendMessage(phoneNumber, `✅ Removed your most recent ${result.type} log. (If that was a mistake, reply 'restore')`);
    } else {
      await sendMessage(phoneNumber, 'No recent entries found to undo.');
    }
  } catch (error) {
    console.error('Error handling undo command:', error);
    await sendMessage(phoneNumber, 'Sorry, I couldn\'t undo your last entry. Please try again.');
  }
}

// Handle summary commands
async function handleSummaryCommand(phoneNumber, messageText) {
  try {
    if (messageText.toLowerCase().includes('last expenses')) {
      const expenses = await getLastExpenses(phoneNumber, 5);
      if (expenses.length > 0) {
        let response = '💰 Last 5 expenses:\n';
        expenses.forEach(expense => {
          response += `• ${expense.currency}${expense.amount} - ${expense.vendor} (${expense.date.toLocaleDateString()})\n`;
        });
        await sendMessage(phoneNumber, response);
      } else {
        await sendMessage(phoneNumber, 'No expenses found.');
      }
    } else if (messageText.toLowerCase().includes('weekly summary')) {
      const summary = await getWeeklySummary(phoneNumber);
      await sendMessage(phoneNumber, summary);
    }
  } catch (error) {
    console.error('Error handling summary command:', error);
    await sendMessage(phoneNumber, 'Sorry, I couldn\'t generate your summary. Please try again.');
  }
}

// Send message via WhatsApp API
async function sendMessage(phoneNumber, message) {
  try {
    const response = await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneNumber,
        type: 'text',
        text: {
          body: message
        }
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    console.log(`📤 Sent message to ${phoneNumber}`);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

module.exports = router;
