const crypto = require('crypto');

// Security configuration
const securityConfig = {
  // JWT Configuration
  jwt: {
    accessTokenExpiry: '1h', // 1 hour (increased from 15 minutes)
    refreshTokenExpiry: '7d', // 7 days
    algorithm: 'HS256',
    issuer: 'untangle-platform',
    audience: 'untangle-users'
  },

  // Password Requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxLength: 128,
    historyCount: 5, // Remember last 5 passwords
    maxAge: 90 // days
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },

  // Stricter rate limiting for auth endpoints
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // limit each IP to 20 requests per windowMs (increased for production)
    message: 'Too many authentication attempts, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skipFailedRequests: false
  },

  // CORS Configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? (process.env.ALLOWED_ORIGINS || 'https://www.liveuntangle.com,https://liveuntangle.com').split(',').filter(Boolean)
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:8081'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token']
  },

  // Security Headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    crossOriginEmbedderPolicy: false,
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  },

  // File Upload Security
  fileUpload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain'
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt'],
    scanForMalware: true,
    quarantineSuspiciousFiles: true
  },

  // Session Management
  session: {
    maxConcurrentSessions: 3,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes of inactivity
    rememberMeDuration: 30 * 24 * 60 * 60 * 1000 // 30 days
  },

  // Account Security
  account: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireEmailVerification: true,
    requirePhoneVerification: false,
    enable2FA: true
  },

  // Data Encryption
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    logSecurityEvents: true,
    logFailedLogins: true,
    logDataAccess: true,
    logAdminActions: true,
    retentionDays: 90
  },

  // GDPR Compliance
  gdpr: {
    dataRetentionDays: 2555, // 7 years
    anonymizeAfterDays: 1095, // 3 years
    enableDataPortability: true,
    enableRightToBeForgotten: true,
    enableConsentManagement: true
  },

  // API Security
  api: {
    versioning: true,
    maxRequestSize: '10mb',
    enableRequestSigning: false, // Can be enabled for high-security requirements
    enableApiKeyAuth: false, // For third-party integrations
    enableWebhookSignatures: true
  }
};

// Generate secure random keys
const generateSecureKey = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Validate security configuration
const validateSecurityConfig = () => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'MONGODB_URI'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn(`⚠️  Missing required environment variables: ${missingVars.join(', ')}`);
    console.warn('Using generated keys for development. DO NOT use in production!');
    
    // Generate fallback keys for development
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = generateSecureKey(64);
    }
    if (!process.env.JWT_REFRESH_SECRET) {
      process.env.JWT_REFRESH_SECRET = generateSecureKey(64);
    }
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = generateSecureKey(32);
    }
  }
};

module.exports = {
  securityConfig,
  generateSecureKey,
  validateSecurityConfig
};
