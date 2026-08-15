import mongoose from 'mongoose';

const brandSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
      index: true,
    },
    brandDescription: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    brandFeatures: {
      type: String,
      maxlength: [3000, 'Brand features cannot exceed 3000 characters'],
      default: '',
    },
    logo: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

brandSchema.index({ seller: 1, createdAt: -1 });

const Brand = mongoose.model('Brand', brandSchema);
export default Brand;
