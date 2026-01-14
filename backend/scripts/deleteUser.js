const mongoose = require('mongoose');
const User = require('../server/models/User');
const Journal = require('../server/models/Journal');
const Finance = require('../server/models/Finance');
const Task = require('../server/models/Task');
const Goal = require('../server/models/Goal');
const Habit = require('../server/models/Habit');
const AiChat = require('../server/models/AiChat');
const Meal = require('../server/models/Meal');
const FoodTracking = require('../server/models/FoodTracking');
const Content = require('../server/models/Content');
const MindfulnessCheckin = require('../server/models/MindfulnessCheckin');
const BookDocument = require('../server/models/BookDocument');
const ExpenseGoal = require('../server/models/ExpenseGoal');
const HabitCheckin = require('../server/models/HabitCheckin');
const JournalTrends = require('../server/models/JournalTrends');
const GoalAlignedDay = require('../server/models/GoalAlignedDay');
const FoodItem = require('../server/models/FoodItem');
const RecipeTemplate = require('../server/models/RecipeTemplate');
const TimeManagement = require('../server/models/TimeManagement');
const WhatsAppSession = require('../server/models/WhatsAppSession');
const Payment = require('../server/models/Payment');
const Subscription = require('../server/models/Subscription');

// Load environment variables from project root directory (same as server)
const dotenv = require('dotenv');
const path = require('path');

// Try multiple .env file locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, '.env')
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`✅ Loaded .env from: ${envPath}`);
    break;
  }
}

async function deleteUserByEmail(email) {
  try {
    // Connect to MongoDB - use the same connection method as the server
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI environment variable is not set');
      console.log('Please set MONGODB_URI in your .env file');
      process.exit(1);
    }
    
    console.log(`🔗 Connecting to MongoDB...`);
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    
    if (!user) {
      console.log(`❌ User with email ${email} not found`);
      await mongoose.disconnect();
      return;
    }

    console.log(`📧 Found user: ${user.email} (ID: ${user._id})`);
    console.log(`👤 Name: ${user.firstName} ${user.lastName}`);

    const userId = user._id;

    // Delete all user data
    console.log('🗑️  Deleting user data...');
    
    // Delete all user data - wrap in try-catch for each model
    const deleteOperations = [
      { model: Journal, name: 'Journal' },
      { model: Finance, name: 'Finance' },
      { model: Task, name: 'Task' },
      { model: Goal, name: 'Goal' },
      { model: Habit, name: 'Habit' },
      { model: AiChat, name: 'AiChat' },
      { model: Meal, name: 'Meal' },
      { model: FoodTracking, name: 'FoodTracking' },
      { model: ExpenseGoal, name: 'ExpenseGoal' },
      { model: Content, name: 'Content' },
      { model: MindfulnessCheckin, name: 'MindfulnessCheckin' },
      { model: BookDocument, name: 'BookDocument' },
      { model: HabitCheckin, name: 'HabitCheckin' },
      { model: JournalTrends, name: 'JournalTrends' },
      { model: GoalAlignedDay, name: 'GoalAlignedDay' },
      { model: FoodItem, name: 'FoodItem' },
      { model: RecipeTemplate, name: 'RecipeTemplate' },
      { model: TimeManagement, name: 'TimeManagement' },
      { model: WhatsAppSession, name: 'WhatsAppSession' },
      { model: Payment, name: 'Payment' },
      { model: Subscription, name: 'Subscription' }
    ];

    const deleteResults = await Promise.allSettled(
      deleteOperations.map(({ model, name }) => {
        if (model && typeof model.deleteMany === 'function') {
          return model.deleteMany({ userId });
        } else {
          return Promise.reject(new Error(`Model ${name} does not have deleteMany method`));
        }
      })
    );

    // Log deletion results
    deleteResults.forEach((result, index) => {
      const modelName = deleteOperations[index].name;
      if (result.status === 'fulfilled') {
        console.log(`  ✅ ${modelName}: ${result.value.deletedCount} documents deleted`);
      } else {
        console.log(`  ⚠️  ${modelName}: Error - ${result.reason.message}`);
      }
    });

    // Delete user account
    console.log('🗑️  Deleting user account...');
    await User.findByIdAndDelete(userId);
    console.log(`✅ User ${email} and all associated data deleted successfully`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address as an argument');
  console.log('Usage: node deleteUser.js <email>');
  process.exit(1);
}

// Run the script
deleteUserByEmail(email);
