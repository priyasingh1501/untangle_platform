const Imap = require('imap');
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
        'transaction', 'order', 'refund', 'refunded', 'paid', 'charge'
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
      const extractedData = await this.extractExpenseDataWithAI(contentToAnalyze, attachmentData);
      
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
  async extractExpenseDataWithAI(emailContent, attachments = []) {
    try {
      const messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this email for expense information and extract the following data in JSON format:
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
              
              Focus on finding the total amount, merchant name, and what was purchased. If any field cannot be determined with reasonable confidence, use null.`
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
      return {
        amount: extractedData.amount ? parseFloat(extractedData.amount) : 0,
        description: extractedData.description || 'Expense from email',
        vendor: extractedData.vendor || 'Unknown',
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
