const { Expense } = require('../models/Finance');
const { FoodTracking } = require('../models/FoodTracking');
const { Habit } = require('../models/Habit');
const { Journal } = require('../models/Journal');
const User = require('../models/User');

// Get or create user by phone number
async function getUserByPhone(phoneNumber) {
  try {
    let user = await User.findOne({ phoneNumber });
    
    if (!user) {
      // Create new user with phone number
      user = new User({
        phoneNumber,
        email: `${phoneNumber}@whatsapp.untangle.com`,
        name: `WhatsApp User ${phoneNumber}`,
        isActive: true
      });
      await user.save();
      console.log(`👤 Created new user for phone: ${phoneNumber}`);
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
      source: 'whatsapp',
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

// Save food data
async function saveFood(phoneNumber, foodData) {
  try {
    const user = await getUserByPhone(phoneNumber);
    
    const food = new FoodTracking({
      userId: user._id,
      date: new Date(),
      mealType: foodData.mealType,
      time: foodData.time || new Date().toLocaleTimeString(),
      energy: 3, // Default value
      hunger: 3, // Default value
      plateTemplate: 'balanced', // Default value
      proteinAnchor: false, // Default value
      plantColors: 2, // Default value
      carbQuality: 'whole', // Default value
      friedOrUPF: false, // Default value
      addedSugar: false, // Default value
      mindfulPractice: 'none', // Default value
      satiety: 3, // Default value
      postMealCravings: 0, // Default value
      notes: foodData.description,
      healthGoals: ['steady_energy'] // Default value
    });
    
    const savedFood = await food.save();
    console.log(`🍽️ Saved food: ${savedFood._id}`);
    return savedFood;
  } catch (error) {
    console.error('Error saving food:', error);
    throw error;
  }
}

// Save habit data
async function saveHabit(phoneNumber, habitData) {
  try {
    const user = await getUserByPhone(phoneNumber);
    
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
    
    await habit.save();
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
    const user = await getUserByPhone(phoneNumber);
    
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
    
    // Add new entry
    journal.entries.push({
      title: journalData.title,
      content: journalData.content,
      type: journalData.type,
      mood: journalData.mood,
      tags: [],
      isPrivate: true,
      attachments: [],
      location: {},
      weather: {},
      alfredAnalysis: {
        emotion: {
          primary: journalData.mood,
          secondary: 'neutral',
          intensity: 5,
          confidence: 0.7
        },
        topics: [],
        beliefs: [],
        summary: journalData.content.substring(0, 100),
        insights: [],
        analyzedAt: new Date()
      }
    });
    
    await journal.save();
    console.log(`📝 Saved journal entry: ${journal._id}`);
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
