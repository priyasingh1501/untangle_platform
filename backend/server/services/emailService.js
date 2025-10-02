const sgMail = require('@sendgrid/mail');
const EmailParsingService = require('./emailParsingService');
const EmailForwarding = require('../models/EmailForwarding');
const { Expense } = require('../models/Finance');

class EmailService {
  constructor() {
    this.sendgridApiKey = process.env.SENDGRID_API_KEY;
    this.webhookUrl = process.env.WEBHOOK_URL || 'https://your-domain.com/api/email-expense/webhook';
    
    if (this.sendgridApiKey) {
      sgMail.setApiKey(this.sendgridApiKey);
    }
  }

  /**
   * Set up email forwarding for a user
   */
  async setupEmailForwarding(userId) {
    try {
      if (!this.sendgridApiKey) {
        throw new Error('SendGrid API key not configured');
      }

      // Get or create forwarding email
      const forwardingEmail = await EmailForwarding.getForwardingEmail(userId);
      
      // Set up SendGrid inbound parse webhook
      const webhookData = {
        url: this.webhookUrl,
        hostname: 'untangle.app', // Your domain
        spam_check: false,
        send_raw: true
      };

      // This would typically be done through SendGrid dashboard or API
      console.log('📧 Email forwarding setup needed:', {
        userId,
        forwardingEmail,
        webhookUrl: this.webhookUrl,
        instructions: 'Configure SendGrid inbound parse webhook in dashboard'
      });

      return {
        forwardingEmail,
        webhookUrl: this.webhookUrl,
        status: 'pending_setup'
      };

    } catch (error) {
      console.error('Error setting up email forwarding:', error);
      throw error;
    }
  }

  /**
   * Process incoming email from webhook
   */
  async processIncomingEmail(emailData) {
    try {
      console.log('📧 Processing incoming email:', {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject
      });

      // Find the user by forwarding email
      const forwarding = await EmailForwarding.findOne({ 
        forwardingEmail: emailData.to,
        isActive: true 
      });

      if (!forwarding) {
        console.log('❌ No active forwarding found for email:', emailData.to);
        return { success: false, message: 'Forwarding email not found' };
      }

      // Process the incoming email
      await forwarding.processIncomingEmail(emailData);

      // Parse email for expense data
      const emailParsingService = new EmailParsingService();
      const expenseData = await emailParsingService.parseEmailForExpense(emailData);
      
      if (!expenseData) {
        console.log('ℹ️ Email does not contain expense information');
        return { success: true, message: 'Email processed but no expense data found' };
      }

      // Create expense entry
      const expense = await this.createExpenseFromEmailData(expenseData, forwarding.userId, emailData);

      // Update forwarding stats
      forwarding.totalExpensesCreated += 1;
      await forwarding.save();

      console.log('✅ Expense created from email:', {
        expenseId: expense._id,
        userId: forwarding.userId,
        amount: expense.amount,
        vendor: expense.vendor
      });

      return {
        success: true,
        expenseId: expense._id,
        expense: expense
      };

    } catch (error) {
      console.error('Error processing incoming email:', error);
      throw error;
    }
  }

  /**
   * Create expense from email data
   */
  async createExpenseFromEmailData(expenseData, userId, emailData) {
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

  /**
   * Extract email data from webhook payload
   */
  extractEmailDataFromWebhook(req) {
    try {
      // Handle SendGrid webhook format
      if (req.body && req.body.from && req.body.to) {
        return {
          from: req.body.from,
          to: req.body.to,
          subject: req.body.subject || '',
          text: req.body.text || '',
          html: req.body.html || '',
          attachments: req.body.attachments || []
        };
      }

      // Handle generic webhook format
      const { from, to, subject, text, html, attachments } = req.body;
      
      if (!from || !to) {
        return null;
      }

      return {
        from,
        to,
        subject: subject || '',
        text: text || '',
        html: html || '',
        attachments: attachments || []
      };

    } catch (error) {
      console.error('Error extracting email data:', error);
      return null;
    }
  }
}

module.exports = EmailService;
