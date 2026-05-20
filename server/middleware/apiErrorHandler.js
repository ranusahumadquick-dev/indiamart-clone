/**
 * API Error Handler Middleware
 * Handles API-specific errors with standardized responses
 */

const { AppError } = require('./errorMiddleware');

/**
 * API Error Types
 * Predefined error types for consistent error handling
 */
const ApiErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
};

/**
 * API Error Response Class
 * Extends AppError with additional API-specific properties
 */
class ApiError extends AppError {
  constructor(message, statusCode, type, details = {}) {
    super(message, statusCode);
    this.type = type;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * API Response Formatter
 * Formats API responses in a consistent structure
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {Number} statusCode - HTTP status code
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Formatted response
 */
const formatApiResponse = (res, data = null, statusCode = 200, metadata = {}) => {
  const response = {
    success: statusCode < 400,
    data,
    timestamp: new Date().toISOString(),
    ...metadata
  };
  
  if (metadata.message) {
    response.message = metadata.message;
  }
  
  if (metadata.pagination) {
    response.pagination = metadata.pagination;
  }
  
  res.status(statusCode).json(response);
};

/**
 * API Error Response Formatter
 * Formats API error responses in a consistent structure
 * @param {Object} res - Express response object
 * @param {ApiError} error - Error object
 * @returns {Object} - Formatted error response
 */
const formatApiErrorResponse = (res, error) => {
  const response = {
    success: false,
    error: {
      type: error.type || ApiErrorTypes.INTERNAL_ERROR,
      message: error.message,
      code: error.code,
      timestamp: error.timestamp || new Date().toISOString()
    }
  };
  
  // Add error details in development mode
  if (process.env.NODE_ENV === 'development' && error.details) {
    response.error.details = error.details;
  }
  
  // Add validation errors if present
  if (error.validationErrors) {
    response.error.validationErrors = error.validationErrors;
  }
  
  res.status(error.statusCode || 500).json(response);
};

/**
 * Validation Error Handler
 * @param {Object} errors - Validation errors object
 * @param {String} message - Error message
 * @returns {ApiError} - API error object
 */
const handleValidationError = (errors, message = 'Validation failed') => {
  const validationErrors = Object.keys(errors).reduce((acc, key) => {
    acc[key] = {
      message: errors[key].message,
      value: errors[key].value,
      path: errors[key].path
    };
    return acc;
  }, {});
  
  return new ApiError(
    message,
    400,
    ApiErrorTypes.VALIDATION_ERROR,
    { validationErrors }
  );
};

/**
 * Authentication Error Handler
 * @param {String} message - Error message
 * @returns {ApiError} - API error object
 */
const handleAuthError = (message = 'Authentication failed') => {
  return new ApiError(
    message,
    401,
    ApiErrorTypes.AUTHENTICATION_ERROR,
    { code: 'AUTH_FAILED' }
  );
};

/**
 * Authorization Error Handler
 * @param {String} message - Error message
 * @returns {ApiError} - API error object
 */
const handleAuthzError = (message = 'Authorization failed') => {
  return new ApiError(
    message,
    403,
    ApiErrorTypes.AUTHORIZATION_ERROR,
    { code: 'AUTHZ_FAILED' }
  );
};

/**
 * Not Found Error Handler
 * @param {String} resource - Resource name
 * @param {String} id - Resource ID
 * @returns {ApiError} - API error object
 */
const handleNotFoundError = (resource, id = null) => {
  const message = id ? `${resource} not found with id: ${id}` : `${resource} not found`;
  return new ApiError(
    message,
    404,
    ApiErrorTypes.NOT_FOUND,
    { resource, id }
  );
};

/**
 * Conflict Error Handler
 * @param {String} message - Error message
 * @param {Object} details - Additional details
 * @returns {ApiError} - API error object
 */
const handleConflictError = (message, details = {}) => {
  return new ApiError(
    message,
    409,
    ApiErrorTypes.CONFLICT,
    details
  );
};

/**
 * Rate Limit Error Handler
 * @param {Number} limit - Rate limit
 * @param {Number} windowMs - Time window in milliseconds
 * @returns {ApiError} - API error object
 */
const handleRateLimitError = (limit, windowMs) => {
  const message = `Rate limit exceeded. Please try again after ${windowMs / 1000} seconds.`;
  return new ApiError(
    message,
    429,
    ApiErrorTypes.RATE_LIMIT_ERROR,
    { limit, windowMs }
  );
};

/**
 * Payment Error Handler
 * @param {String} message - Error message
 * @param {Object} details - Additional details
 * @returns {ApiError} - API error object
 */
const handlePaymentError = (message, details = {}) => {
  return new APIError(
    message,
    400,
    ApiErrorTypes.PAYMENT_ERROR,
    details
  );
};

/**
 * Upload Error Handler
 * @param {String} message - Error message
 * @param {Object} details - Additional details
 * @returns {ApiError} - API error object
 */
const handleUploadError = (message, details = {}) => {
  return new ApiError(
    message,
    400,
    ApiErrorTypes.UPLOAD_ERROR,
    details
  );
};

/**
 * Database Error Handler
 * @param {Error} error - Database error
 * @returns {ApiError} - API error object
 */
const handleDatabaseError = (error) => {
  let message = 'Database operation failed';
  let statusCode = 500;
  let type = ApiErrorTypes.DATABASE_ERROR;
  let details = {};
  
  switch (error.name) {
    case 'ValidationError':
      message = 'Invalid data provided';
      statusCode = 400;
      type = ApiErrorTypes.VALIDATION_ERROR;
      break;
      
    case 'CastError':
      message = `Invalid ID format: ${error.value}`;
      statusCode = 400;
      break;
      
    case 'MongoError':
      if (error.code === 11000) {
        message = 'Duplicate field value';
        statusCode = 409;
        type = ApiErrorTypes.CONFLICT;
      }
      break;
  }
  
  return new ApiError(message, statusCode, type, details);
};

/**
 * External Service Error Handler
 * @param {String} service - Service name
 * @param {String} message - Error message
 * @param {Object} details - Additional details
 * @returns {ApiError} - API error object
 */
const handleExternalServiceError = (service, message, details = {}) => {
  return new ApiError(
    `External service error (${service}): ${message}`,
    502,
    ApiErrorTypes.EXTERNAL_SERVICE_ERROR,
    { service, ...details }
  );
};

/**
 * API Error Wrapper Middleware
 * Wraps route handlers to catch and format errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const wrapAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch((error) => {
      // Handle known error types
      if (error instanceof ApiError) {
        return formatApiErrorResponse(res, error);
      }
      
      // Handle database errors
      if (error.name && error.name.includes('MongoError')) {
        const apiError = handleDatabaseError(error);
        return formatApiErrorResponse(res, apiError);
      }
      
      // Handle validation errors
      if (error.name === 'ValidationError') {
        const apiError = handleValidationError(error.errors);
        return formatApiErrorResponse(res, apiError);
      }
      
      // Handle JWT errors
      if (error.name === 'JsonWebTokenError') {
        const apiError = handleAuthError('Invalid token. Please log in again.');
        return formatApiErrorResponse(res, apiError);
      }
      
      if (error.name === 'TokenExpiredError') {
        const apiError = handleAuthError('Your token has expired. Please log in again.');
        return formatApiErrorResponse(res, apiError);
      }
      
      // Handle unknown errors
      console.error('Unhandled API error:', error);
      const apiError = new ApiError(
        'An unexpected error occurred',
        500,
        ApiErrorTypes.INTERNAL_ERROR
      );
      formatApiErrorResponse(res, apiError);
    });
  };
};

/**
 * API Error Metrics Middleware
 * Logs API errors for monitoring
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const apiErrorMetrics = (req, res, next) => {
  // Store original response methods
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Override json method to capture responses
  res.json = function(data) {
    if (!data.success && data.error) {
      // Log API error
      console.log('API Error:', {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        error: data.error,
        user: req.user ? req.user._id : null,
        userAgent: req.headers['user-agent']
      });
    }
    
    return originalJson.call(this, data);
  };
  
  // Override send method to capture responses
  res.send = function(data) {
    if (typeof data === 'string') {
      try {
        const jsonData = JSON.parse(data);
        if (!jsonData.success && jsonData.error) {
          console.log('API Error:', {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            error: jsonData.error,
            user: req.user ? req.user._id : null,
            userAgent: req.headers['user-agent']
          });
        }
      } catch (e) {
        // Not JSON, ignore
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * API Health Check Handler
 * Checks API health and dependencies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const apiHealthCheck = async (req, res, next) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      dependencies: {}
    };
    
    // Check database connection
    try {
      const mongoose = require('mongoose');
      health.dependencies.database = {
        status: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
        connection: mongoose.connection.readyState
      };
    } catch (error) {
      health.dependencies.database = {
        status: 'unhealthy',
        error: error.message
      };
    }
    
    // Check external services if needed
    // health.dependencies.externalService = await checkExternalService();
    
    formatApiResponse(res, health, 200, { message: 'API is healthy' });
    
  } catch (error) {
    const apiError = new ApiError(
      'Health check failed',
      503,
      ApiErrorTypes.INTERNAL_ERROR,
      { error: error.message }
    );
    formatApiErrorResponse(res, apiError);
  }
};

module.exports = {
  ApiError,
  ApiErrorTypes,
  formatApiResponse,
  formatApiErrorResponse,
  handleValidationError,
  handleAuthError,
  handleAuthzError,
  handleNotFoundError,
  handleConflictError,
  handleRateLimitError,
  handlePaymentError,
  handleUploadError,
  handleDatabaseError,
  handleExternalServiceError,
  wrapAsync,
  apiErrorMetrics,
  apiHealthCheck
};