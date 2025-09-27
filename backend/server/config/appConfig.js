/**
 * Application Configuration
 * Centralized configuration management with validation
 */

const ConfigFacade = require('../facades/configFacade');

class AppConfig {
  constructor() {
    this.config = this.loadConfig();
    this.validateConfig();
  }

  /**
   * Load all configuration
   * @returns {Object} Complete configuration object
   */
  loadConfig() {
    return {
      app: {
        name: 'Untangle Platform',
        version: '1.0.0',
        environment: ConfigFacade.get('NODE_ENV', 'development'),
        port: ConfigFacade.getNumber('PORT', 5000),
        host: ConfigFacade.get('HOST', '0.0.0.0')
      },
      
      database: {
        uri: ConfigFacade.getRequired('MONGODB_URI'),
        options: {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          maxPoolSize: ConfigFacade.getNumber('DB_MAX_POOL_SIZE', 10),
          serverSelectionTimeoutMS: ConfigFacade.getNumber('DB_SERVER_SELECTION_TIMEOUT', 5000),
          socketTimeoutMS: ConfigFacade.getNumber('DB_SOCKET_TIMEOUT', 45000)
        }
      },
      
      jwt: {
        secret: ConfigFacade.getRequired('JWT_SECRET'),
        refreshSecret: ConfigFacade.getRequired('JWT_REFRESH_SECRET'),
        expiresIn: ConfigFacade.get('JWT_EXPIRES_IN', '1h'),
        refreshExpiresIn: ConfigFacade.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        issuer: ConfigFacade.get('JWT_ISSUER', 'untangle-platform'),
        audience: ConfigFacade.get('JWT_AUDIENCE', 'untangle-users')
      },
      
      cors: {
        origin: ConfigFacade.getArray('CORS_ORIGIN', [
          'http://localhost:3000',
          'http://localhost:8081',
          'http://localhost:19006'
        ]),
        credentials: ConfigFacade.getBoolean('CORS_CREDENTIALS', true),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'X-Session-ID'
        ]
      },
      
      security: {
        maxRequestSize: ConfigFacade.get('MAX_REQUEST_SIZE', '10mb'),
        rateLimitWindowMs: ConfigFacade.getNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
        rateLimitMax: ConfigFacade.getNumber('RATE_LIMIT_MAX', 100),
        authRateLimitMax: ConfigFacade.getNumber('AUTH_RATE_LIMIT_MAX', 5),
        passwordResetRateLimitMax: ConfigFacade.getNumber('PASSWORD_RESET_RATE_LIMIT_MAX', 3),
        enableCSRF: ConfigFacade.getBoolean('ENABLE_CSRF', true),
        enableHelmet: ConfigFacade.getBoolean('ENABLE_HELMET', true)
      },
      
      api: {
        openai: {
          apiKey: ConfigFacade.get('OPENAI_API_KEY'),
          model: ConfigFacade.get('OPENAI_MODEL', 'gpt-3.5-turbo'),
          maxTokens: ConfigFacade.getNumber('OPENAI_MAX_TOKENS', 1000),
          temperature: ConfigFacade.getNumber('OPENAI_TEMPERATURE', 0.7)
        },
        
        usda: {
          apiKey: ConfigFacade.get('USDA_API_KEY'),
          baseUrl: ConfigFacade.get('USDA_BASE_URL', 'https://api.nal.usda.gov/fdc/v1'),
          timeout: ConfigFacade.getNumber('USDA_TIMEOUT', 10000)
        },
        
        razorpay: {
          keyId: ConfigFacade.get('RAZORPAY_KEY_ID'),
          secret: ConfigFacade.get('RAZORPAY_SECRET'),
          webhookSecret: ConfigFacade.get('RAZORPAY_WEBHOOK_SECRET')
        }
      },
      
      email: {
        service: ConfigFacade.get('EMAIL_SERVICE', 'gmail'),
        user: ConfigFacade.get('EMAIL_USER'),
        password: ConfigFacade.get('EMAIL_PASSWORD'),
        from: ConfigFacade.get('EMAIL_FROM', 'noreply@untangle.com'),
        replyTo: ConfigFacade.get('EMAIL_REPLY_TO', 'support@untangle.com')
      },
      
      whatsapp: {
        verifyToken: ConfigFacade.get('WHATSAPP_VERIFY_TOKEN'),
        accessToken: ConfigFacade.get('WHATSAPP_ACCESS_TOKEN'),
        phoneNumberId: ConfigFacade.get('WHATSAPP_PHONE_NUMBER_ID'),
        webhookUrl: ConfigFacade.get('WHATSAPP_WEBHOOK_URL')
      },
      
      encryption: {
        key: ConfigFacade.getRequired('ENCRYPTION_KEY'),
        algorithm: ConfigFacade.get('ENCRYPTION_ALGORITHM', 'aes-256-gcm')
      },
      
      logging: {
        level: ConfigFacade.get('LOG_LEVEL', 'info'),
        enableConsole: ConfigFacade.getBoolean('LOG_ENABLE_CONSOLE', true),
        enableFile: ConfigFacade.getBoolean('LOG_ENABLE_FILE', true),
        logDir: ConfigFacade.get('LOG_DIR', './logs'),
        maxFiles: ConfigFacade.getNumber('LOG_MAX_FILES', 5),
        maxSize: ConfigFacade.get('LOG_MAX_SIZE', '10m')
      },
      
      features: {
        enableEmailExpense: ConfigFacade.getBoolean('ENABLE_EMAIL_EXPENSE', true),
        enableWhatsAppBot: ConfigFacade.getBoolean('ENABLE_WHATSAPP_BOT', false),
        enableAIAnalysis: ConfigFacade.getBoolean('ENABLE_AI_ANALYSIS', true),
        enableTwoFactor: ConfigFacade.getBoolean('ENABLE_TWO_FACTOR', true),
        enableEncryption: ConfigFacade.getBoolean('ENABLE_ENCRYPTION', true)
      }
    };
  }

  /**
   * Validate required configuration
   * @throws {Error} If required config is missing
   */
  validateConfig() {
    const required = [
      'MONGODB_URI',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY'
    ];

    const missing = required.filter(key => !ConfigFacade.get(key));
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }

    // Validate JWT secrets are different
    if (this.config.jwt.secret === this.config.jwt.refreshSecret) {
      throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
    }

    // Validate encryption key length
    if (this.config.encryption.key.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
    }
  }

  /**
   * Get configuration value by path
   * @param {string} path - Dot notation path (e.g., 'database.uri')
   * @returns {*} Configuration value
   */
  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.config);
  }

  /**
   * Get all configuration
   * @returns {Object} Complete configuration
   */
  getAll() {
    return this.config;
  }

  /**
   * Check if feature is enabled
   * @param {string} feature - Feature name
   * @returns {boolean} True if enabled
   */
  isFeatureEnabled(feature) {
    return this.config.features[feature] === true;
  }

  /**
   * Get environment-specific configuration
   * @returns {Object} Environment config
   */
  getEnvironment() {
    return {
      isProduction: this.config.app.environment === 'production',
      isDevelopment: this.config.app.environment === 'development',
      isTest: this.config.app.environment === 'test',
      name: this.config.app.environment
    };
  }
}

// Create singleton instance
const appConfig = new AppConfig();

module.exports = appConfig;
