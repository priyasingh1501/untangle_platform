const OpenAI = require('openai');

// Initialize OpenAI only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-test-key-for-development') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Classify incoming message type
async function classifyMessage(messageText) {
  // Use fallback if OpenAI is not available
  if (!openai) {
    return classifyMessageFallback(messageText);
  }

  try {
    const prompt = `
    Classify the following message into one of these categories: expense, food, habit, journal, other.
    
    Rules:
    1. If message contains currency symbols (₹, $, €, etc.) or number+merchant keywords → expense
    2. If message contains words like "ate", "breakfast", "lunch", "dinner", "snack", or food platform names → food
    3. If message contains short goal-oriented phrases ("did", "skipped", "streak", "completed", "done") → habit
    4. If message contains personal thoughts, feelings, or experiences → journal
    5. Otherwise → other
    
    Message: "${messageText}"
    
    Respond with JSON: {"type": "category", "confidence": 0.0-1.0, "reasoning": "brief explanation"}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error classifying message:', error);
    // Fallback classification
    return classifyMessageFallback(messageText);
  }
}

// Fallback classification using simple rules
function classifyMessageFallback(messageText) {
  const text = messageText.toLowerCase();
  
  // Check for expense indicators (more comprehensive)
  if (text.match(/[₹$€£¥]|\d+\s*(rupees?|dollars?|euros?|pounds?)/) || 
      text.match(/\d+\s+(uber|ola|swiggy|zomato|amazon|flipkart)/) ||
      text.match(/^(expense|spent|paid|bought|purchased)/) ||
      text.match(/(uber|ola|swiggy|zomato|amazon|flipkart).*\d+/) ||
      text.match(/\d+.*(uber|ola|swiggy|zomato|amazon|flipkart)/)) {
    return { type: 'expense', confidence: 0.8, reasoning: 'Contains currency, merchant keywords, or expense verbs' };
  }
  
  // Check for food indicators (more specific)
  if ((text.match(/(ate|eating|breakfast|lunch|dinner|snack|food|meal)/) ||
      text.match(/(swiggy|zomato|foodpanda|ubereats)/)) &&
      !text.match(/(grateful|thankful|feeling|thinking|work|life)/)) {
    return { type: 'food', confidence: 0.8, reasoning: 'Contains food-related keywords' };
  }
  
  // Check for habit indicators
  if (text.match(/(did|done|completed|skipped|streak|habit|exercise|meditation|workout)/)) {
    return { type: 'habit', confidence: 0.7, reasoning: 'Contains habit-related keywords' };
  }
  
  // Check for journal indicators (personal thoughts/feelings)
  if (text.match(/(feeling|thinking|grateful|thankful|happy|sad|frustrated|excited|worried|anxious|calm|peaceful|life|family|work|day|today|yesterday)/)) {
    return { type: 'journal', confidence: 0.7, reasoning: 'Contains personal thoughts or feelings' };
  }
  
  // Default to journal
  return { type: 'journal', confidence: 0.6, reasoning: 'Default classification' };
}

// Parse expense from message
async function parseExpense(messageText) {
  // Use fallback if OpenAI is not available
  if (!openai) {
    return parseExpenseFallback(messageText);
  }

  try {
    const prompt = `
    Extract expense information from this message: "${messageText}"
    
    Return JSON with:
    - amount: number
    - currency: string (default "INR")
    - vendor: string
    - date: ISO date string (default to today if not specified)
    - category: one of: food, transportation, housing, utilities, healthcare, entertainment, shopping, education, travel, insurance, taxes, debt, other
    - description: string
    
    Examples:
    "₹450 Uber 2025-09-27" → {"amount": 450, "currency": "INR", "vendor": "Uber", "date": "2025-09-27T00:00:00.000Z", "category": "transportation", "description": "Uber ride"}
    "1200 swiggy" → {"amount": 1200, "currency": "INR", "vendor": "Swiggy", "date": "2025-01-27T00:00:00.000Z", "category": "food", "description": "Swiggy order"}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    // Validate and clean the result
    if (result.amount && result.vendor) {
      return {
        amount: parseFloat(result.amount),
        currency: result.currency || 'INR',
        vendor: result.vendor,
        date: new Date(result.date || new Date()),
        category: result.category || 'other',
        description: result.description || `${result.vendor} expense`,
        source: 'whatsapp'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing expense:', error);
    return parseExpenseFallback(messageText);
  }
}

// Fallback expense parsing
function parseExpenseFallback(messageText) {
  const text = messageText.trim();
  
  // Try to extract amount and vendor using regex
  const currencyMatch = text.match(/[₹$€£¥](\d+)/);
  const numberMatch = text.match(/(\d+)/);
  const amount = currencyMatch ? parseFloat(currencyMatch[1]) : (numberMatch ? parseFloat(numberMatch[1]) : null);
  
  if (!amount) return null;
  
  // Extract vendor (everything except amount and date)
  const vendorMatch = text.replace(/[₹$€£¥]?\d+/, '').replace(/\d{4}-\d{2}-\d{2}/, '').trim();
  const vendor = vendorMatch || 'Unknown';
  
  // Determine category based on vendor
  let category = 'other';
  if (vendor.toLowerCase().includes('uber') || vendor.toLowerCase().includes('ola')) {
    category = 'transportation';
  } else if (vendor.toLowerCase().includes('swiggy') || vendor.toLowerCase().includes('zomato')) {
    category = 'food';
  }
  
  return {
    amount,
    currency: 'INR',
    vendor,
    date: new Date(),
    category,
    description: `${vendor} expense`,
    source: 'whatsapp'
  };
}

// Parse food from message
async function parseFood(messageText) {
  // Use fallback if OpenAI is not available
  if (!openai) {
    return parseFoodFallback(messageText);
  }

  try {
    const prompt = `
    Extract food information from this message: "${messageText}"
    
    Return JSON with:
    - mealType: one of: breakfast, lunch, snack, dinner
    - description: string describing what was eaten
    - foodItems: array of specific food items mentioned (e.g., ["toast", "eggs", "coffee"])
    - calories: number (optional, estimate if not provided)
    - time: string (optional)
    
    Examples:
    "ate breakfast - toast and eggs" → {"mealType": "breakfast", "description": "toast and eggs", "foodItems": ["toast", "eggs"], "calories": 300}
    "lunch at office canteen" → {"mealType": "lunch", "description": "office canteen", "foodItems": [], "calories": 500}
    "had rice, dal, and vegetables" → {"mealType": "lunch", "description": "rice, dal, and vegetables", "foodItems": ["rice", "dal", "vegetables"], "calories": 400}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    if (result.mealType && result.description) {
      return {
        mealType: result.mealType,
        description: result.description,
        foodItems: result.foodItems || [],
        calories: result.calories || null,
        time: result.time || null,
        source: 'whatsapp'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing food:', error);
    return parseFoodFallback(messageText);
  }
}

// Fallback food parsing
function parseFoodFallback(messageText) {
  const text = messageText.toLowerCase();
  
  let mealType = 'snack';
  if (text.includes('breakfast')) mealType = 'breakfast';
  else if (text.includes('lunch')) mealType = 'lunch';
  else if (text.includes('dinner')) mealType = 'dinner';
  
  // Extract description (everything after "ate" or meal type)
  const description = text.replace(/(ate|breakfast|lunch|dinner|snack)\s*-?\s*/, '').trim() || 'food';
  
  // Try to extract food items from description
  const foodItems = [];
  const commonFoods = ['rice', 'dal', 'bread', 'toast', 'eggs', 'coffee', 'tea', 'milk', 'vegetables', 'chicken', 'fish', 'paneer', 'curry', 'soup', 'salad', 'fruit', 'apple', 'banana', 'orange'];
  
  commonFoods.forEach(food => {
    if (description.toLowerCase().includes(food)) {
      foodItems.push(food);
    }
  });
  
  return {
    mealType,
    description,
    foodItems,
    calories: null,
    time: null,
    source: 'whatsapp'
  };
}

// Parse habit from message
async function parseHabit(messageText) {
  // Use fallback if OpenAI is not available
  if (!openai) {
    return parseHabitFallback(messageText);
  }

  try {
    const prompt = `
    Extract habit information from this message: "${messageText}"
    
    Return JSON with:
    - habit: string (habit name)
    - status: "completed" or "skipped"
    - duration: number (minutes, optional)
    - notes: string (optional)
    
    Examples:
    "meditation done" → {"habit": "meditation", "status": "completed", "duration": 10}
    "skipped workout" → {"habit": "workout", "status": "skipped", "notes": "skipped"}
    "exercise 30 min" → {"habit": "exercise", "status": "completed", "duration": 30}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    if (result.habit && result.status) {
      return {
        habit: result.habit,
        status: result.status,
        duration: result.duration || null,
        notes: result.notes || null,
        source: 'whatsapp'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing habit:', error);
    return parseHabitFallback(messageText);
  }
}

// Fallback habit parsing
function parseHabitFallback(messageText) {
  const text = messageText.toLowerCase();
  
  let status = 'completed';
  if (text.includes('skipped') || text.includes('missed')) {
    status = 'skipped';
  }
  
  // Extract habit name (remove status words)
  const habit = text.replace(/(done|completed|skipped|missed)/g, '').trim() || 'habit';
  
  // Extract duration if mentioned
  const durationMatch = text.match(/(\d+)\s*(min|minutes?|hour|hours?)/);
  const duration = durationMatch ? parseInt(durationMatch[1]) : null;
  
  return {
    habit,
    status,
    duration,
    notes: null,
    source: 'whatsapp'
  };
}

// Parse journal from message
async function parseJournal(messageText) {
  // Use fallback if OpenAI is not available
  if (!openai) {
    return parseJournalFallback(messageText);
  }

  try {
    const prompt = `
    Extract journal information from this message: "${messageText}"
    
    Return JSON with:
    - title: string (brief title, max 50 chars)
    - content: string (the full message)
    - mood: one of: excellent, good, neutral, bad, terrible
    - type: one of: daily, gratitude, reflection, goal, dream, memory, creative, work, health, relationship
    
    Examples:
    "Frustrated at work but I handled it calmly" → {"title": "Work frustration handled well", "content": "Frustrated at work but I handled it calmly", "mood": "neutral", "type": "work"}
    "Grateful for my family today" → {"title": "Grateful for family", "content": "Grateful for my family today", "mood": "good", "type": "gratitude"}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    const result = JSON.parse(response.choices[0].message.content);
    
    if (result.title && result.content) {
      return {
        title: result.title,
        content: result.content,
        mood: result.mood || 'neutral',
        type: result.type || 'daily',
        source: 'whatsapp'
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing journal:', error);
    return parseJournalFallback(messageText);
  }
}

// Fallback journal parsing
function parseJournalFallback(messageText) {
  const text = messageText.toLowerCase();
  
  // Determine mood based on keywords
  let mood = 'neutral';
  if (text.includes('happy') || text.includes('great') || text.includes('awesome') || text.includes('excellent')) {
    mood = 'excellent';
  } else if (text.includes('good') || text.includes('nice') || text.includes('grateful')) {
    mood = 'good';
  } else if (text.includes('bad') || text.includes('terrible') || text.includes('awful')) {
    mood = 'bad';
  } else if (text.includes('worst') || text.includes('horrible')) {
    mood = 'terrible';
  }
  
  // Determine type based on keywords
  let type = 'daily';
  if (text.includes('grateful') || text.includes('thankful')) {
    type = 'gratitude';
  } else if (text.includes('work') || text.includes('job') || text.includes('office')) {
    type = 'work';
  } else if (text.includes('health') || text.includes('exercise') || text.includes('doctor')) {
    type = 'health';
  } else if (text.includes('family') || text.includes('friend') || text.includes('relationship')) {
    type = 'relationship';
  }
  
  return {
    title: messageText.substring(0, 50),
    content: messageText,
    mood,
    type,
    source: 'whatsapp'
  };
}

module.exports = {
  classifyMessage,
  parseExpense,
  parseFood,
  parseHabit,
  parseJournal,
  parseExpenseFallback,
  parseFoodFallback,
  parseHabitFallback,
  parseJournalFallback
};
