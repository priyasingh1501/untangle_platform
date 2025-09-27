const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const mailparser = require('mailparser');
const simpleParser = mailparser.simpleParser;
const EmailForwarding = require('../models/EmailForwarding');
const { Expense } = require('../models/Finance');
const EmailParsingService = require('../services/emailParsingService');
const auth = require('../middleware/auth');

// Configure multer for email attachments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for email attachments
  }
});

const emailParsingService = new EmailParsingService();

// Webhook endpoint to receive forwarded emails
router.post('/webhook', async (req, res) => {
  try {
    console.log('📧 Email webhook received:', {
      headers: req.headers,
      body: req.body
    });

    // Extract email data from webhook payload
    const emailData = this.extractEmailDataFromWebhook(req);
    
    if (!emailData) {
      return res.status(400).json({ message: 'Invalid email data' });
    }

    // Find the user by forwarding email
    const forwarding = await EmailForwarding.findOne({ 
      forwardingEmail: emailData.to,
      isActive: true 
    });

    if (!forwarding) {
      console.log('❌ No active forwarding found for email:', emailData.to);
      return res.status(404).json({ message: 'Forwarding email not found' });
    }

    // Process the incoming email
    await forwarding.processIncomingEmail(emailData);

    // Parse email for expense data
    const expenseData = await emailParsingService.parseEmailForExpense(emailData);
    
    if (!expenseData) {
      console.log('ℹ️ Email does not contain expense information');
      return res.json({ message: 'Email processed but no expense data found' });
    }

    // Create expense entry
    const expense = await createExpenseFromEmailData(expenseData, forwarding.userId, emailData);

    // Update forwarding stats
    forwarding.totalExpensesCreated += 1;
    await forwarding.save();

    console.log('✅ Expense created from email:', {
      expenseId: expense._id,
      userId: forwarding.userId,
      amount: expense.amount,
      vendor: expense.vendor
    });

    res.json({
      message: 'Email processed successfully',
      expenseId: expense._id,
      expense: expense
    });

  } catch (error) {
    console.error('Error processing email webhook:', error);
    res.status(500).json({ 
      message: 'Error processing email',
      error: error.message 
    });
  }
});

// Get user's forwarding email
router.get('/forwarding-email', auth, async (req, res) => {
  try {
    const forwardingEmail = await EmailForwarding.getForwardingEmail(req.user.userId);
    res.json({ forwardingEmail });
  } catch (error) {
    console.error('Error getting forwarding email:', error);
    res.status(500).json({ message: 'Error getting forwarding email' });
  }
});

// Get email forwarding settings
router.get('/settings', auth, async (req, res) => {
  try {
    const forwarding = await EmailForwarding.findOne({ 
      userId: req.user.userId,
      isActive: true 
    });

    if (!forwarding) {
      return res.status(404).json({ message: 'Email forwarding not set up' });
    }

    res.json({
      forwardingEmail: forwarding.forwardingEmail,
      settings: forwarding.settings,
      stats: {
        totalEmailsProcessed: forwarding.totalEmailsProcessed,
        totalExpensesCreated: forwarding.totalExpensesCreated,
        lastEmailReceived: forwarding.lastEmailReceived
      }
    });
  } catch (error) {
    console.error('Error getting email settings:', error);
    res.status(500).json({ message: 'Error getting email settings' });
  }
});

// Update email forwarding settings
router.put('/settings', auth, async (req, res) => {
  try {
    const { settings } = req.body;
    
    const forwarding = await EmailForwarding.findOneAndUpdate(
      { userId: req.user.userId, isActive: true },
      { 
        $set: { 
          'settings': settings 
        } 
      },
      { new: true, upsert: true }
    );

    res.json({
      message: 'Settings updated successfully',
      settings: forwarding.settings
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ message: 'Error updating email settings' });
  }
});

// Manually process an email (for testing)
router.post('/process-email', auth, async (req, res) => {
  try {
    const { subject, text, html, attachments } = req.body;
    
    const emailData = {
      subject,
      text,
      html,
      attachments: attachments || []
    };

    const expenseData = await emailParsingService.parseEmailForExpense(emailData);
    
    if (!expenseData) {
      return res.json({ message: 'No expense data found in email' });
    }

    // Create expense entry
    const expense = await createExpenseFromEmailData(expenseData, req.user.userId, emailData);

    res.json({
      message: 'Email processed successfully',
      expense: expense
    });

  } catch (error) {
    console.error('Error processing email manually:', error);
    res.status(500).json({ 
      message: 'Error processing email',
      error: error.message 
    });
  }
});

// Get expenses created from emails
router.get('/email-expenses', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const expenses = await Expense.find({ 
      userId: req.user.userId,
      source: 'email'
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const total = await Expense.countDocuments({ 
      userId: req.user.userId,
      source: 'email'
    });

    res.json({
      expenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching email expenses:', error);
    res.status(500).json({ message: 'Error fetching email expenses' });
  }
});

// Helper function to extract email data from webhook
function extractEmailDataFromWebhook(req) {
  // This would depend on your email service provider's webhook format
  // For now, we'll assume a simple format
  const { from, to, subject, text, html, attachments } = req.body;
  
  return {
    from,
    to,
    subject,
    text,
    html,
    attachments: attachments || []
  };
}

// Helper function to create expense from email data
async function createExpenseFromEmailData(expenseData, userId, emailData) {
  const expense = new Expense({
    userId,
    amount: expenseData.amount,
    currency: 'INR',
    category: expenseData.category || 'other',
    description: expenseData.description || 'Expense from email',
    vendor: expenseData.vendor || 'Unknown',
    paymentMethod: expenseData.paymentMethod || 'other',
    date: expenseData.date ? new Date(expenseData.date) : new Date(),
    notes: `Source: Email - ${emailData.subject}`,
    source: 'email',
    emailData: {
      subject: emailData.subject,
      from: emailData.from,
      confidence: expenseData.confidence,
      needsManualReview: expenseData.needsManualReview || false
    },
    status: expenseData.needsManualReview ? 'pending' : 'completed'
  });

  await expense.save();
  return expense;
}

module.exports = router;
