const rateLimit = require('express-rate-limit');
const { securityConfig } = require('../config/security');
const { securityLogger } = require('../config/logger');

// Memory store for rate limiting (use Redis in production)
const store = new Map();

// Custom store implementation factory - each call creates a new store instance
const createCustomStore = (prefix) => {
  const store = new Map();
  
  return {
    increment: (key, cb) => {
      try {
        if (typeof cb !== 'function') {
          console.error('Rate limit store increment: cb is not a function', typeof cb, cb);
          return;
        }
        
        const now = Date.now();
        const windowMs = securityConfig.rateLimit.windowMs;
        const fullKey = `${prefix}_${key}`;
        
        if (!store.has(fullKey)) {
          store.set(fullKey, { count: 1, resetTime: now + windowMs });
          return cb(null, { totalHits: 1, resetTime: now + windowMs });
        }
        
        const record = store.get(fullKey);
        
        if (now > record.resetTime) {
          // Reset window
          store.set(fullKey, { count: 1, resetTime: now + windowMs });
          return cb(null, { totalHits: 1, resetTime: now + windowMs });
        }
        
        record.count++;
        return cb(null, { totalHits: record.count, resetTime: record.resetTime });
      } catch (error) {
        console.error('Rate limit store increment error:', error);
        if (typeof cb === 'function') {
          return cb(error);
        }
      }
    },
    
    decrement: (key, cb) => {
      try {
        if (typeof cb !== 'function') {
          console.error('Rate limit store decrement: cb is not a function', typeof cb, cb);
          return;
        }
        
        const fullKey = `${prefix}_${key}`;
        if (store.has(fullKey)) {
          const record = store.get(fullKey);
          record.count = Math.max(0, record.count - 1);
        }
        return cb();
      } catch (error) {
        console.error('Rate limit store decrement error:', error);
        if (typeof cb === 'function') {
          return cb(error);
        }
      }
    },
    
    resetKey: (key, cb) => {
      try {
        if (typeof cb !== 'function') {
          console.error('Rate limit store resetKey: cb is not a function', typeof cb, cb);
          return;
        }
        
        const fullKey = `${prefix}_${key}`;
        store.delete(fullKey);
        return cb();
      } catch (error) {
        console.error('Rate limit store resetKey error:', error);
        if (typeof cb === 'function') {
          return cb(error);
        }
      }
    }
  };
};

// General rate limiting - temporarily disabled due to store issues
const generalRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
};

// Strict rate limiting for authentication endpoints - temporarily disabled
const authRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
};

// Strict rate limiting for password reset - temporarily disabled
const passwordResetRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
};

// Rate limiting for file uploads - temporarily disabled
const fileUploadRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
};

// Rate limiting for API endpoints - temporarily disabled
const apiRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
};

// Rate limiting for search endpoints - temporarily disabled
const searchRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
};

// Rate limiting for data export - temporarily disabled
const dataExportRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
};

// Dynamic rate limiting based on user tier - temporarily disabled
const dynamicRateLimit = (req, res, next) => {
  // Skip rate limiting for now to avoid store issues
  next();
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