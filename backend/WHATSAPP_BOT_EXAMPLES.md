# WhatsApp Bot Usage Examples

This document provides comprehensive examples of how to use the WhatsApp bot for the Untangle platform.

## Getting Started

### 1. Send your first message
Simply send any message to your WhatsApp Business number. The bot will automatically classify and process it.

### 2. Basic commands
- **Help**: Send "help" to see available commands
- **Undo**: Send "undo" to remove your last entry
- **Summary**: Send "last expenses" or "weekly summary" for quick insights

## Expense Tracking Examples

### Text-based Expenses
```
User: ₹450 Uber 2025-09-27
Bot: 💰 Logged expense: ₹450 — Uber — 2025-09-27. Category: Transport. Want to change category? (1) Yes (2) No

User: 1200 swiggy
Bot: 💰 Logged expense: ₹1200 — Swiggy — 2025-01-27. Category: Food. Want to change category? (1) Yes (2) No

User: $25.50 Amazon
Bot: 💰 Logged expense: $25.50 — Amazon — 2025-01-27. Category: Shopping. Want to change category? (1) Yes (2) No
```

### Receipt Image Processing
```
User: [sends receipt photo]
Bot: 📷 Got it — found ₹1,198 at Cafe Aroma on Sep 26. Logged as Food. Edit? [Edit] [OK]
```

### Expense Queries
```
User: last expenses
Bot: 💰 Last 5 expenses:
• ₹450 - Uber (2025-01-27)
• ₹1200 - Swiggy (2025-01-27)
• ₹250 - Metro (2025-01-26)
• ₹800 - Grocery Store (2025-01-26)
• ₹150 - Coffee Shop (2025-01-25)
```

## Food Tracking Examples

### Meal Logging
```
User: ate breakfast - toast and eggs
Bot: 🍽️ Logged food: breakfast - toast and eggs. Edit? [Edit] [OK]

User: lunch at office canteen
Bot: 🍽️ Logged food: lunch - office canteen. Edit? [Edit] [OK]

User: dinner with family
Bot: 🍽️ Logged food: dinner - with family. Edit? [Edit] [OK]

User: snack - apple and nuts
Bot: 🍽️ Logged food: snack - apple and nuts. Edit? [Edit] [OK]
```

### Food Platform Integration
```
User: ordered from swiggy - biryani and raita
Bot: 🍽️ Logged food: dinner - biryani and raita (Swiggy). Edit? [Edit] [OK]

User: zomato lunch - pizza and coke
Bot: 🍽️ Logged food: lunch - pizza and coke (Zomato). Edit? [Edit] [OK]
```

## Habit Tracking Examples

### Habit Check-ins
```
User: meditation done
Bot: ✅ Nice — Meditation marked DONE for Jan 27. Streak: 5 days.

User: skipped workout
Bot: ✅ Nice — Workout marked SKIPPED for Jan 27. Streak: 0 days.

User: exercise 30 min
Bot: ✅ Nice — Exercise marked DONE for Jan 27. Streak: 3 days.

User: reading completed
Bot: ✅ Nice — Reading marked DONE for Jan 27. Streak: 12 days.
```

### Habit Creation
The bot automatically creates new habits when you mention them:
```
User: yoga done
Bot: ✅ Nice — Yoga marked DONE for Jan 27. Streak: 1 days.
(New habit "Yoga" created automatically)
```

## Journaling Examples

### Daily Reflections
```
User: Frustrated at work but I handled it calmly
Bot: 📝 Saved journal entry. Mood detected: neutral → positive.

User: Grateful for my family today
Bot: 📝 Saved journal entry. Mood detected: good.

User: Had a great day at the beach
Bot: 📝 Saved journal entry. Mood detected: excellent.

User: Feeling anxious about the presentation tomorrow
Bot: 📝 Saved journal entry. Mood detected: bad.
```

### Mood Analysis
The bot automatically detects mood from your journal entries:
- **Excellent**: "great", "awesome", "amazing"
- **Good**: "good", "nice", "grateful"
- **Neutral**: "okay", "fine", "normal"
- **Bad**: "bad", "terrible", "awful"
- **Terrible**: "worst", "horrible"

## Voice Message Examples

### Voice Commands
```
User: [sends voice note saying "₹450 Uber ride"]
Bot: 🎤 I heard: "₹450 Uber ride". Let me process that...
Bot: 💰 Logged expense: ₹450 — Uber — 2025-01-27. Category: Transport. Want to change category? (1) Yes (2) No

User: [sends voice note saying "ate breakfast toast and eggs"]
Bot: 🎤 I heard: "ate breakfast toast and eggs". Let me process that...
Bot: 🍽️ Logged food: breakfast - toast and eggs. Edit? [Edit] [OK]
```

## Quick Commands

### Undo Functionality
```
User: undo
Bot: ✅ Removed your most recent expense log. (If that was a mistake, reply 'restore')

User: undo
Bot: ✅ Removed your most recent food log. (If that was a mistake, reply 'restore')
```

### Summary Queries
```
User: last expenses
Bot: 💰 Last 5 expenses:
• ₹450 - Uber (2025-01-27)
• ₹1200 - Swiggy (2025-01-27)
• ₹250 - Metro (2025-01-26)
• ₹800 - Grocery Store (2025-01-26)
• ₹150 - Coffee Shop (2025-01-25)

User: weekly summary
Bot: 📊 Weekly Summary (2025-01-20 - 2025-01-27):
💰 Expenses: 15 transactions, Total: ₹8,450.00
🍽️ Food entries: 21
✅ Habit check-ins: 18

Top categories:
• food: ₹3,200.00
• transportation: ₹2,100.00
• shopping: ₹1,800.00
```

## Advanced Usage

### Multi-line Messages
```
User: Today I:
- Had breakfast at home
- Took Uber to office (₹450)
- Ate lunch at canteen
- Completed my meditation
- Feeling good about the day

Bot: I received multiple entries. Let me process them:
💰 Logged expense: ₹450 — Uber — 2025-01-27. Category: Transport.
🍽️ Logged food: breakfast - at home. Edit? [Edit] [OK]
🍽️ Logged food: lunch - at canteen. Edit? [Edit] [OK]
✅ Nice — Meditation marked DONE for Jan 27. Streak: 5 days.
📝 Saved journal entry. Mood detected: good.
```

### Correction and Editing
```
User: ₹450 Uber 2025-09-27
Bot: 💰 Logged expense: ₹450 — Uber — 2025-09-27. Category: Transport. Want to change category? (1) Yes (2) No

User: 1
Bot: What category would you like? (1) Food (2) Transportation (3) Shopping (4) Other

User: 2
Bot: ✅ Updated category to Transportation. Expense logged successfully.
```

## Error Handling

### Parsing Errors
```
User: random text that doesn't make sense
Bot: I'm not sure what you want to log. Try: "₹450 Uber" for expenses, "ate breakfast" for food, "meditation done" for habits, or just write your thoughts for journaling.

User: 450
Bot: I couldn't parse that expense. Please try again with format: "₹450 Uber 2025-09-27"
```

### Media Processing Errors
```
User: [sends blurry receipt photo]
Bot: I couldn't read the text in this image. Please try again with a clearer receipt.

User: [sends voice note that's too quiet]
Bot: I couldn't understand your voice message. Please try again or send a text message.
```

## Tips for Best Results

### 1. Be Specific
- **Good**: "₹450 Uber to airport"
- **Better**: "₹450 Uber to airport 2025-01-27"

### 2. Use Clear Language
- **Good**: "ate breakfast"
- **Better**: "ate breakfast - toast and eggs"

### 3. Include Context
- **Good**: "meditation done"
- **Better**: "meditation done 20 min"

### 4. Use Natural Language
- **Good**: "expense 450 uber"
- **Better**: "₹450 Uber ride"

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if your phone number is registered
   - Verify webhook configuration
   - Check server logs

2. **Incorrect classification**
   - Be more specific in your message
   - Use keywords that clearly indicate the type
   - Try the fallback format

3. **Parsing errors**
   - Check message format
   - Ensure currency symbols are correct
   - Use standard date formats

4. **Media not processing**
   - Ensure images are clear and well-lit
   - Check file size limits
   - Try text message as fallback

### Getting Help

If you encounter issues:
1. Check the error message from the bot
2. Try a simpler message format
3. Contact support with the error details
4. Check the troubleshooting guide

## Privacy and Security

- All your data is encrypted and secure
- Journal entries are private by default
- Phone numbers are hashed for privacy
- Data is only accessible to you

## Support

For technical support or feature requests:
- Check the troubleshooting guide
- Review error messages carefully
- Test with simple messages first
- Contact support with specific error details
