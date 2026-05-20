// Import required dependencies
const mongoose = require('mongoose');

/**
 * Product Schema for B2B Marketplace
 * Represents products sold by sellers to buyers
 */
const productSchema = new mongoose.Schema({
  // Product identification
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [200, 'Product name cannot exceed 200 characters']
  },
  
  // Product details
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  
  // Category information
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please select a category']
  },
  subcategory: {
    type: String,
    trim: true,
    maxlength: [100, 'Subcategory cannot exceed 100 characters']
  },
  
  // Pricing information
  minPrice: {
    type: Number,
    required: [true, 'Please provide minimum price'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  maxPrice: {
    type: Number,
    required: [true, 'Please provide maximum price'],
    min: [0, 'Price cannot be negative'],
    default: 0
  },
  
  // Product specifications
  unit: {
    type: String,
    required: [true, 'Please specify unit'],
    enum: [
      'kg', 'piece', 'meter', 'liter', 'ton', 'bag',
      'box', 'pack', 'dozen', 'gallon', 'milligram',
      'centimeter', 'gram', 'kilogram', 'litre', 'gallon'
    ],
    default: 'piece'
  },
  moq: {
    type: Number,
    required: [true, 'Please specify minimum order quantity'],
    min: [1, 'MOQ must be at least 1'],
    default: 1
  },
  
  // Product images
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    },
    alt_text: {
      type: String,
      trim: true
    }
  }],
  
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Location information
  location: {
    city: {
      type: String,
      required: [true, 'Please provide city'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'Please provide state'],
      trim: true
    },
    pincode: {
      type: String,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^\d{6}$/.test(v);
        },
        message: 'Please provide a valid pincode'
      }
    }
  },
  
  // Product status (for admin approval workflow)
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Product features
  isFeatured: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  
  // Performance tracking
  views: {
    type: Number,
    default: 0
  },
  
  // SEO and metadata
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot exceed 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },
  
  // Product tags for search
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  
  // Product specifications (additional details)
  specifications: {
    brand: String,
    model: String,
    warranty: String,
    manufactureDate: Date,
    expiryDate: Date,
    certifications: [String]
  },
  
  // Product quality
  qualityGrade: {
    type: String,
    enum: ['standard', 'premium', 'organic', 'certified', 'handmade'],
    default: 'standard'
  },
  
  // Bulk purchase incentives
  bulkDiscount: {
    isAvailable: {
      type: Boolean,
      default: false
    },
    minQuantity: Number,
    discountPercentage: {
      type: Number,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    }
  },
  
  // Delivery and shipping
  deliveryOptions: [{
    method: String,
    duration: String,
    cost: Number,
    freeShipping: {
      type: Boolean,
      default: false
    }
  }],
  
  // Compliance and regulation
  licenseNumber: String,
  safetyCertification: String,
  
  // Additional notes
  additionalNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Additional notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// Indexes for performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ seller: 1 });
productSchema.index({ status: 1 });
productSchema.index({ location: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ 'minPrice': 1, 'maxPrice': 1 });
productSchema.index({ moq: 1 });

// Virtual for average rating (if reviews are implemented)
productSchema.virtual('averageRating', {
  ref: 'Review',
  localField: 'seller',
  foreignField: 'seller',
  aggregate: [
    { $match: { status: 'approved' } },
    { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]
});

// Virtual for total enquiries
productSchema.virtual('enquiryCount', {
  ref: 'Enquiry',
  localField: '_id',
  foreignField: 'product',
  count: true
});

// Virtual for seller details
productSchema.virtual('sellerDetails', {
  ref: 'User',
  localField: 'seller',
  foreignField: '_id',
  justOne: true
});

// Method to increment views
productSchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

// Method to add tag
productSchema.methods.addTag = function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    return this.save();
  }
  return this;
};

// Static method to search products
productSchema.statics.searchProducts = function(query = {}, filters = {}) {
  const searchQuery = { ...query, status: 'approved' };
  
  // Add text search
  if (filters.search) {
    searchQuery.$text = { $search: filters.search };
  }
  
  // Add category filter
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  // Add price range filter
  if (filters.minPrice || filters.maxPrice) {
    searchQuery.minPrice = {};
    if (filters.minPrice) searchQuery.minPrice.$gte = filters.minPrice;
    if (filters.maxPrice) searchQuery.minPrice.$lte = filters.maxPrice;
  }
  
  // Add location filter
  if (filters.city) {
    searchQuery['location.city'] = new RegExp(filters.city, 'i');
  }
  if (filters.state) {
    searchQuery['location.state'] = new RegExp(filters.state, 'i');
  }
  
  // Add MOQ filter
  if (filters.moq) {
    searchQuery.moq = { $lte: filters.moq };
  }
  
  return this.find(searchQuery);
};

// Static method to get featured products
productSchema.statics.getFeatured = function() {
  return this.find({ 
    isFeatured: true, 
    status: 'approved',
    views: { $gt: 10 }
  })
  .sort({ views: -1 })
  .limit(8);
};

// Method to check if user is the seller
productSchema.methods.isOwnedBy = function(userId) {
  return this.seller.toString() === userId.toString();
};

module.exports = mongoose.model('Product', productSchema);