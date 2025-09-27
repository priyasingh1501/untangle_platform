/**
 * Response Helper
 * Provides standardized response formatting across the application
 */

class ResponseHelper {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} statusCode - HTTP status code
   * @returns {Object} Response object
   */
  static success(res, data = null, message = 'Success', statusCode = 200) {
    const response = {
      success: true,
      message,
      timestamp: new Date().toISOString()
    };

    if (data !== null) {
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} statusCode - HTTP status code
   * @param {string} code - Error code
   * @param {*} details - Additional error details
   * @returns {Object} Response object
   */
  static error(res, message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    const response = {
      success: false,
      message,
      code,
      timestamp: new Date().toISOString()
    };

    if (details !== null) {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   * @param {Object} res - Express response object
   * @param {Array} errors - Validation errors
   * @param {string} message - Error message
   * @returns {Object} Response object
   */
  static validationError(res, errors, message = 'Validation failed') {
    return this.error(res, message, 400, 'VALIDATION_ERROR', { errors });
  }

  /**
   * Send not found response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Response object
   */
  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, 404, 'NOT_FOUND');
  }

  /**
   * Send unauthorized response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Response object
   */
  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, 401, 'UNAUTHORIZED');
  }

  /**
   * Send forbidden response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Response object
   */
  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, 403, 'FORBIDDEN');
  }

  /**
   * Send conflict response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @returns {Object} Response object
   */
  static conflict(res, message = 'Resource already exists') {
    return this.error(res, message, 409, 'CONFLICT');
  }

  /**
   * Send rate limit response
   * @param {Object} res - Express response object
   * @param {string} message - Error message
   * @param {number} retryAfter - Retry after seconds
   * @returns {Object} Response object
   */
  static rateLimit(res, message = 'Too many requests', retryAfter = null) {
    const response = {
      success: false,
      message,
      code: 'RATE_LIMIT_EXCEEDED',
      timestamp: new Date().toISOString()
    };

    if (retryAfter !== null) {
      response.retryAfter = retryAfter;
    }

    return res.status(429).json(response);
  }

  /**
   * Send paginated response
   * @param {Object} res - Express response object
   * @param {Array} data - Response data
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   * @returns {Object} Response object
   */
  static paginated(res, data, pagination, message = 'Success') {
    return this.success(res, {
      items: data,
      pagination: {
        page: pagination.page || 1,
        limit: pagination.limit || 10,
        total: pagination.total || 0,
        pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10))
      }
    }, message);
  }

  /**
   * Send created response
   * @param {Object} res - Express response object
   * @param {*} data - Created resource data
   * @param {string} message - Success message
   * @returns {Object} Response object
   */
  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  /**
   * Send no content response
   * @param {Object} res - Express response object
   * @returns {Object} Response object
   */
  static noContent(res) {
    return res.status(204).send();
  }
}

module.exports = ResponseHelper;
