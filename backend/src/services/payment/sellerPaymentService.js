import Payment from "../../models/Payment.js";
import Order from "../../models/Order.js";
import { generateGSTInvoice } from "../../utils/invoiceGenerator.js";
import { htmlToPdf } from "../../utils/pdfGenerator.js";

// Get seller's received payments
export const getSellerReceivedPayments = async (sellerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Payment.find({
      status: "completed",
      paymentFor: "product"
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments({
      status: "completed",
      paymentFor: "product"
    })
  ]);

  return {
    payments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

// Get seller's pending payments
export const getSellerPendingPayments = async (sellerId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    Order.find({
      seller: sellerId,
      paymentStatus: "pending"
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("buyer", "name email phone")
      .lean(),
    Order.countDocuments({
      seller: sellerId,
      paymentStatus: "pending"
    })
  ]);

  return {
    orders: payments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

// Get seller settlement status
export const get SellerSettlementStatus = async (sellerId) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [
    pendingOrders,
    recentCompletedOrders,
    monthlyRevenue,
    totalCompletedOrders,
    averageOrderValue
  ] = await Promise.all([
    Order.find({
      seller: sellerId,
      paymentStatus: "pending"
    }).countDocuments(),
    Order.find({
      seller: sellerId,
      paymentStatus: "paid",
      createdAt: { $gte: thirtyDaysAgo }
    }).countDocuments(),
    Order.aggregate([
      { $match: { seller: sellerId, paymentStatus: "paid", createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } }
    ]),
    Order.countDocuments({
      seller: sellerId,
      paymentStatus: "paid"
    }),
    Order.aggregate([
      { $match: { seller: sellerId, paymentStatus: "paid" } },
      { $group: { _id: null, avg: { $avg: "$totalAmount" } } }
    ])
  ]);

  // Calculate commission
  const totalCommission = await Payment.aggregate([
    { $match: { status: "completed", paymentFor: "product" } },
    { $group: { _id: null, commission: { $sum: { $multiply: ["$amount", 0.08] } } } }
  ]);

  const totalRevenue = await Payment.aggregate([
    { $match: { status: "completed", paymentFor: "product" } },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);

  const estimatedPayout = (totalRevenue[0]?.total || 0) - (totalCommission[0]?.commission || 0);

  return {
    pendingOrders,
    recentCompletedOrders,
    monthlyRevenue: monthlyRevenue[0]?.total || 0,
    totalCompletedOrders,
    averageOrderValue: averageOrderValue[0]?.avg || 0,
    estimatedPayout,
    payoutCycle: "Monthly"
  };
};

// Get seller's revenue summary
export const getSellerRevenueSummary = async (sellerId, startDate, endDate) => {
  const query = {
    status: "completed",
    paymentFor: "product",
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  const [
    totalRevenue,
    totalOrders,
    totalCommission,
    successfulPayments,
    failedPayments,
    paymentMethodBreakdown
  ] = await Promise.all([
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Order.aggregate([
      { $match: { seller: sellerId, paymentStatus: "paid" } },
      { $count: "count" }
    ]),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, commission: { $sum: { $multiply: ["$amount", 0.08] } } } }
    ]),
    Payment.countDocuments({ ...query, status: "completed" }),
    Payment.countDocuments({ ...query, status: "failed" }),
    Payment.aggregate([
      { $match: query },
      { $group: {
        _id: "$paymentMethod",
        count: { $sum: 1 },
        amount: { $sum: "$amount" }
      }}
    ])
  ]);

  return {
    totalRevenue: totalRevenue[0]?.total || 0,
    totalOrders: totalOrders[0]?.count || 0,
    totalCommission: totalCommission[0]?.commission || 0,
    netRevenue: (totalRevenue[0]?.total || 0) - (totalCommission[0]?.commission || 0),
    successfulPayments,
    failedPayments,
    paymentMethodBreakdown
  };
};

// Get seller transaction details
export const getSellerTransactionDetails = async (paymentId, sellerId) => {
  const payment = await Payment.findOne({
    _id: paymentId,
    paymentFor: "product"
  }).populate("userId", "name email phone");

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Verify seller ownership
  const order = await Order.findOne({
    paymentId: paymentId,
    seller: sellerId
  });

  if (!order) {
    throw new Error("Unauthorized access to this transaction");
  }

  return {
    payment,
    order
  };
};

// Download GST invoice for seller
export const downloadSellerGSTInvoice = async (orderId, sellerId) => {
  const order = await Order.findOne({
    _id: orderId,
    seller: sellerId
  })
    .populate("buyer", "name email phone company gstNumber address")
    .populate("items.product", "name price")

  if (!order) {
    throw new Error("Order not found");
  }

  // Get associated payment
  const payment = await Payment.findOne({
    paymentId: orderId,
    status: "completed"
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Generate GST invoice
  const invoiceHtml = generateGSTInvoice(order, payment);
  const invoiceNumber = payment.invoiceNumber || `GST-${Date.now()}`;
  
  // Convert to PDF
  const pdfResult = await htmlToPdf(invoiceHtml, invoiceNumber);

  return {
    invoiceNumber,
    url: pdfResult.url,
    fileName: `${invoiceNumber}.pdf`,
    order,
    payment
  };
};

// Get seller payment history
export const getSellerPaymentHistory = async (sellerId, page = 1, limit = 10, status) => {
  const skip = (page - 1) * limit;
  
  const query = { status: "completed", paymentFor: "product" };
  if (status) query.status = status;

  const [payments, total] = await Promise.all([
    Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Payment.countDocuments(query)
  ]);

  return {
    payments,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalItems: total,
      itemsPerPage: limit
    }
  };
};

// Get top performing sellers (Admin view)
export const getTopPerformingSellers = async (page = 1, limit = 10, startDate, endDate) => {
  const skip = (page - 1) * limit;
  
  const query = {
    status: "completed",
    paymentFor: "product",
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  const [sellers, total] = await Promise.all([
    Payment.aggregate([
      { $match: query },
      { $group: {
        _id: "$userId",
        sellerName: { $first: "$userId.name" },
        email: { $first: "$userId.email" },
        totalRevenue: { $sum: "$amount" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: "$amount" },
        paymentCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        successRate: {
          $avg: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        }
      }},
      { $sort: { totalRevenue: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "sellerDetails"
      }},
      { $unwind: "$sellerDetails" },
      { $project: {
        _id: "$_id",
        sellerName: "$sellerName",
        email: "$email",
        totalRevenue: 1,
        orderCount: 1,
        avgOrderValue: 1,
        paymentCount: 1,
        successRate: 1,
        rating: "$sellerDetails.rating"
      }}
    ]),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: "$userId" } },
      { $count: "count" }
    ])
  ]);

  return {
    sellers,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil((total[0]?.count || 0) / limit),
      totalItems: total[0]?.count || 0,
      itemsPerPage: limit
    }
  };
};
