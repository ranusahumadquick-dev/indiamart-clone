import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { USER_ROLE_ENUM } from "../constants/roles.js";

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // --- Basic Info ---
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Don't include password in queries by default
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      unique: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid Indian phone number"],
    },

    // --- Role & Type ---
    role: {
      type: String,
      enum: {
        values: USER_ROLE_ENUM,
        message: "Role must be buyer, seller, admin, or premium",
      },
      default: "buyer",
    },

    // --- Seller Specific ---
    companyName: {
      type: String,
      trim: true,
      maxlength: [200, "Company name cannot exceed 200 characters"],
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
      match: [
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
        "Please enter a valid GST number",
      ],
    },
    businessType: {
      type: String,
      enum: [
        "manufacturer",
        "wholesaler",
        "retailer",
        "distributor",
        "service_provider",
        "other",
      ],
    },
    yearEstablished: { type: Number },

    // --- Seller Profile Details ---
    profileCompleted: {
      type: Boolean,
      default: false, // Sellers must complete profile after signup
    },
    businessDescription: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    businessLogo: { type: String, default: "" }, // Cloudinary URL
    website: {
      type: String,
      trim: true,
      match: [/^(https?:\/\/)?.+/, "Please enter a valid website URL"],
    },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    pincode: { type: String, trim: true },

    // --- Profile ---
    avatar: { type: String, default: "" },
    addresses: [addressSchema],

    // --- Verification ---
    isVerified: { type: Boolean, default: false },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    // --- Tokens ---
    refreshToken: { type: String, select: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    // --- Status ---
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ========================================
// INDEXES
// ========================================
// email & phone already indexed via unique: true
userSchema.index({ role: 1 });
userSchema.index({ "addresses.city": 1 });

// ========================================
// VIRTUALS
// ========================================
// Virtual field: get all products by this seller
userSchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "seller",
  justOne: false,
});

// ========================================
// HOOKS — Run before/after certain operations
// ========================================

// Hash password BEFORE saving to database
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ========================================
// METHODS — Available on user documents
// ========================================

// Compare plain password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get public profile (exclude sensitive fields)
userSchema.methods.getPublicProfile = function () {
  const userObject = this.toObject();
  delete userObject.password;
  delete userObject.refreshToken;
  delete userObject.emailVerificationToken;
  delete userObject.passwordResetToken;
  delete userObject.passwordResetExpiry;
  return userObject;
};

const User = mongoose.model("User", userSchema);
export default User;
