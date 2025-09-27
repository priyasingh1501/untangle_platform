#!/bin/bash

# WhatsApp Bot Deployment Script
# This script helps deploy the WhatsApp bot to your server

echo "🚀 Deploying WhatsApp Bot for Untangle Platform"
echo "================================================"

# Check if required environment variables are set
check_env_vars() {
    echo "🔍 Checking environment variables..."
    
    required_vars=(
        "WHATSAPP_PHONE_NUMBER_ID"
        "WHATSAPP_ACCESS_TOKEN"
        "WHATSAPP_VERIFY_TOKEN"
        "OPENAI_API_KEY"
        "MONGODB_URI"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        echo "❌ Missing required environment variables:"
        printf '%s\n' "${missing_vars[@]}"
        echo ""
        echo "Please set these variables in your .env file or environment:"
        echo "WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id"
        echo "WHATSAPP_ACCESS_TOKEN=your_access_token"
        echo "WHATSAPP_VERIFY_TOKEN=your_custom_verify_token"
        echo "OPENAI_API_KEY=your_openai_api_key"
        echo "MONGODB_URI=your_mongodb_connection_string"
        exit 1
    fi
    
    echo "✅ All required environment variables are set"
}

# Install dependencies
install_dependencies() {
    echo "📦 Installing dependencies..."
    
    if [ ! -f "package.json" ]; then
        echo "❌ package.json not found. Please run this script from the backend directory."
        exit 1
    fi
    
    npm install node-fetch form-data
    echo "✅ Dependencies installed"
}

# Test the bot functionality
test_bot() {
    echo "🧪 Testing bot functionality..."
    
    if [ -f "test-whatsapp-bot.js" ]; then
        node test-whatsapp-bot.js
        if [ $? -eq 0 ]; then
            echo "✅ Bot tests passed"
        else
            echo "❌ Bot tests failed"
            exit 1
        fi
    else
        echo "⚠️  Test file not found, skipping tests"
    fi
}

# Check server status
check_server() {
    echo "🔍 Checking server status..."
    
    if pgrep -f "node.*server/index.js" > /dev/null; then
        echo "✅ Server is running"
    else
        echo "⚠️  Server is not running. Please start the server first:"
        echo "   npm start"
        exit 1
    fi
}

# Verify webhook endpoint
verify_webhook() {
    echo "🔗 Verifying webhook endpoint..."
    
    if [ -z "$WHATSAPP_VERIFY_TOKEN" ]; then
        echo "❌ WHATSAPP_VERIFY_TOKEN not set"
        exit 1
    fi
    
    # Test webhook verification
    webhook_url="http://localhost:5002/api/whatsapp/webhook"
    test_url="${webhook_url}?hub.mode=subscribe&hub.verify_token=${WHATSAPP_VERIFY_TOKEN}&hub.challenge=test"
    
    response=$(curl -s "$test_url")
    
    if [ "$response" = "test" ]; then
        echo "✅ Webhook verification successful"
    else
        echo "❌ Webhook verification failed"
        echo "   Response: $response"
        echo "   Make sure the server is running and accessible"
        exit 1
    fi
}

# Display deployment summary
deployment_summary() {
    echo ""
    echo "🎉 WhatsApp Bot Deployment Complete!"
    echo "===================================="
    echo ""
    echo "📋 Next Steps:"
    echo "1. Configure your WhatsApp Business API webhook:"
    echo "   URL: https://your-domain.com/api/whatsapp/webhook"
    echo "   Verify Token: $WHATSAPP_VERIFY_TOKEN"
    echo ""
    echo "2. Subscribe to these webhook fields:"
    echo "   - messages"
    echo "   - message_deliveries"
    echo "   - message_reads"
    echo ""
    echo "3. Test the bot by sending messages to your WhatsApp Business number:"
    echo "   - Expense: '₹450 Uber 2025-09-27'"
    echo "   - Food: 'ate breakfast - toast and eggs'"
    echo "   - Habit: 'meditation done'"
    echo "   - Journal: 'Frustrated at work but I handled it calmly'"
    echo ""
    echo "4. Monitor logs for any issues:"
    echo "   tail -f logs/app.log"
    echo ""
    echo "📚 Documentation:"
    echo "   - Setup Guide: WHATSAPP_SETUP.md"
    echo "   - API Reference: WHATSAPP_BOT_README.md"
    echo ""
    echo "🆘 Support:"
    echo "   - Check server logs for errors"
    echo "   - Verify webhook configuration"
    echo "   - Test with simple messages first"
}

# Main deployment flow
main() {
    check_env_vars
    install_dependencies
    test_bot
    check_server
    verify_webhook
    deployment_summary
}

# Run main function
main "$@"
