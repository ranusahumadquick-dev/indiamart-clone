// Import required dependencies
const mongoose = require('mongoose');

/**
 * Enquiry Schema for B2B Marketplace
 * Represents buyer inquiries about products
 */
const enquirySchema = new mongoose.Schema({
  // Product information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Please specify the product']
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  
  // Seller information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the seller']
  },
  sellerEmail: {
    type: String,
    required: [true, 'Seller email is required'],
    trim: true
  },
  sellerPhone: {
    type: String,
    required: [true, 'Seller phone is required'],
    trim: true
  },
  
  // Buyer information
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify the buyer']
  },
  buyerName: {
    type: String,
    required: [true, 'Buyer name is required'],
    trim: true
  },
  buyerEmail: {
    type: String,
    required: [true, 'Buyer email is required'],
    trim: true
  },
  buyerPhone: {
    type: String,
    required: [true, 'Buyer phone is required'],
    trim: true
  },
  buyerCompany: {
    type: String,
    trim: true
  },
  
  // Enquiry details
  quantity: {
    type: Number,
    required: [true, 'Please specify quantity'],
    min: [1, 'Quantity must be at least 1']
  },
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
  message: {
    type: String,
    required: [true, 'Please provide your message'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  
  // Enquiry status workflow
  status: {
    type: String,
    enum: ['new', 'responded', 'closed', 'converted'],
    default: 'new'
  },
  
  // Seller response
  reply: {
    type: String,
    trim: true,
    maxlength: [1000, 'Reply cannot exceed 1000 characters']
  },
  replyTime: {
    type: Date,
    default: null
  },
  pricingQuote: {
    pricePerUnit: Number,
    totalPrice: Number,
    currency: {
      type: String,
      default: 'INR'
    },
    validUntil: Date,
    notes: String
  },
  
  // Additional buyer details
  deliveryLocation: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    landmark: String
  },
  deliveryTimeline: {
    requiredBy: Date,
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  },
  
  // Budget information
  budget: {
    minAmount: Number,
    maxAmount: Number,
    currency: {
      type: String,
      default: 'INR'
    }
  },
  
  // Quality and specifications
  qualityRequirements: {
    standards: [String],
    certifications: [String],
    testingRequired: {
      type: Boolean,
      default: false
    }
  },
  
  // Negotiation details
  negotiationNotes: {
    type: String,
    trim: true
  },
  discountRequested: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot exceed 100%']
  },
  
  // Communication history
  communicationHistory: [{
    type: {
      type: String,
      enum: ['buyer_message', 'seller_reply', 'system_notification'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    attachments: [String]
  }],
  
  // Metadata
  source: {
    type: String,
    enum: ['direct', 'email', 'phone', 'chat'],
    default: 'direct'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Follow-up information
  followUpDate: Date,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Closing information
  closedReason: {
    type: String,
    enum: ['converted', 'not_interested', 'budget_issue', 'timeline_issue', 'other'],
    default: null
  },
  closedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  closedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// Indexes for performance
enquirySchema.index({ product: 1 });
enquirySchema.index({ seller: 1 });
enquirySchema.index({ buyer: 1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ buyerEmail: 1 });
enquirySchema.index({ sellerEmail: 1 });
enquirySchema.index({ 'deliveryLocation.city': 1 });
enquirySchema.index({ 'deliveryLocation.state': 1 });

// Virtual for product details
enquirySchema.virtual('productDetails', {
  ref: 'Product',
  localField: 'product',
  foreignField: '_id',
  justOne: true
});

// Virtual for buyer details
enquirySchema.virtual('buyerDetails', {
  ref: 'User',
  localField: 'buyer',
  foreignField: '_id',
  justOne: true
});

// Virtual for seller details
enquirySchema.virtual('sellerDetails', {
  ref: 'User',
  localField: 'seller',
  foreignField: '_id',
  justOne: true
});

// Virtual for response time
enquirySchema.virtual('responseTime').get(function() {
  if (this.replyTime && this.createdAt) {
    return this.replyTime - this.createdAt;
  }
  return null;
});

// Method to add communication
enquirySchema.methods.addCommunication = function(communicationData) {
  this.communicationHistory.push(communicationData);
  return this.save();
};

// Method to update status
enquirySchema.methods.updateStatus = function(newStatus, reply = '') {
  this.status = newStatus;
  if (reply) {
    this.reply = reply;
    this.replyTime = new Date();
  }
  
  // Update communication history
  this.addCommunication({
    type: reply ? 'seller_reply' : 'system_notification',
    message: reply || `Status updated to ${newStatus}`,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to add follow-up
enquirySchema.methods.addFollowUp = function(date) {
  this.followUpDate = date;
  this.priority = 'high'; // Mark as high priority when follow-up scheduled
  return this.save();
};

// Method to close enquiry
enquirySchema.methods.closeEnquiry = function(reason, closedBy) {
  this.status = 'closed';
  this.closedReason = reason;
  this.closedBy = closedBy;
  this.closedAt = new Date();
  return this.save();
};

// Static method to get seller's enquiries
enquirySchema.statics.getSellerEnquiries = function(sellerId, filters = {}) {
  const query = { seller: sellerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.priority) {
    query.priority = filters.priority;
  }
  
  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
  }
  
  return this.find(query)
    .populate('product', 'name images seller')
    .populate('buyer', 'name email company')
    .sort({ createdAt: -1 });
};

// Static method to get buyer's enquiries
enquirySchema.statics.getBuyerEnquiries = function(buyerId, filters = {}) {
  const query = { buyer: buyerId };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.fromDate || filters.toDate) {
    query.createdAt = {};
    if (filters.fromDate) query.createdAt.$gte = new Date(filters.fromDate);
    if (filters.toDate) query.createdAt.$lte = new Date(filters.toDate);
  }
  
  return this.find(query)
    .populate('product', 'name images seller')
    .populate('seller', 'name email businessName')
    .sort({ createdAt: -1 });
};

// Static method to get enquiry statistics
enquirySchema.statics.getEnquiryStats = function() {
  return this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: {
          $avg: {
            $cond: [
              { $and: [{ $ne: ['$replyTime', null] }, { $ne: ['$createdAt', null] }] },
              { $subtract: ['$replyTime', '$createdAt'] },
              null
            ]
          }
        }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);
};

// Method to check if enquiry is new
enquirySchema.methods.isNewEnquiry = function() {
  return this.status === 'new' && this.communicationHistory.length <= 1;
};

// Method to get latest communication
enquirySchema.methods.getLatestCommunication = function() {
  return this.communicationHistory[this.communicationHistory.length - 1];
};

module.exports = mongoose.model('Enquiry', enquirySchema);