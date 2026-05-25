import User from "../models/User.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Inquiry from "../models/Inquiry.js";
import Payment from "../models/Payment.js";
import SampleRequest from "../models/SampleRequest.js";
import Order from "../models/Order.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// ─── GET /admin/dashboard/analytics (Enhanced with period) ──────────────
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const { period = "30d" } = req.query;

  let daysBack = 30;
  if (period === "7d") daysBack = 7;
  else if (period === "90d") daysBack = 90;

  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - daysBack);

  const [
    userStats,
    productStats,
    revenueStats,
    categoryStats,
    pendingStats,
  ] = await Promise.all([
    // User growth
    User.aggregate([
      { $match: { createdAt: { $gte: dateFrom } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
          buyers: { $sum: { $cond: [{ $eq: ["$role", "buyer"] }, 1, 0] } },
          sellers: { $sum: { $cond: [{ $eq: ["$role", "seller"] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Product stats
    Product.aggregate([
      {
        $facet: {
          byDay: [
            { $match: { createdAt: { $gte: dateFrom } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
          byStatus: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: "$category",
                count: { $sum: 1 },
              },
            },
            { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "categoryName" } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
        },
      },
    ]),
    // Revenue stats
    Payment.aggregate([
      { $match: { createdAt: { $gte: dateFrom }, status: "completed" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    // Category stats
    Category.aggregate([
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "category",
          as: "products",
        },
      },
      {
        $project: {
          name: 1,
          productCount: { $size: "$products" },
          approvedCount: {
            $size: {
              $filter: { input: "$products", as: "p", cond: { $eq: ["$$p.status", "approved"] } },
            },
          },
          pendingCount: {
            $size: {
              $filter: { input: "$products", as: "p", cond: { $eq: ["$$p.status", "pending"] } },
            },
          },
        },
      },
      { $sort: { productCount: -1 } },
    ]),
    // Pending actions
    Product.aggregate([
      {
        $facet: {
          pendingProducts: [{ $match: { status: "pending" } }, { $count: "count" }],
          pendingVerifications: [
            { $lookup: { from: "users", localField: "seller", foreignField: "_id", as: "seller" } },
            { $match: { "seller.verificationRequested": true, "seller.isVerified": false } },
            { $count: "count" },
          ],
          bannedUsers: [{ $match: { isActive: false } }, { $count: "count" }],
        },
      },
    ]),
  ]);

  const pendingActionsData = pendingStats[0] || {};

  res.json(
    new ApiResponse(200, {
      period,
      daysBack,
      userGrowth: userStats,
      productStats: {
        byDay: productStats[0]?.byDay || [],
        byStatus: productStats[0]?.byStatus || [],
        byCategory: productStats[0]?.byCategory || [],
      },
      revenueGrowth: revenueStats,
      categoryStats,
      pendingActions: {
        products: pendingActionsData.pendingProducts?.[0]?.count || 0,
        verifications: pendingActionsData.pendingVerifications?.[0]?.count || 0,
        bannedUsers: pendingActionsData.bannedUsers?.[0]?.count || 0,
      },
    })
  );
});

// ─── GET /admin/dashboard ────────────────────────────────────────────
export const getDashboard = asyncHandler(async (req, res) => {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalUsers,
    totalProducts,
    totalCategories,
    totalInquiries,
    pendingApprovals,
    newThisMonth,
    totalRevenue,
    recentUsers,
    recentProducts,
    recentPayments,
  ] = await Promise.all([
    User.countDocuments(),
    Product.countDocuments(),
    Category.countDocuments({ parentCategory: null }),
    Inquiry.countDocuments(),
    Product.countDocuments({ status: "pending" }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
    Product.find().sort({ createdAt: -1 }).limit(5).select("name seller status createdAt").populate("seller", "name"),
    Payment.find({ status: "completed" }).sort({ createdAt: -1 }).limit(5).select("amount createdAt"),
  ]);

  const revenue = totalRevenue[0]?.total || 0;

  // Build recent activity feed
  const recentActivity = [
    ...recentUsers.map((u) => ({
      id: u._id.toString(),
      type: "user",
      title: `New ${u.role} registered: ${u.name}`,
      user: u.email,
      timestamp: u.createdAt,
    })),
    ...recentProducts.map((p) => ({
      id: p._id.toString(),
      type: "product",
      title: `Product submitted: ${p.name}`,
      user: p.seller?.name || "Unknown Seller",
      timestamp: p.createdAt,
    })),
  ]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);

  res.json(
    new ApiResponse(200, {
      stats: {
        totalUsers,
        totalProducts,
        totalCategories,
        totalInquiries,
        pendingApprovals,
        newThisMonth,
        revenue,
      },
      recentActivity,
    })
  );
});

// ─── GET /admin/products ─────────────────────────────────────────────
export const getProducts = asyncHandler(async (req, res) => {
  const { filter = "all", page = 1, limit = 20 } = req.query;

  const query = {};
  if (filter !== "all") query.status = filter;

  const [products, stats] = await Promise.all([
    Product.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate("seller", "name companyName email")
      .populate("category", "name"),
    Product.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const statsMap = { total: 0, pending: 0, approved: 0, rejected: 0, draft: 0 };
  for (const s of stats) {
    statsMap[s._id] = s.count;
    statsMap.total += s.count;
  }

  res.json(new ApiResponse(200, { products, stats: statsMap }));
});

// ─── PATCH /admin/products/:id/approve ──────────────────────────────
export const approveProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  product.status = "approved";
  product.isActive = true;
  product.rejectionReason = undefined;
  await product.save();

  res.json(new ApiResponse(200, { product }, "Product approved"));
});

// ─── PATCH /admin/products/:id/reject ───────────────────────────────
export const rejectProduct = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  if (!notes) throw new ApiError(400, "Rejection reason is required");

  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");

  product.status = "rejected";
  product.isActive = false;
  product.rejectionReason = notes;

  // Track approval history
  if (!product.approvalHistory) product.approvalHistory = [];
  product.approvalHistory.push({
    action: "rejected",
    adminId: req.user._id,
    adminName: req.user.name,
    date: new Date(),
    notes,
  });

  await product.save();

  res.json(new ApiResponse(200, { product }, "Product rejected"));
});

// ─── GET /admin/products/:id (Detailed view) ─────────────────────────
export const getProductDetail = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("seller", "name companyName email phone isVerified")
    .populate("category", "name")
    .populate("approvalHistory.adminId", "name email");

  if (!product) throw new ApiError(404, "Product not found");

  res.json(new ApiResponse(200, { product }, "Product details fetched"));
});

// ─── POST /admin/products/batch-action (Bulk approve/reject) ──────────
export const batchProductAction = asyncHandler(async (req, res) => {
  const { action, productIds, reason } = req.body;

  if (!action || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw new ApiError(400, "action and productIds array are required");
  }

  if (action === "reject" && !reason) {
    throw new ApiError(400, "reason is required for rejection");
  }

  const updateData = {
    status: action === "approve" ? "approved" : "rejected",
    isActive: action === "approve" ? true : false,
  };

  if (action === "reject") {
    updateData.rejectionReason = reason;
  } else {
    updateData.rejectionReason = undefined;
  }

  // Add to approval history for each product
  const products = await Product.find({ _id: { $in: productIds } });

  for (const product of products) {
    if (!product.approvalHistory) product.approvalHistory = [];
    product.approvalHistory.push({
      action,
      adminId: req.user._id,
      adminName: req.user.name,
      date: new Date(),
      notes: reason || "",
    });

    Object.assign(product, updateData);
    await product.save();
  }

  res.json(
    new ApiResponse(
      200,
      { updated: products.length },
      `${products.length} products ${action === "approve" ? "approved" : "rejected"}`
    )
  );
});

// ─── GET /admin/users ────────────────────────────────────────────────
export const getUsers = asyncHandler(async (req, res) => {
  const { filter = "all", page = 1, limit = 50, search } = req.query;

  const query = {};
  if (filter === "buyers") query.role = "buyer";
  else if (filter === "sellers") query.role = "seller";
  else if (filter === "admins") query.role = "admin";
  else if (filter === "active") query.isActive = true;
  else if (filter === "verified") query.isVerified = true;
  else if (filter === "pending_verification") {
    query.verificationRequested = true;
    query.isVerified = false;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { companyName: { $regex: search, $options: "i" } },
    ];
  }

  const [users, counts] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select("-password -refreshToken -emailVerificationToken -passwordResetToken"),
    User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          buyers: { $sum: { $cond: [{ $eq: ["$role", "buyer"] }, 1, 0] } },
          sellers: { $sum: { $cond: [{ $eq: ["$role", "seller"] }, 1, 0] } },
          admins: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } },
          active: { $sum: { $cond: ["$isActive", 1, 0] } },
          verified: { $sum: { $cond: ["$isVerified", 1, 0] } },
          pendingVerification: { $sum: { $cond: [{ $and: ["$verificationRequested", { $not: "$isVerified" }] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const stats = counts[0] || { total: 0, buyers: 0, sellers: 0, admins: 0, active: 0, verified: 0 };

  res.json(new ApiResponse(200, { users, stats }));
});

// ─── PATCH /admin/users/:id/status ──────────────────────────────────
export const updateUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (isActive === undefined) throw new ApiError(400, "isActive is required");

  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "Cannot change your own account status");
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, select: "-password -refreshToken" }
  );
  if (!user) throw new ApiError(404, "User not found");

  res.json(new ApiResponse(200, { user }, `User ${isActive ? "activated" : "deactivated"}`));
});

// ─── PATCH /admin/users/:id/verify ──────────────────────────────────
export const verifyUser = asyncHandler(async (req, res) => {
  const { isVerified } = req.body;
  if (isVerified === undefined) throw new ApiError(400, "isVerified is required");

  const update = { isVerified };
  if (isVerified) update.verificationRequested = false; // clear request once approved

  const user = await User.findByIdAndUpdate(
    req.params.id,
    update,
    { new: true, select: "-password -refreshToken" }
  );
  if (!user) throw new ApiError(404, "User not found");

  res.json(new ApiResponse(200, { user }, `User ${isVerified ? "verified" : "unverified"}`));
});

// ─── DELETE /admin/users/:id ─────────────────────────────────────────
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    throw new ApiError(400, "Cannot delete your own account");
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, "User not found");

  res.json(new ApiResponse(200, {}, "User deleted"));
});

// ─── GET /admin/categories ───────────────────────────────────────────
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ parentCategory: null })
    .sort({ sortOrder: 1, name: 1 });

  // Get product counts per category and subcategory counts
  const [productCounts, subcatCounts] = await Promise.all([
    Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]),
    Category.aggregate([
      { $match: { parentCategory: { $ne: null } } },
      { $group: { _id: "$parentCategory", count: { $sum: 1 } } },
    ]),
  ]);

  const productCountMap = Object.fromEntries(productCounts.map((p) => [p._id.toString(), p.count]));
  const subcatCountMap = Object.fromEntries(subcatCounts.map((s) => [s._id.toString(), s.count]));

  const enriched = categories.map((c) => ({
    ...c.toObject(),
    productCount: productCountMap[c._id.toString()] || 0,
    subcategories: Array.from({ length: subcatCountMap[c._id.toString()] || 0 }),
  }));

  const stats = {
    total: categories.length,
    active: categories.filter((c) => c.isActive).length,
    inactive: categories.filter((c) => !c.isActive).length,
    totalProducts: Object.values(productCountMap).reduce((a, b) => a + b, 0),
  };

  res.json(new ApiResponse(200, { categories: enriched, stats }));
});

// ─── POST /admin/categories ──────────────────────────────────────────
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, isActive } = req.body;
  if (!name) throw new ApiError(400, "Category name is required");

  const category = await Category.create({ name, description, icon, isActive });
  res.status(201).json(new ApiResponse(201, { category }, "Category created"));
});

// ─── PUT /admin/categories/:id ───────────────────────────────────────
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, description, icon, isActive } = req.body;

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, description, icon, isActive },
    { new: true, runValidators: true }
  );
  if (!category) throw new ApiError(404, "Category not found");

  res.json(new ApiResponse(200, { category }, "Category updated"));
});

// ─── PATCH /admin/categories/:id/status ─────────────────────────────
export const toggleCategoryStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (isActive === undefined) throw new ApiError(400, "isActive is required");

  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true }
  );
  if (!category) throw new ApiError(404, "Category not found");

  res.json(new ApiResponse(200, { category }, `Category ${isActive ? "activated" : "deactivated"}`));
});

// ─── DELETE /admin/categories/:id ────────────────────────────────────
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, "Category not found");

  const productCount = await Product.countDocuments({ category: req.params.id });
  if (productCount > 0) {
    throw new ApiError(400, `Cannot delete: ${productCount} products are in this category`);
  }

  await Category.findByIdAndDelete(req.params.id);
  res.json(new ApiResponse(200, {}, "Category deleted"));
});
