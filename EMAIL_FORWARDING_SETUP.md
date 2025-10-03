# 📧 Automatic Email Forwarding Setup

This guide explains how to set up **automatic email forwarding** so users can simply forward receipt emails to their unique address and have them automatically appear in the expense tab.

## 🚀 How It Works

1. **User gets unique email**: `user123+abc123@untangle.app`
2. **User forwards receipt**: Any vendor email → `user123+abc123@untangle.app`
3. **Email service receives**: Automatically processes the email
4. **Webhook triggers**: Sends email data to your app
5. **AI parses**: Extracts expense information
6. **Expense created**: Appears in Email Expenses tab

## 🛠️ Setup Options

### Option 1: SendGrid (Recommended)

**Step 1: Get SendGrid Account**
- Sign up at [sendgrid.com](https://sendgrid.com)
- Get your API key from Settings → API Keys

**Step 2: Configure Environment**
```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
WEBHOOK_URL=https://your-domain.com/api/email-expense/webhook
```

**Step 3: Set Up Inbound Parse**
- Go to SendGrid Dashboard → Settings → Inbound Parse
- Add hostname: `untangle.app`
- Set webhook URL: `https://your-domain.com/api/email-expense/webhook`
- Enable "Send Raw Email"

**Step 4: Configure DNS**
- Add MX record: `mx.sendgrid.net` (priority 10)
- Add CNAME record: `untangle.app` → `sendgrid.net`

### Option 2: Mailgun

**Step 1: Get Mailgun Account**
- Sign up at [mailgun.com](https://mailgun.com)
- Get your API key

**Step 2: Configure Environment**
```env
MAILGUN_API_KEY=your_mailgun_api_key_here
MAILGUN_DOMAIN=untangle.app
WEBHOOK_URL=https://your-domain.com/api/email-expense/webhook
```

**Step 3: Set Up Routes**
- Create route: `untangle.app/*` → `https://your-domain.com/api/email-expense/webhook`

### Option 3: AWS SES

**Step 1: Set Up SES**
- Create AWS SES account
- Verify domain `untangle.app`
- Set up Lambda function to process emails

**Step 2: Configure Environment**
```env
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=us-east-1
WEBHOOK_URL=https://your-domain.com/api/email-expense/webhook
```

## 🔧 Implementation

### Frontend Integration

Add a "Set Up Email Forwarding" button in the Email Expenses tab:

```jsx
const setupEmailForwarding = async () => {
  try {
    const response = await fetch('/api/email-expense/setup-forwarding', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    
    if (result.status === 'pending_setup') {
      // Show instructions to user
      showSetupInstructions(result.forwardingEmail, result.webhookUrl);
    }
  } catch (error) {
    console.error('Error setting up email forwarding:', error);
  }
};
```

### Backend Webhook

The webhook endpoint `/api/email-expense/webhook` automatically:
- Receives forwarded emails
- Parses them with AI
- Creates expense entries
- Updates user's expense list

## 📋 Testing

### Test Email Forwarding

1. **Get your forwarding email**: `68de4bce+mg9c1y4cmhhwl2@untangle.app`
2. **Send test email**:
   ```
   To: 68de4bce+mg9c1y4cmhhwl2@untangle.app
   Subject: Receipt from Starbucks - ₹450
   
   Thank you for your purchase at Starbucks.
   Amount: ₹450.00
   Date: 2024-01-15
   Payment: Credit Card ending in 1234
   ```
3. **Check Email Expenses tab** - should appear within seconds

### Test Webhook Directly

```bash
curl -X POST https://your-domain.com/api/email-expense/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "receipts@starbucks.com",
    "to": "68de4bce+mg9c1y4cmhhwl2@untangle.app",
    "subject": "Receipt from Starbucks - ₹450",
    "text": "Thank you for your purchase at Starbucks. Amount: ₹450.00"
  }'
```

## 🎯 User Experience

### For Users:
1. **Go to Finance → Email Expenses**
2. **Copy unique email**: `user123+abc123@untangle.app`
3. **Forward any receipt** to that email
4. **Expense appears automatically** in Email Expenses tab

### For Developers:
- **Webhook receives**: All forwarded emails
- **AI parses**: Extracts amount, vendor, category
- **Database stores**: Expense with correct details
- **Frontend shows**: Real-time updates

## 🔒 Security

- **Webhook validation**: Verify email signatures
- **Rate limiting**: Prevent spam
- **User isolation**: Only process emails for valid users
- **Data privacy**: Don't store email content permanently

## 📊 Monitoring

Track email processing:
- **Emails received**: Total count per user
- **Parsing success rate**: AI accuracy
- **Processing time**: Performance metrics
- **Error logs**: Failed processing attempts

## 🚨 Troubleshooting

### Emails Not Appearing
1. **Check webhook URL**: Ensure it's accessible
2. **Verify DNS**: MX records configured correctly
3. **Check logs**: Look for webhook errors
4. **Test manually**: Use curl to test webhook

### Parsing Failures
1. **Check OpenAI API**: Ensure key is valid
2. **Review email format**: Some vendors use complex formats
3. **Check confidence**: Low confidence = manual review needed

### User Not Seeing Expenses
1. **Check user ID**: Ensure correct user logged in
2. **Check tab**: Look in "Email Expenses" not "Expenses"
3. **Check status**: Pending expenses need approval

## 🎉 Success!

Once set up, users can:
- ✅ Forward any receipt email
- ✅ See expenses appear automatically
- ✅ Have correct amounts and vendors
- ✅ Categorize expenses properly
- ✅ Track all email-based expenses

The system becomes **completely automatic** - just forward emails and expenses appear!


