const { Expense } = require('../models/Finance');
const { FoodTracking } = require('../models/FoodTracking');
const { Habit } = require('../models/Habit');
const Journal = require('../models/Journal');
const Meal = require('../models/Meal');
const FoodItem = require('../models/FoodItem');
const User = require('../models/User');
const { getAuthenticatedUser, isUserAuthenticated } = require('./whatsappAuthService');

// Get user by phone number (authenticated or create temporary)
async function getUserByPhone(phoneNumber) {
  try {
    // First check if user is authenticated
    if (await isUserAuthenticated(phoneNumber)) {
      const user = await getAuthenticatedUser(phoneNumber);
      if (user) {
        console.log(`👤 Using authenticated user: ${user.email}`);
        return user;
      }
    }

    // If not authenticated, create temporary user
    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      // Create temporary user with phone number
      user = new User({
        phoneNumber,
        email: `${phoneNumber}@whatsapp.untangle.com`,
        name: `WhatsApp User ${phoneNumber}`,
        isActive: true,
        isTemporary: true // Mark as temporary
      });
      await user.save();
      console.log(`👤 Created temporary user for phone: ${phoneNumber}`);
    }
    
    return user;
  } catch (error) {
    console.error('Error getting/creating user:', error);
    throw error;
  }
}

// Save expense data
async function saveExpense(phoneNumber, expenseData) {
  try {
    const user = await getUserByPhone(phoneNumber);
    
    const expense = new Expense({
      userId: user._id,
      amount: expenseData.amount,
      currency: expenseData.currency,
      vendor: expenseData.vendor,
      date: expenseData.date,
      category: expenseData.category,
      description: expenseData.description,
      source: 'other', // WhatsApp is not in the enum, using 'other'
      paymentMethod: 'digital-wallet'
    });
    
    const savedExpense = await expense.save();
    console.log(`💰 Saved expense: ${savedExpense._id}`);
    return savedExpense;
  } catch (error) {
    console.error('Error saving expense:', error);
    throw error;
  }
}

// Save food data with meal creation
async function saveFood(phoneNumber, foodData) {
  try {
    // Set a shorter timeout for WhatsApp operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('WhatsApp food save timeout')), 5000)
    );
    
    const userPromise = getUserByPhone(phoneNumber);
    const user = await Promise.race([userPromise, timeoutPromise]);
    
    // Helper to save basic FoodTracking
    const saveBasicFood = async () => {
      const food = new FoodTracking({
        userId: user._id,
        date: new Date(),
        mealType: foodData.mealType,
        time: foodData.time || new Date().toLocaleTimeString(),
        energy: 3,
        hunger: 3,
        plateTemplate: 'balanced',
        proteinAnchor: false,
        plantColors: 2,
        carbQuality: 'whole',
        friedOrUPF: false,
        addedSugar: false,
        mindfulPractice: 'none',
        satiety: 3,
        postMealCravings: 0,
        notes: foodData.description,
        healthGoals: ['steady_energy']
      });
      const savedFood = await food.save();
      console.log(`🍽️ Saved basic food tracking: ${savedFood._id}`);
      return savedFood;
    };
    
    // If no specific food items mentioned, save basic tracking
    if (!foodData.foodItems || foodData.foodItems.length === 0) {
      return await saveBasicFood();
    }
    
    // Try meal flow; on any failure, fallback to basic tracking
    try {
      const mealItems = await searchAndCreateMealItems(foodData.foodItems);
      if (mealItems.length === 0) {
        return await saveBasicFood();
      }
      const meal = new Meal({
        userId: user._id,
        ts: new Date(),
        items: mealItems,
        notes: foodData.description,
        context: {
          postWorkout: false,
          plantDiversity: mealItems.length,
          fermented: false,
          omega3Tag: false,
          addedSugar: 0
        },
        // Skip AI analysis for WhatsApp - just basic computed data
        computed: {
          totals: {
            kcal: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            vitaminC: 0,
            zinc: 0,
            selenium: 0,
            iron: 0,
            omega3: 0
          },
          badges: {
            protein: false,
            veg: false,
            gi: 0,
            fodmap: 'Unknown',
            nova: 0
          },
          mindfulMealScore: 3,
          rationale: ['Basic meal logged via WhatsApp'],
          tip: 'Consider adding more details for better analysis',
          aiInsights: null,
          effects: {}
        }
      });
      const savePromise = meal.save();
      const savedMeal = await Promise.race([savePromise, timeoutPromise]);
      console.log(`🍽️ Saved meal with ${mealItems.length} items: ${savedMeal._id}`);
      return savedMeal;
    } catch (mealError) {
      console.error('Meal creation failed, falling back to basic tracking:', mealError);
      return await saveBasicFood();
    }
  } catch (error) {
    console.error('Error saving food:', error);
    throw error;
  }
}

// Search for food items and create meal items
async function searchAndCreateMealItems(foodItems) {
  const mealItems = [];
  
  for (const foodName of foodItems) {
    try {
      // Use the same search endpoint that the frontend uses
      console.log(`🔍 Searching for food: ${foodName}`);
      const searchResults = await searchFoodUsingAPI(foodName);
      
      if (searchResults && searchResults.length > 0) {
        // Use the first (most relevant) result
        const food = searchResults[0];
        
        mealItems.push({
          foodId: food.externalId || food._id || `api_${foodName}`,
          customName: food.name,
          grams: food.portionGramsDefault || 100
        });
        
        console.log(`✅ Found food via API: ${food.name} (${food.portionGramsDefault || 100}g)`);
      } else {
        // Create basic entry for unknown foods
        mealItems.push({
          foodId: `unknown_${foodName}`,
          customName: foodName,
          grams: 100
        });
        console.log(`📝 Created basic entry for: ${foodName} (100g)`);
      }
    } catch (error) {
      console.error(`Error searching for food item ${foodName}:`, error);
      // Create a basic food item entry even on error
      mealItems.push({
        foodId: `error_${foodName}`,
        customName: foodName,
        grams: 100
      });
    }
  }
  
  return mealItems;
}

// Use the same search API that the frontend uses
async function searchFoodUsingAPI(foodName) {
  try {
    // Import the search functions from the food route
    const { searchLocalDatabase, searchUSDADatabase, searchOpenFoodFacts, deduplicateResults } = require('../routes/food');
    
    let results = [];
    
    // Search local database
    try {
      const localResults = await searchLocalDatabase(foodName, 5);
      results.push(...localResults);
    } catch (error) {
      console.log('Local search failed:', error.message);
    }
    
    // Search USDA database
    try {
      const usdaResults = await searchUSDADatabase(foodName, 5);
      results.push(...usdaResults);
    } catch (error) {
      console.log('USDA search failed:', error.message);
    }
    
    // Search Open Food Facts
    try {
      const offResults = await searchOpenFoodFacts(foodName, 5);
      results.push(...offResults);
    } catch (error) {
      console.log('OpenFoodFacts search failed:', error.message);
    }
    
    // Deduplicate and filter results
    results = deduplicateResults(results);
    results = results.filter(result => (result.relevanceScore || 0) >= 0.4);
    
    // Sort by relevance and return top result
    return results
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 1);
      
  } catch (error) {
    console.error('API search error:', error.message);
    return [];
  }
}

// Save habit data
async function saveHabit(phoneNumber, habitData) {
  try {
    // Set a shorter timeout for WhatsApp operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('WhatsApp habit save timeout')), 5000)
    );
    
    const userPromise = getUserByPhone(phoneNumber);
    const user = await Promise.race([userPromise, timeoutPromise]);
    
    // Find existing habit or create new one
    let habit = await Habit.findOne({ 
      userId: user._id, 
      habit: habitData.habit,
      isActive: true 
    });
    
    if (!habit) {
      // Create new habit
      habit = new Habit({
        userId: user._id,
        habit: habitData.habit,
        description: `Habit created via WhatsApp: ${habitData.habit}`,
        valueMin: habitData.duration || 30, // Default 30 minutes
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        isActive: true,
        frequency: 'daily'
      });
      await habit.save();
    }
    
    // Add check-in for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    habit.addCheckin(
      today,
      habitData.status === 'completed',
      habitData.duration || habit.valueMin,
      habitData.notes || null,
      habitData.status === 'completed' ? 'good' : 'poor'
    );
    
    const savePromise = habit.save();
    await Promise.race([savePromise, timeoutPromise]);
    console.log(`✅ Saved habit check-in: ${habit._id}`);
    return habit;
  } catch (error) {
    console.error('Error saving habit:', error);
    throw error;
  }
}

// Save journal data
async function saveJournal(phoneNumber, journalData) {
  try {
    // Set a shorter timeout for WhatsApp operations
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('WhatsApp journal save timeout')), 5000)
    );
    
    const userPromise = getUserByPhone(phoneNumber);
    const user = await Promise.race([userPromise, timeoutPromise]);
    
    // Find existing journal or create new one
    let journal = await Journal.findOne({ userId: user._id });
    
    if (!journal) {
      journal = new Journal({
        userId: user._id,
        entries: [],
        settings: {
          defaultPrivacy: 'private',
          reminderTime: '20:00',
          enableReminders: true,
          journalingPrompts: true
        },
        stats: {
          totalEntries: 0,
          currentStreak: 0,
          longestStreak: 0
        }
      });
    }
    
    // Add new entry without encryption for now (encryption service has issues)
    const newEntry = {
      title: journalData.title,
      content: journalData.content,
      type: journalData.type,
      mood: journalData.mood,
      tags: [],
      isPrivate: true,
      attachments: [],
      location: {},
      weather: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    journal.entries.push(newEntry);
    journal.stats.totalEntries = journal.entries.length;
    
    const savePromise = journal.save();
    await Promise.race([savePromise, timeoutPromise]);
    console.log(`📝 Saved journal entry for user: ${user._id}`);
    return journal;
  } catch (error) {
    console.error('Error saving journal:', error);
    throw error;
  }
}

// Get last expenses for a user
async function getLastExpenses(phoneNumber, limit = 5) {
  try {
    const user = await getUserByPhone(phoneNumber);
    
    const expenses = await Expense.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('amount currency vendor date category description');
    
    return expenses;
  } catch (error) {
    console.error('Error getting last expenses:', error);
    return [];
  }
}

// Get weekly summary for a user
async function getWeeklySummary(phoneNumber) {
  try {
    const user = await getUserByPhone(phoneNumber);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Get expenses for the week
    const expenses = await Expense.find({
      userId: user._id,
      date: { $gte: weekAgo, $lte: now }
    }).select('amount currency category');
    
    // Get food entries for the week
    const foodEntries = await FoodTracking.find({
      userId: user._id,
      date: { $gte: weekAgo, $lte: now }
    }).select('mealType notes');
    
    // Get habit check-ins for the week
    const habits = await Habit.find({
      userId: user._id,
      isActive: true
    }).select('habit checkins');
    
    // Calculate totals
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const expenseCount = expenses.length;
    const foodCount = foodEntries.length;
    
    // Count completed habits
    let completedHabits = 0;
    habits.forEach(habit => {
      const weekCheckins = habit.checkins.filter(checkin => 
        checkin.date >= weekAgo && checkin.date <= now && checkin.completed
      );
      completedHabits += weekCheckins.length;
    });
    
    let summary = `📊 Weekly Summary (${weekAgo.toLocaleDateString()} - ${now.toLocaleDateString()}):\n\n`;
    summary += `💰 Expenses: ${expenseCount} transactions, Total: ₹${totalExpenses.toFixed(2)}\n`;
    summary += `🍽️ Food entries: ${foodCount}\n`;
    summary += `✅ Habit check-ins: ${completedHabits}\n`;
    
    if (expenses.length > 0) {
      summary += `\nTop categories:\n`;
      const categories = {};
      expenses.forEach(exp => {
        categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
      });
      Object.entries(categories)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .forEach(([category, amount]) => {
          summary += `• ${category}: ₹${amount.toFixed(2)}\n`;
        });
    }
    
    return summary;
  } catch (error) {
    console.error('Error getting weekly summary:', error);
    return 'Sorry, I couldn\'t generate your weekly summary. Please try again.';
  }
}

// Remove last entry (for undo functionality)
async function removeLastEntry(phoneNumber) {
  try {
    const user = await getUserByPhone(phoneNumber);
    
    // Try to remove from each collection in order of priority
    const collections = [
      { model: Expense, name: 'expense' },
      { model: FoodTracking, name: 'food' },
      { model: Journal, name: 'journal' },
      { model: Habit, name: 'habit' }
    ];
    
    for (const { model, name } of collections) {
      const lastEntry = await model.findOne({ userId: user._id })
        .sort({ createdAt: -1 });
      
      if (lastEntry) {
        await model.findByIdAndDelete(lastEntry._id);
        console.log(`🗑️ Removed last ${name} entry: ${lastEntry._id}`);
        return { type: name, id: lastEntry._id };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error removing last entry:', error);
    throw error;
  }
}

module.exports = {
  getUserByPhone,
  saveExpense,
  saveFood,
  saveHabit,
  saveJournal,
  getLastExpenses,
  getWeeklySummary,
  removeLastEntry
};



