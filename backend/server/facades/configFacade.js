/**
 * Config Facade
 * Centralizes all configuration access to make it easily mockable and testable
 */

class ConfigFacade {
  /**
   * Get environment variable with fallback
   * @param {string} key - Environment variable key
   * @param {*} defaultValue - Default value if not set
   * @returns {*} Environment variable value or default
   */
  static get(key, defaultValue = undefined) {
    return process.env[key] || defaultValue;
  }

  /**
   * Get required environment variable
   * @param {string} key - Environment variable key
   * @returns {string} Environment variable value
   * @throws {Error} If variable is not set
   */
  static getRequired(key) {
    const value = process.env[key];
    if (value === undefined) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  /**
   * Get boolean environment variable
   * @param {string} key - Environment variable key
   * @param {boolean} defaultValue - Default value
   * @returns {boolean} Boolean value
   */
  static getBoolean(key, defaultValue = false) {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  /**
   * Get number environment variable
   * @param {string} key - Environment variable key
   * @param {number} defaultValue - Default value
   * @returns {number} Number value
   */
  static getNumber(key, defaultValue = 0) {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  /**
   * Get array environment variable (comma-separated)
   * @param {string} key - Environment variable key
   * @param {string[]} defaultValue - Default value
   * @returns {string[]} Array value
   */
  static getArray(key, defaultValue = []) {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.split(',').map(item => item.trim());
  }

  /**
   * Check if running in production
   * @returns {boolean} True if production
   */
  static isProduction() {
    return this.get('NODE_ENV') === 'production';
  }

  /**
   * Check if running in development
   * @returns {boolean} True if development
   */
  static isDevelopment() {
    return this.get('NODE_ENV') === 'development';
  }

  /**
   * Check if running in test
   * @returns {boolean} True if test
   */
  static isTest() {
    return this.get('NODE_ENV') === 'test';
  }

  /**
   * Get database configuration
   * @returns {Object} Database config
   */
  static getDatabaseConfig() {
    return {
      uri: this.getRequired('MONGODB_URI'),
      options: {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    };
  }

  /**
   * Get JWT configuration
   * @returns {Object} JWT config
   */
  static getJWTConfig() {
    return {
      secret: this.getRequired('JWT_SECRET'),
      refreshSecret: this.getRequired('JWT_REFRESH_SECRET'),
      expiresIn: this.get('JWT_EXPIRES_IN', '1h'),
      refreshExpiresIn: this.get('JWT_REFRESH_EXPIRES_IN', '7d')
    };
  }

  /**
   * Get API configuration
   * @returns {Object} API config
   */
  static getAPIConfig() {
    return {
      port: this.getNumber('PORT', 5000),
      corsOrigin: this.getArray('CORS_ORIGIN', ['http://localhost:3000']),
      maxRequestSize: this.get('MAX_REQUEST_SIZE', '10mb')
    };
  }

  /**
   * Get external API keys
   * @returns {Object} API keys
   */
  static getAPIKeys() {
    return {
      openai: this.get('OPENAI_API_KEY'),
      usda: this.get('USDA_API_KEY'),
      razorpay: this.get('RAZORPAY_KEY_ID'),
      razorpaySecret: this.get('RAZORPAY_SECRET')
    };
  }
}

module.exports = ConfigFacade;
