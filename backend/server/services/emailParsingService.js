// Optional IMAP dependency - will be used when available
let Imap;
try {
  Imap = require('imap');
} catch (error) {
  console.warn('IMAP module not available:', error.message);
}

const { simpleParser } = require('mailparser');
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

class EmailParsingService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Connect to IMAP server and fetch emails
   */
  async fetchEmails(imapConfig) {
    if (!Imap) {
      throw new Error('IMAP module not available. Email fetching is disabled.');
    }

    return new Promise((resolve, reject) => {
      const imap = new Imap({
        host: imapConfig.host,
        port: imapConfig.port,
        tls: imapConfig.secure,
        user: imapConfig.username,
        password: imapConfig.password
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            reject(err);
            return;
          }

          const emails = [];
          const fetch = imap.seq.fetch('1:*', {
            bodies: '',
            struct: true
          });

          fetch.on('message', (msg, seqno) => {
            let buffer = '';
            
            msg.on('body', (stream) => {
              stream.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
              });
              
              stream.once('end', () => {
                simpleParser(buffer, (err, parsed) => {
                  if (!err) {
                    emails.push(parsed);
                  }
                });
              });
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails);
          });
        });
      });

      imap.once('error', (err) => {
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Parse email content and extract expense information
   */
  async parseEmailForExpense(emailData) {
    try {
      const { subject, text, html, attachments } = emailData;
      
      // Extract text content
      const emailText = text || this.extractTextFromHtml(html) || '';
      
      // Check if email contains expense-related keywords
      const expenseKeywords = [
        'receipt', 'invoice', 'bill', 'payment', 'purchase', 'expense',
        'transaction', 'order', 'refund', 'refunded', 'paid', 'charge',
        'total', 'amount', 'cost', 'price', 'fee', 'subscription',
        'booking', 'reservation', 'ticket', 'delivery', 'shipping',
        'tax', 'gst', 'vat', 'discount', 'coupon', 'promo'
      ];
      
      const hasExpenseKeywords = expenseKeywords.some(keyword => 
        emailText.toLowerCase().includes(keyword) || 
        subject.toLowerCase().includes(keyword)
      );

      if (!hasExpenseKeywords && attachments.length === 0) {
        return null; // Not an expense-related email
      }

      // Prepare content for AI analysis
      let contentToAnalyze = `Subject: ${subject}\n\nContent: ${emailText}`;
      
      // Process attachments if any
      let attachmentData = [];
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (this.isImageOrPdf(attachment.contentType)) {
            const base64Data = attachment.content.toString('base64');
            attachmentData.push({
              filename: attachment.filename,
              contentType: attachment.contentType,
              data: base64Data
            });
          }
        }
      }

      // Use OpenAI to extract expense data
      const extractedData = await this.extractExpenseDataWithAI(contentToAnalyze, attachmentData, emailData);
      
      return {
        ...extractedData,
        source: 'email',
        originalSubject: subject,
        originalText: emailText,
        attachments: attachmentData.map(att => ({
          filename: att.filename,
          contentType: att.contentType
        }))
      };

    } catch (error) {
      console.error('Error parsing email for expense:', error);
      throw error;
    }
  }

  /**
   * Extract text content from HTML
   */
  extractTextFromHtml(html) {
    if (!html) return '';
    
    // Simple HTML tag removal (you might want to use a proper HTML parser)
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if attachment is image or PDF
   */
  isImageOrPdf(contentType) {
    return contentType.startsWith('image/') || contentType === 'application/pdf';
  }

  /**
   * Use OpenAI to extract expense data from email content and attachments
   */
  async extractExpenseDataWithAI(emailContent, attachments = [], emailData = {}) {
    try {
      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this email for expense information and extract the following data in JSON format. This could be from any vendor (Amazon, Uber, Starbucks, restaurants, online stores, etc.) with different email formats:

              {
                "amount": "total amount (number only, null if not found)",
                "description": "brief description of the expense",
                "vendor": "merchant/store name",
                "category": "expense category (food, transportation, housing, utilities, healthcare, entertainment, shopping, education, travel, insurance, taxes, debt, other)",
                "date": "expense date if found (YYYY-MM-DD format, null if not found)",
                "paymentMethod": "payment method if mentioned (cash, credit-card, debit-card, bank-transfer, digital-wallet, other)",
                "confidence": "confidence level (high, medium, low) based on how clear the information is"
              }
              
              Email content:
              ${emailContent}
              
              IMPORTANT INSTRUCTIONS:
              1. Look for amounts in various formats: ₹450, $25.99, USD 50, INR 1000, etc.
              2. Extract vendor names from sender addresses, company names, or merchant mentions
              3. Identify what was purchased from item descriptions, order details, or receipt content
              4. Determine category based on vendor type and purchase items
              5. Look for dates in various formats: "Jan 15, 2024", "15/01/2024", "2024-01-15", etc.
              6. Handle different languages and currencies
              7. If information is unclear or missing, use null for that field
              8. Set confidence to "low" if you're unsure about any extracted data`
            }
          ]
        }
      ];

      // Add attachment images to the analysis if any
      for (const attachment of attachments) {
        if (attachment.contentType.startsWith('image/')) {
          messages[0].content.push({
            type: "image_url",
            image_url: {
              url: `data:${attachment.contentType};base64,${attachment.data}`
            }
          });
        }
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 500
      });

      const analysisText = response.choices[0].message.content;
      
      // Parse JSON response
      let extractedData;
      try {
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          extractedData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError);
        return this.getFallbackExpenseData();
      }

      // Validate and clean the extracted data
      const vendor = extractedData.vendor || this.extractVendorFromEmail(emailData);
      
      return {
        amount: extractedData.amount ? parseFloat(extractedData.amount) : 0,
        description: extractedData.description || 'Expense from email',
        vendor: vendor,
        category: this.validateCategory(extractedData.category),
        date: extractedData.date || null,
        paymentMethod: this.validatePaymentMethod(extractedData.paymentMethod),
        confidence: extractedData.confidence || 'low',
        source: 'email_ai_parsing'
      };

    } catch (error) {
      console.error('Error in AI expense extraction:', error);
      return this.getFallbackExpenseData();
    }
  }

  /**
   * Validate and normalize category
   */
  validateCategory(category) {
    const validCategories = [
      'food', 'transportation', 'housing', 'utilities', 'healthcare', 
      'entertainment', 'shopping', 'education', 'travel', 'insurance', 
      'taxes', 'debt', 'other'
    ];
    
    if (category && validCategories.includes(category.toLowerCase())) {
      return category.toLowerCase();
    }
    return 'other';
  }

  /**
   * Validate and normalize payment method
   */
  validatePaymentMethod(paymentMethod) {
    const validMethods = [
      'cash', 'credit-card', 'debit-card', 'bank-transfer', 
      'digital-wallet', 'other'
    ];
    
    if (paymentMethod && validMethods.includes(paymentMethod.toLowerCase())) {
      return paymentMethod.toLowerCase();
    }
    return 'other';
  }

  /**
   * Get fallback expense data when parsing fails
   */
  getFallbackExpenseData() {
    return {
      amount: 0,
      description: 'Expense from email (parsing failed)',
      vendor: 'Unknown',
      category: 'other',
      date: null,
      paymentMethod: 'other',
      confidence: 'low',
      source: 'email_fallback',
      needsManualReview: true
    };
  }

  /**
   * Extract vendor information from email metadata
   */
  extractVendorFromEmail(emailData) {
    const { from, subject, text } = emailData;
    
    // Common vendor patterns
    const vendorPatterns = [
      { pattern: /amazon/i, vendor: 'Amazon' },
      { pattern: /uber/i, vendor: 'Uber' },
      { pattern: /swiggy/i, vendor: 'Swiggy' },
      { pattern: /zomato/i, vendor: 'Zomato' },
      { pattern: /starbucks/i, vendor: 'Starbucks' },
      { pattern: /mcdonald/i, vendor: 'McDonald\'s' },
      { pattern: /domino/i, vendor: 'Domino\'s' },
      { pattern: /pizza hut/i, vendor: 'Pizza Hut' },
      { pattern: /netflix/i, vendor: 'Netflix' },
      { pattern: /spotify/i, vendor: 'Spotify' },
      { pattern: /google/i, vendor: 'Google' },
      { pattern: /apple/i, vendor: 'Apple' },
      { pattern: /microsoft/i, vendor: 'Microsoft' },
      { pattern: /adobe/i, vendor: 'Adobe' },
      { pattern: /booking/i, vendor: 'Booking.com' },
      { pattern: /airbnb/i, vendor: 'Airbnb' },
      { pattern: /ola/i, vendor: 'Ola' },
      { pattern: /rapido/i, vendor: 'Rapido' }
    ];

    // Check sender email domain
    for (const { pattern, vendor } of vendorPatterns) {
      if (pattern.test(from) || pattern.test(subject) || pattern.test(text)) {
        return vendor;
      }
    }

    // Extract from sender email domain
    if (from && from.includes('@')) {
      const domain = from.split('@')[1];
      const cleanDomain = domain.replace(/\.(com|in|co\.in|org|net)$/, '');
      return cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
    }

    return 'Unknown';
  }

  /**
   * Process email attachments for OCR
   */
  async processAttachmentsForOCR(attachments) {
    const results = [];
    
    for (const attachment of attachments) {
      if (this.isImageOrPdf(attachment.contentType)) {
        try {
          const ocrResult = await this.performOCR(attachment);
          results.push({
            filename: attachment.filename,
            contentType: attachment.contentType,
            ocrData: ocrResult
          });
        } catch (error) {
          console.error(`Error processing attachment ${attachment.filename}:`, error);
        }
      }
    }
    
    return results;
  }

  /**
   * Perform OCR on image/PDF attachment
   */
  async performOCR(attachment) {
    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Extract text content from this image/PDF. Focus on finding amounts, dates, merchant names, and item descriptions."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${attachment.contentType};base64,${attachment.data}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('OCR processing failed:', error);
      return null;
    }
  }
}

module.exports = EmailParsingService;
