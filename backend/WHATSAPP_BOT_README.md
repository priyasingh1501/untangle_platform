# WhatsApp Bot for Untangle Platform

A comprehensive WhatsApp bot that allows users to log expenses, track food, manage habits, and journal through simple text messages, images, and voice notes.

## Features

### 📱 Multi-Modal Input Support
- **Text Messages**: Natural language processing for all data types
- **Images**: OCR processing for receipt extraction
- **Voice Notes**: Speech-to-text conversion for hands-free logging
- **Documents**: PDF receipt processing (basic support)

### 🤖 Smart Classification
The bot automatically classifies incoming messages into:
- **Expense**: Currency symbols, merchant names, amounts
- **Food**: Meal-related keywords, food platform names
- **Habit**: Goal-oriented phrases, completion status
- **Journal**: Personal thoughts, feelings, experiences

### 💰 Expense Tracking
- **Format**: "₹450 Uber 2025-09-27"
- **Auto-extraction**: Amount, vendor, date, category
- **Receipt OCR**: Extract data from receipt images
- **Categories**: Food, transportation, housing, utilities, etc.

### 🍽️ Food Logging
- **Format**: "ate breakfast - toast and eggs"
- **Meal Types**: Breakfast, lunch, dinner, snack
- **Nutrition**: Calorie estimation, meal quality
- **Platform Integration**: Swiggy, Zomato, etc.

### ✅ Habit Tracking
- **Format**: "meditation done"
- **Status**: Completed, skipped, duration
- **Streak Tracking**: Automatic streak calculation
- **Habit Creation**: Auto-create habits from messages

### 📝 Journaling
- **Format**: Any personal thoughts or experiences
- **Mood Detection**: Automatic mood analysis
- **Sentiment Analysis**: Emotion and topic extraction
- **Privacy**: All entries are private by default

### 🔧 Quick Actions
- **Undo**: "undo" - Remove last entry
- **Queries**: "last expenses", "weekly summary"
- **Inline Editing**: Quick correction suggestions
- **Duplicate Detection**: Prevent duplicate entries

## API Endpoints

### Webhook Verification
```
GET /api/whatsapp/webhook
```
Verifies webhook with WhatsApp Business API.

### Message Processing
```
POST /api/whatsapp/webhook
```
Receives and processes incoming WhatsApp messages.

## Message Examples

### Expense Messages
```
₹450 Uber 2025-09-27
1200 swiggy
$25.50 Amazon
500 rupees ola
```

### Food Messages
```
ate breakfast - toast and eggs
lunch at office canteen
dinner with family
snack - apple and nuts
```

### Habit Messages
```
meditation done
skipped workout
exercise 30 min
reading completed
```

### Journal Messages
```
Frustrated at work but I handled it calmly
Grateful for my family today
Had a great day at the beach
Feeling anxious about the presentation tomorrow
```

### Commands
```
undo
last expenses
weekly summary
```

## Response Examples

### Expense Response
```
💰 Logged expense: ₹450 — Uber — 2025-09-27. Category: Transport. Want to change category? (1) Yes (2) No
```

### Food Response
```
🍽️ Logged food: breakfast - toast and eggs. Edit? [Edit] [OK]
```

### Habit Response
```
✅ Nice — Meditation marked DONE for Sep 27. Streak: 5 days.
```

### Journal Response
```
📝 Saved journal entry. Mood detected: neutral → positive.
```

### Undo Response
```
✅ Removed your most recent expense log. (If that was a mistake, reply 'restore')
```

## Technical Architecture

### Services
- **`messageParsingService.js`**: AI-powered message classification and parsing
- **`dataService.js`**: Database operations and user management
- **`whatsappService.js`**: WhatsApp API integration and media processing

### Models Used
- **Expense**: Financial transactions
- **FoodTracking**: Meal and nutrition data
- **Habit**: Habit tracking and check-ins
- **Journal**: Personal journal entries
- **User**: User management and phone number mapping

### AI Integration
- **OpenAI GPT-3.5-turbo**: Message classification and parsing
- **Fallback Rules**: Simple regex-based parsing when AI fails
- **Confidence Scoring**: Low-confidence parsing triggers clarification

## Setup Instructions

### 1. Environment Variables
```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_VERIFY_TOKEN=your_custom_verify_token
OPENAI_API_KEY=your_openai_api_key
```

### 2. Install Dependencies
```bash
npm install node-fetch form-data
```

### 3. Configure Webhook
- Set webhook URL to: `https://your-domain.com/api/whatsapp/webhook`
- Subscribe to: `messages`, `message_deliveries`, `message_reads`
- Set verify token to match `WHATSAPP_VERIFY_TOKEN`

### 4. Test the Bot
```bash
node test-whatsapp-bot.js
```

## Error Handling

### Graceful Degradation
- AI parsing failures fall back to rule-based parsing
- Media processing errors return helpful error messages
- Database errors are logged and user is notified

### User Feedback
- Clear error messages for parsing failures
- Suggestions for correct message formats
- Confirmation messages for successful operations

## Security Considerations

### Data Protection
- All user data is encrypted in transit
- Phone numbers are hashed for privacy
- Journal entries are private by default

### API Security
- Webhook verification prevents unauthorized access
- Rate limiting prevents abuse
- Access tokens are rotated regularly

## Monitoring and Analytics

### Key Metrics
- Message processing success rate
- Classification accuracy
- User engagement patterns
- Error rates by message type

### Logging
- All incoming messages are logged
- Parsing results are tracked
- Error details are captured for debugging

## Future Enhancements

### Planned Features
- **Two-way Conversations**: Clarification questions for low-confidence parsing
- **Smart Reminders**: Proactive habit and journaling reminders
- **Advanced OCR**: Better receipt processing with multiple languages
- **Voice Commands**: More sophisticated voice processing
- **Analytics Dashboard**: User insights and trends

### Integration Opportunities
- **Calendar Integration**: Schedule-based reminders
- **Health Apps**: Sync with fitness trackers
- **Banking APIs**: Automatic expense categorization
- **AI Coaching**: Personalized lifestyle recommendations

## Troubleshooting

### Common Issues
1. **Webhook verification fails**: Check verify token configuration
2. **Messages not received**: Verify webhook URL and subscriptions
3. **Parsing errors**: Check OpenAI API key and message format
4. **Database errors**: Verify MongoDB connection and user creation

### Debug Mode
Enable detailed logging by setting `NODE_ENV=development` and check server logs for detailed error messages.

## Support

For technical support or feature requests:
1. Check the troubleshooting guide
2. Review server logs for error details
3. Test with simple messages first
4. Verify all environment variables are set correctly
