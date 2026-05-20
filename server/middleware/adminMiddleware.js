// Import required dependencies
const User = require('../models/User');

/**
 * Admin Middleware Collection
 * Handles various administrative access controls and permissions
 */

/**
 * Verify Admin Status
 * Checks if the current user is an admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Additional checks for admin accounts
    if (req.user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Admin account is banned.'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Admin verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during admin verification.'
    });
  }
};

/**
 * Verify Super Admin Status
 * Checks if the user has super admin privileges
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const verifySuperAdmin = async (req, res, next) => {
  try {
    // First check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. User not authenticated.'
      });
    }
    
    // Check if user has admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    // Check if user is super admin (can be identified by email or custom field)
    const superAdminEmails = process.env.SUPER_ADMIN_EMAILS 
      ? process.env.SUPER_ADMIN_EMAILS.split(',') 
      : ['admin@bazaarconnect.com'];
    
    if (!superAdminEmails.includes(req.user.email)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Super admin privileges required.'
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Super admin verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during super admin verification.'
    });
  }
};

/**
 * Admin Access Control for Specific Resources
 * Checks admin's permission to modify specific resources
 * @param {Object} resource - Resource object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const checkAdminAccess = (resource) => {
  return async (req, res, next) => {
    try {
      // Verify admin first
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      
      // Check if admin has permission for this resource
      if (resource && resource.createdBy && resource.createdBy.toString() !== req.user._id.toString()) {
        // Only super admins can modify other admin's resources
        if (resource.adminLevel === 'super') {
          const superAdminEmails = process.env.SUPER_ADMIN_EMAILS 
            ? process.env.SUPER_ADMIN_EMAILS.split(',') 
            : ['admin@bazaarconnect.com'];
          
          if (!superAdminEmails.includes(req.user.email)) {
            return res.status(403).json({
              success: false,
              message: 'Access denied. Cannot modify super admin resources.'
            });
          }
        }
      }
      
      next();
      
    } catch (error) {
      console.error('Admin access control error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during access control.'
      });
    }
  };
};

/**
 * Admin Action Logging Middleware
 * Logs admin actions for audit purposes
 * @param {String} actionType - Type of action being performed
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const logAdminAction = (actionType) => {
  return (req, res, next) => {
    // Skip logging for health checks and login
    if (req.originalUrl === '/api/health' || req.originalUrl.includes('/auth/')) {
      return next();
    }
    
    // Store original send method to intercept response
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      setTimeout(() => {
        const adminAction = {
          adminId: req.user._id,
          adminEmail: req.user.email,
          action: actionType,
          method: req.method,
          url: req.originalUrl,
          params: req.params,
          body: req.body,
          response: {
            status: res.statusCode,
            data: data
          },
          timestamp: new Date(),
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress
        };
        
        // Log to console (in production, you might use a logging service)
        console.log('Admin Action Log:', JSON.stringify(adminAction, null, 2));
        
        // You could also save this to a database collection
        // const AdminAction = mongoose.model('AdminAction', adminActionSchema);
        // AdminAction.create(adminAction);
        
      }, 0);
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

/**
 * Admin Statistics Middleware
 * Provides statistics about the system for admin dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const getAdminStats = async (req, res, next) => {
  try {
    // Get various statistics for admin dashboard
    const stats = {
      overview: await getSystemOverview(),
      users: await getUserStatistics(),
      products: await getProductStatistics(),
      revenues: await getRevenueStatistics(),
      recent: await getRecentActivities()
    };
    
    req.adminStats = stats;
    next();
    
  } catch (error) {
    console.error('Admin stats error:', error);
    return next(); // Don't block the request if stats fail
  }
};

/**
 * System Overview Statistics
 * @returns {Object} - System overview statistics
 */
async function getSystemOverview() {
  const User = require('../models/User');
  const Product = require('../models/Product');
  const Enquiry = require('../models/Enquiry');
  const Review = require('../models/Review');
  
  const [
    totalUsers,
    totalProducts,
    totalEnquiries,
    totalReviews,
    pendingProducts,
    pendingEnquiries
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments({ status: 'approved' }),
    Enquiry.countDocuments(),
    Review.countDocuments({ status: 'approved' }),
    Product.countDocuments({ status: 'pending' }),
    Enquiry.countDocuments({ status: 'new' })
  ]);
  
  return {
    totalUsers,
    totalProducts,
    totalEnquiries,
    totalReviews,
    pendingProducts,
    pendingEnquiries,
    systemUptime: process.uptime()
  };
}

/**
 * User Statistics
 * @returns {Object} - User statistics
 */
async function getUserStatistics() {
  const User = require('../models/User');
  
  const [
    totalSellers,
    verifiedSellers,
    totalBuyers,
    bannedUsers
  ] = await Promise.all([
    User.countDocuments({ role: 'seller' }),
    User.countDocuments({ role: 'seller', isVerified: true }),
    User.countDocuments({ role: 'buyer' }),
    User.countDocuments({ isBanned: true })
  ]);
  
  const thisMonthNewUsers = await User.countDocuments({
    createdAt: {
      $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    }
  });
  
  return {
    totalSellers,
    verifiedSellers,
    totalBuyers,
    bannedUsers,
    thisMonthNewUsers,
    verificationRate: totalSellers > 0 ? (verifiedSellers / totalSellers * 100).toFixed(2) : 0
  };
}

/**
 * Product Statistics
 * @returns {Object} - Product statistics
 */
async function getProductStatistics() {
  const Product = require('../models/Product');
  
  const [
    totalProducts,
    approvedProducts,
    pendingProducts,
    rejectedProducts,
    featuredProducts
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ status: 'approved' }),
    Product.countDocuments({ status: 'pending' }),
    Product.countDocuments({ status: 'rejected' }),
    Product.countDocuments({ isFeatured: true })
  ]);
  
  const totalViews = await Product.aggregate([
    { $group: { _id: null, totalViews: { $sum: '$views' } } }
  ]);
  
  return {
    totalProducts,
    approvedProducts,
    pendingProducts,
    rejectedProducts,
    featuredProducts,
    totalViews: totalViews[0]?.totalViews || 0
  };
}

/**
 * Revenue Statistics
 * @returns {Object} - Revenue statistics
 */
async function getRevenueStatistics() {
  const Subscription = require('../models/Subscription');
  
  const [
    totalRevenue,
    monthlyRevenue,
    activeSubscriptions,
    pendingPayments
  ] = await Promise.all([
    // Total revenue from all paid subscriptions
    Subscription.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    // Revenue from this month
    Subscription.aggregate([
      {
        $match: {
          status: 'paid',
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]),
    // Active subscriptions
    Subscription.countDocuments({ status: 'paid', endDate: { $gt: new Date() } }),
    // Pending payments
    Subscription.countDocuments({ status: 'pending' })
  ]);
  
  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    activeSubscriptions,
    pendingPayments,
    conversionRate: monthlyRevenue[0]?.total ? ((activeSubscriptions / monthlyRevenue[0].total) * 100).toFixed(2) : 0
  };
}

/**
 * Recent Activities
 * @returns {Object} - Recent activities
 */
async function getRecentActivities() {
  const Enquiry = require('../models/Enquiry');
  const Product = require('../models/Product');
  const Review = require('../models/Review');
  
  const [
    recentEnquiries,
    recentProducts,
    recentReviews
  ] = await Promise.all([
    Enquiry.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyer', 'name email')
      .populate('product', 'name'),
    Product.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('seller', 'name businessName'),
    Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('buyer', 'name')
      .populate('seller', 'name businessName')
  ]);
  
  return {
    recentEnquiries,
    recentProducts,
    recentReviews
  };
}

/**
 * Admin Permission Checker
 * Checks if admin has specific permissions
 * @param {Array} permissions - Array of required permissions
 * @returns {Function} - Middleware function
 */
const checkAdminPermissions = (permissions) => {
  return (req, res, next) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      
      // Check if admin has the required permissions
      // This would be stored in user's adminPermissions field
      const adminPermissions = req.user.adminPermissions || [];
      
      const hasPermission = permissions.every(permission => 
        adminPermissions.includes(permission)
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required permissions: ${permissions.join(', ')}`
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error during permission check.'
      });
    }
  };
};

/**
 * Bulk Action Middleware
 * Handles bulk operations with proper validation
 */
const handleBulkAction = async (req, res, next) => {
  try {
    const { ids, action } = req.body;
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid IDs for bulk operation.'
      });
    }
    
    if (!action) {
      return res.status(400).json({
        success: false,
        message: 'Please specify the action to perform.'
      });
    }
    
    // Validate action
    const allowedActions = [
      'approve', 'reject', 'delete', 'ban', 'unban',
      'verify', 'unverify', 'feature', 'unfeature'
    ];
    
    if (!allowedActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action specified.'
      });
    }
    
    // Add to request for controller to use
    req.bulkAction = { ids, action };
    next();
    
  } catch (error) {
    console.error('Bulk action validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during bulk operation validation.'
    });
  }
};

module.exports = {
  verifyAdmin,
  verifySuperAdmin,
  checkAdminAccess,
  logAdminAction,
  getAdminStats,
  checkAdminPermissions,
  handleBulkAction
};