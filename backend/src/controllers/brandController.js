import Brand from '../models/Brand.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';

// ── GET ALL BRANDS (public, with optional seller filter) ──────────────────────
export const getAllBrands = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, sellerId } = req.query;
    const filter = { isActive: true };

    if (sellerId) filter.seller = sellerId;

    if (search && search.trim()) {
      filter.$or = [
        { brandName: { $regex: search, $options: 'i' } },
        { brandDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [brands, total] = await Promise.all([
      Brand.find(filter)
        .populate('seller', 'name companyName avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Brand.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        brands,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      }, 'Brands fetched successfully')
    );
  } catch (err) {
    next(err);
  }
};

// ── GET SINGLE BRAND (public) ─────────────────────────────────────────────────
export const getBrandById = async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, isActive: true })
      .populate('seller', 'name companyName avatar');
    if (!brand) throw new ApiError(404, 'Brand not found');
    return res.status(200).json(new ApiResponse(200, { brand }, 'Brand fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// ── GET MY BRANDS (seller) ────────────────────────────────────────────────────
export const getMyBrands = async (req, res, next) => {
  try {
    const brands = await Brand.find({ seller: req.user._id })
      .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, { brands }, 'Your brands fetched successfully'));
  } catch (err) {
    next(err);
  }
};

// ── CREATE BRAND ──────────────────────────────────────────────────────────────
export const createBrand = async (req, res, next) => {
  try {
    const { brandName, brandDescription, brandFeatures, website } = req.body;

    if (!brandName || !brandName.trim()) {
      throw new ApiError(400, 'Brand name is required');
    }

    const logo = req.file ? `/uploads/brands/${req.file.filename}` : '';

    const brand = await Brand.create({
      brandName:        brandName.trim(),
      brandDescription: brandDescription?.trim() || '',
      brandFeatures:    brandFeatures?.trim() || '',
      logo,
      website:          website?.trim() || '',
      seller:           req.user._id,
    });

    return res.status(201).json(new ApiResponse(201, { brand }, 'Brand created successfully'));
  } catch (err) {
    next(err);
  }
};

// ── UPDATE BRAND ──────────────────────────────────────────────────────────────
export const updateBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findOne({ _id: req.params.id, seller: req.user._id });
    if (!brand) throw new ApiError(404, 'Brand not found or unauthorized');

    const { brandName, brandDescription, brandFeatures, website } = req.body;

    if (brandName !== undefined) brand.brandName = brandName.trim();
    if (brandDescription !== undefined) brand.brandDescription = brandDescription.trim();
    if (brandFeatures !== undefined) brand.brandFeatures = brandFeatures.trim();
    if (website !== undefined) brand.website = website.trim();
    if (req.file) brand.logo = `/uploads/brands/${req.file.filename}`;

    await brand.save();
    return res.status(200).json(new ApiResponse(200, { brand }, 'Brand updated successfully'));
  } catch (err) {
    next(err);
  }
};

// ── DELETE BRAND ──────────────────────────────────────────────────────────────
export const deleteBrand = async (req, res, next) => {
  try {
    const brand = await Brand.findOneAndDelete({ _id: req.params.id, seller: req.user._id });
    if (!brand) throw new ApiError(404, 'Brand not found or unauthorized');
    return res.status(200).json(new ApiResponse(200, {}, 'Brand deleted successfully'));
  } catch (err) {
    next(err);
  }
};
