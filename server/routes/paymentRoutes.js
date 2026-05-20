const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const Subscription = require('../models/Subscription');
const SubscriptionPlan = require('../models/SubscriptionPlan');

/**
 * Get user's current subscription
 * @route GET /api/payments/subscription
 * @access Private
 */
const getSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Find active subscription for the user
  const subscription = await Subscription.findOne({ 
    user: userId, 
    status: 'active' 
  }).populate('subscriptionPlan', 'name price features duration description');
  
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'No active subscription found',
      data: null
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'Subscription retrieved successfully',
    data: subscription
  });
});

/**
 * Get available subscription plans
 * @route GET /api/payments/plans
 * @access Public
 */
const getSubscriptionPlans = asyncHandler(async (req, res) => {
  const plans = await SubscriptionPlan.find({ isActive: true }).sort({ price: 1 });
  
  res.status(200).json({
    success: true,
    message: 'Subscription plans retrieved successfully',
    data: plans
  });
});

/**
 * Create a new subscription
 * @route POST /api/payments/subscribe
 * @access Private
 */
const createSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { planId } = req.body;
  
  // Check if plan exists
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return res.status(404).json({
      success: false,
      message: 'Subscription plan not found',
      data: null
    });
  }
  
  // Check if user already has an active subscription
  const existingSubscription = await Subscription.findOne({ 
    user: userId, 
    status: 'active' 
  });
  
  if (existingSubscription) {
    return res.status(400).json({
      success: false,
      message: 'You already have an active subscription',
      data: null
    });
  }
  
  // Create new subscription
  const subscription = new Subscription({
    user: userId,
    subscriptionPlan: planId,
    status: 'active',
    startDate: new Date(),
    endDate: new Date(Date.now() + plan.duration * 24 * 60 * 60 * 1000), // duration in days
    features: plan.features
  });
  
  await subscription.save();
  
  res.status(201).json({
    success: true,
    message: 'Subscription created successfully',
    data: subscription
  });
});

/**
 * Cancel subscription
 * @route DELETE /api/payments/subscription
 * @access Private
 */
const cancelSubscription = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const subscription = await Subscription.findOne({ 
    user: userId, 
    status: 'active' 
  });
  
  if (!subscription) {
    return res.status(404).json({
      success: false,
      message: 'No active subscription found to cancel',
      data: null
    });
  }
  
  subscription.status = 'cancelled';
  subscription.cancelledAt = new Date();
  await subscription.save();
  
  res.status(200).json({
    success: true,
    message: 'Subscription cancelled successfully',
    data: subscription
  });
});

router.get('/subscription', protect, getSubscription);
router.get('/plans', getSubscriptionPlans);
router.post('/subscribe', protect, createSubscription);
router.delete('/subscription', protect, cancelSubscription);

module.exports = router;