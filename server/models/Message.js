// Import required dependencies
const mongoose = require('mongoose');

/**
 * Message Schema for Real-time Chat
 * Individual messages within conversations
 */
const messageSchema = new mongoose.Schema({
  // Message identification
  messageId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'MSG_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  
  // Conversation reference
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  // Sender information
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  senderName: {
    type: String,
    required: true,
    trim: true
  },
  senderEmail: {
    type: String,
    trim: true
  },
  senderRole: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: true
  },
  
  // Receiver information
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  receiverName: {
    type: String,
    required: true,
    trim: true
  },
  receiverEmail: {
    type: String,
    trim: true
  },
  receiverRole: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    required: true
  },
  
  // Message content
  message: {
    type: String,
    required: function() {
      return this.messageType === 'text' || !this.messageType;
    },
    trim: true,
    maxlength: [2000, 'Message cannot exceed 2000 characters']
  },
  
  // Message type and attachments
  messageType: {
    type: String,
    enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'system'],
    default: 'text'
  },
  
  // Media information
  media: [{
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['image', 'document', 'audio', 'video', 'file'],
      required: true
    },
    filename: String,
    size: Number,
    dimensions: {
      width: Number,
      height: Number,
      duration: Number
    },
    thumbnailUrl: String,
    altText: String,
    description: String
  }],
  
  // Message metadata
  subject: {
    type: String,
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['inquiry', 'response', 'negotiation', 'support', 'complaint', 'other'],
    default: 'inquiry'
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Delivery tracking
  deliveredAt: {
    type: Date,
    default: null
  },
  readAt: {
    type: Date,
    default: null
  },
  
  // Read receipts
  readReceipts: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    },
    deviceId: String
  }],
  
  // Message reactions
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    emoji: String,
    reactedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message editing
  isEdited: {
    type: Boolean,
    default: false
  },
  originalMessage: {
    type: String,
    trim: true
  },
  editedAt: {
    type: Date,
    default: null
  },
  
  // Message forwarding
  forwardedFrom: {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation'
    },
    messageId: String
  },
  isForwarded: {
    type: Boolean,
    default: false
  },
  
  // Message privacy
  isPrivate: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Message automation
  isAutomated: {
    type: Boolean,
    default: false
  },
  automatedTemplate: {
    type: String,
    trim: true
  },
  
  // Business context
  businessContext: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    orderId: String,
    invoiceNumber: String,
    quoteId: String
  },
  
  // Tags and keywords
  tags: [{
    type: String,
    trim: true
  }],
  
  // Administrative notes
  adminNotes: String,
  flaggedReason: {
    type: String,
    enum: ['spam', 'inappropriate', 'harassment', 'violates_policy']
  },
  
  // Compliance and audit
  encrypted: {
    type: Boolean,
    default: false
  },
  auditLog: [{
    action: {
      type: String,
      enum: ['created', 'edited', 'deleted', 'reacted', 'forwarded'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  
  // Message scheduling
  scheduledFor: Date,
  isScheduled: {
    type: Boolean,
    default: false
  },
  
  // Message actions
  actions: [{
    type: {
      type: String,
      enum: ['button_click', 'link_click', 'file_download', 'call'],
      required: true
    },
    data: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true
  }
});

// Indexes for performance
messageSchema.index({ conversationId: 1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ receiverId: 1 });
messageSchema.index({ senderId: 1, conversationId: 1 });
messageSchema.index({ receiverId: 1, conversationId: 1 });
messageSchema.index({ messageType: 1 });
messageSchema.index({ status: 1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ 'businessContext.productId': 1 });

// Virtual for conversation details
messageSchema.virtual('conversationDetails', {
  ref: 'Conversation',
  localField: 'conversationId',
  foreignField: '_id',
  justOne: true
});

// Virtual for sender details
messageSchema.virtual('senderDetails', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

// Virtual for receiver details
messageSchema.virtual('receiverDetails', {
  ref: 'User',
  localField: 'receiverId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to handle message editing
messageSchema.pre('save', function(next) {
  if (this.isModified('message') && this.isModified('createdAt')) {
    this.isEdited = true;
    this.originalMessage = this.message;
    this.editedAt = new Date();
  }
  
  next();
});

// Method to mark as delivered
messageSchema.methods.markAsDelivered = function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return this.save();
};

// Method to mark as read
messageSchema.methods.markAsRead = function(userId) {
  this.status = 'read';
  this.readAt = new Date();
  
  // Add to read receipts
  const existingReceipt = this.readReceipts.find(
    receipt => receipt.userId.toString() === userId.toString()
  );
  
  if (!existingReceipt) {
    this.readReceipts.push({
      userId: userId,
      readAt: new Date()
    });
  }
  
  return this.save();
};

// Method to add reaction
messageSchema.methods.addReaction = function(userId, emoji) {
  const existingReaction = this.reactions.find(
    reaction => reaction.userId.toString() === userId.toString()
  );
  
  if (existingReaction) {
    existingReaction.emoji = emoji;
    existingReaction.reactedAt = new Date();
  } else {
    this.reactions.push({
      userId: userId,
      emoji: emoji,
      reactedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove reaction
messageSchema.methods.removeReaction = function(userId) {
  this.reactions = this.reactions.filter(
    reaction => reaction.userId.toString() !== userId.toString()
  );
  return this.save();
};

// Method to delete message (soft delete)
messageSchema.methods.deleteMessage = function(userId) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = userId;
  return this.save();
};

// Method to forward message
messageSchema.methods.forwardMessage = function(conversationId, senderId) {
  return this.create({
    messageId: 'FWD_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
    conversationId: conversationId,
    senderId: senderId,
    originalMessage: this.message,
    isForwarded: true,
    forwardedFrom: {
      conversationId: this.conversationId,
      messageId: this.messageId
    }
  });
};

// Method to add action
messageSchema.methods.addAction = function(actionData) {
  this.actions.push({
    type: actionData.type,
    data: actionData.data,
    timestamp: new Date()
  });
  return this.save();
};

// Method to add audit log entry
messageSchema.methods.addAuditLog = function(action, userId, details = '') {
  this.auditLog.push({
    action: action,
    userId: userId,
    timestamp: new Date(),
    details: details
  });
  return this.save();
};

// Method to schedule message
messageSchema.methods.scheduleMessage = function(scheduledDate) {
  this.scheduledFor = scheduledDate;
  this.isScheduled = true;
  return this.save();
};

// Method to get unread count for a user
messageSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    receiverId: userId,
    status: 'delivered',
    isDeleted: false
  });
};

// Method to get conversation messages
messageSchema.statics.getConversationMessages = function(conversationId, userId, limit = 50, offset = 0) {
  return this.find({
    conversationId: conversationId,
    isDeleted: false
  })
  .populate('senderId', 'name email profileImage')
  .populate('receiverId', 'name email profileImage')
  .sort({ createdAt: 1 })
  .skip(offset)
  .limit(limit);
};

// Method to get user's messages
messageSchema.statics.getUserMessages = function(userId, filters = {}) {
  const query = {
    isDeleted: false,
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ]
  };
  
  if (filters.conversationId) {
    query.conversationId = filters.conversationId;
  }
  
  if (filters.messageType) {
    query.messageType = filters.messageType;
  }
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
  }
  
  return this.find(query)
    .populate('senderId', 'name email profileImage')
    .populate('receiverId', 'name email profileImage')
    .populate('conversationId', 'subject status lastMessage')
    .sort({ createdAt: -1 });
};

// Method to get message statistics
messageSchema.statics.getMessageStats = function(userId) {
  return this.aggregate([
    {
      $match: {
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ],
        isDeleted: false
      }
    },
    {
      $group: {
        _id: null,
        totalSent: {
          $sum: { $cond: [{ $eq: ['$senderId', userId] }, 1, 0] }
        },
        totalReceived: {
          $sum: { $cond: [{ $eq: ['$receiverId', userId] }, 1, 0] }
        },
        totalMedia: {
          $sum: { $cond: [{ $ne: ['$media', []] }, 1, 0] }
        },
        averageResponseTime: {
          $avg: {
            $cond: [
              { $and: [
                { $eq: ['$receiverId', userId] },
                { $ne: ['$status', 'sent'] }
              ]},
              { $subtract: ['$createdAt', new Date()] },
              null
            ]
          }
        }
      }
    }
  ]);
};

// Method to search messages
messageSchema.statics.searchMessages = function(userId, searchTerm) {
  return this.find({
    $or: [
      { senderId: userId },
      { receiverId: userId }
    ],
    message: { $regex: searchTerm, $options: 'i' },
    isDeleted: false
  })
  .populate('senderId', 'name email profileImage')
  .populate('receiverId', 'name email profileImage')
  .sort({ createdAt: -1 });
};

module.exports = mongoose.model('Message', messageSchema);