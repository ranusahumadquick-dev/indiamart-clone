// Import required dependencies
const mongoose = require('mongoose');

/**
 * Review Schema for B2B Marketplace
 * Allows buyers to rate and review sellers
 */
const reviewSchema = new mongoose.Schema({
  // Review identification
  reviewId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'REV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the seller'],
    index: true
  },
  sellerName: {
    type: String,
    required: [true, 'Seller name is required'],
    trim: true
  },
  
  // Buyer information
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the buyer'],
    index: true
  },
  buyerName: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true
  },
  
  // Rating information
  rating: {
    type: Number,
    required: [true, 'Please provide a rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
    enum: [1, 2, 3, 4, 5]
  },
  
  // Review content
  title: {
    type: String,
    required: [true, 'Please provide a review title'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Please provide review comment'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  },
  
  // Review verification and status
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  
  // Review categories
  aspects: [{
    aspect: {
      type: String,
      enum: ['quality', 'delivery', 'communication', 'pricing', 'support'],
      required: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    }
  }],
  
  // Review context
  relatedProduct: {
    type: String,
    trim: true
  },
  purchaseDate: {
    type: Date,
    default: null
  },
  
  // Review media
  images: [{
    url: String,
    alt: String
  }],
  purchaseProof: {
    url: String,
    type: {
      type: String,
      enum: ['invoice', 'order', 'payment', 'contract'],
      default: 'invoice'
    }
  },
  
  // Review status and moderation
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'flagged'],
    default: 'pending'
  },
  moderationReason: {
    type: String,
    trim: true
  },
  
  // Review helpfulness
  helpfulCount: {
    type: Number,
    default: 0
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  
  // Review response from seller
  sellerResponse: {
    message: {
      type: String,
      trim: true,
      maxlength: [500, 'Response cannot exceed 500 characters']
    },
    respondedAt: Date,
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  
  // Review metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'as', 'or']
  },
  
  // Review reporting
  reports: [{
    reason: {
      type: String,
      enum: ['spam', 'inappropriate', 'fake', 'harassment'],
      required: true
    },
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Review verification
  verificationMethod: {
    type: String,
    enum: ['email', 'phone', 'document', 'auto'],
    default: 'auto'
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// Indexes for performance
reviewSchema.index({ seller: 1 });
reviewSchema.index({ buyer: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ isApproved: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ 'sellerName': 1 });
reviewSchema.index({ 'buyerName': 1 });
reviewSchema.index({ helpfulCount: -1 });

// Virtual for average rating calculation
reviewSchema.virtual('averageAspectRating').get(function() {
  const aspectRatings = {};
  this.aspects.forEach(aspect => {
    if (!aspectRatings[aspect.aspect]) {
      aspectRatings[aspect.aspect] = { sum: 0, count: 1 };
    }
    aspectRatings[aspect.aspect].sum += aspect.rating;
    aspectRatings[aspect.aspect].count++;
  });
  
  const averages = {};
  Object.keys(aspectRatings).forEach(aspect => {
    averages[aspect] = aspectRatings[aspect].sum / aspectRatings[aspect].count;
  });
  
  return averages;
});

// Virtual for review details
reviewSchema.virtual('sellerDetails', {
  ref: 'User',
  localField: 'seller',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update seller rating
reviewSchema.pre('save', async function(next) {
  if (this.isModified('rating') || this.isModified('isApproved')) {
    try {
      const User = mongoose.model('User');
      const approvedReviews = await Review.find({
        seller: this.seller,
        isApproved: true
      });
      
      if (approvedReviews.length > 0) {
        const totalRating = approvedReviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / approvedReviews.length;
        
        await User.findByIdAndUpdate(this.seller, {
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalReviews: approvedReviews.length
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

// Method to add helpful vote
reviewSchema.methods.addHelpfulVote = function() {
  this.helpfulCount += 1;
  this.totalVotes += 1;
  return this.save();
};

// Method to add not helpful vote
reviewSchema.methods.addNotHelpfulVote = function() {
  this.totalVotes += 1;
  return this.save();
};

// Method to add report
reviewSchema.methods.addReport = function(reportData) {
  this.reports.push(reportData);
  if (this.reports.length >= 3) {
    this.status = 'flagged';
    this.moderationReason = 'Multiple reports';
  }
  return this.save();
};

// Method to approve review
reviewSchema.methods.approveReview = function(approvedBy) {
  this.isApproved = true;
  this.status = 'approved';
  this.verifiedAt = new Date();
  this.verifiedBy = approvedBy;
  return this.save();
};

// Method to reject review
reviewSchema.methods.rejectReview = function(reason, rejectedBy) {
  this.status = 'rejected';
  this.moderationReason = reason;
  this.verifiedAt = new Date();
  this.verifiedBy = rejectedBy;
  return this.save();
};

// Method to add seller response
reviewSchema.methods.addSellerResponse = function(message) {
  this.sellerResponse = {
    message: message,
    respondedAt: new Date(),
    isPublic: true
  };
  return this.save();
};

// Method to calculate overall rating
reviewSchema.methods.calculateOverallRating = function() {
  if (this.aspects.length === 0) return this.rating;
  
  const aspectTotal = this.aspects.reduce((sum, aspect) => sum + aspect.rating, 0);
  return (aspectTotal / this.aspects.length);
};

// Static method to get seller reviews with filters
reviewSchema.statics.getSellerReviews = function(sellerId, filters = {}) {
  const query = { 
    seller: sellerId,
    isApproved: true
  };
  
  if (filters.rating) {
    query.rating = filters.rating;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('buyer', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get review statistics
reviewSchema.statics.getReviewStats = function(sellerId) {
  return this.aggregate([
    {
      $match: { seller: sellerId, isApproved: true }
    },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Static method to calculate average rating
reviewSchema.statics.calculateAverageRating = function(sellerId) {
  return this.aggregate([
    {
      $match: { seller: sellerId, isApproved: true }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);
};

// Method to check if buyer has already reviewed this seller
reviewSchema.statics.hasReviewed = function(buyerId, sellerId) {
  return this.findOne({
    buyer: buyerId,
    seller: sellerId
  }).exec();
};

module.exports = mongoose.model('Review', reviewSchema);