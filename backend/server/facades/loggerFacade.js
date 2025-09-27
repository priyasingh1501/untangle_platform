/**
 * Logger Facade
 * Centralizes all logging operations to make them easily mockable and testable
 */

const { logger, securityLogger } = require('../config/logger');

class LoggerFacade {
  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  static info(message, meta = {}) {
    logger.info(message, meta);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  static error(message, meta = {}) {
    logger.error(message, meta);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  static warn(message, meta = {}) {
    logger.warn(message, meta);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  static debug(message, meta = {}) {
    logger.debug(message, meta);
  }

  /**
   * Log security event
   * @param {string} userId - User ID
   * @param {string} event - Security event type
   * @param {Object} details - Event details
   * @param {string} ip - IP address
   */
  static security(userId, event, details, ip) {
    securityLogger.logSuspiciousActivity(userId, event, details, ip);
  }

  /**
   * Log API usage
   * @param {string} userId - User ID
   * @param {string} endpoint - API endpoint
   * @param {string} method - HTTP method
   * @param {string} ip - IP address
   * @param {string} userAgent - User agent
   */
  static apiUsage(userId, endpoint, method, ip, userAgent) {
    securityLogger.logAPIUsage(userId, endpoint, method, ip, userAgent);
  }

  /**
   * Log account lockout
   * @param {string} userId - User ID
   * @param {string} ip - IP address
   * @param {string} reason - Lockout reason
   */
  static accountLockout(userId, ip, reason) {
    securityLogger.logAccountLockout(userId, ip, reason);
  }
}

module.exports = LoggerFacade;
