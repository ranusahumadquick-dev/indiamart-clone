import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, "../../uploads/gallery");

const backendUrl = () => process.env.BACKEND_URL || "http://localhost:8000";

// GET /api/gallery/:sellerId — public
export const getSellerGallery = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const seller = await User.findById(sellerId).select("galleryImages companyName");
  if (!seller) throw new ApiError(404, "Seller not found");

  const gallery = (seller.galleryImages || [])
    .sort((a, b) => a.order - b.order)
    .map((img) => ({
      _id: img._id,
      url: img.url,
      caption: img.caption,
      category: img.category,
      isCover: img.isCover,
      order: img.order,
      uploadedAt: img.uploadedAt,
    }));

  return res.status(200).json(new ApiResponse(200, gallery, "Gallery fetched"));
});

// POST /api/gallery/upload — seller only
export const uploadGalleryImages = asyncHandler(async (req, res) => {
  const files = req.files;
  if (!files || files.length === 0) throw new ApiError(400, "No images uploaded");

  const { captions, categories } = req.body;
  const captionArr = captions
    ? Array.isArray(captions) ? captions : [captions]
    : [];
  const categoryArr = categories
    ? Array.isArray(categories) ? categories : [categories]
    : [];

  const seller = await User.findById(req.user._id);
  if (!seller) throw new ApiError(404, "Seller not found");

  const currentCount = (seller.galleryImages || []).length;
  if (currentCount + files.length > 50)
    throw new ApiError(400, `Max 50 gallery images allowed. You have ${currentCount} already.`);

  const newImages = files.map((file, idx) => ({
    url: `${backendUrl()}/uploads/gallery/${file.filename}`,
    filename: file.filename,
    caption: captionArr[idx] || "",
    category: categoryArr[idx] || "other",
    isCover: currentCount === 0 && idx === 0, // first ever image becomes cover
    order: currentCount + idx,
  }));

  seller.galleryImages.push(...newImages);
  await seller.save();

  return res.status(201).json(new ApiResponse(201, newImages, "Images uploaded successfully"));
});

// PATCH /api/gallery/:imageId — update caption/category/cover
export const updateGalleryImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const { caption, category, isCover } = req.body;

  const seller = await User.findById(req.user._id);
  if (!seller) throw new ApiError(404, "Seller not found");

  const img = seller.galleryImages.id(imageId);
  if (!img) throw new ApiError(404, "Image not found");

  if (caption !== undefined) img.caption = caption;
  if (category !== undefined) img.category = category;

  // If setting as cover, unset all others first
  if (isCover === true) {
    seller.galleryImages.forEach((i) => { i.isCover = false; });
    img.isCover = true;
  }

  await seller.save();
  return res.status(200).json(new ApiResponse(200, img, "Image updated"));
});

// DELETE /api/gallery/:imageId
export const deleteGalleryImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const seller = await User.findById(req.user._id);
  if (!seller) throw new ApiError(404, "Seller not found");

  const img = seller.galleryImages.id(imageId);
  if (!img) throw new ApiError(404, "Image not found");

  // Delete file from disk
  if (img.filename) {
    const filePath = path.join(uploadsDir, img.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  const wasCover = img.isCover;
  img.deleteOne();

  // If deleted image was cover, make first remaining one cover
  if (wasCover && seller.galleryImages.length > 0) {
    seller.galleryImages[0].isCover = true;
  }

  // Re-order remaining images
  seller.galleryImages.forEach((i, idx) => { i.order = idx; });
  await seller.save();

  return res.status(200).json(new ApiResponse(200, null, "Image deleted"));
});

// PATCH /api/gallery/reorder — { order: [id1, id2, id3, ...] }
export const reorderGalleryImages = asyncHandler(async (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) throw new ApiError(400, "order must be an array of image IDs");

  const seller = await User.findById(req.user._id);
  if (!seller) throw new ApiError(404, "Seller not found");

  order.forEach((id, idx) => {
    const img = seller.galleryImages.id(id);
    if (img) img.order = idx;
  });

  await seller.save();
  return res.status(200).json(new ApiResponse(200, null, "Gallery reordered"));
});
