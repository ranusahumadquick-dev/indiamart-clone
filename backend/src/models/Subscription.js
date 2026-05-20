const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SubscriptionPlan',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  features: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'expired'],
    default: 'active'
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  cancelledAt: {
    type: Date
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  renewalDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for active subscriptions
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ plan: 1 });

// Virtual for days remaining
subscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for isExpired
subscriptionSchema.virtual('isExpired').get(function() {
  return new Date() > new Date(this.endDate);
});

// Virtual for isExpiringSoon
subscriptionSchema.virtual('isExpiringSoon').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - now;
  return diffTime > 0 && diffTime < (7 * 24 * 60 * 60 * 1000); // Less than 7 days
});

// Method to check subscription validity
subscriptionSchema.methods.isValid = function() {
  return this.status === 'active' && !this.isExpired;
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = async function() {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.autoRenew = false;
  await this.save();
  return this;
};

// Method to renew subscription
subscriptionSchema.methods.renew = async function(duration = null) {
  this.status = 'active';
  this.startDate = new Date();
  this.endDate = new Date(Date.now() + (duration || this.duration));
  this.cancelledAt = null;
  await this.save();
  return this;
};

// Static method to find active subscription by user
subscriptionSchema.statics.findActiveSubscription = function(userId) {
  return this.findOne({ userId, status: 'active' });
};

// Static method to find expired subscriptions
subscriptionSchema.statics.findExpiredSubscriptions = function() {
  return this.find({
    status: 'active',
    endDate: { $lt: new Date() }
  });
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;