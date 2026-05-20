import mongoose from "mongoose";

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

// Method to get remaining features (for comparison)
subscriptionPlanSchema.methods.getRemainingFeatures = function(otherPlan) {
  const thisFeatures = new Set(this.features);
  const otherFeatures = new Set(otherPlan.features);
  return Array.from(otherFeatures).filter(feature => !thisFeatures.has(feature));
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

// Seed default subscription plans
const seedDefaultPlans = async () => {
  try {
    const count = await SubscriptionPlan.countDocuments();
    if (count === 0) {
      const plans = [
        {
          name: 'Free Plan',
          description: 'Start selling for free with basic features',
          price: 0,
          duration: 30,
          features: [
            'List up to 10 products',
            'Receive inquiries from buyers',
            'Basic seller profile',
            'Email support'
          ],
          benefits: [
            'No listing fees',
            'Access to buyer network',
            'Easy product management',
            'Customer support'
          ],
          limits: {
            maxProducts: 10,
            maxInquiriesPerDay: 20,
            maxImagesPerProduct: 3,
            featuredListings: 0,
            prioritySupport: false,
            analytics: false
          },
          isPopular: false,
          sortOrder: 0
        },
        {
          name: 'Basic Plan',
          description: 'Ideal for small businesses starting their online presence',
          price: 499,
          duration: 30,
          features: [
            'List up to 50 products',
            'Unlimited inquiries',
            'Priority seller profile',
            'Product analytics',
            'Email support',
            'Featured listings'
          ],
          benefits: [
            'Higher product visibility',
            'Advanced analytics',
            'Customer insights',
            'Featured product listings',
            'Priority customer support'
          ],
          limits: {
            maxProducts: 50,
            maxInquiriesPerDay: 100,
            maxImagesPerProduct: 5,
            featuredListings: 5,
            prioritySupport: true,
            analytics: true
          },
          isPopular: true,
          sortOrder: 1
        },
        {
          name: 'Premium Plan',
          description: 'For established businesses looking to maximize reach',
          price: 1499,
          duration: 30,
          features: [
            'Unlimited products',
            'Unlimited inquiries',
            'Premium seller profile',
            'Advanced analytics',
            'Priority support',
            'Unlimited featured listings',
            'SEO optimization',
            'API access'
          ],
          benefits: [
            'Maximum visibility',
            'Complete analytics suite',
            'SEO optimization tools',
            'API integration',
            '24/7 priority support',
            'Unlimited product listings'
          ],
          limits: {
            maxProducts: -1, // Unlimited
            maxInquiriesPerDay: -1, // Unlimited
            maxImagesPerProduct: 10,
            featuredListings: -1, // Unlimited
            prioritySupport: true,
            analytics: true
          },
          isPopular: false,
          sortOrder: 2
        }
      ];

      await SubscriptionPlan.insertMany(plans);
      console.log('Default subscription plans seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  }
};

export { SubscriptionPlan, seedDefaultPlans };