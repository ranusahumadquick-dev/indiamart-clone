import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    askedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true, trim: true, maxlength: 500 },
    answer: { type: String, trim: true, maxlength: 1000 },
    answeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    answeredAt: { type: Date },
    isPublic: { type: Boolean, default: true },
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

questionSchema.index({ product: 1, createdAt: -1 });
questionSchema.index({ seller: 1, answer: 1 });

const Question = mongoose.model("Question", questionSchema);
export default Question;
