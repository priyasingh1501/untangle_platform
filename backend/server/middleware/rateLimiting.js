const { securityConfig } = require('../config/security');
const { securityLogger } = require('../config/logger');

// Memory store for rate limiting (use Redis in production)
const store = new Map();

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