import mongoose from "mongoose";

const sellerShortlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, default: "", maxlength: 500, trim: true },
    collectionName: { type: String, default: "All", maxlength: 50, trim: true },
  },
  { timestamps: true }
);

sellerShortlistSchema.index({ user: 1, seller: 1 }, { unique: true });
sellerShortlistSchema.index({ user: 1, createdAt: -1 });

const SellerShortlist = mongoose.model("SellerShortlist", sellerShortlistSchema);
export default SellerShortlist;
