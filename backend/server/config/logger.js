const winston = require('winston');
const path = require('path');

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  security: 5
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
  security: 'cyan'
};

winston.addColors(colors);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'untangle-platform' },
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs with level 'security' to security.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/security.log'),
      level: 'security',
      maxsize: 5242880, // 5MB
      maxFiles: 10
    }),
    // Write all logs to combined.log
    new winston.transports.File({
      filename: path.join(__dirname, '../../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// If we're not in production, log to the console as well
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Security event logger
const securityLogger = {
  logLoginAttempt: (email, ip, success, userAgent) => {
    logger.log('security', 'Login attempt', {
      email,
      ip,
      success,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  logFailedLogin: (email, ip, reason, userAgent) => {
    logger.log('security', 'Failed login attempt', {
      email,
      ip,
      reason,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  logAccountLockout: (email, ip, reason) => {
    logger.log('security', 'Account lockout', {
      email,
      ip,
      reason,
      timestamp: new Date().toISOString()
    });
  },

  logPasswordChange: (userId, ip, userAgent) => {
    logger.log('security', 'Password changed', {
      userId,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  logDataAccess: (userId, resource, action, ip) => {
    logger.log('security', 'Data access', {
      userId,
      resource,
      action,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  logSuspiciousActivity: (userId, activity, details, ip) => {
    logger.log('security', 'Suspicious activity detected', {
      userId,
      activity,
      details,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  logFileUpload: (userId, filename, fileSize, ip) => {
    logger.log('security', 'File upload', {
      userId,
      filename,
      fileSize,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  logAPIUsage: (userId, endpoint, method, ip, userAgent) => {
    logger.log('security', 'API usage', {
      userId,
      endpoint,
      method,
      ip,
      userAgent,
      timestamp: new Date().toISOString()
    });
  },

  logAdminAction: (adminId, action, targetUserId, details) => {
    logger.log('security', 'Admin action', {
      adminId,
      action,
      targetUserId,
      details,
      timestamp: new Date().toISOString()
    });
  },

  logDataExport: (userId, dataType, ip) => {
    logger.log('security', 'Data export', {
      userId,
      dataType,
      ip,
      timestamp: new Date().toISOString()
    });
  },

  logDataDeletion: (userId, dataType, ip) => {
    logger.log('security', 'Data deletion', {
      userId,
      dataType,
      ip,
      timestamp: new Date().toISOString()
    });
  }
};

// Create logs directory if it doesn't exist
const fs = require('fs');
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = {
  logger,
  securityLogger
};
