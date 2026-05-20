// Import required dependencies
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Handles JWT token verification and user authentication
 */

/**
 * Verify JWT Token and Attach User to Request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is required.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account is banned. Please contact support.'
      });
    }
    
    // Check if user is verified (for sellers)
    if (user.role === 'seller' && !user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Seller account is not verified. Please wait for admin approval.'
      });
    }
    
    // Attach user to request object
    req.user = user;
    
    // Update user's last login time
    await user.updateLastLogin();
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }
    
    // Handle unexpected errors
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

/**
 * Check if User is a Seller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifySeller = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }
  
  if (req.user.role !== 'seller') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Seller privileges required.'
    });
  }
  
  next();
};

/**
 * Check if User is a Buyer
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyBuyer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }
  
  if (req.user.role !== 'buyer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Buyer privileges required.'
    });
  }
  
  next();
};

/**
 * Check if User is an Admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. User not authenticated.'
    });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

/**
 * Optional Authentication Middleware
 * Allows access whether user is authenticated or not
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without user
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && !user.isBanned) {
      req.user = user;
    }
    
    next();
    
  } catch (error) {
    // If token is invalid, continue without user
    console.log('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Check User Role (Flexible)
 * Allows multiple roles
 * @param {Array} roles - Array of allowed roles
 * @returns {Function} - Express middleware function
 */
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    
    next();
  };
};

/**
 * Check if User has Active Subscription
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyActiveSubscription = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'seller') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Seller privileges required.'
      });
    }
    
    // Check if user has active subscription
    const Subscription = require('../models/Subscription');
    const activeSubscription = await Subscription.getSellerCurrentSubscription(req.user._id);
    
    if (!activeSubscription) {
      return res.status(403).json({
        success: false,
        message: 'No active subscription found. Please subscribe to continue.'
      });
    }
    
    // Check if subscription is about to expire (within 7 days)
    if (activeSubscription.isExpiringSoon(7)) {
      return res.status(200).json({
        success: true,
        message: 'Warning: Your subscription is about to expire.',
        subscription: activeSubscription,
        daysRemaining: activeSubscription.daysRemaining
      });
    }
    
    req.subscription = activeSubscription;
    next();
    
  } catch (error) {
    console.error('Subscription verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking subscription status.'
    });
  }
};

/**
 * Check User's Permission for Specific Resource
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkOwnership = (resourceIdField) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    // Check if the resource belongs to the current user
    if (req.resource && req.resource[resourceIdField] !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to access this resource.'
      });
    }
    
    next();
  };
};

/**
 * Rate Limiting for Authentication Endpoints
 * Protects against brute force attacks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authRateLimiter = (req, res, next) => {
  const { email } = req.body;
  
  // Implement rate limiting logic here
  // This could be implemented using Redis or in-memory storage
  // For now, we'll proceed with a basic check
  
  const attempts = req.rateLimiter?.attempts || 0;
  
  if (attempts >= 5) {
    return res.status(429).json({
      success: false,
      message: 'Too many failed attempts. Please try again later.'
    });
  }
  
  next();
};

/**
 * Sanitize User Data
 * Removes sensitive information from user object before sending to client
 * @param {Object} user - User object
 * @returns {Object} - Sanitized user object
 */
const sanitizeUser = (user) => {
  const sanitized = user.toObject();
  delete sanitized.password;
  delete sanitized.__v;
  return sanitized;
};

/**
 * Protect Routes Middleware
 * Verifies JWT token and attaches user to request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const protect = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }
    
    // Extract token from header
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is required.'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account has been banned. Please contact support.'
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }
};

module.exports = {
  protect,
  verifyToken,
  verifySeller,
  verifyBuyer,
  verifyAdmin,
  optionalAuth,
  checkRole,
  verifyActiveSubscription,
  checkOwnership,
  authRateLimiter,
  sanitizeUser
};