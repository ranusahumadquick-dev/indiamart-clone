// Import required dependencies
const mongoose = require('mongoose');

/**
 * Subscription Schema for B2B Marketplace
 * Manages seller subscriptions and payment processing
 */
const subscriptionSchema = new mongoose.Schema({
  // Subscription identification
  subscriptionId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'SUB_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sellerEmail: {
    type: String,
    required: true,
    trim: true
  },
  sellerName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Subscription details
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    required: true
  },
  
  // Payment information
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount must be positive']
  },
  currency: {
    type: String,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR', 'GBP']
  },
  
  // Razorpay integration
  razorpayOrderId: {
    type: String,
    unique: true,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  
  // Payment status and timeline
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'bank_transfer', 'upi', 'card'],
    default: 'razorpay'
  },
  paymentGateway: {
    type: String,
    default: 'razorpay'
  },
  
  // Subscription timeline
  startDate: {
    type: Date,
    required: true,
    default: function() {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      return now;
    }
  },
  endDate: {
    type: Date,
    required: true,
    default: function() {
      const now = new Date();
      now.setHours(23, 59, 59, 999);
      return now;
    }
  },
  
  // Subscription duration and renewal
  duration: {
    type: Number,
    required: true,
    min: [1, 'Duration must be at least 1']
  },
  durationUnit: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    required: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  renewalDate: {
    type: Date,
    default: null
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  
  // Plan features and limits
  features: {
    maxProducts: {
      type: Number,
      required: true
    },
    maxImages: {
      type: Number,
      required: true
    },
    featuredProducts: {
      type: Number,
      required: true
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    analyticsAccess: {
      type: Boolean,
      default: false
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    advancedSEO: {
      type: Boolean,
      default: false
    },
    whiteLabel: {
      type: Boolean,
      default: false
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    dedicatedAccountManager: {
      type: Boolean,
      default: false
    }
  },
  
  // Invoice and billing
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
  },
  invoiceUrl: {
    type: String,
    default: null
  },
  taxDetails: {
    gstNumber: String,
    taxAmount: {
      type: Number,
      default: 0
    },
    taxPercentage: {
      type: Number,
      default: 0
    }
  },
  discount: {
    amount: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    code: String,
    reason: String
  },
  
  // Payment processing
  paymentDate: {
    type: Date,
    default: null
  },
  paymentGatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  failureReason: {
    type: String,
    trim: true
  },
  
  // Subscription management
  cancelledAt: {
    type: Date,
    default: null
  },
  cancelledReason: {
    type: String,
    trim: true
  },
  refundedAt: {
    type: Date,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundReason: {
    type: String,
    trim: true
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Usage tracking
  currentUsage: {
    productCount: {
      type: Number,
      default: 0
    },
    featuredCount: {
      type: Number,
      default: 0
    },
    lastSyncAt: {
      type: Date,
      default: null
    }
  },
  
  // Notifications and alerts
  reminderSent: {
    type: Boolean,
    default: false
  },
  lastReminderSent: {
    type: Date,
    default: null
  },
  expiryAlertSent: {
    type: Boolean,
    default: false
  },
  cancellationRequested: {
    type: Boolean,
    default: false
  },
  cancellationRequestDate: {
    type: Date,
    default: null
  },
  
  // Compliance and audit
  complianceStatus: {
    type: String,
    enum: ['compliant', 'pending_review', 'non_compliant', 'requires_action'],
    default: 'compliant'
  },
  auditTrail: [{
    action: {
      type: String,
      enum: ['created', 'activated', 'renewed', 'cancelled', 'refunded', 'updated'],
      required: true
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  
  // Custom fields and metadata
  customFields: mongoose.Schema.Types.Mixed,
  tags: [{
    type: String,
    trim: true
  }],
  
  // Integration data
  externalSubscriptionId: String,
  integrationData: mongoose.Schema.Types.Mixed,
  
  // Notes and comments
  internalNotes: [{
    note: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Trial period
  isTrial: {
    type: Boolean,
    default: false
  },
  trialStartedAt: Date,
  trialEndedAt: Date,
  trialConvertedToPaid: {
    type: Boolean,
    default: false
  },
  trialConversionDate: Date
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// Indexes for performance
subscriptionSchema.index({ seller: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ startDate: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ razorpayOrderId: 1 });
subscriptionSchema.index({ invoiceNumber: 1 });
subscriptionSchema.index({ isTrial: 1 });

// Virtual for seller details
subscriptionSchema.virtual('sellerDetails', {
  ref: 'User',
  localField: 'seller',
  foreignField: '_id',
  justOne: true
});

// Virtual for subscription plan details
subscriptionSchema.virtual('planDetails', {
  ref: 'SubscriptionPlan',
  localField: 'plan',
  foreignField: 'planName',
  justOne: true
});

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
});

// Method to update subscription status
subscriptionSchema.methods.updateStatus = function(newStatus, paymentId = null, signature = null) {
  this.status = newStatus;
  
  if (paymentId) {
    this.razorpayPaymentId = paymentId;
    this.paymentDate = new Date();
  }
  
  if (signature) {
    this.razorpaySignature = signature;
  }
  
  this.lastSyncAt = new Date();
  
  return this.save();
};

// Method to process payment
subscriptionSchema.methods.processPayment = function(paymentData) {
  this.status = 'paid';
  this.razorpayPaymentId = paymentData.razorpay_payment_id;
  this.razorpaySignature = paymentData.razorpay_signature;
  this.paymentDate = new Date();
  this.paymentGatewayResponse = paymentData;
  this.lastSyncAt = new Date();
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'activated',
    performedBy: null, // System initiated
    timestamp: new Date(),
    details: `Payment processed via ${this.paymentGateway}`
  });
  
  return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancelSubscription = function(reason, cancelledBy) {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelledReason = reason;
  this.autoRenew = false;
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'cancelled',
    performedBy: cancelledBy,
    timestamp: new Date(),
    details: reason
  });
  
  return this.save();
}

// Method to refund subscription
subscriptionSchema.methods.refundSubscription = function(refundAmount, reason, refundedBy) {
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.refundAmount = refundAmount;
  this.refundReason = reason;
  
  // Add to audit trail
  this.auditTrail.push({
    action: 'refunded',
    performedBy: refundedBy,
    timestamp: new Date(),
    details: `Refund amount: ${refundAmount}, Reason: ${reason}`
  });
  
  return this.save();
};

// Method to update usage
subscriptionSchema.methods.updateUsage = function(usageData) {
  this.currentUsage = {
    ...this.currentUsage,
    ...usageData,
    lastSyncAt: new Date()
  };
  return this.save();
};

// Method to check if subscription is active
subscriptionSchema.methods.isActive = function() {
  const now = new Date();
  return this.status === 'paid' && new Date(this.endDate) > now;
};

// Method to check if subscription is expired
subscriptionSchema.methods.isExpired = function() {
  const now = new Date();
  return this.status === 'paid' && new Date(this.endDate) < now;
};

// Method to check if subscription is about to expire
subscriptionSchema.methods.isExpiringSoon = function(days = 7) {
  if (!this.isActive()) return false;
  
  const now = new Date();
  const endDate = new Date(this.endDate);
  const diffTime = endDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= days && diffDays > 0;
};

// Method to add internal note
subscriptionSchema.methods.addInternalNote = function(note, authorId) {
  this.internalNotes.push({
    note: note,
    author: authorId,
    timestamp: new Date()
  });
  return this.save();
};

// Method to add audit trail entry
subscriptionSchema.methods.addAuditTrail = function(action, performedBy, details = '') {
  this.auditTrail.push({
    action: action,
    performedBy: performedBy,
    timestamp: new Date(),
    details: details
  });
  return this.save();
};

// Method to calculate renewal date
subscriptionSchema.methods.calculateRenewalDate = function() {
  if (!this.isRecurring || this.status !== 'paid') return null;
  
  const renewalDate = new Date(this.endDate);
  
  switch (this.durationUnit) {
    case 'day':
      renewalDate.setDate(renewalDate.getDate() + this.duration);
      break;
    case 'week':
      renewalDate.setDate(renewalDate.getDate() + (this.duration * 7));
      break;
    case 'month':
      renewalDate.setMonth(renewalDate.getMonth() + this.duration);
      break;
    case 'year':
      renewalDate.setFullYear(renewalDate.getFullYear() + this.duration);
      break;
  }
  
  return renewalDate;
};

// Method to get subscription statistics
subscriptionSchema.statics.getSubscriptionStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$plan',
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
        totalRevenue: { $sum: '$amount' },
        averageDuration: { $avg: '$duration' }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Method to get active subscriptions
subscriptionSchema.statics.getActiveSubscriptions = function() {
  return this.find({
    status: 'paid',
    endDate: { $gt: new Date() }
  }).populate('seller', 'name email businessName');
};

// Method to get expiring subscriptions
subscriptionSchema.statics.getExpiringSubscriptions = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: 'paid',
    endDate: { $gte: new Date(), $lte: futureDate }
  }).populate('seller', 'name email businessName');
};

// Method to get seller's current subscription
subscriptionSchema.statics.getSellerCurrentSubscription = function(sellerId) {
  return this.findOne({
    seller: sellerId,
    status: 'paid',
    endDate: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Method to get trial subscriptions
subscriptionSchema.statics.getTrialSubscriptions = function() {
  return this.find({
    isTrial: true,
    status: 'paid',
    trialEndedAt: { $gt: new Date() }
  }).populate('seller', 'name email businessName');
};

module.exports = mongoose.model('Subscription', subscriptionSchema);