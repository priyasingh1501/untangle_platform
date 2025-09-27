/**
 * Centralized Error Handling
 * Provides consistent error handling across the application
 */

const LoggerFacade = require('../facades/loggerFacade');

class AppError extends Error {
  constructor(message, statusCode, code, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ErrorHandler {
  /**
   * Create a standardized error response
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(error, req) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Log the error
    LoggerFacade.error('Error occurred', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.userId
    });

    // Create base response
    const response = {
      success: false,
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      timestamp: error.timestamp || new Date().toISOString()
    };

    // Add stack trace in development
    if (isDevelopment && error.stack) {
      response.stack = error.stack;
    }

    // Add additional details for operational errors
    if (error.isOperational) {
      response.details = {
        path: req.path,
        method: req.method
      };
    }

    return response;
  }

  /**
   * Handle different types of errors
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @returns {Object} Error response with status code
   */
  static handleError(error, req) {
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const validationError = new AppError(
        'Validation failed',
        400,
        'VALIDATION_ERROR'
      );
      validationError.details = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message
      }));
      return {
        statusCode: 400,
        response: this.createErrorResponse(validationError, req)
      };
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      const duplicateError = new AppError(
        'Resource already exists',
        409,
        'DUPLICATE_ERROR'
      );
      return {
        statusCode: 409,
        response: this.createErrorResponse(duplicateError, req)
      };
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      const jwtError = new AppError(
        'Invalid token',
        401,
        'INVALID_TOKEN'
      );
      return {
        statusCode: 401,
        response: this.createErrorResponse(jwtError, req)
      };
    }

    if (error.name === 'TokenExpiredError') {
      const expiredError = new AppError(
        'Token expired',
        401,
        'TOKEN_EXPIRED'
      );
      return {
        statusCode: 401,
        response: this.createErrorResponse(expiredError, req)
      };
    }

    // Rate limiting error
    if (error.status === 429) {
      const rateLimitError = new AppError(
        'Too many requests',
        429,
        'RATE_LIMIT_EXCEEDED'
      );
      return {
        statusCode: 429,
        response: this.createErrorResponse(rateLimitError, req)
      };
    }

    // Default to internal server error
    const internalError = new AppError(
      error.message || 'Internal server error',
      error.statusCode || 500,
      error.code || 'INTERNAL_ERROR',
      false
    );
    
    return {
      statusCode: internalError.statusCode,
      response: this.createErrorResponse(internalError, req)
    };
  }

  /**
   * Async error wrapper for route handlers
   * @param {Function} fn - Async function
   * @returns {Function} Wrapped function
   */
  static asyncWrapper(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Retry policy for failed operations
   * @param {Function} operation - Operation to retry
   * @param {Object} options - Retry options
   * @returns {Promise} Operation result
   */
  static async withRetry(operation, options = {}) {
    const {
      maxRetries = 3,
      delay = 1000,
      backoffMultiplier = 2,
      retryCondition = (error) => error.isOperational !== false
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry if condition is not met
        if (!retryCondition(error)) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const currentDelay = delay * Math.pow(backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        
        LoggerFacade.warn(`Retry attempt ${attempt + 1}/${maxRetries}`, {
          error: error.message,
          delay: currentDelay
        });
      }
    }
    
    throw lastError;
  }
}

// Common error types
const Errors = {
  BadRequest: (message = 'Bad request') => new AppError(message, 400, 'BAD_REQUEST'),
  Unauthorized: (message = 'Unauthorized') => new AppError(message, 401, 'UNAUTHORIZED'),
  Forbidden: (message = 'Forbidden') => new AppError(message, 403, 'FORBIDDEN'),
  NotFound: (message = 'Not found') => new AppError(message, 404, 'NOT_FOUND'),
  Conflict: (message = 'Conflict') => new AppError(message, 409, 'CONFLICT'),
  TooManyRequests: (message = 'Too many requests') => new AppError(message, 429, 'TOO_MANY_REQUESTS'),
  InternalServerError: (message = 'Internal server error') => new AppError(message, 500, 'INTERNAL_SERVER_ERROR')
};

module.exports = {
  AppError,
  ErrorHandler,
  Errors
};
