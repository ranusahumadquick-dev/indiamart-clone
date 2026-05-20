/**
 * Authentication Controller
 * Handles all authentication-related operations for the B2B marketplace
 */

const User = require('../models/User');
const { ApiError, handleAuthError, handleAuthzError, handleNotFoundError, handleConflictError } = require('../middleware/apiErrorHandler');
const { wrapAsync } = require('../middleware/apiErrorHandler');
const { verifyAdmin } = require('../middleware/adminMiddleware');
const sendEmail = require('../utils/sendEmail');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

/**
 * Register a new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = wrapAsync(async (req, res, next) => {
  try {
    const { name, email, password, role, businessName, businessAddress, phone } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Missing required fields'
        }
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
        error: {
          type: 'CONFLICT_ERROR',
          message: 'Email already registered'
        }
      });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: role.toLowerCase(),
      businessName: role === 'seller' ? businessName : undefined,
      businessAddress: role === 'seller' ? businessAddress : undefined,
      phone: phone || undefined
    });
    
    // Save user to database
    await user.save();
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Send verification email for sellers
    if (role === 'seller' && user.emailVerificationToken) {
      await sendVerificationEmail(user);
    }
    
    // Send response without password
    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      isPremium: user.isPremium,
      createdAt: user.createdAt
    };
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: responseUser,
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = wrapAsync(async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Missing email or password'
        }
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'Invalid credentials'
        }
      });
    }
    
    // Check if user is banned
    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        message: 'Account has been banned. Please contact support.',
        error: {
          type: 'AUTHORIZATION_ERROR',
          message: 'Account banned'
        }
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'Invalid credentials'
        }
      });
    }
    
    // Generate tokens
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Send response without password
    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      isPremium: user.isPremium,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: responseUser,
        accessToken: token,
        refreshToken: refreshToken,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Logout user
 * @route POST /api/auth/logout
 * @access Private
 */
const logout = wrapAsync(async (req, res, next) => {
  try {
    // Invalidate token by adding to blacklist (in production, use Redis or similar)
    // For now, we'll just send a success response
    
    res.status(200).json({
      success: true,
      message: 'Logout successful',
      data: {}
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 * @access Public
 */
const refreshToken = wrapAsync(async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Missing refresh token'
        }
      });
    }
    
    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token',
          error: {
            type: 'AUTHENTICATION_ERROR',
            message: 'Invalid refresh token'
          }
        });
      }
      
      // Find user
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          error: {
            type: 'AUTHENTICATION_ERROR',
            message: 'User not found'
          }
        });
      }
      
      // Generate new tokens
      const newToken = generateToken(user._id);
      const newRefreshToken = generateRefreshToken(user._id);
      
      res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '1h'
        }
      });
      
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = wrapAsync(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Send response without password
    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      isPremium: user.isPremium,
      profile: {
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        phone: user.phone,
        bio: user.bio,
        website: user.website,
        socialLinks: user.socialLinks,
        profileImage: user.profileImage,
        logo: user.logo,
        gstNumber: user.gstNumber,
        panNumber: user.panNumber
      },
      subscription: {
        plan: user.subscriptionPlan,
        startDate: user.subscriptionStartDate,
        endDate: user.subscriptionEndDate,
        status: user.subscriptionStatus,
        features: user.subscriptionFeatures || []
      },
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: responseUser
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = wrapAsync(async (req, res, next) => {
  try {
    const allowedUpdates = [
      'name', 'phone', 'businessName', 'businessAddress', 
      'bio', 'website', 'socialLinks', 'gstNumber', 'panNumber'
    ];
    
    const updates = Object.keys(req.body);
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));
    
    if (!isValidOperation) {
      return res.status(400).json({
        success: false,
        message: 'Invalid updates',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid field updates'
        }
      });
    }
    
    // Find and update user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Apply updates
    updates.forEach(update => {
      user[update] = req.body[update];
    });
    
    await user.save();
    
    // Send response without password
    const responseUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      isBanned: user.isBanned,
      isPremium: user.isPremium,
      profile: {
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        phone: user.phone,
        bio: user.bio,
        website: user.website,
        socialLinks: user.socialLinks,
        profileImage: user.profileImage,
        logo: user.logo,
        gstNumber: user.gstNumber,
        panNumber: user.panNumber
      },
      updatedAt: user.updatedAt
    };
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: responseUser
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Change password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = wrapAsync(async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Missing passwords'
        }
      });
    }
    
    // Find user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        error: {
          type: 'AUTHENTICATION_ERROR',
          message: 'Invalid current password'
        }
      });
    }
    
    // Update password
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      data: {}
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 * @access Public
 */
const forgotPassword = wrapAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Missing email'
        }
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });
    
    // Send reset email
    const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
    
    const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;
    
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Token',
        message
      });
      
      res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        data: {}
      });
      
    } catch (error) {
      // Reset password token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      
      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
        error: {
          type: 'INTERNAL_ERROR',
          message: 'Email delivery failed'
        }
      });
    }
    
  } catch (error) {
    next(error);
  }
});

/**
 * Reset password
 * @route PUT /api/auth/reset-password/:token
 * @access Public
 */
const resetPassword = wrapAsync(async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide new password',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Missing password'
        }
      });
    }
    
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user by reset token
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid or expired token'
        }
      });
    }
    
    // Update password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    user.passwordChangedAt = new Date();
    await user.save();
    
    // Generate new tokens
    const tokenValue = generateToken(user._id);
    const refreshTokenValue = generateRefreshToken(user._id);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        },
        token: tokenValue,
        refreshToken: refreshTokenValue,
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Verify email
 * @route GET /api/auth/verify-email/:token
 * @access Public
 */
const verifyEmail = wrapAsync(async (req, res, next) => {
  try {
    const { token } = req.params;
    
    // Get hashed token
    const emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user by verification token
    const user = await User.findOne({
      emailVerificationToken,
      emailVerificationExpire: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Invalid or expired token'
        }
      });
    }
    
    // Mark email as verified
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 * @access Public
 */
const resendVerificationEmail = wrapAsync(async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Missing email'
        }
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: {
          type: 'NOT_FOUND',
          message: 'User not found'
        }
      });
    }
    
    // Check if already verified
    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified',
        error: {
          type: 'VALIDATION_ERROR',
          message: 'Email already verified'
        }
      });
    }
    
    // Generate new verification token
    user.emailVerificationToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();
    
    // Send verification email
    await sendVerificationEmail(user);
    
    res.status(200).json({
      success: true,
      message: 'Verification email sent successfully',
      data: {}
    });
    
  } catch (error) {
    next(error);
  }
});

/**
 * Send verification email helper function
 */
async function sendVerificationEmail(user) {
  const verificationToken = user.emailVerificationToken;
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
  
  const message = `Hello ${user.name},\n\nPlease verify your email by clicking the following link:\n\n${verificationUrl}\n\nThis link will expire in 24 hours.`;
  
  await sendEmail({
    email: user.email,
    subject: 'Email Verification',
    message
  });
}

/**
 * Generate JWT token
 */
function generateToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  });
}

/**
 * Generate refresh token
 */
function generateRefreshToken(id) {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  });
}

module.exports = {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerificationEmail
};