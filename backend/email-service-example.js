/**
 * Example email service configuration for different providers
 * This file shows how to configure email forwarding for various providers
 */

// Gmail Configuration
const gmailConfig = {
  provider: 'gmail',
  imap: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD // Use App Password, not regular password
    }
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  }
};

// Outlook/Hotmail Configuration
const outlookConfig = {
  provider: 'outlook',
  imap: {
    host: 'outlook.office365.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASSWORD
    }
  },
  smtp: {
    host: 'smtp-mail.outlook.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.OUTLOOK_USER,
      pass: process.env.OUTLOOK_PASSWORD
    }
  }
};

// Yahoo Configuration
const yahooConfig = {
  provider: 'yahoo',
  imap: {
    host: 'imap.mail.yahoo.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.YAHOO_USER,
      pass: process.env.YAHOO_APP_PASSWORD
    }
  },
  smtp: {
    host: 'smtp.mail.yahoo.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.YAHOO_USER,
      pass: process.env.YAHOO_APP_PASSWORD
    }
  }
};

// Custom IMAP Configuration
const customConfig = {
  provider: 'custom',
  imap: {
    host: process.env.CUSTOM_IMAP_HOST,
    port: parseInt(process.env.CUSTOM_IMAP_PORT) || 993,
    secure: process.env.CUSTOM_IMAP_SECURE === 'true',
    auth: {
      user: process.env.CUSTOM_IMAP_USER,
      pass: process.env.CUSTOM_IMAP_PASS
    }
  }
};

/**
 * Email forwarding setup instructions for different providers
 */
const setupInstructions = {
  gmail: {
    steps: [
      '1. Enable 2-Factor Authentication on your Google account',
      '2. Generate an App Password: Google Account → Security → App passwords',
      '3. Use the App Password (not your regular password) in EMAIL_PASS',
      '4. Set EMAIL_USER to your Gmail address',
      '5. Configure forwarding rules in Gmail to forward receipts to your unique address'
    ],
    forwardingRules: [
      'Create a filter in Gmail:',
      '- From: receipts@* OR subject contains "receipt" OR subject contains "invoice"',
      '- Action: Forward to your unique email address',
      '- Also apply label: "Receipts"'
    ]
  },
  
  outlook: {
    steps: [
      '1. Enable 2-Factor Authentication on your Microsoft account',
      '2. Generate an App Password: Microsoft Account → Security → App passwords',
      '3. Use the App Password in EMAIL_PASS',
      '4. Set EMAIL_USER to your Outlook email address',
      '5. Configure inbox rules to forward receipts'
    ],
    forwardingRules: [
      'Create an inbox rule in Outlook:',
      '- When email arrives from: receipts@*',
      '- Do the following: Forward to your unique email address',
      '- Or when subject contains: "receipt" or "invoice"'
    ]
  },
  
  yahoo: {
    steps: [
      '1. Enable 2-Factor Authentication on your Yahoo account',
      '2. Generate an App Password: Yahoo Account → Security → App passwords',
      '3. Use the App Password in EMAIL_PASS',
      '4. Set EMAIL_USER to your Yahoo email address',
      '5. Configure filters to forward receipts'
    ],
    forwardingRules: [
      'Create a filter in Yahoo Mail:',
      '- From: receipts@* OR subject contains "receipt"',
      '- Action: Forward to your unique email address'
    ]
  }
};

/**
 * Webhook configuration for email services
 */
const webhookConfig = {
  // For services like SendGrid, Mailgun, etc.
  sendgrid: {
    endpoint: '/api/email-expense/webhook',
    verification: 'sendgrid_webhook_verification',
    headers: {
      'X-SendGrid-Event': 'processed',
      'Content-Type': 'application/json'
    }
  },
  
  mailgun: {
    endpoint: '/api/email-expense/webhook',
    verification: 'mailgun_signature_verification',
    headers: {
      'X-Mailgun-Event': 'delivered',
      'Content-Type': 'application/json'
    }
  },
  
  // For custom email forwarding services
  custom: {
    endpoint: '/api/email-expense/webhook',
    verification: 'custom_webhook_verification',
    headers: {
      'X-Custom-Signature': 'your_signature_here',
      'Content-Type': 'application/json'
    }
  }
};

/**
 * Example webhook payload structure
 */
const webhookPayloadExample = {
  from: 'receipts@starbucks.com',
  to: 'user123+abc123@expenses.untangle.app',
  subject: 'Receipt from Starbucks - ₹450',
  text: 'Thank you for your purchase at Starbucks. Amount: ₹450.00. Date: 2024-01-15.',
  html: '<p>Thank you for your purchase at Starbucks. Amount: ₹450.00. Date: 2024-01-15.</p>',
  attachments: [
    {
      filename: 'receipt.pdf',
      contentType: 'application/pdf',
      content: 'base64_encoded_content_here'
    }
  ],
  headers: {
    'Message-ID': '<unique-message-id@starbucks.com>',
    'Date': 'Mon, 15 Jan 2024 10:30:00 +0000'
  }
};

module.exports = {
  gmailConfig,
  outlookConfig,
  yahooConfig,
  customConfig,
  setupInstructions,
  webhookConfig,
  webhookPayloadExample
};
