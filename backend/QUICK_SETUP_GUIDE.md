# 🚀 Quick Setup Guide - WhatsApp Bot

Follow this step-by-step guide to set up your WhatsApp bot for the Untangle platform.

## Prerequisites

Before starting, make sure you have:
- ✅ Node.js and npm installed
- ✅ MongoDB running
- ✅ OpenAI API key
- ✅ A domain/server where you can host the webhook

## Step 1: Environment Configuration

### Option A: Use the Setup Script (Recommended)
```bash
cd backend
node setup-whatsapp-bot.js
```

### Option B: Manual Configuration
Add these variables to your `.env` file:

```env
# WhatsApp Bot Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token_here
WHATSAPP_WEBHOOK_URL=https://your-domain.com/api/whatsapp/webhook

# Make sure you have these existing variables:
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

## Step 2: Set Up WhatsApp Business API

### 2.1 Create Facebook Developer Account
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Sign in with your Facebook account
3. Click "My Apps" → "Create App"
4. Select "Business" as app type
5. Fill in app details and create

### 2.2 Add WhatsApp Product
1. In your app dashboard, click "Add Product"
2. Find "WhatsApp" and click "Set up"
3. Follow the setup wizard

### 2.3 Get Your Credentials
1. **Phone Number ID**: 
   - Go to WhatsApp → API Setup
   - Copy the "Phone number ID" (looks like: 123456789012345)

2. **Access Token**:
   - In the same section, click "Generate Token"
   - Copy the permanent access token (starts with "EAA...")

3. **Verify Token**:
   - Choose any secure string (e.g., "my_secure_verify_token_123")
   - This will be used for webhook verification

### 2.4 Update Your .env File
Replace the placeholder values in your `.env` file with the actual credentials.

## Step 3: Configure Webhook

### 3.1 Get Your Webhook URL
Your webhook URL will be: `https://your-domain.com/api/whatsapp/webhook`

**For local testing:**
- Use ngrok or similar tool to expose your local server
- Example: `https://abc123.ngrok.io/api/whatsapp/webhook`

**For production:**
- Use your actual domain
- Example: `https://untangle-platform.com/api/whatsapp/webhook`

### 3.2 Configure in Facebook Developer Console
1. Go to WhatsApp → Configuration
2. Set **Callback URL** to your webhook URL
3. Set **Verify Token** to match your `WHATSAPP_VERIFY_TOKEN`
4. Click "Verify and Save"

### 3.3 Subscribe to Webhook Fields
Select these fields:
- ✅ `messages`
- ✅ `message_deliveries`
- ✅ `message_reads`

## Step 4: Test the Setup

### 4.1 Test Message Parsing
```bash
cd backend
node test-whatsapp-bot.js
```

### 4.2 Test Webhook Verification
```bash
# Test locally (replace with your actual values)
curl "http://localhost:5002/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test"
```

Expected response: `test`

### 4.3 Start Your Server
```bash
npm start
```

### 4.4 Test with WhatsApp
1. Send a message to your WhatsApp Business number
2. Try these test messages:
   - `₹450 Uber 2025-09-27` (expense)
   - `ate breakfast - toast and eggs` (food)
   - `meditation done` (habit)
   - `Feeling good today` (journal)

## Step 5: Deploy (Production)

### 5.1 Update Webhook URL
Update `WHATSAPP_WEBHOOK_URL` in your `.env` file with your production domain.

### 5.2 Deploy Your Server
Deploy your server to your hosting platform (Railway, Vercel, etc.)

### 5.3 Update Webhook in Facebook Console
Update the webhook URL to your production domain.

### 5.4 Test Production
Send test messages to verify everything works in production.

## Troubleshooting

### Common Issues

**1. Webhook verification fails**
- Check that `WHATSAPP_VERIFY_TOKEN` matches exactly
- Ensure your server is accessible from the internet
- Check server logs for errors

**2. Messages not received**
- Verify webhook URL is correct
- Check that webhook fields are subscribed
- Ensure your server is running and accessible

**3. Parsing errors**
- Check OpenAI API key is set correctly
- Verify message format matches expected patterns
- Check server logs for detailed error messages

**4. Database errors**
- Ensure MongoDB is running and accessible
- Check `MONGODB_URI` is correct
- Verify user creation is working

### Debug Commands

```bash
# Check environment variables
node -e "require('dotenv').config(); console.log('OpenAI Key:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing'); console.log('WhatsApp Token:', process.env.WHATSAPP_ACCESS_TOKEN ? 'Set' : 'Missing');"

# Test webhook locally
curl -X POST http://localhost:5002/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"1234567890","text":{"body":"test message"},"type":"text"}]},"field":"messages"}]}]}'

# Check server logs
tail -f logs/app.log
```

## Quick Test Messages

Once set up, try these messages:

**Expenses:**
- `₹450 Uber 2025-09-27`
- `1200 swiggy`
- `$25.50 Amazon`

**Food:**
- `ate breakfast - toast and eggs`
- `lunch at office canteen`
- `dinner with family`

**Habits:**
- `meditation done`
- `skipped workout`
- `exercise 30 min`

**Journal:**
- `Frustrated at work but I handled it calmly`
- `Grateful for my family today`
- `Had a great day at the beach`

**Commands:**
- `undo` - Remove last entry
- `last expenses` - Show recent expenses
- `weekly summary` - Show weekly summary

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Test with simple messages first
4. Verify all environment variables are set correctly

## Next Steps

Once your bot is working:
1. Customize response messages in `whatsapp-bot-config.js`
2. Add more parsing rules in `messageParsingService.js`
3. Implement additional features like reminders
4. Monitor usage and performance
5. Add analytics and reporting

Happy bot building! 🎉
