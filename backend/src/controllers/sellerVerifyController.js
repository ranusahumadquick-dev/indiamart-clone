/**
 * Seller Verification Controller
 *
 * POST   /api/seller-verify/gst               — verify GST (full 4-step check)
 * POST   /api/seller-verify/upload-docs        — upload ITR / CA Certificate / Bank Statement
 * GET    /api/seller-verify/status             — seller checks own verification status
 * GET    /api/seller-verify/admin/list         — admin lists sellers
 * PATCH  /api/seller-verify/admin/:id/approve  — admin approves seller
 * PATCH  /api/seller-verify/admin/:id/reject   — admin rejects seller
 */

import User          from "../models/User.js";
import ItrCertificate from "../models/ItrCertificate.js";
import ApiResponse   from "../utils/ApiResponse.js";
import ApiError      from "../utils/ApiError.js";
import asyncHandler  from "../utils/asyncHandler.js";
import {
  verifyGSTIN,
  fetchTurnoverFromExternalAPI,
  calcAgeMonths,
  calcAgeYears,
  GST_ERROR,
} from "../services/gstService.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const MIN_AGE_MONTHS = 24;        // 2 years
const MIN_TURNOVER   = 1_000_000; // ₹10 lakh

// ─── Turnover resolver — DB lookup ───────────────────────────────────────────
/**
 * Looks up the company's verified annual turnover from our database.
 *
 * Source: ItrCertificate documents with status "verified", linked to any seller
 * whose gstNumber matches. We take the most recent verified record.
 *
 * Returns a number (rupees) if found, otherwise null.
 */
async function fetchTurnoverFromDB(gstin) {
  // Find the seller who owns this GSTIN
  const seller = await User.findOne({ gstNumber: gstin }).select("_id").lean();
  if (!seller) return null;

  // Get the most recent verified ITR for that seller
  const itr = await ItrCertificate
    .findOne({
      sellerId:   seller._id,
      status:     "verified",
      isActive:   true,
      turnoverGrossReceipt: { $exists: true, $ne: null },
    })
    .sort({ createdAt: -1 })
    .select("turnoverGrossReceipt assessmentYear financialYear")
    .lean();

  if (!itr) return null;

  return {
    amount:         itr.turnoverGrossReceipt,
    assessmentYear: itr.assessmentYear,
    financialYear:  itr.financialYear,
    source:         "itr_verified",
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/seller-verify/gst
//
// Body:
//   gstNumber  {string}  — 15-char GSTIN (required)
//   gstRegDate {string}  — "YYYY-MM-DD", required only when GST API is unavailable
//
// Verification order (stops at first failure):
//   Step 1 — Format validation
//   Step 2 — GST exists in government database
//   Step 3 — GST status is Active
//   Step 4 — Registration is at least 2 years old
//   Step 5 — Annual turnover ≥ ₹10 lakh
//             Source priority: GST API → External API → Verified ITR in DB
//             If no trusted source has turnover → TURNOVER_UNVERIFIABLE (blocked)
//
// Turnover is NEVER assumed or self-declared. It must come from a verified source.
// ═══════════════════════════════════════════════════════════════════════════════
export const verifyGST = asyncHandler(async (req, res) => {
  const { gstNumber, gstRegDate, phone } = req.body;

  if (!gstNumber?.trim()) {
    throw new ApiError(400, "GST number is required");
  }

  // ── Steps 1–3: Format, existence, active status (via GST API service) ──────
  const gst = await verifyGSTIN(gstNumber);

  if (!gst.ok) {
    throw new ApiError(422, gst.error, { errorCode: gst.errorCode });
  }

  // ── Step 4: Age check ──────────────────────────────────────────────────────
  let finalRegDate = gst.registrationDate;  // Date object (from API) or null
  let ageMonths, ageYears;

  if (finalRegDate) {
    // API returned registration date — calculate age directly
    ageMonths = calcAgeMonths(finalRegDate);
    ageYears  = calcAgeYears(finalRegDate);
    finalRegDate = finalRegDate.toISOString().split("T")[0];
  } else {
    // format-only mode — registration date must be supplied by the user
    if (!gstRegDate) {
      throw new ApiError(422,
        "GST registration date is required. Please enter the date printed on your GST certificate.",
        { errorCode: "DATE_REQUIRED" }
      );
    }

    const parsed = new Date(gstRegDate);
    if (isNaN(parsed.getTime())) {
      throw new ApiError(400, "Invalid registration date. Use YYYY-MM-DD format.");
    }
    if (parsed > new Date()) {
      throw new ApiError(400, "Registration date cannot be in the future.");
    }

    ageMonths    = calcAgeMonths(gstRegDate);
    ageYears     = calcAgeYears(gstRegDate);
    finalRegDate = parsed.toISOString().split("T")[0];
  }

  if (ageMonths < MIN_AGE_MONTHS) {
    const needed = MIN_AGE_MONTHS - ageMonths;
    throw new ApiError(422,
      `GST registration is only ${ageMonths} month${ageMonths === 1 ? "" : "s"} old. ` +
      `You need ${needed} more month${needed === 1 ? "" : "s"} to be eligible (minimum 2 years required).`,
      { errorCode: GST_ERROR.TOO_NEW, ageMonths, needed }
    );
  }

  // ── Step 5: Turnover check — NO self-declaration accepted ─────────────────
  //
  // Source priority:
  //   1. Turnover returned directly by the GST API
  //   2. Turnover from a third-party external API
  //   3. Verified ITR document in our own database
  //
  // If none of these sources has data → block with TURNOVER_UNVERIFIABLE.

  const cleaned = gstNumber.trim().toUpperCase();
  let turnoverAmount = null;
  let turnoverSource = null;

  // Source 1: GST API turnover
  if (gst.apiTurnover !== null && gst.apiTurnover !== undefined) {
    turnoverAmount = Number(gst.apiTurnover);
    turnoverSource = "gst_api";
  }

  // Source 2: External API (pluggable — see gstService.fetchTurnoverFromExternalAPI)
  if (turnoverAmount === null) {
    const extTurnover = await fetchTurnoverFromExternalAPI(cleaned);
    if (extTurnover !== null) {
      turnoverAmount = Number(extTurnover);
      turnoverSource = "external_api";
    }
  }

  // Source 3: Verified ITR document in our database
  let itrRecord = null;
  if (turnoverAmount === null) {
    itrRecord = await fetchTurnoverFromDB(cleaned);
    if (itrRecord !== null) {
      turnoverAmount = itrRecord.amount;
      turnoverSource = "itr_verified";
    }
  }

  // ── Turnover unverifiable — age is OK but no trusted source has turnover data.
  // Do NOT mark GST as fully verified. Allow registration to continue so the
  // seller can upload their ITR in the next step. Account stays under_review
  // until admin confirms turnover from the ITR document.
  if (turnoverAmount === null) {
    const gstSaveTarget = req.user
      ? { _id: req.user._id }
      : phone ? await User.findOne({ phone: String(phone).replace(/\D/g, "").slice(-10) }).select("_id").lean() : null;
    if (gstSaveTarget) {
      await User.findByIdAndUpdate(gstSaveTarget._id, {
        gstNumber:   cleaned,
        gstRegDate:  new Date(finalRegDate),
        gstVerified: false,
        gstAge:      Math.floor(ageYears),
        sellerStatus: "pending",
      });
    }

    return res.status(200).json(
      new ApiResponse(200, {
        verified:        false,       // GST is NOT fully verified
        turnoverPending: true,        // turnover verification required via ITR
        gstin:           gst.gstin,
        apiUsed:         gst.apiUsed,
        businessName:    gst.businessName  || "",
        tradeName:       gst.tradeName     || "",
        status:          gst.status        || null,
        stateCode:       gst.stateCode,
        state:           gst.state,
        businessType:    gst.businessType  || "",
        registrationDate: finalRegDate,
        ageYears,
        ageMonths,
        turnoverAmount:  null,
        turnoverSource:  null,
        nextStep:        "upload_itr",
      },
      "GST age verified ✅ — turnover pending ITR review"
    ));
  }

  // ── Turnover found but below minimum — hard block ─────────────────────────
  if (turnoverAmount < MIN_TURNOVER) {
    throw new ApiError(422,
      `Annual turnover ₹${(turnoverAmount / 100_000).toFixed(1)} lakh is below ` +
      `the required minimum of ₹10,00,000 (10 lakh).`,
      { errorCode: GST_ERROR.TURNOVER_LOW, turnoverAmount, turnoverSource }
    );
  }

  // ── All 5 checks passed — GST fully verified ──────────────────────────────
  const gstFullTarget = req.user
    ? { _id: req.user._id }
    : phone ? await User.findOne({ phone: String(phone).replace(/\D/g, "").slice(-10) }).select("_id").lean() : null;
  if (gstFullTarget) {
    await User.findByIdAndUpdate(gstFullTarget._id, {
      gstNumber:   cleaned,
      gstRegDate:  new Date(finalRegDate),
      gstVerified: true,
      gstAge:      Math.floor(ageYears),
    });
  }

  // ── Return fully verified business details ────────────────────────────────
  return res.status(200).json(
    new ApiResponse(200, {
      verified:        true,
      turnoverPending: false,
      gstin:           gst.gstin,
      apiUsed:         gst.apiUsed,

      // Business details for auto-fill
      businessName: gst.businessName  || "",
      tradeName:    gst.tradeName     || "",
      status:       gst.status        || "Active",
      stateCode:    gst.stateCode,
      state:        gst.state,
      businessType: gst.businessType  || "",

      // Age
      registrationDate: finalRegDate,
      ageYears,
      ageMonths,

      // Turnover
      turnoverAmount,
      turnoverSource,
      turnoverFinancialYear: itrRecord?.financialYear ?? null,
    },
    `GST Verified ✅ — ${gst.businessName || cleaned}`
  ));
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /api/seller-verify/upload-docs
// ═══════════════════════════════════════════════════════════════════════════════
export const uploadDocs = asyncHandler(async (req, res) => {
  const seller = req.user || null;

  // Resolve sellerId — try body, then auth, then phone lookup
  let sellerId = req.body.sellerId || seller?._id || null;
  if (!sellerId && req.body.phone) {
    const raw  = String(req.body.phone).replace(/\D/g, "").slice(-10);
    const found = await User.findOne({ phone: raw }).select("_id role").lean();
    if (found) sellerId = found._id;
  }

  if (seller?.role && seller.role !== "seller") {
    throw new ApiError(403, "Only sellers can upload documents");
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000";
  const docs = {};
  if (req.files?.itr?.[0])           docs.itr           = `${backendUrl}/uploads/seller-docs/${req.files.itr[0].filename}`;
  if (req.files?.caCertificate?.[0]) docs.caCertificate = `${backendUrl}/uploads/seller-docs/${req.files.caCertificate[0].filename}`;
  if (req.files?.bankStatement?.[0]) docs.bankStatement = `${backendUrl}/uploads/seller-docs/${req.files.bankStatement[0].filename}`;

  if (Object.keys(docs).length === 0) {
    throw new ApiError(400, "Please upload at least one document (ITR, CA Certificate, or Bank Statement)");
  }

  if (!sellerId) {
    throw new ApiError(400, "Could not identify seller. Please re-login and try again.");
  }

  const updateFields = { "sellerDocs.uploadedAt": new Date(), sellerStatus: "under_review" };
  if (docs.itr)           updateFields["sellerDocs.itr"]           = docs.itr;
  if (docs.caCertificate) updateFields["sellerDocs.caCertificate"] = docs.caCertificate;
  if (docs.bankStatement) updateFields["sellerDocs.bankStatement"]  = docs.bankStatement;

  await User.findByIdAndUpdate(sellerId, { $set: updateFields });

  return res.status(200).json(
    new ApiResponse(200, { uploaded: Object.keys(docs), status: "under_review" },
      "Documents uploaded. Our team will verify your ITR and activate your account within 5–7 business days.")
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/seller-verify/status
// ═══════════════════════════════════════════════════════════════════════════════
export const getMyStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("sellerStatus sellerStatusNote gstVerified gstAge sellerDocs gstNumber gstRegDate")
    .lean();

  return res.status(200).json(
    new ApiResponse(200, {
      sellerStatus:     user.sellerStatus,
      sellerStatusNote: user.sellerStatusNote || "",
      gstVerified:      user.gstVerified,
      gstAge:           user.gstAge,
      gstNumber:        user.gstNumber,
      gstRegDate:       user.gstRegDate,
      docsUploaded: {
        itr:           !!user.sellerDocs?.itr,
        caCertificate: !!user.sellerDocs?.caCertificate,
        bankStatement:  !!user.sellerDocs?.bankStatement,
        uploadedAt:    user.sellerDocs?.uploadedAt,
      },
    }, "Verification status fetched")
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /api/seller-verify/admin/list
// ═══════════════════════════════════════════════════════════════════════════════
export const adminListSellers = asyncHandler(async (req, res) => {
  const { status = "all", page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { role: "seller" };
  if (status !== "all") filter.sellerStatus = status;

  const [sellers, total] = await Promise.all([
    User.find(filter)
      .select("name email phone companyName gstNumber gstRegDate gstAge gstVerified sellerStatus sellerStatusNote sellerDocs createdAt updatedAt city state pincode annualTurnover")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    User.countDocuments(filter),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      sellers, total, page: Number(page), pages: Math.ceil(total / Number(limit)),
    }, "Sellers fetched")
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/seller-verify/admin/:sellerId/approve
// ═══════════════════════════════════════════════════════════════════════════════
export const adminApproveSeller = asyncHandler(async (req, res) => {
  const { sellerId }  = req.params;
  const { note = "" } = req.body;

  const seller = await User.findOne({ _id: sellerId, role: "seller" });
  if (!seller) throw new ApiError(404, "Seller not found");

  await User.findByIdAndUpdate(sellerId, {
    sellerStatus:          "approved",
    sellerStatusNote:      note,
    sellerStatusUpdatedAt: new Date(),
    sellerApprovedBy:      req.user._id,
    isVerified:            true,
    gstVerified:           true,  // admin approval implies GST fully verified
  });

  return res.status(200).json(
    new ApiResponse(200, { sellerId, status: "approved" },
      `Seller "${seller.companyName || seller.name}" approved ✅`)
  );
});

// ═══════════════════════════════════════════════════════════════════════════════
// PATCH /api/seller-verify/admin/:sellerId/reject
// ═══════════════════════════════════════════════════════════════════════════════
export const adminRejectSeller = asyncHandler(async (req, res) => {
  const { sellerId } = req.params;
  const { reason }   = req.body;

  if (!reason?.trim()) throw new ApiError(400, "Rejection reason is required");

  const seller = await User.findOne({ _id: sellerId, role: "seller" });
  if (!seller) throw new ApiError(404, "Seller not found");

  await User.findByIdAndUpdate(sellerId, {
    sellerStatus:          "rejected",
    sellerStatusNote:      reason.trim(),
    sellerStatusUpdatedAt: new Date(),
    isVerified:            false,
  });

  return res.status(200).json(
    new ApiResponse(200, { sellerId, status: "rejected" },
      `Seller "${seller.companyName || seller.name}" rejected`)
  );
});
