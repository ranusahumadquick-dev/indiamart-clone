// Import required dependencies
const mongoose = require('mongoose');

/**
 * Category Schema for B2B Marketplace
 * Organizes products into hierarchical categories and subcategories
 */
const categorySchema = new mongoose.Schema({
  // Basic category information
  name: {
    type: String,
    required: [true, 'Please provide category name'],
    trim: true,
    maxlength: [100, 'Category name cannot exceed 100 characters'],
    unique: true
  },
  
  // Category visual identity
  icon: {
    type: String,
    required: [true, 'Please provide category icon'],
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^#[0-9A-F]{6}$/i.test(v);
      },
      message: 'Please provide a valid hex color code'
    }
  },
  
  // Category hierarchy
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  subcategories: [{
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
      maxlength: [50, 'Subcategory name cannot exceed 50 characters']
    },
    icon: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Subcategory description cannot exceed 200 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  // Category status and visibility
  isActive: {
    type: Boolean,
    default: true
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
  
  // Category specifications
  specifications: [{
    name: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['text', 'select', 'number', 'boolean'],
      default: 'text'
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [String] // For select type
  }],
  
  // Category statistics
  productCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Category attributes for filtering
  attributes: [{
    name: String,
    displayName: String,
    type: String,
    required: Boolean,
    defaultValue: String
  }],
  
  // Display order
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Tags and keywords
  tags: [{
    type: String,
    trim: true
  }],
  
  // Category description and help text
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Category description cannot exceed 1000 characters']
  },
  helpText: {
    type: String,
    trim: true,
    maxlength: [500, 'Help text cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// Indexes for performance
categorySchema.index({ name: 1, isActive: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ displayOrder: 1 });
categorySchema.index({ productCount: -1 });

// Virtual for parent category
categorySchema.virtual('parentCategoryDetails', {
  ref: 'Category',
  localField: 'parentCategory',
  foreignField: '_id',
  justOne: true
});

// Virtual for child categories
categorySchema.virtual('childCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  options: { isActive: true }
});

// Virtual for active subcategories
categorySchema.virtual('activeSubcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parentCategory',
  options: { isActive: true, 'subcategories.isActive': true }
});

// Virtual for category products
categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category'
});

// Virtual for active products count
categorySchema.virtual('activeProductCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  match: { status: 'approved' },
  count: true
});

// Pre-save middleware to update product count
categorySchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('parentCategory')) {
    // Update product count
    try {
      const Product = mongoose.model('Product');
      this.productCount = await Product.countDocuments({ 
        category: this._id,
        status: 'approved'
      });
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to add subcategory
categorySchema.methods.addSubcategory = function(subcategoryData) {
  this.subcategories.push(subcategoryData);
  return this.save();
};

// Method to update subcategory
categorySchema.methods.updateSubcategory = function(subcategoryIndex, updatedData) {
  if (subcategoryIndex >= 0 && subcategoryIndex < this.subcategories.length) {
    this.subcategories[subcategoryIndex] = {
      ...this.subcategories[subcategoryIndex],
      ...updatedData
    };
    return this.save();
  }
  throw new Error('Invalid subcategory index');
};

// Method to remove subcategory
categorySchema.methods.removeSubcategory = function(subcategoryIndex) {
  if (subcategoryIndex >= 0 && subcategoryIndex < this.subcategories.length) {
    this.subcategories.splice(subcategoryIndex, 1);
    return this.save();
  }
  throw new Error('Invalid subcategory index');
};

// Method to toggle category status
categorySchema.methods.toggleStatus = function() {
  this.isActive = !this.isActive;
  return this.save();
};

// Static method to get category hierarchy
categorySchema.statics.getCategoryHierarchy = function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'parentCategory',
        foreignField: '_id',
        as: 'parent'
      }
    },
    {
      $match: { isActive: true }
    },
    {
      $sort: { displayOrder: 1, name: 1 }
    }
  ]);
};

// Static method to get root categories
categorySchema.statics.getRootCategories = function() {
  return this.find({ 
    isActive: true,
    parentCategory: null
  }).sort({ displayOrder: 1, name: 1 });
};

// Static method to get category with subcategories
categorySchema.statics.getCategoryWithSubcategories = function(categoryId) {
  return this.findOne({
    _id: categoryId,
    isActive: true
  }).populate('parentCategory');
};

// Method to check if category has subcategories
categorySchema.methods.hasActiveSubcategories = function() {
  return this.subcategories.some(sub => sub.isActive);
};

// Virtual for total products in category and subcategories
categorySchema.virtual('totalProductCount', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
  match: { status: 'approved' },
  count: true
});

module.exports = mongoose.model('Category', categorySchema);