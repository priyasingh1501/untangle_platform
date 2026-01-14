// Optional IMAP dependency - will be used when available
let Imap;
try {
  Imap = require('imap');
} catch (error) {
  console.warn('IMAP module not available:', error.message);
}

const { simpleParser } = require('mailparser');
const { OpenAI } = require('openai');

class EmailParsingService {
  constructor() {
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
      } catch (error) {
        console.warn('OpenAI not available:', error.message);
        this.openai = null;
      }
    } else {
      this.openai = null;
    }
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

      if (!hasExpenseKeywords && (!attachments || attachments.length === 0)) {
        return null; // Not an expense-related email
      }

      // Prepare content for AI analysis
      let contentToAnalyze = `Subject: ${subject}\n\nContent: ${emailText}`;
      
      // Process attachments if any
      let attachmentData = [];
      if (attachments && attachments.length > 0) {
        for (const attachment of attachments) {
          if (this.isImageOrPdf(attachment.contentType)) {
            const base64Data = attachment.content ? attachment.content.toString('base64') : null;
            if (base64Data) {
              attachmentData.push({
                filename: attachment.filename,
                contentType: attachment.contentType,
                data: base64Data
              });
            }
          }
        }
      }

      // Use OpenAI to extract expense data if available, otherwise use fallback
      let extractedData;
      if (this.openai) {
        extractedData = await this.extractExpenseDataWithAI(contentToAnalyze, attachmentData, emailData);
      } else {
        extractedData = this.extractExpenseDataFallback(emailText, subject, emailData);
      }
      
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
      return this.getFallbackExpenseData();
    }
  }

  /**
   * Extract text content from HTML
   */
  extractTextFromHtml(html) {
    if (!html) return '';
    
    // Simple HTML tag removal
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if attachment is image or PDF
   */
  isImageOrPdf(contentType) {
    return contentType && (contentType.startsWith('image/') || contentType === 'application/pdf');
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
              text: `Analyze this email for expense information and extract the following data in JSON format:

              {
                "amount": "total amount (number only, null if not found)",
                "description": "brief description of the expense",
                "vendor": "merchant/store name",
                "category": "expense category (food, transportation, housing, utilities, healthcare, entertainment, shopping, education, travel, insurance, taxes, debt, other)",
                "date": "expense date if found (YYYY-MM-DD format, null if not found)",
                "paymentMethod": "payment method if mentioned (cash, credit-card, debit-card, bank-transfer, digital-wallet, other)",
                "confidence": "confidence level (high, medium, low)"
              }
              
              Email content:
              ${emailContent}
              
              IMPORTANT: Return only valid JSON, no other text.`
            }
          ]
        }
      ];

      // Add attachment images to the analysis if any
      for (const attachment of attachments) {
        if (attachment.contentType && attachment.contentType.startsWith('image/')) {
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
        max_tokens: 500,
        temperature: 0.1
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
        return this.extractExpenseDataFallback(emailContent, emailData.subject || '', emailData);
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
        needsManualReview: extractedData.confidence === 'low'
      };

    } catch (error) {
      console.error('Error in AI expense extraction:', error);
      return this.extractExpenseDataFallback(emailContent, emailData.subject || '', emailData);
    }
  }

  /**
   * Fallback expense extraction using regex patterns
   */
  extractExpenseDataFallback(emailText, subject, emailData) {
    // Extract amount
    const amountRegex = /(?:₹|rs|rupee|inr|usd|\$)\s*(\d+(?:\.\d{2})?)/i;
    const amountMatch = emailText.match(amountRegex) || subject.match(amountRegex);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    // Extract vendor
    const vendor = this.extractVendorFromEmail(emailData);

    // Extract date
    const dateRegex = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/;
    const dateMatch = emailText.match(dateRegex) || subject.match(dateRegex);
    let date = null;
    if (dateMatch) {
      try {
        date = new Date(dateMatch[0]).toISOString().split('T')[0];
      } catch (e) {
        // Invalid date, keep null
      }
    }

    return {
      amount,
      description: subject || 'Expense from email',
      vendor,
      category: 'other',
      date,
      paymentMethod: 'other',
      confidence: amount > 0 ? 'medium' : 'low',
      needsManualReview: amount === 0
    };
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
      needsManualReview: true
    };
  }

  /**
   * Extract vendor information from email metadata
   */
  extractVendorFromEmail(emailData) {
    const { from, subject, text } = emailData;
    const content = `${subject || ''} ${text || ''}`.toLowerCase();
    
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

    // Check sender email domain and content
    for (const { pattern, vendor } of vendorPatterns) {
      if ((from && pattern.test(from)) || pattern.test(subject) || pattern.test(content)) {
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
}

module.exports = EmailParsingService;
