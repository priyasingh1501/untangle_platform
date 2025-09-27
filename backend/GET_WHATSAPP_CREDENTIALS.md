# 🔑 How to Get WhatsApp Business API Credentials

Follow this step-by-step guide to get your WhatsApp Business API credentials.

## Step 1: Create Facebook Developer Account

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/
   - Sign in with your Facebook account

2. **Create a New App**
   - Click "My Apps" → "Create App"
   - Select "Business" as the app type
   - Fill in the details:
     - **App Name**: `Untangle WhatsApp Bot`
     - **App Contact Email**: Your email address
     - **Business Account**: Select or create one
   - Click "Create App"

## Step 2: Add WhatsApp Product

1. **In your app dashboard**
   - Click "Add Product"
   - Find "WhatsApp" and click "Set up"
   - You should see the WhatsApp setup page

## Step 3: Get Your Credentials

### Phone Number ID
1. In **WhatsApp → API Setup**
2. Look for "Phone number ID"
3. Copy the ID (looks like: `123456789012345`)

### Access Token
1. In the same section, click "Generate Token"
2. Select "Permanent" token
3. Copy the access token (starts with `EAA...`)

### Verify Token
1. Choose any secure string (e.g., `untangle_verify_123`)
2. This will be used for webhook verification

## Step 4: Update Your .env File

Replace these values in your `.env` file:

```env
WHATSAPP_PHONE_NUMBER_ID=your_actual_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_actual_access_token
WHATSAPP_VERIFY_TOKEN=your_chosen_verify_token
```

## Step 5: Configure Webhook

1. **In WhatsApp → Configuration**
2. Set **Callback URL** to: `https://your-domain.com/api/whatsapp/webhook`
3. Set **Verify Token** to your chosen verify token
4. Click "Verify and Save"

## Step 6: Subscribe to Webhook Fields

In the same Configuration page, check:
- ✅ `messages`
- ✅ `message_deliveries`
- ✅ `message_reads`

Click "Save"

## Step 7: Test Your Setup

1. **Start your server**:
   ```bash
   npm start
   ```

2. **Test webhook verification**:
   ```bash
   curl "http://localhost:5002/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_verify_token&hub.challenge=test"
   ```
   Expected response: `test`

3. **Send test messages** to your WhatsApp Business number:
   - `₹450 Uber 2025-09-27` (expense)
   - `ate breakfast - toast and eggs` (food)
   - `meditation done` (habit)
   - `Feeling good today` (journal)

## Troubleshooting

### Common Issues

**1. Webhook verification fails**
- Check that verify token matches exactly
- Ensure your server is accessible from the internet
- Check server logs for errors

**2. Messages not received**
- Verify webhook URL is correct
- Check that webhook fields are subscribed
- Ensure your server is running

**3. Parsing errors**
- Check OpenAI API key is set correctly
- Verify message format matches expected patterns

### For Local Testing

If you're testing locally, use ngrok to expose your server:

1. **Install ngrok**:
   ```bash
   npm install -g ngrok
   ```

2. **Start your server**:
   ```bash
   npm start
   ```

3. **Expose with ngrok**:
   ```bash
   ngrok http 5002
   ```

4. **Use the ngrok URL** for your webhook:
   - Example: `https://abc123.ngrok.io/api/whatsapp/webhook`

## Quick Test

Once configured, try this quick test:

```bash
# Test webhook verification
curl "http://localhost:5002/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=untangle_whatsapp_verify_123&hub.challenge=test"

# Test message processing
curl -X POST http://localhost:5002/api/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"1234567890","text":{"body":"₹450 Uber"},"type":"text"}]},"field":"messages"}]}]}'
```

## Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error details
3. Test with simple messages first
4. Verify all environment variables are set correctly

Your WhatsApp bot is ready to help users manage their lifestyle data through simple conversations! 🎉
