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
    verificationRequested: { type: Boolean, default: false },
    verificationRequestedAt: { type: Date },
    verificationNote: { type: String, trim: true }, // seller's note when requesting

    // --- Tokens ---
    refreshToken: { type: String, select: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpiry: { type: Date, select: false },

    // --- Status ---
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },

    // --- Seller Advanced Profile ---
    annualTurnover: {
      type: String,
      enum: ["below_1cr", "1_5cr", "5_10cr", "10_50cr", "50_100cr", "above_100cr", ""],
      default: "",
    },
    employeeCount: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "500+", ""],
      default: "",
    },
    exportCapability: {
      type: String,
      enum: ["domestic_only", "export_only", "both", ""],
      default: "",
    },
    mainProducts: [{ type: String, trim: true, maxlength: 100 }],
    certifications: [{ type: String, trim: true, maxlength: 100 }],
    certificationDocs: [
      {
        name:          { type: String, required: true, trim: true, maxlength: 200 },
        issuingBody:   { type: String, trim: true, maxlength: 200, default: "" },
        certNumber:    { type: String, trim: true, maxlength: 100, default: "" },
        issuedDate:    { type: Date },
        expiryDate:    { type: Date },
        imageUrl:      { type: String, default: "" },
        publicId:      { type: String, default: "" },
        fileType:      { type: String, enum: ["image", "pdf"], default: "image" },
        isAdminVerified: { type: Boolean, default: false },
      },
    ],
    socialLinks: {
      linkedin:  { type: String, trim: true, default: "" },
      facebook:  { type: String, trim: true, default: "" },
      instagram: { type: String, trim: true, default: "" },
    },

    // --- WhatsApp Contact ---
    whatsapp: {
      number: {
        type: String,
        trim: true,
        match: [/^[6-9]\d{9}$/, "Please enter a valid Indian WhatsApp number"],
        default: "",
      },
      isVerified: { type: Boolean, default: false },
      verifiedAt: { type: Date },
      displayOnProfile: { type: Boolean, default: false },
    },

    // --- Requirement Alerts ---
    requirementAlerts: {
      enabled: { type: Boolean, default: true },
      categories: [{ type: String, trim: true }], // Categories seller wants alerts for
      minBudget: { type: Number, default: 0 },
      maxBudget: { type: Number, default: 10000000 },
      preferredLocations: [{ type: String, trim: true }], // Cities seller wants to serve
    },
    paymentTerms: [{
      type: String,
      enum: ["advance", "lc", "dp", "da", "net30", "net60", "cod"],
    }],
    minOrderValue: { type: Number, min: 0, default: 0 },
    productionCapacity: { type: String, trim: true, maxlength: 200, default: "" },
    exportCountries: [{ type: String, trim: true }],
    tradeShows: [{ type: String, trim: true }],
    companyVideo: { type: String, trim: true, default: "" },   // YouTube URL or Cloudinary video
    virtualTourUrl: { type: String, trim: true, default: "" }, // 360° tour / second video link

    // --- Seller Metrics ---
    avgResponseTime: { type: Number, default: 0 }, // minutes
    replyCount: { type: Number, default: 0 },

    // --- Quick Reply Templates ---
    responseTemplates: [
      {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        title: {
          type: String,
          required: true,
          trim: true,
          maxlength: [50, "Template title cannot exceed 50 characters"],
        },
        content: {
          type: String,
          required: true,
          trim: true,
          maxlength: [500, "Template content cannot exceed 500 characters"],
        },
        category: {
          type: String,
          enum: ["general", "out_of_stock", "quote_ready", "delayed", "pending", "custom"],
          default: "general",
        },
        isPinned: { type: Boolean, default: false },
        usageCount: { type: Number, default: 0 },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // --- Notification Preferences ---
    notificationPreferences: {
      inquiryAlerts: { type: Boolean, default: true },
      replyNotifications: { type: Boolean, default: true },
      reminderNotifications: { type: Boolean, default: true },
      quotationAlerts: { type: Boolean, default: true },
      channels: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        whatsapp: { type: Boolean, default: false },
      },
    },

    // --- Trust Score ---
    trustScore: {
      overall: { type: Number, min: 0, max: 5, default: 0 },
      verification: { type: Number, min: 0, max: 1.5, default: 0 },
      responseMetrics: { type: Number, min: 0, max: 1.5, default: 0 },
      ratings: { type: Number, min: 0, max: 1.5, default: 0 },
      activity: { type: Number, min: 0, max: 0.5, default: 0 },
      lastUpdatedAt: { type: Date },
    },
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
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
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
