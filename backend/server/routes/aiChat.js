const express = require('express');
const AiChat = require('../models/AiChat');
const Task = require('../models/Task');
const Journal = require('../models/Journal');
const Expense = require('../models/Finance');
const Schedule = require('../models/TimeManagement');
const ContentCollection = require('../models/Content');

// OpenAI service will be initialized dynamically when needed
let OpenAIService = null;

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const User = require('../models/User');
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Invalid or inactive user' });
    }
    
    console.log('🔍 AI Chat auth - User object:', {
      _id: user._id,
      email: user.email,
      isActive: user.isActive
    });
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Get or create AI chat session
router.get('/session', authenticateToken, async (req, res) => {
  try {
    let aiChat = await AiChat.findOne({ userId: req.user._id });
    
    if (!aiChat) {
      // Create new AI chat session
      const conversationId = `chat_${req.user._id}_${Date.now()}`;
      aiChat = new AiChat({
        userId: req.user._id,
        conversationId,
        messages: [],
        currentSession: {
          startTime: new Date(),
          context: {
            currentGoal: '',
            mood: 'neutral',
            energyLevel: 'medium',
            currentTask: '',
            location: '',
            timeOfDay: getTimeOfDay()
          },
          focusArea: ''
        }
      });
      await aiChat.save();
    } else {
      // Update session start time
      aiChat.currentSession.startTime = new Date();
      aiChat.currentSession.context.timeOfDay = getTimeOfDay();
      await aiChat.save();
    }
    
    res.json({
      conversationId: aiChat.conversationId,
      currentSession: aiChat.currentSession,
      userProfile: aiChat.userProfile,
      assistantConfig: aiChat.assistantConfig,
      recentMessages: aiChat.messages.slice(-10) // Last 10 messages
    });
  } catch (error) {
    console.error('Error getting AI chat session:', error);
    res.status(500).json({ message: 'Error getting AI chat session' });
  }
});

// Send message and get AI response
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Chat endpoint hit with message:', req.body);
    const { message, context } = req.body;
    
    let aiChat = await AiChat.findOne({ userId: req.user._id });
    if (!aiChat) {
      return res.status(404).json({ message: 'AI chat session not found' });
    }
    
    // Add user message
    await aiChat.addMessage('user', message, {
      context: context || aiChat.currentSession.context,
      timestamp: new Date()
    });
    
    // Check if this is a follow-up to a recommendation
    const lastRecommendation = aiChat.currentSession.context?.lastRecommendation;
    let followUpResponse = null;
    
    if (lastRecommendation && lastRecommendation.action === 'waiting_for_confirmation') {
      const lowerMessage = message.toLowerCase();
      
      // Check if user is confirming a recommendation (more flexible matching)
      if (lowerMessage.includes('add') || lowerMessage.includes('yes') || lowerMessage.includes('ok') || lowerMessage.includes('sure')) {
        // Try to extract the specific item name
        let itemName = '';
        if (lowerMessage.includes('arrival')) itemName = 'Arrival';
        else if (lowerMessage.includes('martian')) itemName = 'The Martian';
        else if (lowerMessage.includes('interstellar')) itemName = 'Interstellar';
        else if (lowerMessage.includes('three-body')) itemName = 'The Three-Body Problem';
        else if (lowerMessage.includes('project hail mary')) itemName = 'Project Hail Mary';
        else if (lowerMessage.includes('dune')) itemName = 'Dune';
        else if (lowerMessage.includes('lex fridman')) itemName = 'Lex Fridman Podcast';
        else if (lowerMessage.includes('tim ferriss')) itemName = 'The Tim Ferriss Show';
        else if (lowerMessage.includes('hardcore history')) itemName = 'Hardcore History';
        else itemName = 'the recommendation';
        
        followUpResponse = {
          content: `Perfect! I've added "${itemName}" to your ${lastRecommendation.type === 'movie' ? 'watchlist' : lastRecommendation.type === 'book' ? 'reading list' : 'podcast list'}. You can view it in your Content section.`,
          actions: [{
            type: 'add_content',
            data: { 
              title: itemName,
              type: lastRecommendation.type, 
              action: 'confirmed',
              timestamp: new Date()
            },
            status: 'completed'
          }],
          context: {
            ...aiChat.currentSession.context,
            lastRecommendation: { ...lastRecommendation, action: 'confirmed' }
          }
        };
      } else if (lowerMessage.includes('no') || lowerMessage.includes('else') || lowerMessage.includes('different') || lowerMessage.includes('thanks')) {
        followUpResponse = {
          content: `No problem! Let me suggest something different. What genre or mood are you in the mood for?`,
          actions: [],
          context: {
            ...aiChat.currentSession.context,
            lastRecommendation: undefined
          }
        };
      } else if (lowerMessage.includes('comedy') || lowerMessage.includes('funny') || lowerMessage.includes('light')) {
        followUpResponse = {
          content: `Great choice! Here are some lighter, fun options:\n\n🎬 **Comedy/Sci-Fi Movies:**\n• "The Hitchhiker's Guide to the Galaxy" (2005) - Quirky British humor meets sci-fi\n• "Men in Black" (1997) - Fun alien comedy with Will Smith\n• "Back to the Future" (1985) - Classic time-travel adventure with humor\n\nWould you like me to add any of these?`,
          actions: [],
          context: {
            ...aiChat.currentSession.context,
            lastRecommendation: { type: 'movie', action: 'waiting_for_confirmation' }
          }
        };
      } else if (lowerMessage.includes('non-fiction') || lowerMessage.includes('real') || lowerMessage.includes('factual')) {
        followUpResponse = {
          content: `Perfect! Here are some excellent non-fiction options:\n\n📚 **Non-Fiction Recommendations:**\n• "Sapiens" by Yuval Noah Harari - Fascinating human history\n• "Atomic Habits" by James Clear - Practical habit building\n• "Thinking, Fast and Slow" by Daniel Kahneman - Psychology insights\n\nWould you like me to add any of these?`,
          actions: [],
          context: {
            ...aiChat.currentSession.context,
            lastRecommendation: { type: 'book', action: 'waiting_for_confirmation' }
          }
        };
      }
    }
    
    // Check for expense detection BEFORE generating AI response
    let expenseAcknowledgment = '';
    let expenseActions = [];
    
    // Define userMessage for expense detection
    const userMessage = message.toLowerCase();
    
    // Handle expense tracking (Alfred's Expense Intelligence)
    console.log('🔍 Checking message for expense patterns:', userMessage);
    console.log('🔍 Contains ₹:', userMessage.includes('₹'));
    console.log('🔍 Contains rs:', userMessage.includes('rs'));
    console.log('🔍 Contains rupee:', userMessage.includes('rupee'));
    console.log('🔍 Contains paid:', userMessage.includes('paid'));
    console.log('🔍 Contains spent:', userMessage.includes('spent'));
    console.log('🔍 Contains cost:', userMessage.includes('cost'));
    console.log('🔍 Contains numbers:', /\d+/.test(userMessage));
    
    if (userMessage.includes('₹') || userMessage.includes('rs') || userMessage.includes('rupee') || 
        userMessage.includes('paid') || userMessage.includes('spent') || userMessage.includes('cost') ||
        /\d+/.test(userMessage)) {
      
      console.log('🔍 EXPENSE DETECTED! Processing message:', userMessage);
    
      // Extract expense information from the message
      const expenseData = extractExpenseFromMessage(message, userMessage);
      
      console.log('📊 Extracted expense data:', expenseData);
      
      if (expenseData.amount) {
        console.log('🔍 About to save expense. req.user:', {
          _id: req.user._id,
          email: req.user.email,
          type: typeof req.user._id
        });
        
        // Log the transaction based on type
        try {
          const { Expense, Income } = require('../models/Finance');
        
        if (expenseData.type === 'income') {
          // Handle income
          const income = new Income({
            userId: req.user._id,
            amount: expenseData.amount,
            currency: expenseData.currency || 'INR',
            source: 'other', // Default source
            description: `Income from ${expenseData.merchant} - ${expenseData.notes || 'Logged via AI chat'}`,
            date: expenseData.date || new Date(),
            tags: expenseData.tags,
            notes: expenseData.notes || `Added via AI chat`,
            isRecurring: false
          });
          
          await income.save();
          console.log('✅ Income saved successfully:', {
            id: income._id,
            userId: income.userId,
            amount: income.amount,
            source: income.source,
            description: income.description
          });
          
          // Create acknowledgment message
          expenseAcknowledgment = `\n✅ **Logged ₹${expenseData.amount} income from ${expenseData.merchant}.**`;
          
        } else if (expenseData.type === 'internal') {
          // Handle internal transfers (don't save to database, just track)
          expenseAcknowledgment = `\nℹ️ **Marked as internal transfer; won't affect budget.**`;
          
        } else if (expenseData.type === 'refund') {
          // Handle refunds
          expenseAcknowledgment = `\n🔄 **Refund ₹${expenseData.amount} from ${expenseData.merchant} recorded; excluded from spend.**`;
          
        } else {
          // Handle regular expenses
          const expense = new Expense({
            userId: req.user._id,
            amount: expenseData.amount,
            currency: expenseData.currency || 'INR',
            category: mapCategoryToModel(expenseData.category),
            description: `${expenseData.merchant || 'General expense'} - ${expenseData.notes || 'Expense logged via AI chat'}`,
            vendor: expenseData.merchant || 'General',
            paymentMethod: mapPaymentMethodToModel(expenseData.paidWith),
            date: expenseData.date || new Date(),
            tags: expenseData.tags,
            notes: expenseData.notes || `Added via AI chat. Payment method: ${expenseData.paidWith}`,
            status: 'completed'
          });
          
          await expense.save();
          console.log('✅ Expense saved successfully:', {
            id: expense._id,
            userId: expense.userId,
            amount: expense.amount,
            category: expense.category,
            vendor: expense.vendor
          });
          
          // Format: "Logged ₹420 • Food & Drink • Third Wave (UPI)."
          const categoryDisplay = expenseData.category === 'food-drink' ? 'Food & Drink' : 
                               expenseData.category === 'bills-recharges' ? 'Bills & Recharges' :
                               expenseData.category === 'fees-charges' ? 'Fees & Charges' :
                               expenseData.category === 'gifts-donations' ? 'Gifts & Donations' :
                               expenseData.category === 'fitness-sports' ? 'Fitness & Sports' :
                               expenseData.category.charAt(0).toUpperCase() + expenseData.category.slice(1);
          
          expenseAcknowledgment = `\n✅ **Logged ₹${expenseData.amount} • ${categoryDisplay} • ${expenseData.merchant || 'General'} (${expenseData.paidWith.toUpperCase()}).**`;
        }
        
        // Create an action to track this transaction
        const addExpenseAction = {
          type: 'add_expense',
          data: {
            amount: expenseData.amount,
            currency: expenseData.currency || 'INR',
            category: expenseData.category,
            merchant: expenseData.merchant,
            paidWith: expenseData.paidWith,
            date: expenseData.date || new Date(),
            type: expenseData.type
          },
          status: 'completed'
        };
        
        expenseActions.push(addExpenseAction);
        console.log('✅ Expense action tracked:', addExpenseAction.data);
        
        } catch (error) {
          console.error('❌ Error saving expense:', error);
          expenseAcknowledgment = `\n❌ **Error saving expense: ${error.message}**`;
        }
      }
    }
    
    // Generate AI response (only if no follow-up response)
    // Pass expense context to make AI response aware of what happened
    const expenseContext = expenseAcknowledgment ? { 
      actionPerformed: 'expense_logged',
      expenseData: expenseActions[0]?.data 
    } : null;
    
    const aiResponse = followUpResponse || await generateAIResponse(message, aiChat, req.user, req, expenseContext);
    
    // Enhance AI response with expense acknowledgment if applicable
    let finalResponse = aiResponse.content;
    if (expenseAcknowledgment) {
      finalResponse += expenseAcknowledgment;
    }
    
    // Add AI response
    await aiChat.addMessage('assistant', finalResponse, {
      actions: [...(aiResponse.actions || []), ...expenseActions],
      context: aiResponse.context || aiChat.currentSession.context
    });
    
    // Update session context if provided
    if (aiResponse.context) {
      aiChat.currentSession.context = { ...aiChat.currentSession.context, ...aiResponse.context };
      await aiChat.save();
    }
    
    // Execute actions if any
    if (aiResponse.actions && aiResponse.actions.length > 0) {
      for (const action of aiResponse.actions) {
        await executeAction(action, req.user._id);
      }
    }
    
    const responseData = {
      response: finalResponse,
      actions: [...(aiResponse.actions || []), ...expenseActions],
      context: aiChat.currentSession.context,
      suggestions: aiResponse.suggestions || []
    };
    console.log('🔍 Sending response:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({ message: 'Error processing chat message' });
  }
});

// Get conversation history
router.get('/conversation', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    const aiChat = await AiChat.findOne({ userId: req.user._id });
    if (!aiChat) {
      return res.json({ messages: [], total: 0, page: 1, totalPages: 0 });
    }
    
    const total = aiChat.messages.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (total - (page * limit));
    const endIndex = Math.max(0, startIndex);
    const paginatedMessages = aiChat.messages.slice(endIndex, startIndex + limit).reverse();
    
    res.json({
      messages: paginatedMessages,
      total,
      page: parseInt(page),
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ message: 'Error fetching conversation' });
  }
});

// Update user profile and preferences
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { goals, interests, patterns, contentTaste, preferences } = req.body;
    
    let aiChat = await AiChat.findOne({ userId: req.user._id });
    if (!aiChat) {
      return res.status(404).json({ message: 'AI chat session not found' });
    }
    
    const updates = {};
    if (goals) updates.goals = goals;
    if (interests) updates.interests = interests;
    if (patterns) updates.patterns = patterns;
    if (contentTaste) updates.contentTaste = contentTaste;
    if (preferences) updates.preferences = preferences;
    
    await aiChat.updateUserProfile(updates);
    
    res.json({
      message: 'Profile updated successfully',
      userProfile: aiChat.userProfile
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get AI insights and recommendations
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const aiChat = await AiChat.findOne({ userId: req.user._id });
    if (!aiChat) {
      return res.status(404).json({ message: 'AI chat session not found' });
    }
    
    // Generate personalized insights
    const insights = await generateInsights(aiChat, req.user._id);
    
    res.json({
      insights,
      userProfile: aiChat.userProfile,
      currentSession: aiChat.currentSession
    });
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ message: 'Error fetching insights' });
  }
});

// Get content recommendations based on user profile
router.get('/recommendations', authenticateToken, async (req, res) => {
  try {
    const { type, category, limit = 5 } = req.query;
    
    const aiChat = await AiChat.findOne({ userId: req.user._id });
    if (!aiChat) {
      return res.status(404).json({ message: 'AI chat session not found' });
    }
    
    const recommendations = await generateContentRecommendations(
      aiChat.userProfile,
      type,
      category,
      limit
    );
    
    res.json({
      recommendations,
      userProfile: aiChat.userProfile
    });
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ message: 'Error fetching recommendations' });
  }
});

// Helper function to get time of day
function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

// Alfred's Expense Intelligence - Extract expense data from natural language
function extractExpenseFromMessage(message, userMessage) {
  console.log('🔍 extractExpenseFromMessage called with:', { message, userMessage });
  
  const result = {
    amount: null,
    currency: 'INR',
    category: null,
    merchant: null,
    paidWith: null,
    date: new Date(),
    notes: '',
    tags: [],
    type: 'expense',
    userShare: null,
    needsClarification: false,
    clarificationQuestion: ''
  };
  
  // Extract amount (look for numbers followed by currency symbols or words)
  const amountRegex = /(?:₹|rs|rupee|inr)?\s*(\d+(?:\.\d{2})?)\s*(?:₹|rs|rupee|inr)?/i;
  const amountMatch = userMessage.match(amountRegex);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
  }
  
  // Detect if it's income, transfer, or refund
  if (userMessage.includes('refund')) {
    result.type = 'refund';
  } else if (userMessage.includes('received') || userMessage.includes('got') || userMessage.includes('income') || 
      userMessage.includes('salary') || userMessage.includes('bonus')) {
    result.type = 'income';
  } else if (userMessage.includes('transfer') || userMessage.includes('top-up') || userMessage.includes('recharge') ||
             userMessage.includes('moved') || userMessage.includes('sent to') || userMessage.includes('self')) {
    result.type = 'internal';
  }
  
  // Extract merchant names (improved patterns for India-first examples)
  const merchantPatterns = [
    // Brand names (exact matches)
    /(?:Third Wave|Starbucks|McDonald|KFC|Domino|Pizza Hut|Amazon|Flipkart|Swiggy|Zomato|BigBasket|Blinkit|DMart|Myntra|Nykaa|Ola|Uber|Rapido|IRCTC|Apollo|Fortis|Netflix|Prime|Hotstar|Sony|MakeMyTrip|Goibibo|OYO|Taj|Udemy|Coursera|Skillshare|Airtel|Jio|VI)/i,
    // Coffee shops and restaurants
    /(?:at|from|to|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Coffee|Cafe|Restaurant|Hotel))/i,
    // Generic merchants with context
    /(?:at|from|to|in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    // Landlord, self transfer
    /(?:landlord|self transfer)/i
  ];
  
  for (const pattern of merchantPatterns) {
    const match = userMessage.match(pattern);
    if (match && match[1]) {
      result.merchant = match[1].trim();
      break;
    } else if (match && !match[1]) {
      // Handle exact brand matches
      result.merchant = match[0];
      break;
    }
  }
  
  // Special handling for common patterns
  if (userMessage.includes('Third Wave') || userMessage.includes('third wave')) {
    result.merchant = 'Third Wave Coffee';
  } else if (userMessage.includes('self') && userMessage.includes('transfer')) {
    result.merchant = 'Self transfer';
  } else if (userMessage.includes('landlord')) {
    result.merchant = 'Landlord';
  }
  
  // Fallback: Extract merchant from "for" or "on" patterns (e.g., "spent 30 for icecream")
  if (!result.merchant) {
    const forPattern = /(?:spent|paid|cost|bought)\s+\d+\s+(?:for|on)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i;
    const forMatch = userMessage.match(forPattern);
    if (forMatch && forMatch[1]) {
      result.merchant = forMatch[1].trim();
    }
  }
  
  // Fallback: Extract merchant from "at" patterns (e.g., "spent 30 at store")
  if (!result.merchant) {
    const atPattern = /(?:spent|paid|cost|bought)\s+\d+\s+at\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*)/i;
    const atMatch = userMessage.match(atPattern);
    if (atMatch && atMatch[1]) {
      result.merchant = atMatch[1].trim();
    }
  }
  
  // Infer payment method (India-first)
  if (userMessage.includes('upi') || userMessage.includes('paytm') || userMessage.includes('phonepe') || 
      userMessage.includes('google pay') || userMessage.includes('gpay')) {
    result.paidWith = 'upi';
  } else if (userMessage.includes('card') || userMessage.includes('credit') || userMessage.includes('debit')) {
    result.paidWith = 'card';
  } else if (userMessage.includes('cash')) {
    result.paidWith = 'cash';
  } else if (userMessage.includes('wallet')) {
    result.paidWith = 'wallet';
  } else if (userMessage.includes('bank') || userMessage.includes('transfer') || userMessage.includes('netbanking')) {
    result.paidWith = 'netbanking';
  } else {
    // Default to UPI for India
    result.paidWith = 'upi';
  }
  
  // Infer category from merchant and context
  result.category = inferCategoryFromMerchant(result.merchant, userMessage);
  
  // Handle split bills
  if (userMessage.includes('split') || userMessage.includes('shared')) {
    const splitMatch = userMessage.match(/split\s+(\d+%|\d+)/i);
    if (splitMatch) {
      if (splitMatch[1].includes('%')) {
        const percentage = parseInt(splitMatch[1]);
        result.userShare = (result.amount * percentage) / 100;
        result.notes = `Split bill - ${percentage}% share`;
      } else {
        result.userShare = parseFloat(splitMatch[1]);
        result.notes = `Split bill - ₹${result.userShare} share`;
      }
    }
  }
  
  // Extract additional notes from context
  if (userMessage.includes('coffee') || userMessage.includes('yoga mat') || userMessage.includes('dinner')) {
    result.notes = userMessage.match(/(?:coffee|yoga mat|dinner)/i)[0];
  }
  
  // Add tags based on context
  if (userMessage.includes('coffee')) result.tags.push('coffee');
  if (userMessage.includes('yoga')) result.tags.push('yoga');
  if (userMessage.includes('dinner')) result.tags.push('dinner');
  if (userMessage.includes('rent')) result.tags.push('rent');
  if (userMessage.includes('transfer')) result.tags.push('transfer');
  
  // Determine if clarification is needed
  if (!result.amount) {
    result.needsClarification = true;
    result.clarificationQuestion = 'How much did you spend?';
  } else if (!result.merchant) {
    result.needsClarification = true;
    result.clarificationQuestion = 'Where did you spend this?';
  }
  
  console.log('🔍 extractExpenseFromMessage result:', result);
  return result;
}

// Infer expense category from merchant name and context (India-first taxonomy)
function inferCategoryFromMerchant(merchant, userMessage) {
  if (!merchant) return 'other';
  
  const merchantLower = merchant.toLowerCase();
  const messageLower = userMessage.toLowerCase();
  
  // Food & Drink (cafes, restaurants, Swiggy, Zomato)
  if (merchantLower.includes('coffee') || merchantLower.includes('cafe') || merchantLower.includes('restaurant') ||
      merchantLower.includes('hotel') || merchantLower.includes('food') || merchantLower.includes('pizza') ||
      merchantLower.includes('swiggy') || merchantLower.includes('zomato') || merchantLower.includes('third wave') ||
      messageLower.includes('food') || messageLower.includes('lunch') || messageLower.includes('dinner') ||
      messageLower.includes('breakfast') || messageLower.includes('snack') || messageLower.includes('meal')) {
    return 'food-drink';
  }
  
  // Groceries (BigBasket, Blinkit, DMart)
  if (merchantLower.includes('bigbasket') || merchantLower.includes('blinkit') || merchantLower.includes('dmart') ||
      merchantLower.includes('grocery') || merchantLower.includes('supermarket') || merchantLower.includes('mart') ||
      messageLower.includes('grocery') || messageLower.includes('vegetables') || messageLower.includes('fruits')) {
    return 'groceries';
  }
  
  // Transport (Ola, Uber, Rapido, Metro, fuel)
  if (merchantLower.includes('uber') || merchantLower.includes('ola') || merchantLower.includes('rapido') ||
      merchantLower.includes('metro') || merchantLower.includes('bus') || merchantLower.includes('train') ||
      merchantLower.includes('irctc') || merchantLower.includes('fuel') || merchantLower.includes('petrol') ||
      merchantLower.includes('diesel') || messageLower.includes('travel') || messageLower.includes('commute') ||
      messageLower.includes('ride') || messageLower.includes('cab')) {
    return 'transport';
  }
  
  // Housing (Rent, Maintenance, Utilities: Electricity, Water, Gas)
  if (merchantLower.includes('rent') || merchantLower.includes('maintenance') || merchantLower.includes('electricity') ||
      merchantLower.includes('water') || merchantLower.includes('gas') || merchantLower.includes('society') ||
      messageLower.includes('rent') || messageLower.includes('maintenance') || messageLower.includes('electricity') ||
      messageLower.includes('water') || messageLower.includes('gas')) {
    return 'housing';
  }
  
  // Bills & Recharges (Mobile, DTH, Internet)
  if (merchantLower.includes('mobile') || merchantLower.includes('phone') || merchantLower.includes('dth') ||
      merchantLower.includes('internet') || merchantLower.includes('broadband') || merchantLower.includes('recharge') ||
      merchantLower.includes('airtel') || merchantLower.includes('jio') || merchantLower.includes('vi') ||
      messageLower.includes('bill') || messageLower.includes('recharge') || messageLower.includes('mobile')) {
    return 'bills-recharges';
  }
  
  // Shopping (Amazon, Flipkart, Myntra, Nykaa)
  if (merchantLower.includes('amazon') || merchantLower.includes('flipkart') || merchantLower.includes('myntra') ||
      merchantLower.includes('nykaa') || merchantLower.includes('mall') || merchantLower.includes('store') ||
      merchantLower.includes('shop') || messageLower.includes('bought') || messageLower.includes('purchase') ||
      messageLower.includes('shopping') || messageLower.includes('clothes') || messageLower.includes('electronics')) {
    return 'shopping';
  }
  
  // Health (Pharmacy, Clinics, Labs)
  if (merchantLower.includes('pharmacy') || merchantLower.includes('medical') || merchantLower.includes('doctor') ||
      merchantLower.includes('clinic') || merchantLower.includes('lab') || merchantLower.includes('hospital') ||
      merchantLower.includes('apollo') || merchantLower.includes('fortis') || messageLower.includes('health') ||
      messageLower.includes('medicine') || messageLower.includes('doctor') || messageLower.includes('test')) {
    return 'health';
  }
  
  // Fitness & Sports
  if (merchantLower.includes('gym') || merchantLower.includes('fitness') || merchantLower.includes('sports') ||
      merchantLower.includes('yoga') || merchantLower.includes('pilates') || merchantLower.includes('swimming') ||
      messageLower.includes('fitness') || messageLower.includes('workout') || messageLower.includes('exercise') ||
      messageLower.includes('gym') || messageLower.includes('sports')) {
    return 'fitness-sports';
  }
  
  // Entertainment (Streaming, Movies, Events)
  if (merchantLower.includes('movie') || merchantLower.includes('cinema') || merchantLower.includes('theater') ||
      merchantLower.includes('netflix') || merchantLower.includes('prime') || merchantLower.includes('hotstar') ||
      merchantLower.includes('sony') || merchantLower.includes('event') || messageLower.includes('movie') ||
      messageLower.includes('entertainment') || messageLower.includes('fun') || messageLower.includes('streaming')) {
    return 'entertainment';
  }
  
  // Travel (Flights, Trains/IRCTC, Hotels)
  if (merchantLower.includes('flight') || merchantLower.includes('airline') || merchantLower.includes('hotel') ||
      merchantLower.includes('booking') || merchantLower.includes('makemytrip') || merchantLower.includes('goibibo') ||
      merchantLower.includes('oyo') || merchantLower.includes('taj') || messageLower.includes('flight') ||
      messageLower.includes('hotel') || messageLower.includes('travel') || messageLower.includes('vacation')) {
    return 'travel';
  }
  
  // Education (Courses, Books)
  if (merchantLower.includes('course') || merchantLower.includes('education') || merchantLower.includes('book') ||
      merchantLower.includes('udemy') || merchantLower.includes('coursera') || merchantLower.includes('skillshare') ||
      messageLower.includes('course') || messageLower.includes('education') || messageLower.includes('learning')) {
    return 'education';
  }
  
  // Fees & Charges (Bank fees, convenience fees)
  if (merchantLower.includes('fee') || merchantLower.includes('charge') || merchantLower.includes('convenience') ||
      merchantLower.includes('bank') || merchantLower.includes('atm') || messageLower.includes('fee') ||
      messageLower.includes('charge') || messageLower.includes('bank')) {
    return 'fees-charges';
  }
  
  // Gifts & Donations
  if (merchantLower.includes('gift') || merchantLower.includes('donation') || merchantLower.includes('charity') ||
      messageLower.includes('gift') || messageLower.includes('donation') || messageLower.includes('charity')) {
    return 'gifts-donations';
  }
  
  // Business (Software, SaaS, Work expenses)
  if (merchantLower.includes('software') || merchantLower.includes('saas') || merchantLower.includes('work') ||
      merchantLower.includes('office') || merchantLower.includes('business') || messageLower.includes('work') ||
      messageLower.includes('business') || messageLower.includes('software')) {
    return 'business';
  }
  
  // Default category
  return 'other';
}

// Map Alfred's inferred categories to Finance model categories (India-first taxonomy)
function mapCategoryToModel(alfredCategory) {
  const categoryMap = {
    'food-drink': 'food',
    'groceries': 'food', // Map groceries to food category in Finance model
    'transport': 'transportation',
    'housing': 'housing',
    'bills-recharges': 'utilities',
    'shopping': 'shopping',
    'health': 'healthcare',
    'fitness-sports': 'healthcare', // Map fitness to healthcare in Finance model
    'entertainment': 'entertainment',
    'travel': 'travel',
    'education': 'education',
    'fees-charges': 'other',
    'gifts-donations': 'other',
    'business': 'other',
    'other': 'other'
  };
  return categoryMap[alfredCategory] || 'other';
}

// Map Alfred's payment methods to Finance model payment methods
function mapPaymentMethodToModel(alfredPaymentMethod) {
  const paymentMap = {
    'upi': 'digital-wallet',
    'card': 'credit-card',
    'cash': 'cash',
    'wallet': 'digital-wallet',
    'netbanking': 'bank-transfer'
  };
  return paymentMap[alfredPaymentMethod] || 'other';
}

// AI Response Generation using OpenAI or fallback
async function generateAIResponse(message, aiChat, user, req, expenseContext = null) {
  console.log('generateAIResponse called with message:', message);
  console.log('OpenAI API Key available:', !!process.env.OPENAI_API_KEY);
  
  // If this is an expense context, return a focused expense response
  if (expenseContext && expenseContext.actionPerformed === 'expense_logged') {
    console.log('🔍 Expense context detected, returning focused response');
    return {
      content: "I've tracked that expense for you.",
      actions: [{
        type: 'add_expense',
        data: expenseContext.expenseData,
        status: 'completed'
      }],
      context: aiChat.currentSession.context,
      suggestions: []
    };
  }
  
  // Initialize OpenAI service if not already done and API key is available
  if (!OpenAIService && process.env.OPENAI_API_KEY) {
    try {
      OpenAIService = require('../services/openaiService');
      console.log('OpenAI service loaded successfully');
    } catch (error) {
      console.log('OpenAI service not available, using fallback responses:', error.message);
      OpenAIService = null;
    }
  }
  
  // Try to use OpenAI service if available
  if (OpenAIService && process.env.OPENAI_API_KEY) {
    console.log('Attempting to use OpenAI service...');
    try {
      const openaiService = new OpenAIService();
      const aiResponse = await openaiService.generateResponse(
        message, 
        aiChat.currentSession.context, 
        aiChat.userProfile
      );
      
      console.log('OpenAI response received:', aiResponse);
      
      // Map OpenAI action types to database schema types and enhance content
      let mappedActions = (aiResponse.actions || []).map(action => {
        let mappedType = action.type;
        
        // Map OpenAI tool names to database action types
        switch (action.type) {
          case 'recommend_content':
            mappedType = 'add_content';
            break;
          case 'set_goal':
            mappedType = 'update_goal';
            break;
          case 'provide_insight':
            mappedType = 'create_reminder';
            break;
          default:
            // Keep the original type if it matches our schema
            break;
        }
        
        return {
          ...action,
          type: mappedType
        };
      });

      // If the AI used recommend_content tool, ALWAYS generate actual recommendations
      let enhancedContent = aiResponse.content;
      const recommendAction = aiResponse.actions?.find(a => a.type === 'recommend_content');
      let contentType = 'movie'; // Default to movie if not specified
      
      if (recommendAction && recommendAction.data) {
        const contentData = recommendAction.data;
        contentType = contentData.type || 'movie';
      }
      
      // Always show recommendations if the user asked for them
      const userMessage = message.toLowerCase();
      if (userMessage.includes('movie') || userMessage.includes('film') || userMessage.includes('watch') || 
          userMessage.includes('recommend') || userMessage.includes('suggest') || contentType === 'movie') {
        
        enhancedContent = `🎬 **Movie Recommendations (Alfred's Picks):**\n\n`;
        
        // Analyze user message for context and preferences
        const isComedy = userMessage.includes('comedy') || userMessage.includes('funny') || userMessage.includes('light') || userMessage.includes('feel good');
        const isAction = userMessage.includes('action') || userMessage.includes('thriller') || userMessage.includes('intense') || userMessage.includes('exciting');
        const isSmart = userMessage.includes('smart') || userMessage.includes('intelligent') || userMessage.includes('thought') || userMessage.includes('complex');
        const isShort = userMessage.includes('short') || userMessage.includes('quick') || userMessage.includes('under 120') || userMessage.includes('90 min');
        const isLong = userMessage.includes('long') || userMessage.includes('epic') || userMessage.includes('series') || userMessage.includes('binge');
        const isHindi = userMessage.includes('hindi') || userMessage.includes('bollywood') || userMessage.includes('indian');
        const isKorean = userMessage.includes('korean') || userMessage.includes('k-drama') || userMessage.includes('korea');
        const isSciFi = userMessage.includes('sci-fi') || userMessage.includes('scifi') || userMessage.includes('space') || userMessage.includes('future');
        const isDrama = userMessage.includes('drama') || userMessage.includes('emotional') || userMessage.includes('character');
        
        // Generate context-aware recommendations
        if (isComedy) {
          enhancedContent += `🎯 **Bullseye for tonight:** "The Hitchhiker's Guide to the Galaxy" (2005) — Quirky British humor meets sci-fi\n`;
          enhancedContent += `   Why you'll vibe: Light-hearted adventure + clever wordplay\n`;
          enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
          enhancedContent += `🔥 **Strong:** "Men in Black" (1997) — Fun alien comedy with Will Smith\n`;
          enhancedContent += `   Why you'll vibe: Action + humor + memorable characters\n`;
          enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
          enhancedContent += `🔥 **Strong:** "Back to the Future" (1985) — Classic time-travel adventure with humor\n`;
          enhancedContent += `   Why you'll vibe: Nostalgic fun + clever plot + great chemistry\n`;
          enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
          enhancedContent += `🔄 **Adjacent:** "Shaun of the Dead" (2004) — Horror-comedy with heart\n`;
          enhancedContent += `   Why you'll vibe: British wit + zombie fun + character development\n`;
          enhancedContent += `   Flags: Violence (comic) | Adjacency: Adjacent\n\n`;
          enhancedContent += `🎲 **Wild-card:** "The Grand Budapest Hotel" (2014) — Wes Anderson whimsy\n`;
          enhancedContent += `   Why you'll vibe: Visual charm + quirky humor + ensemble cast\n`;
          enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
        } else if (isAction) {
          enhancedContent += `🎯 **Bullseye for tonight:** "Mad Max: Fury Road" (2015) — Relentless action spectacle\n`;
          enhancedContent += `   Why you'll vibe: Non-stop intensity + stunning practical effects\n`;
          enhancedContent += `   Flags: Violence | Adjacency: Bullseye\n\n`;
          enhancedContent += `🔥 **Strong:** "John Wick" (2014) — Stylish revenge action\n`;
          enhancedContent += `   Why you'll vibe: Clean choreography + world-building + Keanu Reeves\n`;
          enhancedContent += `   Flags: Violence | Adjacency: Strong\n\n`;
          enhancedContent += `🔥 **Strong:** "Mission: Impossible - Fallout" (2018) — Peak Tom Cruise action\n`;
          enhancedContent += `   Why you'll vibe: Real stunts + globe-trotting + intense sequences\n`;
          enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
          enhancedContent += `🔄 **Adjacent:** "The Raid" (2011) — Indonesian martial arts masterpiece\n`;
          enhancedContent += `   Why you'll vibe: Relentless action + incredible choreography\n`;
          enhancedContent += `   Flags: Violence | Adjacency: Adjacent\n\n`;
          enhancedContent += `🎲 **Wild-card:** "Upgrade" (2018) — Sci-fi action with body horror\n`;
          enhancedContent += `   Why you'll vibe: Unique premise + Logan Marshall-Green performance\n`;
          enhancedContent += `   Flags: Violence, body horror | Adjacency: Wild-card\n`;
        } else if (isSmart) {
          enhancedContent += `🎯 **Bullseye for tonight:** "Primer" (2004) — Complex time-travel puzzle\n`;
          enhancedContent += `   Why you'll vibe: Intellectual challenge + realistic science + mind-bending plot\n`;
          enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
          enhancedContent += `🔥 **Strong:** "Coherence" (2013) — Quantum physics meets dinner party\n`;
          enhancedContent += `   Why you'll vibe: Smart sci-fi + character drama + reality-bending\n`;
          enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
          enhancedContent += `🔥 **Strong:** "The Prestige" (2006) — Magician rivalry with twists\n`;
          enhancedContent += `   Why you'll vibe: Christopher Nolan + complex narrative + period setting\n`;
          enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
          enhancedContent += `🔄 **Adjacent:** "Memento" (2000) — Reverse chronological mystery\n`;
          enhancedContent += `   Why you'll vibe: Innovative structure + Guy Pearce + psychological depth\n`;
          enhancedContent += `   Flags: Violence | Adjacency: Adjacent\n\n`;
          enhancedContent += `🎲 **Wild-card:** "Triangle" (2009) — Time loop horror-thriller\n`;
          enhancedContent += `   Why you'll vibe: Clever premise + psychological horror + Melissa George\n`;
          enhancedContent += `   Flags: Violence, horror | Adjacency: Wild-card\n`;
        } else if (isHindi) {
          enhancedContent += `🎯 **Bullseye for tonight:** "Andhadhun" (2018) — Blind pianist thriller\n`;
          enhancedContent += `   Why you'll vibe: Smart twists + Ayushmann Khurrana + dark humor\n`;
          enhancedContent += `   Flags: Violence | Adjacency: Bullseye\n\n`;
          enhancedContent += `🔥 **Strong:** "Tumbbad" (2018) — Folk horror with stunning visuals\n`;
          enhancedContent += `   Why you'll vibe: Unique mythology + atmospheric horror + period setting\n`;
          enhancedContent += `   Flags: Horror, violence | Adjacency: Strong\n\n`;
          enhancedContent += `🔥 **Strong:** "Gangs of Wasseypur" (2012) — Epic crime saga\n`;
          enhancedContent += `   Why you'll vibe: Anurag Kashyap + complex narrative + authentic dialogue\n`;
          enhancedContent += `   Flags: Violence, language | Adjacency: Strong\n\n`;
          enhancedContent += `🔄 **Adjacent:** "Ugly" (2013) — Psychological thriller\n`;
          enhancedContent += `   Why you'll vibe: Dark character study + Rashomon-style narrative\n`;
          enhancedContent += `   Flags: Violence, disturbing content | Adjacency: Adjacent\n\n`;
          enhancedContent += `🎲 **Wild-card:** "Ship of Theseus" (2012) — Philosophical art film\n`;
          enhancedContent += `   Why you'll vibe: Thought-provoking + beautiful cinematography + Anand Gandhi\n`;
          enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
        } else if (isKorean) {
          enhancedContent += `🎯 **Bullseye for tonight:** "Parasite" (2019) — Social satire thriller\n`;
          enhancedContent += `   Why you'll vibe: Bong Joon-ho + class commentary + perfect execution\n`;
          enhancedContent += `   Flags: Violence, dark themes | Adjacency: Bullseye\n\n`;
          enhancedContent += `🔥 **Strong:** "Oldboy" (2003) — Revenge thriller masterpiece\n`;
          enhancedContent += `   Why you'll vibe: Park Chan-wook + shocking twists + Choi Min-sik\n`;
          enhancedContent += `   Flags: Extreme violence, disturbing content | Adjacency: Strong\n\n`;
          enhancedContent += `🔥 **Strong:** "The Handmaiden" (2016) — Erotic thriller with twists\n`;
          enhancedContent += `   Why you'll vibe: Beautiful cinematography + complex plot + Kim Tae-ri\n`;
          enhancedContent += `   Flags: Sexual content, violence | Adjacency: Strong\n\n`;
          enhancedContent += `🔄 **Adjacent:** "Memories of Murder" (2003) — Serial killer procedural\n`;
          enhancedContent += `   Why you'll vibe: Song Kang-ho + true crime + Bong Joon-ho\n`;
          enhancedContent += `   Flags: Violence, disturbing content | Adjacency: Adjacent\n\n`;
          enhancedContent += `🎲 **Wild-card:** "Burning" (2018) — Slow-burn mystery\n`;
          enhancedContent += `   Why you'll vibe: Lee Chang-dong + atmospheric tension + Yoo Ah-in\n`;
          enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
        } else if (isShort) {
          enhancedContent += `🎯 **Bullseye for tonight:** "Run Lola Run" (1998) — 81-minute adrenaline rush\n`;
          enhancedContent += `   Why you'll vibe: Fast-paced + innovative structure + Franka Potente\n`;
          enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
          enhancedContent += `🔥 **Strong:** "Phone Booth" (2002) — 81-minute real-time thriller\n`;
          enhancedContent += `   Why you'll vibe: Colin Farrell + Hitchcockian tension + single location\n`;
          enhancedContent += `   Flags: Violence, language | Adjacency: Strong\n\n`;
          enhancedContent += `🔥 **Strong:** "Locke" (2013) — 85-minute car ride drama\n`;
          enhancedContent += `   Why you'll vibe: Tom Hardy + single location + character study\n`;
          enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
          enhancedContent += `🔄 **Adjacent:** "Buried" (2010) — 95-minute coffin thriller\n`;
          enhancedContent += `   Why you'll vibe: Ryan Reynolds + claustrophobic tension + real-time\n`;
          enhancedContent += `   Flags: Claustrophobia, violence | Adjacency: Adjacent\n\n`;
          enhancedContent += `🎲 **Wild-card:** "The One I Love" (2014) — 91-minute relationship sci-fi\n`;
          enhancedContent += `   Why you'll vibe: Mark Duplass + Elisabeth Moss + unique premise\n`;
          enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
        } else {
          // Default sci-fi recommendations (original logic)
          const conversationCount = aiChat.currentSession.context?.conversationHistory?.length || 0;
          const recommendationSet = Math.floor(conversationCount / 3) % 3;
          
          if (recommendationSet === 0) {
            enhancedContent += `🎯 **Bullseye for tonight:** "Arrival" (2016) — Thought-provoking sci-fi about communication\n`;
            enhancedContent += `   Why you'll vibe: Intelligent storytelling + emotional depth\n`;
            enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
            enhancedContent += `🔥 **Strong:** "The Martian" (2015) — Inspiring space survival story\n`;
            enhancedContent += `   Why you'll vibe: Problem-solving focus + scientific accuracy\n`;
            enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
            enhancedContent += `🔥 **Strong:** "Interstellar" (2014) — Mind-bending space journey\n`;
            enhancedContent += `   Why you'll vibe: Complex concepts + emotional family story\n`;
            enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
            enhancedContent += `🔄 **Adjacent:** "Blade Runner 2049" (2017) — Stunning neo-noir sci-fi\n`;
            enhancedContent += `   Why you'll vibe: Visual storytelling + philosophical themes\n`;
            enhancedContent += `   Flags: None | Adjacency: Adjacent\n\n`;
            enhancedContent += `🎲 **Wild-card:** "Ex Machina" (2014) — AI thriller with depth\n`;
            enhancedContent += `   Why you'll vibe: Intimate scale + ethical questions\n`;
            enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
          } else if (recommendationSet === 1) {
            enhancedContent += `🎯 **Bullseye for tonight:** "Inception" (2010) — Mind-bending dream exploration\n`;
            enhancedContent += `   Why you'll vibe: Complex narrative + stunning visuals\n`;
            enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
            enhancedContent += `🔥 **Strong:** "The Matrix" (1999) — Revolutionary sci-fi action\n`;
            enhancedContent += `   Why you'll vibe: Philosophical depth + groundbreaking effects\n`;
            enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
            enhancedContent += `🔥 **Strong:** "Her" (2013) — Beautiful AI-human connection story\n`;
            enhancedContent += `   Why you'll vibe: Emotional intelligence + near-future setting\n`;
            enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
            enhancedContent += `🔄 **Adjacent:** "Gravity" (2013) — Intense space survival\n`;
            enhancedContent += `   Why you'll vibe: Technical achievement + human resilience\n`;
            enhancedContent += `   Flags: None | Adjacency: Adjacent\n\n`;
            enhancedContent += `🎲 **Wild-card:** "Looper" (2012) — Time-travel action thriller\n`;
            enhancedContent += `   Why you'll vibe: Unique premise + Bruce Willis performance\n`;
            enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
          } else {
            enhancedContent += `🎯 **Bullseye for tonight:** "Edge of Tomorrow" (2014) — Groundhog Day meets sci-fi\n`;
            enhancedContent += `   Why you'll vibe: Clever premise + Tom Cruise action\n`;
            enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
            enhancedContent += `🔥 **Strong:** "Minority Report" (2002) — Pre-crime thriller\n`;
            enhancedContent += `   Why you'll vibe: Spielberg + Cruise + futuristic concepts\n`;
            enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
            enhancedContent += `🔥 **Strong:** "District 9" (2009) — Alien apartheid story\n`;
            enhancedContent += `   Why you'll vibe: Social commentary + innovative storytelling\n`;
            enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
            enhancedContent += `🔄 **Adjacent:** "Children of Men" (2006) — Dystopian future\n`;
            enhancedContent += `   Why you'll vibe: Hope in darkness + technical achievement\n`;
            enhancedContent += `   Flags: None | Adjacency: Adjacent\n\n`;
            enhancedContent += `🎲 **Wild-card:** "Moon" (2009) — Claustrophobic space mystery\n`;
            enhancedContent += `   Why you'll vibe: Sam Rockwell + psychological depth\n`;
            enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
          }
        }
        
        enhancedContent += `\n💡 **Quick Actions:**\n`;
        enhancedContent += `• "add Arrival" or "add to watchlist"\n`;
        enhancedContent += `• "I'm in the mood for comedy" or "show me action movies"\n`;
        enhancedContent += `• "more like #2" or "less like #4" for feedback\n`;
        enhancedContent += `• "Hindi/Korean only" or "under 120 minutes"`;
        
      } else if (userMessage.includes('book') || userMessage.includes('read') || contentType === 'book') {
        enhancedContent = `📚 **Book Recommendations (Alfred's Picks):**\n\n`;
        enhancedContent += `🎯 **Bullseye for tonight:** "The Three-Body Problem" — Hard sci-fi with complex ideas\n`;
        enhancedContent += `   Why you'll vibe: Challenging concepts + scientific accuracy\n`;
        enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
        enhancedContent += `🔥 **Strong:** "Project Hail Mary" — Space adventure with problem-solving\n`;
        enhancedContent += `   Why you'll vibe: Andy Weir's accessible science + survival story\n`;
        enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
        enhancedContent += `🔥 **Strong:** "Dune" — Epic sci-fi world-building\n`;
        enhancedContent += `   Why you'll vibe: Complex politics + desert planet setting\n`;
        enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
        enhancedContent += `🔄 **Adjacent:** "Neuromancer" — Cyberpunk classic\n`;
        enhancedContent += `   Why you'll vibe: Influential genre-defining work + tech themes\n`;
        enhancedContent += `   Flags: None | Adjacency: Adjacent\n\n`;
        enhancedContent += `🎲 **Wild-card:** "Snow Crash" — Fast-paced cyberpunk adventure\n`;
        enhancedContent += `   Why you'll vibe: Neal Stephenson's wit + action-packed narrative\n`;
        enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
        enhancedContent += `\n💡 Say "add [book]" or "I prefer non-fiction"`;
        
      } else if (userMessage.includes('podcast') || userMessage.includes('audio') || contentType === 'podcast') {
        enhancedContent = `🎧 **Podcast Recommendations (Alfred's Picks):**\n\n`;
        enhancedContent += `🎯 **Bullseye for tonight:** "Lex Fridman Podcast" — Deep AI/science conversations\n`;
        enhancedContent += `   Why you'll vibe: Cutting-edge technology + long-form content\n`;
        enhancedContent += `   Flags: None | Adjacency: Bullseye\n\n`;
        enhancedContent += `🔥 **Strong:** "The Tim Ferriss Show" — Life optimization\n`;
        enhancedContent += `   Why you'll vibe: Productivity focus + diverse guest expertise\n`;
        enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
        enhancedContent += `🔥 **Strong:** "Hardcore History" — Historical deep-dives\n`;
        enhancedContent += `   Why you'll vibe: Complex narratives + engaging storytelling\n`;
        enhancedContent += `   Flags: None | Adjacency: Strong\n\n`;
        enhancedContent += `🔄 **Adjacent:** "The Joe Rogan Experience" — Long-form conversations\n`;
        enhancedContent += `   Why you'll vibe: Diverse topics + unfiltered discussions\n`;
        enhancedContent += `   Flags: None | Adjacency: Adjacent\n\n`;
        enhancedContent += `🎲 **Wild-card:** "Stuff You Should Know" — Educational content\n`;
        enhancedContent += `   Why you'll vibe: Bite-sized learning + wide topic range\n`;
        enhancedContent += `   Flags: None | Adjacency: Wild-card\n`;
        enhancedContent += `\n💡 Say "add [podcast]" or "I want something shorter"`;
      }
      
      // Handle Alfred-style action patterns
      if (userMessage.includes('block') && (userMessage.includes('pm') || userMessage.includes('am'))) {
        enhancedContent += `\n⏰ I'll block that time for you. What should I call this block?`;
      } else if (userMessage.includes('add') && (userMessage.includes('grocery') || userMessage.includes('food'))) {
        enhancedContent += `\n🛒 I'll add those items to your grocery list.`;
      } else if (userMessage.includes('workout') || userMessage.includes('exercise')) {
        enhancedContent += `\n💪 I'll log your workout session.`;
      } else if (userMessage.includes('log') && (userMessage.includes('ate') || userMessage.includes('dinner') || userMessage.includes('lunch'))) {
        enhancedContent += `\n🍽️ I'll log your meal.`;
      } else if (userMessage.includes('check in') || userMessage.includes('habit')) {
        enhancedContent += `\n✅ I'll check you in for that habit.`;
      } else if (userMessage.includes('save') && userMessage.includes('document')) {
        enhancedContent += `\n📄 I'll save that document for you.`;
      }
      
              // Expense tracking is now handled BEFORE AI response generation
      
      // Handle adding movies to watchlist
      if (userMessage.includes('add') && (userMessage.includes('movie') || userMessage.includes('film') || userMessage.includes('watch'))) {
        // Extract movie name from the message
        let movieName = '';
        const addIndex = userMessage.indexOf('add');
        if (addIndex !== -1) {
          const afterAdd = userMessage.substring(addIndex + 3).trim();
          // Find the first movie name that matches
          const movieNames = [
            'arrival', 'the martian', 'interstellar', 'blade runner 2049', 'ex machina',
            'inception', 'the matrix', 'her', 'gravity', 'looper',
            'edge of tomorrow', 'minority report', 'district 9', 'children of men', 'moon',
            'hitchhiker', 'men in black', 'back to the future', 'shaun of the dead', 'grand budapest hotel',
            'mad max', 'john wick', 'mission impossible', 'the raid', 'upgrade',
            'primer', 'coherence', 'the prestige', 'memento', 'triangle',
            'andhadhun', 'tumbbad', 'gangs of wasseypur', 'ugly', 'ship of theseus',
            'parasite', 'oldboy', 'the handmaiden', 'memories of murder', 'burning',
            'run lola run', 'phone booth', 'locke', 'buried', 'the one i love'
          ];
          
          for (const name of movieNames) {
            if (afterAdd.toLowerCase().includes(name.toLowerCase())) {
              movieName = name;
              break;
            }
          }
          
          if (!movieName) {
            // Try to extract any word after "add"
            const words = afterAdd.split(' ');
            if (words.length > 0) {
              movieName = words[0];
            }
          }
        }
        
        if (movieName) {
          enhancedContent += `\n✅ **Added "${movieName}" to your watchlist!**`;
          enhancedContent += `\n💡 You can view it in your Content section.`;
          
          // Create an action to add the movie
          const addMovieAction = {
            type: 'add_content',
            data: {
              title: movieName,
              type: 'movie',
              action: 'added_to_watchlist',
              timestamp: new Date()
            },
            status: 'completed'
          };
          
          // Add this action to the mapped actions
          if (!mappedActions) mappedActions = [];
          mappedActions.push(addMovieAction);
          
          // Actually save the movie to the user's content collection
          try {
            const ContentCollection = require('../models/Content');
            
            // Find or create a default watchlist collection
            let watchlistCollection = await ContentCollection.findOne({
              userId: req.user._id,
              name: 'Watchlist'
            });
            
            if (!watchlistCollection) {
              watchlistCollection = new ContentCollection({
                userId: req.user._id,
                name: 'Watchlist',
                description: 'Movies and shows I want to watch',
                type: 'wishlist',
                isPublic: false
              });
            }
            
            // Check if movie already exists
            const existingMovie = watchlistCollection.items.find(item => 
              item.title.toLowerCase() === movieName.toLowerCase()
            );
            
            if (!existingMovie) {
              // Add the movie to the watchlist
              watchlistCollection.items.push({
                title: movieName,
                type: 'movie',
                status: 'want_to_consume',
                isRecommended: true,
                recommendationReason: 'Added via AI chat',
                addedAt: new Date()
              });
              
              await watchlistCollection.save();
              enhancedContent += `\n🎬 **Saved to database!** Movie "${movieName}" is now in your watchlist.`;
            } else {
              enhancedContent += `\nℹ️ **Already in watchlist!** "${movieName}" was already on your list.`;
            }
          } catch (error) {
            console.error('Error saving movie to watchlist:', error);
            enhancedContent += `\n⚠️ **Note:** Movie added to chat but couldn't save to database.`;
          }
        } else {
          enhancedContent += `\n❓ Which movie would you like me to add? Try "add Arrival" or "add Inception"`;
        }
      }

      // Update context with the current conversation
      const updatedContext = {
        ...aiChat.currentSession.context,
        lastRecommendation: recommendAction ? {
          type: contentType,
          timestamp: new Date(),
          action: 'waiting_for_confirmation'
        } : undefined,
        conversationHistory: [
          ...(aiChat.currentSession.context.conversationHistory || []),
          { message, response: enhancedContent, timestamp: new Date() }
        ].slice(-5) // Keep last 5 exchanges for context
      };

      return {
        content: enhancedContent,
        actions: mappedActions,
        suggestions: [],
        context: updatedContext
      };
    } catch (error) {
      console.error('OpenAI service error:', error);
      // Fall back to simple response generation
    }
  } else {
    console.log('Using fallback response generation');
  }
  
  // Fallback to simple response generation
  const userMessage = message.toLowerCase();
  const context = aiChat.currentSession.context;
  const userProfile = aiChat.userProfile;
  
  let response = '';
  let actions = [];
  let suggestions = [];
  
  // Analyze user intent and generate appropriate response
  if (userMessage.includes('task') || userMessage.includes('todo') || userMessage.includes('need to')) {
    response = generateTaskResponse(userMessage, context);
    actions.push({
      type: 'create_task',
      data: extractTaskData(userMessage),
      status: 'pending'
    });
  } else if (userMessage.includes('journal') || userMessage.includes('write') || userMessage.includes('feeling')) {
    response = generateJournalResponse(userMessage, context);
    actions.push({
      type: 'create_journal_entry',
      data: extractJournalData(userMessage),
      status: 'pending'
    });
  } else if (userMessage.includes('expense') || userMessage.includes('spent') || userMessage.includes('bought')) {
    response = generateExpenseResponse(userMessage, context);
    actions.push({
      type: 'add_expense',
      data: extractExpenseData(userMessage),
      status: 'pending'
    });
  } else if (userMessage.includes('schedule') || userMessage.includes('time') || userMessage.includes('meeting')) {
    response = generateScheduleResponse(userMessage, context);
    actions.push({
      type: 'schedule_time',
      data: extractScheduleData(userMessage),
      status: 'pending'
    });
  } else if (userMessage.includes('read') || userMessage.includes('book') || userMessage.includes('watch') || userMessage.includes('movie')) {
    response = generateContentResponse(userMessage, userProfile);
    suggestions = await generateContentSuggestions(userProfile, userMessage);
  } else if (userMessage.includes('goal') || userMessage.includes('achieve') || userMessage.includes('plan')) {
    response = generateGoalResponse(userMessage, userProfile);
  } else if (userMessage.includes('energy') || userMessage.includes('tired') || userMessage.includes('motivated')) {
    response = generateEnergyResponse(userMessage, context);
  } else {
    response = generateGeneralResponse(userMessage, context, userProfile);
  }
  
  return {
    content: response,
    actions,
    suggestions,
    context: updateContext(context, userMessage)
  };
}

// Generate task-related response
function generateTaskResponse(message, context) {
  const responses = [
    "I'll help you create a task for that! Let me add it to your task list.",
    "Great! I'm adding this to your tasks so you won't forget.",
    "I've got you covered! This task is now in your system.",
    "Perfect! I'll make sure this gets tracked in your task management."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Generate journal-related response
function generateJournalResponse(message, context) {
  const responses = [
    "I'd love to help you capture that thought in your journal!",
    "That's a great reflection! Let me add it to your journal.",
    "I'm recording this in your journal so you can look back on it later.",
    "This is worth remembering! I'll add it to your journal entries."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Generate expense-related response
function generateExpenseResponse(message, context) {
  const responses = [
    "I'll track that expense for you! Let me add it to your finance records.",
    "Got it! I'm recording this expense in your financial tracker.",
    "I'll make sure that expense is logged in your finance management.",
    "Perfect! This expense is now tracked in your financial records."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Generate schedule-related response
function generateScheduleResponse(message, context) {
  const responses = [
    "I'll help you schedule that! Let me add it to your calendar.",
    "Great! I'm blocking that time in your schedule.",
    "I'll make sure that gets scheduled at the right time.",
    "Perfect! I'm adding this to your time management system."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Generate content-related response
function generateContentResponse(message, userProfile) {
  const responses = [
    "Based on your interests, I have some great recommendations for you!",
    "I think you'll love these suggestions based on your taste!",
    "Let me recommend some content that matches your preferences.",
    "I've got some perfect recommendations for you!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Generate goal-related response
function generateGoalResponse(message, userProfile) {
  const responses = [
    "That's a fantastic goal! Let me help you break it down and track your progress.",
    "I love your ambition! Let me help you plan and achieve this goal.",
    "Great goal setting! I'll help you create a roadmap to success.",
    "Excellent! Let me help you structure this goal and track your progress."
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Generate energy-related response
function generateEnergyResponse(message, context) {
  if (message.includes('tired') || message.includes('exhausted')) {
    return "I understand you're feeling tired. Let me suggest some energy-boosting activities and help you adjust your schedule accordingly.";
  } else if (message.includes('motivated') || message.includes('energized')) {
    return "That's fantastic! You're in a great energy state. Let's make the most of it and tackle your most important tasks.";
  } else {
    return "How's your energy level today? I can help you optimize your schedule based on your current energy state.";
  }
}

// Generate general response
function generateGeneralResponse(message, context, userProfile) {
  const responses = [
    "I'm here to help you manage your lifestyle better! What would you like to work on today?",
    "How can I assist you with your goals and daily management today?",
    "I'm ready to help you optimize your life! What's on your mind?",
    "Let's work together to make your day more productive and fulfilling!"
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// Extract task data from message
function extractTaskData(message) {
  // Simple extraction - in production, use NLP libraries
  return {
    title: message.replace(/^(i need to|i have to|i should|create task|add task)/i, '').trim(),
    priority: message.includes('urgent') || message.includes('important') ? 'high' : 'medium',
    category: 'general',
    description: message
  };
}

// Extract journal data from message
function extractJournalData(message) {
  return {
    title: 'Journal Entry',
    content: message,
    type: 'daily',
    mood: extractMood(message),
    tags: extractTags(message)
  };
}

// Extract expense data from message
function extractExpenseData(message) {
  const amount = message.match(/\$?(\d+(?:\.\d{2})?)/);
  return {
    amount: amount ? parseFloat(amount[1]) : 0,
    description: message,
    category: 'general',
    date: new Date()
  };
}

// Extract schedule data from message
function extractScheduleData(message) {
  return {
    title: 'Scheduled Event',
    description: message,
    startTime: new Date(),
    duration: 60, // default 1 hour
    type: 'event'
  };
}

// Extract mood from message
function extractMood(message) {
  if (message.includes('happy') || message.includes('excited') || message.includes('great')) return 'excellent';
  if (message.includes('good') || message.includes('fine') || message.includes('okay')) return 'good';
  if (message.includes('bad') || message.includes('sad') || message.includes('terrible')) return 'bad';
  return 'neutral';
}

// Extract tags from message
function extractTags(message) {
  const tags = [];
  const commonTags = ['work', 'personal', 'health', 'finance', 'family', 'hobby'];
  commonTags.forEach(tag => {
    if (message.toLowerCase().includes(tag)) {
      tags.push(tag);
    }
  });
  return tags;
}

// Update context based on message
function updateContext(context, message) {
  const newContext = { ...context };
  
  if (message.includes('tired') || message.includes('exhausted')) {
    newContext.energyLevel = 'low';
  } else if (message.includes('motivated') || message.includes('energized')) {
    newContext.energyLevel = 'high';
  }
  
  if (message.includes('work') || message.includes('office')) {
    newContext.location = 'work';
  } else if (message.includes('home') || message.includes('house')) {
    newContext.location = 'home';
  }
  
  return newContext;
}

// Execute actions based on AI response
async function executeAction(action, userId) {
  try {
    switch (action.type) {
      case 'create_task':
        const task = new Task({
          userId,
          title: action.data.title,
          description: action.data.description,
          priority: action.data.priority,
          category: action.data.category,
          dueDate: action.data.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000) // Default: tomorrow
        });
        await task.save();
        break;
        
      case 'create_journal_entry':
        let journal = await Journal.findOne({ userId });
        if (!journal) {
          journal = new Journal({ userId, entries: [] });
        }
        journal.entries.unshift(action.data);
        await journal.save();
        break;
        
      case 'add_expense':
        // Expense tracking is handled in the main expense detection logic
        // This action is just for tracking purposes
        console.log('✅ Expense action tracked:', action.data);
        break;
        
      case 'schedule_time':
        let schedule = await Schedule.findOne({ userId });
        if (!schedule) {
          schedule = new Schedule({ userId, events: [] });
        }
        schedule.events.push(action.data);
        await schedule.save();
        break;
    }
    
    // Mark action as completed
    action.status = 'completed';
  } catch (error) {
    console.error('Error executing action:', error);
    action.status = 'failed';
  }
}

// Generate insights based on user data
async function generateInsights(aiChat, userId) {
  const insights = {
    productivity: {
      peakHours: aiChat.userProfile.patterns?.productivityPeakHours || ['9:00', '14:00'],
      recommendations: []
    },
    goals: {
      active: aiChat.userProfile.goals?.filter(g => g.isActive) || [],
      progress: aiChat.insights.goalProgress || []
    },
    content: {
      recommendations: [],
      preferences: aiChat.userProfile.contentTaste || {}
    }
  };
  
  // Generate productivity recommendations
  if (aiChat.currentSession.context.energyLevel === 'low') {
    insights.productivity.recommendations.push('Consider taking a short break or switching to less demanding tasks');
  }
  
  return insights;
}

// Generate content recommendations
async function generateContentRecommendations(userProfile, type, category, limit) {
  // This would integrate with external APIs (Goodreads, TMDB, etc.)
  // For now, return sample recommendations based on user preferences
  
  const recommendations = [
    {
      title: "Atomic Habits",
      type: "book",
      category: "self_help",
      author: "James Clear",
      description: "Tiny Changes, Remarkable Results: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
      rating: 4.8,
      matchScore: 0.95
    },
    {
      title: "The Social Network",
      type: "movie",
      category: "business",
      director: "David Fincher",
      year: 2010,
      description: "As Harvard student Mark Zuckerberg creates the social networking site that would become known as Facebook, he is sued by the twins who claimed he stole their idea.",
      rating: 4.2,
      matchScore: 0.87
    }
  ];
  
  return recommendations.slice(0, limit);
}

// Generate content suggestions
async function generateContentSuggestions(userProfile, message) {
  const suggestions = [];
  
  if (message.includes('read') || message.includes('book')) {
    suggestions.push('Would you like me to recommend some books based on your interests?');
    suggestions.push('I can suggest books that match your learning style and difficulty preference.');
  }
  
  if (message.includes('watch') || message.includes('movie')) {
    suggestions.push('I have some great movie recommendations that match your taste!');
    suggestions.push('Would you like me to suggest some content based on your mood today?');
  }
  
  return suggestions;
}

// Handle content confirmation and add to user's lists
router.post('/confirm-content', authenticateToken, async (req, res) => {
  try {
    const { contentType, title, action } = req.body; // action: 'add_to_watchlist', 'add_to_reading_list', etc.
    
    let aiChat = await AiChat.findOne({ userId: req.user._id });
    if (!aiChat) {
      return res.status(404).json({ message: 'AI chat session not found' });
    }
    
    // Add the confirmed content to the appropriate collection
    let contentCollection = await ContentCollection.findOne({ 
      userId: req.user._id, 
      type: action === 'add_to_watchlist' ? 'watchlist' : 'wishlist' 
    });
    
    if (!contentCollection) {
      contentCollection = new ContentCollection({
        userId: req.user._id,
        name: action === 'add_to_watchlist' ? 'My Watchlist' : 'My Wishlist',
        type: action === 'add_to_watchlist' ? 'watchlist' : 'wishlist',
        items: []
      });
    }
    
    // Add the content item
    contentCollection.items.push({
      title: title,
      type: contentType,
      addedAt: new Date(),
      status: 'pending'
    });
    
    await contentCollection.save();
    
    // Add a confirmation message to the chat
    await aiChat.addMessage('assistant', `Great! I've added "${title}" to your ${action === 'add_to_watchlist' ? 'watchlist' : 'wishlist'}. You can view it in your Content section.`, {
      actions: [{
        type: 'add_content',
        data: { title, type: contentType, action },
        status: 'completed'
      }]
    });
    
    res.json({
      message: 'Content added successfully',
      contentCollection: contentCollection
    });
    
  } catch (error) {
    console.error('Error confirming content:', error);
    res.status(500).json({ message: 'Error adding content to list' });
  }
});

module.exports = router;
