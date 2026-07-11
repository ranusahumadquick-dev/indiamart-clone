import Payment from "../../models/Payment.js";
import Order from "../../models/Order.js";
import { aggregateStats } from "../analytics/aggregator.js";

// Get comprehensive payment statistics (Admin)
export const getPaymentStatistics = async (filter = {}) => {
  const [
    totalPayments,
    successfulPayments,
    failedPayments,
    pendingPayments,
    refundedPayments,
    totalRevenue,
    successfulRevenue,
    failedRevenue,
    pendingRevenue
  ] = await Promise.all([
    Payment.countDocuments(filter),
    Payment.countDocuments({ ...filter, status: "completed" }),
    Payment.countDocuments({ ...filter, status: "failed" }),
    Payment.countDocuments({ ...filter, status: "pending" }),
    Payment.countDocuments({ ...filter, status: "refunded" }),
    Payment.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { ...filter, status: "completed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { ...filter, status: "failed" } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { ...filter, status: "pending" } }, { $group: { _id: null, total: { $sum: "$amount" } } }])
  ]);

  return {
    totalPayments,
    successfulPayments,
    failedPayments,
    pendingPayments,
    refundedPayments,
    totalRevenue: totalRevenue[0]?.total || 0,
    successfulRevenue: successfulRevenue[0]?.total || 0,
    failedRevenue: failedRevenue[0]?.total || 0,
    pendingRevenue: pendingRevenue[0]?.total || 0
  };
};

// Get payment analytics by date range
export const getPaymentAnalytics = async (startDate, endDate, groupBy = 'day') => {
  const query = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };

  let groupStage;
  if (groupBy === 'day') {
    groupStage = {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
        },
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        successAmount: {
          $sum: {
            $cond: [
              { $eq: ["$status", "completed"] },
              "$amount",
              0
            ]
          }
        }
      }
    };
  } else if (groupBy === 'month') {
    groupStage = {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$createdAt" }
        },
        count: { $sum: 1 },
        amount: { $sum: "$amount" },
        successCount: {
          $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
        },
        successAmount: {
          $sum: {
            $cond: [
              { $eq: ["$status", "completed"] },
              "$amount",
              0
            ]
          }
        }
      }
    };
  }

  const result = await Payment.aggregate([
    { $match: query },
    groupStage,
    { $sort: { _id: 1 } }
  ]);

  return result;
};

// Get revenue analytics by payment for
export const getRevenueByPaymentFor = async (filter = {}) => {
  const result = await Payment.aggregate([
    { $match: filter },
    { $group: {
      _id: "$paymentFor",
      count: { $sum: 1 },
      amount: { $sum: "$amount" },
      successCount: {
        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
      },
      successAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0]
        }
      }
    }},
    { $sort: { amount: -1 } }
  ]);

  return result;
};

// Get payment analytics by payment method
export const getPaymentByMethod = async (filter = {}) => {
  const result = await Payment.aggregate([
    { $match: filter },
    { $group: {
      _id: "$paymentMethod",
      count: { $sum: 1 },
      amount: { $sum: "$amount" },
      successCount: {
        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
      },
      successAmount: {
        $sum: {
          $cond: [{ $eq: ["$status", "completed"] }, "$amount", 0]
        }
      }
    }},
    { $sort: { amount: -1 } }
  ]);

  return result;
};

// Get GST & Tax reports
export const getGSTReports = async (startDate, endDate) => {
  const query = {
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    paymentFor: "product"
  };

  const [
    totalInvoices,
    totalGSTRelatedAmount,
    averageGST,
    highValueInvoices,
    refundAmount
  ] = await Promise.all([
    Payment.countDocuments({ ...query, status: "completed" }),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, avgGST: { $avg: "$metadata.gstAmount" } } }
    ]),
    Payment.aggregate([
      { $match: { ...query, amount: { $gte: 5000 } } },
      { $count: "count" }
    ]),
    Payment.aggregate([
      { $match: { ...query, status: "refunded" } },
      { $group: { _id: null, refundAmount: { $sum: "$amount" } } }
    ])
  ]);

  return {
    totalInvoices,
    totalAmount: totalInvoices > 0 ? totalGSTRelatedAmount[0]?.total : 0,
    averageGST: averageGST[0]?.avgGST || 0,
    highValueInvoices: highValueInvoices[0]?.count || 0,
    refundAmount: refundAmount[0]?.refundAmount || 0
  };
};

// Get commission reports
export const getCommissionReports = async (startDate, endDate) => {
  const query = {
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) },
    status: "completed"
  };

  const [
    totalTransactions,
    totalCommission,
    totalSellerRevenue,
    avgCommissionRate
  ] = await Promise.all([
    Payment.countDocuments(query),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, commission: { $sum: { $subtract: ["$amount", { $multiply: ["$amount", 0.92] }] } } } }
    ]),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, sellerRevenue: { $sum: { $multiply: ["$amount", 0.92] } } } }
    ]),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: null, avgRate: { $avg: { $multiply: [0.08, 100] } } } }
    ])
  ]);

  return {
    totalTransactions,
    totalCommission: totalCommission[0]?.commission || 0,
    totalSellerRevenue: totalSellerRevenue[0]?.sellerRevenue || 0,
    avgCommissionRate: avgCommissionRate[0]?.avgRate || 8
  };
};

// Get seller payouts summary
export const get SellerPayoutsSummary = async (sellerId, startDate, endDate) => {
  const query = {
    status: "completed",
    paymentFor: "product",
    createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
  };

  const [
    totalPayouts,
    payoutAmount,
    successfulOrders,
    averageOrderValue,
    topSellingProducts
  ] = await Promise.all([
    Order.countDocuments({ seller: sellerId, paymentStatus: "paid" }),
    Payment.aggregate([
      { $match: query },
      { $group: { _id: "$userId", total: { $sum: "$amount" } } }
    ]),
    Order.aggregate([
      { $match: { seller: sellerId, paymentStatus: "paid" } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$totalAmount" } } }
    ]),
    Order.aggregate([
      { $match: { seller: sellerId, paymentStatus: "paid" } },
      { $group: { _id: null, avg: { $avg: "$totalAmount" } } }
    ])
  ]);

  return {
    totalPayouts,
    payoutAmount: payoutAmount[0]?.total || 0,
    successfulOrders,
    averageOrderValue: averageOrderValue[0]?.avg || 0
  };
};

// Get failed payments with reasons
export const getFailedPayments = async (filter = {}) => {
  const result = await Payment.aggregate([
    { $match: { status: "failed", ...filter } },
    { $sort: { createdAt: -1 } },
    { $limit: 100 }
  ]);

  return result;
};

// Get pending payments with buyer info
export const getPendingPayments = async (filter = {}) => {
  const result = await Payment.aggregate([
    { $match: { status: "pending", ...filter } },
    { $sort: { createdAt: -1 } },
    { $limit: 100 }
  ]);

  return result;
};

// Export payments to CSV format
export const exportPaymentsToCSV = async (filter = {}) => {
  const payments = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .populate("userId", "name email phone")
    .lean();

  const headers = [
    "Invoice Number",
    "Payment ID",
    "User Name",
    "Email",
    "Phone",
    "Amount",
    "Currency",
    "Payment For",
    "Payment Method",
    "Status",
    "Invoice Date",
    "Completion Date",
    "Failure Reason"
  ];

  const csvContent = [
    headers.join(","),
    ...payments.map(payment => [
      payment.invoiceNumber || "",
      payment._id,
      payment.userId?.name || "",
      payment.userId?.email || "",
      payment.userId?.phone || "",
      payment.amount.toFixed(2),
      payment.currency,
      payment.paymentFor,
      payment.paymentMethod,
      payment.status,
      new Date(payment.createdAt).toLocaleDateString(),
      payment.completedAt ? new Date(payment.completedAt).toLocaleDateString() : "",
      payment.failedReason || ""
    ].join(","))
  ].join("\n");

  return csvContent;
};

// Export to JSON format
export const exportPaymentsToJSON = async (filter = {}) => {
  const payments = await Payment.find(filter)
    .sort({ createdAt: -1 })
    .populate("userId", "name email phone")
    .lean();

  return {
    exportDate: new Date().toISOString(),
    count: payments.length,
    data: payments
  };
};
