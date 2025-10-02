#!/bin/bash

echo "🚀 Deploying WhatsApp Bot to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
railway whoami || railway login

# Deploy the backend
echo "📦 Deploying backend service..."
railway up

echo "✅ Deployment complete!"
echo "🔗 Your webhook URL should be: https://untangle-production.up.railway.app/api/whatsapp/webhook"
echo "🔑 Verify token: bahgfcfogiophagedywegdhejjefetjghltgbjvbdhvshfdhgafsjqfk"
echo ""
echo "📋 Next steps:"
echo "1. Go to Facebook Developer Console"
echo "2. Set webhook URL: https://untangle-production.up.railway.app/api/whatsapp/webhook"
echo "3. Set verify token: bahgfcfogiophagedywegdhejjefetjghltgbjvbdhvshfdhgafsjqgk"
echo "4. Subscribe to: messages, message_deliveries, message_reads"
echo "5. Test by sending a message to +15556324225"
