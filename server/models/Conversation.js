// Import required dependencies
const mongoose = require('mongoose');

/**
 * Conversation Schema for Real-time Chat
 * Manages chat conversations between buyers and sellers
 */
const conversationSchema = new mongoose.Schema({
  // Conversation identification
  conversationId: {
    type: String,
    unique: true,
    required: true,
    default: function() {
      return 'CONV_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
  },
  
  // Participants
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['buyer', 'seller'],
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leftAt: {
      type: Date,
      default: null
    },
    lastRead: {
      type: Date,
      default: Date.now
    },
    isTyping: {
      type: Boolean,
      default: false
    }
  }],
  
  // Product information (if related to a product)
  product: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Conversation metadata
  subject: {
    type: String,
    trim: true,
    maxlength: [100, 'Subject cannot exceed 100 characters']
  },
  
  // Last message information
  lastMessage: {
    message: String,
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'document', 'audio'],
      default: 'text'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Conversation status
  status: {
    type: String,
    enum: ['active', 'archived', 'closed', 'spam'],
    default: 'active'
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  // Tags
  tags: [{
    type: String,
    trim: true
  }],
  
  // Conversation statistics
  messageCount: {
    type: Number,
    default: 0
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  
  // Timeline
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  },
  archivedAt: Date,
  closedAt: Date,
  
  // Auto-archive settings
  autoArchive: {
    enabled: {
      type: Boolean,
      default: true
    },
    afterDays: {
      type: Number,
      default: 30
    }
  },
  
  // Business-related information
  businessType: {
    type: String,
    enum: ['inquiry', 'negotiation', 'support', 'complaint', 'other'],
    default: 'inquiry'
  },
  
  // Resolution status
  isResolved: {
    type: Boolean,
    default: false
  },
  
  // Resolution information
  resolvedAt: Date,
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolutionNotes: String,
  
  // Integration with other systems
  externalId: String, // For integration with CRM systems
  source: {
    type: String,
    enum: ['web', 'mobile', 'api', 'email'],
    default: 'web'
  },
  
  // Attachments and media
  hasAttachments: {
    type: Boolean,
    default: false
  },
  attachmentCount: {
    type: Number,
    default: 0
  },
  
  // Administrative notes
  adminNotes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Conversation workflow
  workflow: [{
    stage: {
      type: String,
      enum: ['new', 'assigned', 'in_progress', 'awaiting_response', 'resolved', 'closed'],
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String,
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
conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ 'participants.role': 1 });
conversationSchema.index({ product: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastActivityAt: -1 });
conversationSchema.index({ priority: 1 });
conversationSchema.index({ startedAt: -1 });

// Virtual for other participant
conversationSchema.virtual('otherParticipant', {
  ref: 'User',
  localField: 'participants',
  foreignField: '_id',
  justOne: true,
  options: {
    $or: [
      { 'participants.user': { $ne: 'CURRENT_USER_ID' } }
    ]
  }
});

// Virtual for unread messages
conversationSchema.virtual('unreadMessages', function() {
  return this.participants.reduce((total, participant) => {
    if (participant.user !== 'CURRENT_USER_ID') {
      return total + this.calculateUnreadForUser(participant.user);
    }
    return total;
  }, 0);
});

// Virtual for participant details
conversationSchema.virtual('participantDetails', {
  ref: 'User',
  localField: 'participants.user',
  foreignField: '_id'
});

// Method to add participant
conversationSchema.methods.addParticipant = function(userId, role) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (!existingParticipant) {
    this.participants.push({
      user: userId,
      role: role,
      joinedAt: new Date()
    });
    this.lastActivityAt = new Date();
  }
  
  return this.save();
};

// Method to remove participant
conversationSchema.methods.removeParticipant = function(userId) {
  const participantIndex = this.participants.findIndex(
    p => p.user.toString() === userId.toString()
  );
  
  if (participantIndex !== -1) {
    this.participants[participantIndex].leftAt = new Date();
  }
  
  return this.save();
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function(messageData) {
  this.lastMessage = {
    message: messageData.message,
    senderId: messageData.senderId,
    messageType: messageData.messageType || 'text',
    timestamp: new Date(),
    readBy: []
  };
  
  this.messageCount += 1;
  this.lastActivityAt = new Date();
  this.status = 'active';
  
  return this.save();
};

// Method to mark as read
conversationSchema.methods.markAsRead = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.lastRead = new Date();
    
    // Update last message read status
    if (this.lastMessage) {
      const readEntry = this.lastMessage.readBy.find(
        r => r.user.toString() === userId.toString()
      );
      
      if (!readEntry) {
        this.lastMessage.readBy.push({
          user: userId,
          readAt: new Date()
        });
      }
    }
    
    this.lastActivityAt = new Date();
    return this.save();
  }
  
  throw new Error('Participant not found in conversation');
};

// Method to update participant typing status
conversationSchema.methods.updateTypingStatus = function(userId, isTyping) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant) {
    participant.isTyping = isTyping;
    return this.save();
  }
  
  throw new Error('Participant not found in conversation');
};

// Method to calculate unread messages for a user
conversationSchema.methods.calculateUnreadForUser = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
  
  if (participant && this.lastMessage) {
    const lastReadTime = participant.lastRead || this.startedAt;
    const messagesSinceLastRead = this.messageCount - this.getMessageCountBefore(lastReadTime);
    return Math.max(0, messagesSinceLastRead);
  }
  
  return 0;
};

// Method to get message count before a specific time
conversationSchema.methods.getMessageCountBefore = function(timestamp) {
  // This would ideally be calculated from message collection
  // For now, return an approximation
  const messagesBefore = this.messageCount * 0.3; // Simplified approximation
  return Math.max(0, messagesBefore);
};

// Method to archive conversation
conversationSchema.methods.archiveConversation = function() {
  this.status = 'archived';
  this.archivedAt = new Date();
  return this.save();
};

// Method to close conversation
conversationSchema.methods.closeConversation = function(resolvedBy, resolutionNotes) {
  this.status = 'closed';
  this.isResolved = true;
  this.resolvedAt = new Date();
  this.resolvedBy = resolvedBy;
  this.resolutionNotes = resolutionNotes;
  this.closedAt = new Date();
  
  // Add to workflow
  this.workflow.push({
    stage: 'closed',
    resolvedBy: resolvedBy,
    notes: resolutionNotes,
    timestamp: new Date()
  });
  
  return this.save();
};

// Method to add admin note
conversationSchema.methods.addAdminNote = function(note, adminId) {
  this.adminNotes.push({
    note: note,
    addedBy: adminId,
    addedAt: new Date()
  });
  return this.save();
};

// Method to add to workflow
conversationSchema.methods.addToWorkflow = function(stage, notes, assignedTo) {
  this.workflow.push({
    stage: stage,
    assignedTo: assignedTo,
    notes: notes,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to get user conversations
conversationSchema.statics.getUserConversations = function(userId, filters = {}) {
  const query = {
    'participants.user': userId,
    status: { $in: ['active', 'archived'] }
  };
  
  if (filters.status) {
    query.status = filters.status;
  }
  
  if (filters.priority) {
    query.priority = filters.priority;
  }
  
  if (filters.businessType) {
    query.businessType = filters.businessType;
  }
  
  return this.find(query)
    .populate('participants.user', 'name email profileImage')
    .populate('product.productId', 'name images')
    .sort({ lastActivityAt: -1 });
};

// Static method to get conversation between users
conversationSchema.statics.getConversationBetweenUsers = function(user1Id, user2Id) {
  return this.findOne({
    'participants.user': { $all: [user1Id, user2Id] },
    status: 'active'
  }).populate('participants.user', 'name email profileImage');
};

// Static method to get unread conversations count
conversationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    'participants.user': userId,
    'participants.lastRead': { $lte: new Date() }
  });
};

module.exports = mongoose.model('Conversation', conversationSchema);