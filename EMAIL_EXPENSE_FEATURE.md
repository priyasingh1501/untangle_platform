# Email-Based Expense Logging Feature

This feature allows users to automatically log expenses by forwarding receipts and invoices to a unique email address. The system uses AI to parse email content and attachments to extract expense information.

## 🚀 Features

### 1. Unique Email Addresses
- Each user gets a unique forwarding email address (e.g., `user123+abc123@expenses.untangle.app`)
- Emails sent to this address are automatically processed and linked to the user's account

### 2. AI-Powered Email Parsing
- Automatically extracts expense details from email content and attachments
- Supports PDF receipts, image attachments, and text-based invoices
- Uses OpenAI's GPT-4 Vision API for advanced parsing

### 3. Smart Expense Detection
- Identifies expense-related emails using keyword detection
- Extracts key information: amount, vendor, date, category, payment method
- Provides confidence levels for parsed data

### 4. Flexible Configuration
- Customizable default categories and payment methods
- Optional manual review for low-confidence extractions
- Notification settings for success/failure alerts

## 📁 File Structure

```
backend/
├── server/
│   ├── models/
│   │   └── EmailForwarding.js          # Email forwarding configuration model
│   ├── services/
│   │   └── emailParsingService.js      # Email parsing and AI extraction service
│   └── routes/
│       └── emailExpense.js             # API endpoints for email expense functionality
└── client/src/components/
    ├── EmailExpenseSettings.jsx        # Settings UI for email forwarding
    └── EmailExpensesList.jsx           # List view for email-created expenses
```

## 🔧 API Endpoints

### Email Forwarding
- `GET /api/email-expense/forwarding-email` - Get user's unique forwarding email
- `GET /api/email-expense/settings` - Get email forwarding settings
- `PUT /api/email-expense/settings` - Update email forwarding settings

### Email Processing
- `POST /api/email-expense/webhook` - Webhook endpoint for receiving emails
- `POST /api/email-expense/process-email` - Manually process an email (for testing)

### Expense Management
- `GET /api/email-expense/email-expenses` - Get expenses created from emails

## 🛠️ Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install imap mailparser
```

### 2. Environment Variables
Add these to your `.env` file:
```env
# OpenAI API Key (required for email parsing)
OPENAI_API_KEY=your_openai_api_key_here

# Email service configuration (optional - for IMAP)
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

### 3. Database Migration
The system automatically creates the `EmailForwarding` collection when first used. No manual migration needed.

## 📧 How It Works

### 1. User Setup
1. User navigates to Finance → Email Expenses tab
2. System generates a unique forwarding email address
3. User copies the email address for forwarding receipts

### 2. Email Processing
1. User forwards receipt/invoice to their unique email address
2. Email service (webhook) receives the forwarded email
3. System extracts email content and attachments
4. AI service analyzes content to extract expense data
5. Expense is created and linked to user's account

### 3. Data Extraction
The AI service extracts:
- **Amount**: Total expense amount
- **Vendor**: Store/merchant name
- **Date**: Transaction date
- **Category**: Expense category (food, transportation, etc.)
- **Payment Method**: How the payment was made
- **Description**: Brief description of the purchase

## 🎯 Usage Examples

### Forwarding a Receipt
```
To: user123+abc123@expenses.untangle.app
Subject: Receipt from Starbucks - ₹450

Thank you for your purchase at Starbucks.
Amount: ₹450.00
Date: 2024-01-15
Payment: Credit Card ending in 1234
```

### Processing PDF Attachments
The system can process PDF receipts and extract text using OCR, then parse the extracted text for expense information.

## ⚙️ Configuration Options

### Auto-Parse Settings
- **Auto-parse emails**: Automatically extract expense data
- **Default category**: Fallback category for unclassified expenses
- **Default payment method**: Fallback payment method
- **Require confirmation**: Review expenses before they're logged

### Notification Settings
- **Success notifications**: Get notified when expenses are logged
- **Failure notifications**: Get notified when parsing fails

## 🔍 Error Handling

### Parsing Failures
- Low-confidence extractions are marked for manual review
- Fallback data is provided when parsing completely fails
- Users can manually edit parsed information

### Email Processing Errors
- Invalid email formats are logged and reported
- Attachment processing errors are handled gracefully
- Network timeouts are retried with exponential backoff

## 🧪 Testing

### Manual Testing
```bash
# Run the test script
cd backend
node test-email-expense.js
```

### Test Scenarios
1. **Basic email parsing**: Text-based receipts
2. **Attachment processing**: PDF and image receipts
3. **Error handling**: Malformed emails and parsing failures
4. **Webhook processing**: End-to-end email processing

## 🔒 Security Considerations

### Email Privacy
- Email content is processed securely and not stored permanently
- Only extracted expense data is saved to the database
- User email addresses are not exposed in logs

### API Security
- All endpoints require authentication
- Webhook endpoints should be secured with proper validation
- Rate limiting should be implemented for webhook endpoints

## 🚀 Future Enhancements

### Planned Features
1. **Multi-language support**: Parse receipts in different languages
2. **Merchant recognition**: Auto-categorize based on merchant patterns
3. **Receipt validation**: Verify receipt authenticity
4. **Bulk processing**: Process multiple receipts in one email
5. **Smart categorization**: Learn from user corrections

### Integration Opportunities
1. **Bank integration**: Connect with bank APIs for transaction matching
2. **Tax preparation**: Export data for tax software
3. **Expense reporting**: Generate reports for business expenses
4. **Mobile app**: Push notifications for new expenses

## 📊 Monitoring and Analytics

### Key Metrics
- Email processing success rate
- Parsing accuracy by confidence level
- User adoption rate
- Processing time per email

### Logging
- All email processing events are logged
- Parsing confidence levels are tracked
- Error rates and types are monitored

## 🤝 Contributing

When contributing to this feature:
1. Follow the existing code structure and patterns
2. Add comprehensive error handling
3. Include tests for new functionality
4. Update documentation for any API changes
5. Consider security implications of changes

## 📞 Support

For issues or questions about the email expense feature:
1. Check the logs for error details
2. Verify OpenAI API key configuration
3. Test with the provided test script
4. Review the API documentation above
