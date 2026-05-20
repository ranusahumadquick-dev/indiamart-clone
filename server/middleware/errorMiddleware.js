/**
 * Global Error Handling Middleware
 * Handles all types of errors and provides consistent error responses
 */

/**
 * Development Error Handler
 * Provides detailed error information for development
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const devErrors = (error, req, res, next) => {
  // Log the full error stack for debugging
  console.error('ERROR 💥:', error);
  
  // Send detailed error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: error,
    message: error.message,
    stack: error.stack,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    body: req.body,
    params: req.params,
    query: req.query
  });
};

/**
 * Production Error Handler
 * Provides minimal error information for production
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const prodErrors = (error, req, res, next) => {
  // Operational, trusted error: send message to client
  if (error.isOperational) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
      code: error.code,
      path: req.originalUrl
    });
  }
  
  // Programming or unknown error: don't leak details to client
  console.error('ERROR 💥:', error);
  
  // Send generic message
  return res.status(500).json({
    success: false,
    message: 'Something went wrong on our end. Please try again later.',
    code: 'INTERNAL_SERVER_ERROR',
    path: req.originalUrl
  });
};

/**
 * Cast Error Handler (for MongoDB ObjectId casting errors)
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleCastErrorDB = (error, req, res, next) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  
  const appError = new AppError(message, 400);
  next(appError);
};

/**
 * Duplicate Fields Error Handler (for MongoDB duplicate key errors)
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleDuplicateFieldsDB = (error, req, res, next) => {
  const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  
  const appError = new AppError(message, 400);
  next(appError);
};

/**
 * Validation Error Handler (for MongoDB validation errors)
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleValidationErrorDB = (error, req, res, next) => {
  const errors = Object.values(error.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  
  const appError = new AppError(message, 400);
  next(appError);
};

/**
 * JWT Error Handler (for JSON Web Token errors)
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleJWTError = (error, req, res, next) => {
  const message = 'Invalid token. Please log in again!';
  const appError = new AppError(message, 401);
  next(appError);
};

/**
 * JWT Expired Handler (for expired JWT tokens)
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleJWTExpiredError = (error, req, res, next) => {
  const message = 'Your token has expired. Please log in again!';
  const appError = new AppError(message, 401);
  next(appError);
};

/**
 * Authentication Error Handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleAuthError = (error, req, res, next) => {
  const message = 'Authentication failed. Invalid credentials.';
  const appError = new AppError(message, 401);
  next(appError);
};

/**
 * Authorization Error Handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * *param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleAuthzError = (error, req, res, next) => {
  const message = 'Authorization failed. Insufficient permissions.';
  const appError = new AppError(message, 403);
  next(appError);
};

/**
 * Network Error Handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleNetworkError = (error, req, res, next) => {
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    const message = 'Network error. Please check your connection.';
    const appError = new AppError(message, 503);
    return next(appError);
  }
  
  next(error);
};

/**
 * Mongoose Error Handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleMongooseError = (error, req, res, next) => {
  // Handle Mongoose-specific errors
  if (error.name === 'MongooseError') {
    const appError = new AppError('Database operation failed. Please try again.', 500);
    return next(appError);
  }
  
  // Handle MongoDB connection errors
  if (error.name === 'MongoError' && error.code === 89) {
    const appError = new AppError('Connection to database failed. Please try again later.', 500);
    return next(appError);
  }
  
  next(error);
};

/**
 * Rate Limiting Error Handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleRateLimitError = (error, req, res, next) => {
  if (error.name === 'RateLimitError') {
    const appError = new AppError(
      'Too many requests. Please try again later.',
      429
    );
    return next(appError);
  }
  
  next(error);
};

/**
 * Multer Error Handler
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    let message = 'File upload error.';
    
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File too large. Maximum size is 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Too many files. Maximum number of files exceeded.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Unexpected field in file upload.';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Field name too long.';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Field value too long.';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Too many fields.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Too many parts.';
        break;
      case 'LIMIT_FILE_SIZE_EXCEEDED':
        message = 'File size limit exceeded.';
        break;
    }
    
    const appError = new AppError(message, 400);
    return next(appError);
  }
  
  next(error);
};

/**
 * Custom API Error Class
 * Extends Error class with additional properties
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async Error Wrapper
 * Wraps async route handlers to catch errors
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function with error handling
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Handler
 * Handles routes that don't exist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(error);
};

/**
 * Global Error Handler
 * Catches all errors and handles them appropriately
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const globalErrorHandler = (error, req, res, next) => {
  error.statusCode = error.statusCode || 500;
  error.status = error.status || 'error';
  
  // Handle specific error types
  let handled = false;
  
  if (error.name === 'CastError') {
    handleCastErrorDB(error, req, res, next);
    handled = true;
  }
  
  if (error.code === 11000) {
    handleDuplicateFieldsDB(error, req, res, next);
    handled = true;
  }
  
  if (error.name === 'ValidationError') {
    handleValidationErrorDB(error, req, res, next);
    handled = true;
  }
  
  if (error.name === 'JsonWebTokenError') {
    handleJWTError(error, req, res, next);
    handled = true;
  }
  
  if (error.name === 'TokenExpiredError') {
    handleJWTExpiredError(error, req, res, next);
    handled = true;
  }
  
  if (error.name === 'MongoError') {
    handleMongooseError(error, req, res, next);
    handled = true;
  }
  
  if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
    handleNetworkError(error, req, res, next);
    handled = true;
  }
  
  if (error.name === 'MulterError') {
    handleMulterError(error, req, res, next);
    handled = true;
  }
  
  if (error.name === 'RateLimitError') {
    handleRateLimitError(error, req, res, next);
    handled = true;
  }
  
  if (!handled) {
    // Use production or development error handler
    const handler = process.env.NODE_ENV === 'development' ? devErrors : prodErrors;
    handler(error, req, res, next);
  }
};

/**
 * Error Logger Middleware
 * Logs errors for debugging and monitoring
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorLogger = (error, req, res, next) => {
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      statusCode: error.statusCode
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type']
      },
      body: req.body,
      params: req.params,
      query: req.query
    },
    response: {
      statusCode: res.statusCode
    }
  });
  
  next(error);
};

/**
 * Error Response Structure
 * Standardizes error response format
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const standardizeErrorResponse = (error, req, res) => {
  const response = {
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };
  
  // Add additional error details in development mode
  if (process.env.NODE_ENV === 'development') {
    response.error.details = {
      stack: error.stack,
      body: req.body,
      params: req.params,
      query: req.query
    };
  }
  
  res.status(error.statusCode || 500).json(response);
};

/**
 * Error Metrics Middleware
 * Collects error metrics for monitoring
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const errorMetrics = (error, req, res, next) => {
  // In a real application, you would track these metrics
  const metrics = {
    errorType: error.constructor.name,
    statusCode: error.statusCode || 500,
    path: req.originalUrl,
    method: req.method,
    userAgent: req.headers['user-agent'],
    timestamp: new Date(),
    userId: req.user ? req.user._id : null
  };
  
  // Log metrics (in production, send to monitoring service)
  console.log('Error Metrics:', JSON.stringify(metrics, null, 2));
  
  next(error);
};

module.exports = {
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFoundHandler,
  errorLogger,
  errorMetrics,
  standardizeErrorResponse,
  handleAuthError,
  handleAuthzError,
  handleMongooseError,
  handleNetworkError,
  handleRateLimitError,
  handleMulterError
};