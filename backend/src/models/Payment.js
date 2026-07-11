import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  razorpayOrderId: {
    type: String,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    required: false // Only present after successful payment
  },
  razorpaySignature: {
    type: String,
    required: false // Only present after successful payment
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  paymentFor: {
    type: String,
    enum: ['subscription', 'product', 'listing', 'advertisement', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay', 'upi', 'card', 'netbanking', 'wallet'],
    default: 'razorpay'
  },
  metadata: {
    type: Object,
    default: {}
  },
  failedReason: {
    type: String
  },
  completedAt: {
    type: Date
  },
  failedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  invoiceUrl: {
    type: String
  },
  invoiceGeneratedAt: {
    type: Date
  },
  invoiceSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for user payments
paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ razorpayOrderId: 1, unique: true });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount}`;
});

// Virtual for status badge class
paymentSchema.virtual('statusBadgeClass').get(function() {
  switch (this.status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    case 'cancelled':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-yellow-100 text-yellow-800';
  }
});

// Method to update payment status
paymentSchema.methods.updateStatus = async function(status, additionalData = {}) {
  this.status = status;
  
  switch (status) {
    case 'completed':
      this.completedAt = new Date();
      break;
    case 'failed':
      this.failedAt = new Date();
      this.failedReason = additionalData.reason || 'Payment failed';
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
  }
  
  await this.save();
  return this;
};

// Method to mark as completed
paymentSchema.methods.markCompleted = async function() {
  return this.updateStatus('completed');
};

// Method to mark as failed
paymentSchema.methods.markFailed = async function(reason) {
  return this.updateStatus('failed', { reason });
};

// Method to mark as cancelled
paymentSchema.methods.markCancelled = async function() {
  return this.updateStatus('cancelled');
};

// Static method to find completed payments
paymentSchema.statics.findCompletedPayments = function(userId) {
  return this.find({ userId, status: 'completed' })
    .sort({ completedAt: -1 });
};

// Static method to find pending payments
paymentSchema.statics.findPendingPayments = function(userId) {
  return this.find({ userId, status: 'pending' })
    .sort({ createdAt: -1 });
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    }
  ]);

  const result = {
    total: 0,
    completed: { count: 0, totalAmount: 0 },
    pending: { count: 0, totalAmount: 0 },
    failed: { count: 0, totalAmount: 0 },
    cancelled: { count: 0, totalAmount: 0 }
  };

  stats.forEach(stat => {
    result.total += stat.count;
    result[stat._id] = {
      count: stat.count,
      totalAmount: stat.totalAmount
    };
  });

  return result;
};

// Static method to get monthly revenue
paymentSchema.statics.getMonthlyRevenue = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const result = await this.aggregate([
    {
      $match: {
        status: 'completed',
        completedAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  return result[0] || { totalAmount: 0, count: 0 };
};

// Static method to generate invoice number
paymentSchema.statics.generateInvoiceNumber = async function() {
  const year = new Date().getFullYear();
  const lastPayment = await this.findOne({ invoiceNumber: { $exists: true } })
    .sort({ createdAt: -1 });

  let sequence = 1;
  if (lastPayment && lastPayment.invoiceNumber) {
    const lastNum = parseInt(lastPayment.invoiceNumber.split('-').pop());
    sequence = lastNum + 1;
  }

  return `INV-${year}-${String(sequence).padStart(5, '0')}`;
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;