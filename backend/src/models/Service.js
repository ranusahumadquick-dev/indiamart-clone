import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    serviceName: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [100, 'Service name cannot exceed 100 characters'],
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Raw Materials',
        'Manufacturing',
        'Electronics',
        'Textiles',
        'Chemicals',
        'Machinery',
        'Agriculture',
        'Packaging',
        'Quality Testing',
        'Logistics',
        'Other',
      ],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR'],
    },
    priceType: {
      type: String,
      enum: ['fixed', 'hourly', 'custom'],
      default: 'fixed',
    },
    provider: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Provider is required'],
        index: true,
      },
      companyName: String,
      businessType: String,
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      reviewCount: {
        type: Number,
        default: 0,
      },
      responseTime: String, // e.g., "< 2 hours"
      isVerified: {
        type: Boolean,
        default: false,
      },
    },
    images: [
      {
        url: String,
        alt: String,
      },
    ],
    deliveryTime: {
      type: Number, // in days
      required: [true, 'Delivery time is required'],
      min: 1,
    },
    revisions: Number, // number of revisions included
    features: [String], // additional features/benefits
    tags: [String],
    availability: {
      type: String,
      enum: ['available', 'unavailable', 'on-break'],
      default: 'available',
      index: true,
    },
    contact: {
      phone: String,
      email: String,
      preferredContact: {
        type: String,
        enum: ['phone', 'email', 'whatsapp', 'chat'],
      },
    },
    location: {
      city: String,
      state: String,
      country: {
        type: String,
        default: 'India',
      },
    },
    portfolio: [
      {
        title: String,
        description: String,
        image: String,
        link: String,
      },
    ],
    ratings: {
      average: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      total: {
        type: Number,
        default: 0,
      },
    },
    inquiries: {
      type: Number,
      default: 0,
    },
    orders: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'suspended'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for search and filtering
serviceSchema.index({ serviceName: 'text', description: 'text', category: 1 });
serviceSchema.index({ 'provider.userId': 1, isActive: 1 });
serviceSchema.index({ category: 1, availability: 1, price: 1 });

const Service = mongoose.model('Service', serviceSchema);

export default Service;
