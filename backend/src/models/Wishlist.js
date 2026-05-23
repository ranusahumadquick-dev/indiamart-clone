import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    note: { type: String, default: "", maxlength: 500, trim: true },
    collectionName: { type: String, default: "All", maxlength: 50, trim: true },
  },
  { timestamps: true }
);

wishlistSchema.index({ user: 1, product: 1 }, { unique: true });
wishlistSchema.index({ user: 1, createdAt: -1 });

const Wishlist = mongoose.model("Wishlist", wishlistSchema);
export default Wishlist;
