/**
 * HTTP Facade
 * Centralizes all HTTP operations to make them easily mockable and testable
 */

const axios = require('axios');

class HttpFacade {
  /**
   * Make HTTP GET request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  static async get(url, options = {}) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        ...options
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  /**
   * Make HTTP POST request
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  static async post(url, data, options = {}) {
    try {
      const response = await axios.post(url, data, {
        timeout: 10000,
        ...options
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  /**
   * Make HTTP PUT request
   * @param {string} url - Request URL
   * @param {*} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  static async put(url, data, options = {}) {
    try {
      const response = await axios.put(url, data, {
        timeout: 10000,
        ...options
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  /**
   * Make HTTP DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  static async delete(url, options = {}) {
    try {
      const response = await axios.delete(url, {
        timeout: 10000,
        ...options
      });
      return {
        success: true,
        data: response.data,
        status: response.status,
        headers: response.headers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      };
    }
  }

  /**
   * Make HTTP request with retry logic
   * @param {Function} requestFn - Request function
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Delay between retries in ms
   * @returns {Promise<Object>} Response data
   */
  static async withRetry(requestFn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await requestFn();
        if (result.success) {
          return result;
        }
        lastError = result.error;
      } catch (error) {
        lastError = error.message;
      }
      
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
    
    return {
      success: false,
      error: `Request failed after ${maxRetries + 1} attempts: ${lastError}`
    };
  }
}

module.exports = HttpFacade;
