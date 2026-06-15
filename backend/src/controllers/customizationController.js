import Customization from "../models/Customization.js";
import Product from "../models/Product.js";

// ────────────────────────────────────────────────────────────────────────────
// CREATE CUSTOMIZATION REQUEST
// ────────────────────────────────────────────────────────────────────────────

export const createCustomizationRequest = async (req, res) => {
  try {
    const { productId, quantity, message, oemRequirement, packagingRequirement } = req.body;
    const buyerId = req.user._id;

    // Validate required fields
    if (!productId || !quantity || !message) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: productId, quantity, message",
      });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Validate quantity
    if (parseInt(quantity) < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Prepare customization data
    const customizationData = {
      productId,
      buyerId,
      quantity: parseInt(quantity),
      message,
      oemRequirement: oemRequirement || "",
      packagingRequirement: packagingRequirement || "",
      updatedAt: new Date(),
    };

    // Handle file uploads with .fields() middleware
    // req.files is an object with keys: { logo: [...], attachment: [...] }
    if (req.files && req.files.logo && req.files.logo.length > 0) {
      customizationData.logoUrl = `/uploads/customizations/${req.files.logo[0].filename}`;
    }

    if (req.files && req.files.attachment && req.files.attachment.length > 0) {
      customizationData.attachmentUrls = req.files.attachment.map(
        (file) => `/uploads/customizations/${file.filename}`
      );
    }

    // Create customization request
    const customization = new Customization(customizationData);
    await customization.save();

    // Populate product and buyer info for response
    await customization.populate("productId", "name");
    await customization.populate("buyerId", "name email");

    res.status(201).json({
      success: true,
      message: "Customization request created successfully",
      data: {
        _id: customization._id,
        customizationId: customization._id,
        logoUrl: customization.logoUrl,
        status: customization.status,
        createdAt: customization.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating customization request:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create customization request",
      error: error.code || "INTERNAL_ERROR",
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET CUSTOMIZATION REQUESTS (FOR BUYER)
// ────────────────────────────────────────────────────────────────────────────

export const getBuyerCustomizations = async (req, res) => {
  try {
    const buyerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { buyerId };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const customizations = await Customization.find(query)
      .populate("productId", "name image price")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Customization.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        customizations,
        pagination: {
          current: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching customizations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customizations",
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// GET SINGLE CUSTOMIZATION REQUEST
// ────────────────────────────────────────────────────────────────────────────

export const getCustomizationById = async (req, res) => {
  try {
    const { id } = req.params;

    const customization = await Customization.findById(id)
      .populate("productId")
      .populate("buyerId", "name email phone");

    if (!customization) {
      return res.status(404).json({
        success: false,
        message: "Customization request not found",
      });
    }

    // Check authorization (buyer can see their own, admin/seller can see all)
    if (
      req.user._id.toString() !== customization.buyerId._id.toString() &&
      req.user.role !== "admin" &&
      req.user.role !== "seller"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this customization request",
      });
    }

    res.status(200).json({
      success: true,
      data: customization,
    });
  } catch (error) {
    console.error("Error fetching customization:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch customization",
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// UPDATE CUSTOMIZATION REQUEST (ADMIN/SELLER ONLY)
// ────────────────────────────────────────────────────────────────────────────

export const updateCustomizationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, sellerNotes, estimatedDelivery } = req.body;

    // Check authorization
    if (req.user.role !== "admin" && req.user.role !== "seller") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update customization requests",
      });
    }

    const customization = await Customization.findById(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        message: "Customization request not found",
      });
    }

    if (status) {
      if (!["pending", "in-progress", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }
      customization.status = status;
    }

    if (sellerNotes) customization.sellerNotes = sellerNotes;
    if (estimatedDelivery) customization.estimatedDelivery = new Date(estimatedDelivery);

    await customization.save();

    res.status(200).json({
      success: true,
      message: "Customization request updated successfully",
      data: customization,
    });
  } catch (error) {
    console.error("Error updating customization:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update customization request",
    });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// DELETE CUSTOMIZATION REQUEST
// ────────────────────────────────────────────────────────────────────────────

export const deleteCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    const customization = await Customization.findById(id);
    if (!customization) {
      return res.status(404).json({
        success: false,
        message: "Customization request not found",
      });
    }

    // Check authorization (buyer can delete their own, admin can delete any)
    if (
      req.user._id.toString() !== customization.buyerId.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this customization request",
      });
    }

    await Customization.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Customization request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting customization:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete customization request",
    });
  }
};
