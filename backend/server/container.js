/**
 * Simple Dependency Injection Container
 * Provides centralized service management and dependency resolution
 */

class Container {
  constructor() {
    this.services = new Map();
    this.singletons = new Map();
  }

  /**
   * Register a service with the container
   * @param {string} name - Service name
   * @param {Function|Object} factory - Factory function or service instance
   * @param {boolean} singleton - Whether to treat as singleton
   */
  register(name, factory, singleton = true) {
    this.services.set(name, { factory, singleton });
  }

  /**
   * Get a service from the container
   * @param {string} name - Service name
   * @returns {*} Service instance
   */
  get(name) {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found in container`);
    }

    // Return singleton if already created
    if (service.singleton && this.singletons.has(name)) {
      return this.singletons.get(name);
    }

    // Create new instance
    const instance = typeof service.factory === 'function' 
      ? service.factory() 
      : service.factory;

    // Store singleton
    if (service.singleton) {
      this.singletons.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if a service is registered
   * @param {string} name - Service name
   * @returns {boolean}
   */
  has(name) {
    return this.services.has(name);
  }

  /**
   * Clear all services (useful for testing)
   */
  clear() {
    this.services.clear();
    this.singletons.clear();
  }
}

// Create global container instance
const container = new Container();

// Register core services
container.register('logger', () => require('./config/logger'));
container.register('securityLogger', () => require('./config/logger').securityLogger);

// Register facades
container.register('LoggerFacade', () => require('./facades/loggerFacade'));
container.register('ConfigFacade', () => require('./facades/configFacade'));
container.register('HttpFacade', () => require('./facades/httpFacade'));

// Register database models
container.register('User', () => require('./models/User'));
container.register('Journal', () => require('./models/Journal'));
container.register('Task', () => require('./models/Task'));
container.register('Finance', () => require('./models/Finance'));
container.register('Meal', () => require('./models/Meal'));
container.register('FoodItem', () => require('./models/FoodItem'));
container.register('AiChat', () => require('./models/AiChat'));
container.register('Content', () => require('./models/Content'));
container.register('BookDocument', () => require('./models/BookDocument'));
container.register('Goal', () => require('./models/Goal'));
container.register('Habit', () => require('./models/Habit'));
container.register('MindfulnessCheckin', () => require('./models/MindfulnessCheckin'));
container.register('TimeManagement', () => require('./models/TimeManagement'));
container.register('Payment', () => require('./models/Payment'));
container.register('Subscription', () => require('./models/Subscription'));
container.register('RecipeTemplate', () => require('./models/RecipeTemplate'));
container.register('ExpenseGoal', () => require('./models/ExpenseGoal'));
container.register('GoalAlignedDay', () => require('./models/GoalAlignedDay'));
container.register('HabitCheckin', () => require('./models/HabitCheckin'));
container.register('JournalTrends', () => require('./models/JournalTrends'));
container.register('EmailForwarding', () => require('./models/EmailForwarding'));

// Register services
container.register('OpenAIService', () => require('./services/openaiService'));
container.register('JournalAnalysisService', () => require('./services/journalAnalysisService'));
container.register('TwoFactorService', () => require('./services/twoFactorService'));
container.register('EncryptionService', () => require('./services/encryptionService'));
container.register('GDPRService', () => require('./services/gdprService'));
container.register('WhatsAppService', () => require('./services/whatsappService'));
container.register('MessageParsingService', () => require('./services/messageParsingService'));
container.register('DataService', () => require('./services/dataService'));
container.register('EmailParsingService', () => require('./services/emailParsingService'));
container.register('EnhancedTrendAnalysisService', () => require('./services/enhancedTrendAnalysisService'));
container.register('GoalAlignedDayService', () => require('./services/goalAlignedDayService'));

// Register JWT services
container.register('JWTService', () => require('./services/jwtService').JWTService);
container.register('TokenBlacklistService', () => require('./services/jwtService').TokenBlacklistService);
container.register('SessionService', () => require('./services/jwtService').SessionService);

// Register external dependencies
container.register('axios', () => require('axios'));
container.register('crypto', () => require('crypto'));
container.register('jwt', () => require('jsonwebtoken'));

module.exports = container;
