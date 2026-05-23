import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  planFor: {
    type: String,
    enum: ['seller', 'buyer', 'both'],
    default: 'seller'
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
    // Seller limits
    maxProducts: { type: Number, default: 10 },
    maxInquiriesPerDay: { type: Number, default: 50 },
    maxImagesPerProduct: { type: Number, default: 5 },
    featuredListings: { type: Number, default: 0 },
    prioritySupport: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    // Buyer limits
    maxDailyInquiries: { type: Number, default: 5 },
    bulkInquirySize: { type: Number, default: 3 },
    maxPriceAlerts: { type: Number, default: 3 },
    maxBuyRequirements: { type: Number, default: 1 },
    sampleRequestAccess: { type: Boolean, default: false },
    verifiedContactsAccess: { type: Boolean, default: false },
    tradeAssurance: { type: Boolean, default: false },
    dedicatedManager: { type: Boolean, default: false },
    rfqAccess: { type: Boolean, default: false },
    exportCatalogAccess: { type: Boolean, default: false },
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

    // Upsert buyer plans (always update to keep features fresh)
    const buyerPlans = [
      {
        name: 'Buyer Free',
        planFor: 'buyer',
        description: 'Start sourcing for free — no credit card needed',
        price: 0,
        duration: 30,
        features: [
          'Browse 8+ product categories',
          'Send up to 5 enquiries/day',
          'Post 1 Buy Requirement/month',
          'Rate & review suppliers',
          'Wishlist & product comparison',
          '3 price drop alerts',
          'Basic product Q&A',
        ],
        benefits: ['No cost to get started', 'Access to thousands of verified suppliers', 'Core sourcing tools included'],
        limits: {
          maxDailyInquiries: 5,
          bulkInquirySize: 3,
          maxPriceAlerts: 3,
          maxBuyRequirements: 1,
          sampleRequestAccess: false,
          verifiedContactsAccess: false,
          tradeAssurance: false,
          dedicatedManager: false,
          rfqAccess: false,
          exportCatalogAccess: false,
        },
        isPopular: false,
        sortOrder: 10
      },
      {
        name: 'Buyer Business',
        planFor: 'buyer',
        description: 'Unlock verified contacts & reach more suppliers faster',
        price: 299,
        duration: 30,
        features: [
          'Send up to 25 enquiries/day',
          'Bulk enquiry — contact 7 sellers at once',
          'Unlimited price drop alerts',
          'Post up to 10 Buy Requirements/month',
          'Request product samples before bulk order',
          'Verified supplier phone numbers & WhatsApp',
          '"Verified Buyer" badge — get priority responses',
          'RFQ to multiple suppliers simultaneously',
          'Saved supplier folders & notes',
          'Direct negotiation chat with sellers',
        ],
        benefits: [
          'Unlock verified direct contacts',
          'Get priority responses from suppliers',
          'Sample before committing to bulk',
          'Faster procurement with RFQ',
          'Unlimited price tracking',
        ],
        limits: {
          maxDailyInquiries: 25,
          bulkInquirySize: 7,
          maxPriceAlerts: -1,
          maxBuyRequirements: 10,
          sampleRequestAccess: true,
          verifiedContactsAccess: true,
          tradeAssurance: false,
          dedicatedManager: false,
          rfqAccess: true,
          exportCatalogAccess: false,
        },
        isPopular: true,
        sortOrder: 11
      },
      {
        name: 'Buyer Enterprise',
        planFor: 'buyer',
        description: 'End-to-end procurement suite for growing teams',
        price: 799,
        duration: 30,
        features: [
          'Unlimited daily enquiries',
          'Bulk enquiry to 10 sellers at once',
          'Unlimited Buy Requirements',
          'Trade Assurance — payment protection on all orders',
          'Dedicated Sourcing Manager (personal POC)',
          'Export supplier catalog — PDF & Excel',
          'Procurement analytics & spend dashboard',
          '3 team member seats',
          'Legal templates — NDA, Purchase Order, LOI',
          'Escrow payment protection',
          'Video call with supplier via platform',
          'Priority support — 4hr response SLA',
        ],
        benefits: [
          'Complete end-to-end procurement',
          'Trade assurance on every order',
          'Personal dedicated manager',
          'Team collaboration (3 seats)',
          'Procurement analytics & reporting',
        ],
        limits: {
          maxDailyInquiries: -1,
          bulkInquirySize: 10,
          maxPriceAlerts: -1,
          maxBuyRequirements: -1,
          sampleRequestAccess: true,
          verifiedContactsAccess: true,
          tradeAssurance: true,
          dedicatedManager: true,
          rfqAccess: true,
          exportCatalogAccess: true,
        },
        isPopular: false,
        sortOrder: 12
      }
    ];

    for (const plan of buyerPlans) {
      await SubscriptionPlan.findOneAndUpdate(
        { name: plan.name, planFor: 'buyer' },
        { $set: plan },
        { upsert: true, new: true }
      );
    }
    console.log('✅ Buyer subscription plans ready');
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
  }
};

export { SubscriptionPlan, seedDefaultPlans };