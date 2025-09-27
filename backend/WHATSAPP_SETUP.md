# WhatsApp Bot Setup Guide

This guide will help you set up the WhatsApp bot for the Untangle platform.

## Prerequisites

1. A Facebook Developer Account
2. A WhatsApp Business Account
3. A webhook URL (your server URL + `/api/whatsapp/webhook`)

## Step 1: Create a WhatsApp Business App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app and select "Business" as the app type
3. Add the "WhatsApp" product to your app
4. Set up your WhatsApp Business Account

## Step 2: Get Your Credentials

1. **Phone Number ID**: Found in your WhatsApp Business API settings
2. **Access Token**: Generate a permanent access token
3. **Verify Token**: Create a custom verification token (you'll use this in your webhook)
4. **Webhook URL**: Your server URL + `/api/whatsapp/webhook`

## Step 3: Configure Environment Variables

Add these variables to your `.env` file:

```env
# WhatsApp Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook
```

## Step 4: Set Up Webhook

1. In your WhatsApp Business API settings, go to "Configuration"
2. Set the webhook URL to: `https://your-domain.com/api/whatsapp/webhook`
3. Set the verify token to the same value as `WHATSAPP_VERIFY_TOKEN`
4. Subscribe to the following webhook fields:
   - `messages`
   - `message_deliveries`
   - `message_reads`

## Step 5: Test the Bot

1. Send a message to your WhatsApp Business number
2. The bot should respond with a confirmation
3. Try different message types:
   - Expense: "₹450 Uber 2025-09-27"
   - Food: "ate breakfast - toast and eggs"
   - Habit: "meditation done"
   - Journal: "Frustrated at work but I handled it calmly"

## Message Types Supported

### Text Messages
- **Expense**: "₹450 Uber 2025-09-27"
- **Food**: "ate breakfast - toast and eggs"
- **Habit**: "meditation done"
- **Journal**: Any personal thoughts or experiences

### Media Messages
- **Images**: Receipt photos for expense extraction
- **Documents**: PDF receipts (basic support)
- **Audio**: Voice notes (converted to text)

### Commands
- **"undo"**: Remove the most recent entry
- **"last expenses"**: Show recent expenses
- **"weekly summary"**: Show weekly summary

## Features

### Auto-Classification
The bot automatically classifies incoming messages based on content:
- Currency symbols → Expense
- Food keywords → Food tracking
- Habit keywords → Habit check-in
- Personal thoughts → Journal entry

### Smart Parsing
- Extracts amounts, vendors, dates from expense messages
- Identifies meal types and food descriptions
- Recognizes habit completion status
- Analyzes mood and sentiment for journal entries

### Quick Actions
- Inline editing suggestions
- Duplicate detection
- Quick queries and summaries
- Undo functionality

## Troubleshooting

### Common Issues

1. **Webhook verification fails**
   - Check that `WHATSAPP_VERIFY_TOKEN` matches your webhook configuration
   - Ensure your server is accessible from the internet

2. **Messages not being received**
   - Verify webhook URL is correct
   - Check that webhook fields are subscribed
   - Ensure your server is running and accessible

3. **Parsing errors**
   - Check OpenAI API key is set correctly
   - Verify message format matches expected patterns
   - Check server logs for detailed error messages

### Testing

Use the webhook verification endpoint to test:
```
GET https://your-domain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test
```

## Security Considerations

1. **Access Token**: Keep your access token secure and rotate it regularly
2. **Webhook Verification**: Always verify webhook requests
3. **Rate Limiting**: Implement rate limiting to prevent abuse
4. **Data Privacy**: Ensure user data is handled according to privacy regulations

## Monitoring

Monitor the following:
- Webhook delivery success rate
- Message processing time
- Error rates and types
- User engagement metrics

## Support

For issues with the WhatsApp bot:
1. Check server logs for error messages
2. Verify webhook configuration
3. Test with simple messages first
4. Check API rate limits and quotas

