const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number,
    required: true,
    description: 'Duration in days'
  },
  features: [{
    type: String,
    required: true
  }],
  benefits: [{
    type: String,
    required: true
  }],
  limits: {
    maxProducts: {
      type: Number,
      default: 10
    },
    maxInquiriesPerDay: {
      type: Number,
      default: 50
    },
    maxImagesPerProduct: {
      type: Number,
      default: 5
    },
    featuredListings: {
      type: Number,
      default: 0
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    analytics: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Object,
    default: {}
  }
}, {
  timestamps: true
});

// Index for active plans
subscriptionPlanSchema.index({ isActive: 1, sortOrder: 1 });

// Virtual for formatted price
subscriptionPlanSchema.virtual('formattedPrice').get(function() {
  return `₹${this.price}/month`;
});

// Method to check if plan has specific feature
subscriptionPlanSchema.methods.hasFeature = function(feature) {
  return this.features.includes(feature);
};

// Static method to get popular plans
subscriptionPlanSchema.statics.getPopularPlans = function() {
  return this.find({ isActive: true, isPopular: true })
    .sort({ sortOrder: 1 });
};

// Static method to get all active plans
subscriptionPlanSchema.statics.getActivePlans = function() {
  return this.find({ isActive: true })
    .sort({ sortOrder: 1 });
};

// Static method to get plan by name
subscriptionPlanSchema.statics.getPlanByName = function(name) {
  return this.findOne({ name, isActive: true });
};

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

module.exports = SubscriptionPlan;