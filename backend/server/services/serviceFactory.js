/**
 * Service Factory
 * Provides a clean interface for accessing services through dependency injection
 */

const container = require('../container');

class ServiceFactory {
  /**
   * Get a service by name
   * @param {string} serviceName - Name of the service
   * @returns {*} Service instance
   */
  static get(serviceName) {
    return container.get(serviceName);
  }

  /**
   * Get multiple services at once
   * @param {string[]} serviceNames - Array of service names
   * @returns {Object} Object with service names as keys
   */
  static getMany(serviceNames) {
    const services = {};
    serviceNames.forEach(name => {
      services[name] = container.get(name);
    });
    return services;
  }

  /**
   * Get all models
   * @returns {Object} Object with all model constructors
   */
  static getModels() {
    return ServiceFactory.getMany([
      'User',
      'Journal', 
      'Task',
      'Finance',
      'Meal',
      'FoodItem',
      'AiChat',
      'Content',
      'BookDocument',
      'Goal',
      'Habit',
      'MindfulnessCheckin',
      'TimeManagement',
      'Payment',
      'Subscription',
      'RecipeTemplate',
      'ExpenseGoal',
      'GoalAlignedDay',
      'HabitCheckin',
      'JournalTrends',
      'EmailForwarding'
    ]);
  }

  /**
   * Get all services
   * @returns {Object} Object with all service instances
   */
  static getServices() {
    return ServiceFactory.getMany([
      'OpenAIService',
      'JournalAnalysisService',
      'TwoFactorService',
      'EncryptionService',
      'GDPRService',
      'WhatsAppService',
      'MessageParsingService',
      'DataService',
      'EmailParsingService',
      'EnhancedTrendAnalysisService',
      'GoalAlignedDayService',
      'JWTService',
      'TokenBlacklistService',
      'SessionService'
    ]);
  }

  /**
   * Get logger services
   * @returns {Object} Logger services
   */
  static getLoggers() {
    return ServiceFactory.getMany(['logger', 'securityLogger']);
  }

  /**
   * Get external dependencies
   * @returns {Object} External dependencies
   */
  static getExternalDeps() {
    return ServiceFactory.getMany(['axios', 'crypto', 'jwt']);
  }
}

module.exports = ServiceFactory;
