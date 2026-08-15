import mongoose from "mongoose";

const otpSessionSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    // No select:false — OtpSession is internal only, never sent to client
    otp: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts:    { type: Number, default: 0 },
    isVerified:  { type: Boolean, default: false },
    resendCount: { type: Number, default: 0 },
    lastSentAt:  { type: Date, default: Date.now },

    provider: {
      type: String,
      enum: ["msg91", "fast2sms", "dev", "none"],
      default: "none",
    },
  },
  { timestamps: true }
);

// TTL — MongoDB auto-deletes after expiresAt
otpSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
otpSessionSchema.index({ phone: 1, createdAt: -1 });

export default mongoose.model("OtpSession", otpSessionSchema);
