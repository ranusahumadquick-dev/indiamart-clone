import Question from "../models/Question.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { createNotification } from "./notificationController.js";

// GET /questions/:productId — list all public questions for a product
export const getProductQuestions = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(20, parseInt(req.query.limit) || 10);
  const skip = (page - 1) * limit;

  const [questions, total] = await Promise.all([
    Question.find({ product: productId, isPublic: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("askedBy", "name avatar")
      .populate("answeredBy", "name companyName"),
    Question.countDocuments({ product: productId, isPublic: true }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { questions, total, page, pages: Math.ceil(total / limit) }, "Questions fetched")
  );
});

// POST /questions/:productId — buyer asks a question
export const askQuestion = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { question } = req.body;
  if (!question?.trim()) throw new ApiError(400, "Question text is required");

  const product = await Product.findById(productId).select("name seller isActive");
  if (!product || !product.isActive) throw new ApiError(404, "Product not found");

  const q = await Question.create({
    product: productId,
    seller: product.seller,
    askedBy: req.user._id,
    question: question.trim(),
  });

  const populated = await Question.findById(q._id).populate("askedBy", "name avatar");

  // Notify seller
  await createNotification({
    userId: product.seller,
    type: "general",
    title: "New question on your product",
    message: `${req.user.name} asked: "${question.slice(0, 80)}${question.length > 80 ? "…" : ""}"`,
    link: `/seller/questions`,
  });

  return res.status(201).json(new ApiResponse(201, populated, "Question submitted"));
});

// PUT /questions/:id/answer — seller answers a question
export const answerQuestion = asyncHandler(async (req, res) => {
  const { answer } = req.body;
  if (!answer?.trim()) throw new ApiError(400, "Answer text is required");

  const q = await Question.findById(req.params.id).populate("product", "name seller");
  if (!q) throw new ApiError(404, "Question not found");
  if (q.seller.toString() !== req.user._id.toString()) throw new ApiError(403, "Not authorized");

  q.answer = answer.trim();
  q.answeredBy = req.user._id;
  q.answeredAt = new Date();
  await q.save();

  const populated = await Question.findById(q._id)
    .populate("askedBy", "name avatar")
    .populate("answeredBy", "name companyName");

  // Notify buyer
  await createNotification({
    userId: q.askedBy,
    type: "general",
    title: "Your question was answered!",
    message: `${req.user.companyName || req.user.name} answered: "${answer.slice(0, 80)}${answer.length > 80 ? "…" : ""}"`,
    link: `/products/${q.product._id}#questions`,
  });

  return res.status(200).json(new ApiResponse(200, populated, "Answer posted"));
});

// DELETE /questions/:id — delete own question (or seller deletes any question on their product)
export const deleteQuestion = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) throw new ApiError(404, "Question not found");

  const isOwner = q.askedBy.toString() === req.user._id.toString();
  const isSeller = q.seller.toString() === req.user._id.toString();
  if (!isOwner && !isSeller) throw new ApiError(403, "Not authorized");

  await q.deleteOne();
  return res.status(200).json(new ApiResponse(200, {}, "Question deleted"));
});

// POST /questions/:id/upvote — toggle upvote
export const upvoteQuestion = asyncHandler(async (req, res) => {
  const q = await Question.findById(req.params.id);
  if (!q) throw new ApiError(404, "Question not found");

  const userId = req.user._id.toString();
  const alreadyUpvoted = q.upvotes.map((id) => id.toString()).includes(userId);

  if (alreadyUpvoted) {
    q.upvotes = q.upvotes.filter((id) => id.toString() !== userId);
  } else {
    q.upvotes.push(req.user._id);
  }
  await q.save();

  return res.status(200).json(new ApiResponse(200, { upvotes: q.upvotes.length, upvoted: !alreadyUpvoted }, "Upvote toggled"));
});

// GET /questions/seller — seller sees all unanswered questions across their products
export const getSellerQuestions = asyncHandler(async (req, res) => {
  const { answered, page = 1, limit = 20 } = req.query;
  const filter = { seller: req.user._id };
  if (answered === "false") filter.answer = { $exists: false };
  if (answered === "true") filter.answer = { $exists: true, $ne: "" };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [questions, total] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("askedBy", "name avatar")
      .populate("product", "name images"),
    Question.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, { questions, total, unanswered: await Question.countDocuments({ seller: req.user._id, answer: { $exists: false } }) }, "Seller questions fetched")
  );
});
