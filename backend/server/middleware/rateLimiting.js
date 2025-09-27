const rateLimit = require('express-rate-limit');
const { securityConfig } = require('../config/security');
const { securityLogger } = require('../config/logger');

// Memory store for rate limiting (use Redis in production)
const store = new Map();

// Custom store implementation
const customStore = {
  increment: (key, cb) => {
    const now = Date.now();
    const windowMs = securityConfig.rateLimit.windowMs;
    
    if (!store.has(key)) {
      store.set(key, { count: 1, resetTime: now + windowMs });
      return cb(null, 1, Date.now() + windowMs);
    }
    
    const record = store.get(key);
    
    if (now > record.resetTime) {
      // Reset window
      store.set(key, { count: 1, resetTime: now + windowMs });
      return cb(null, 1, now + windowMs);
    }
    
    record.count++;
    return cb(null, record.count, record.resetTime);
  },
  
  decrement: (key, cb) => {
    if (store.has(key)) {
      const record = store.get(key);
      record.count = Math.max(0, record.count - 1);
    }
    cb();
  },
  
  resetKey: (key, cb) => {
    store.delete(key);
    cb();
  }
};

// General rate limiting
const generalRateLimit = rateLimit({
  windowMs: securityConfig.rateLimit.windowMs,
  max: securityConfig.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: securityConfig.rateLimit.skipSuccessfulRequests,
  skipFailedRequests: securityConfig.rateLimit.skipFailedRequests,
  store: customStore,
  keyGenerator: (req) => {
    return `general_${req.ip}`;
  },
  handler: (req, res) => {
    securityLogger.logSuspiciousActivity(
      req.user?.userId || 'anonymous',
      'rate_limit_exceeded',
      { endpoint: req.path, ip: req.ip },
      req.ip
    );
    
    res.status(429).json({
      error: 'Too many requests from this IP, please try again later.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(securityConfig.rateLimit.windowMs / 1000)
    });
  }
});

// Strict rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: securityConfig.authRateLimit.windowMs,
  max: securityConfig.authRateLimit.max,
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: securityConfig.authRateLimit.skipSuccessfulRequests,
  skipFailedRequests: securityConfig.authRateLimit.skipFailedRequests,
  store: customStore,
  keyGenerator: (req) => {
    return `auth_${req.ip}`;
  },
  handler: (req, res) => {
    securityLogger.logAccountLockout(
      req.body?.email || 'unknown',
      req.ip,
      'auth_rate_limit_exceeded'
    );
    
    res.status(429).json({
      error: 'Too many authentication attempts, please try again later.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(securityConfig.authRateLimit.windowMs / 1000)
    });
  }
});

// Strict rate limiting for password reset
const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: {
    error: 'Too many password reset attempts, please try again later.',
    code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  store: customStore,
  keyGenerator: (req) => {
    return `password_reset_${req.ip}`;
  },
  handler: (req, res) => {
    securityLogger.logSuspiciousActivity(
      req.body?.email || 'unknown',
      'password_reset_rate_limit_exceeded',
      { endpoint: req.path, ip: req.ip },
      req.ip
    );
    
    res.status(429).json({
      error: 'Too many password reset attempts, please try again later.',
      code: 'PASSWORD_RESET_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

// Rate limiting for file uploads
const fileUploadRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 uploads per hour
  message: {
    error: 'Too many file uploads, please try again later.',
    code: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  store: customStore,
  keyGenerator: (req) => {
    return `file_upload_${req.user?.userId || req.ip}`;
  },
  handler: (req, res) => {
    securityLogger.logSuspiciousActivity(
      req.user?.userId || 'anonymous',
      'file_upload_rate_limit_exceeded',
      { endpoint: req.path, ip: req.ip },
      req.ip
    );
    
    res.status(429).json({
      error: 'Too many file uploads, please try again later.',
      code: 'FILE_UPLOAD_RATE_LIMIT_EXCEEDED',
      retryAfter: 3600
    });
  }
});

// Rate limiting for API endpoints
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // 1000 requests per 15 minutes
  message: {
    error: 'API rate limit exceeded, please try again later.',
    code: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  store: customStore,
  keyGenerator: (req) => {
    return `api_${req.user?.userId || req.ip}`;
  },
  handler: (req, res) => {
    securityLogger.logSuspiciousActivity(
      req.user?.userId || 'anonymous',
      'api_rate_limit_exceeded',
      { endpoint: req.path, ip: req.ip },
      req.ip
    );
    
    res.status(429).json({
      error: 'API rate limit exceeded, please try again later.',
      code: 'API_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(15 * 60)
    });
  }
});

// Rate limiting for search endpoints
const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 searches per minute
  message: {
    error: 'Too many search requests, please try again later.',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  store: customStore,
  keyGenerator: (req) => {
    return `search_${req.user?.userId || req.ip}`;
  },
  handler: (req, res) => {
    securityLogger.logSuspiciousActivity(
      req.user?.userId || 'anonymous',
      'search_rate_limit_exceeded',
      { endpoint: req.path, ip: req.ip },
      req.ip
    );
    
    res.status(429).json({
      error: 'Too many search requests, please try again later.',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED',
      retryAfter: 60
    });
  }
});

// Rate limiting for data export
const dataExportRateLimit = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // 5 exports per day
  message: {
    error: 'Too many data export requests, please try again tomorrow.',
    code: 'DATA_EXPORT_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  store: customStore,
  keyGenerator: (req) => {
    return `data_export_${req.user?.userId}`;
  },
  handler: (req, res) => {
    securityLogger.logSuspiciousActivity(
      req.user?.userId || 'anonymous',
      'data_export_rate_limit_exceeded',
      { endpoint: req.path, ip: req.ip },
      req.ip
    );
    
    res.status(429).json({
      error: 'Too many data export requests, please try again tomorrow.',
      code: 'DATA_EXPORT_RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(24 * 60 * 60)
    });
  }
});

// Dynamic rate limiting based on user tier
const dynamicRateLimit = (req, res, next) => {
  const user = req.user;
  let maxRequests = securityConfig.rateLimit.max;
  
  if (user) {
    // Premium users get higher limits
    if (user.role === 'premium' || user.role === 'admin') {
      maxRequests = maxRequests * 2;
    }
    
    // Admin users get even higher limits
    if (user.role === 'admin' || user.role === 'superadmin') {
      maxRequests = maxRequests * 5;
    }
  }
  
  const dynamicLimit = rateLimit({
    windowMs: securityConfig.rateLimit.windowMs,
    max: maxRequests,
    message: {
      error: 'Rate limit exceeded for your account tier.',
      code: 'DYNAMIC_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: securityConfig.rateLimit.skipSuccessfulRequests,
    skipFailedRequests: securityConfig.rateLimit.skipFailedRequests,
    store: customStore,
    keyGenerator: (req) => {
      return `dynamic_${req.user?.userId || req.ip}`;
    }
  });
  
  return dynamicLimit(req, res, next);
};

// Cleanup old rate limit records periodically
const cleanupRateLimits = () => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);

module.exports = {
  generalRateLimit,
  authRateLimit,
  passwordResetRateLimit,
  fileUploadRateLimit,
  apiRateLimit,
  searchRateLimit,
  dataExportRateLimit,
  dynamicRateLimit,
  cleanupRateLimits
};
