# IndiaMart Clone — Full Project Context

Comprehensive reference for the entire codebase, front to back. Read this before making changes if you're new to the repo. For quick coding conventions see [CLAUDE.md](CLAUDE.md); this file goes deeper — actual schemas, actual routes, actual data flow.

---

## 1. What This Project Is

A B2B marketplace clone of IndiaMart — connects **buyers** and **sellers** across India for bulk/wholesale trade. Not a simple storefront: it models the real B2B sourcing lifecycle — RFQ (buy requirements), negotiation, sample-before-bulk-order, production tracking, delivery inspection, seller verification (GST/ITR), subscriptions/quotas, and live buyer-seller chat.

Four user roles: `buyer`, `seller`, `admin`, `premium` (see `backend/src/constants/roles.js`).

**Status per CLAUDE.md**: v1.0.0, "Production Ready", 50+ features, 40+ API endpoints, 12+ DB models (actual current count is higher — see §4).

---

## 2. Repo Layout

```
indiamart-comp-main/
├── package.json          # root: orchestrates via `concurrently`, no real deps of its own
├── CLAUDE.md              # conventions/gotchas for AI agents
├── backend/               # Express API (own package.json, own node_modules)
│   └── src/
│       ├── server.js      # entry: HTTP server + Socket.IO + cron jobs + DB connect
│       ├── app.js         # Express app: middleware chain + all route mounts
│       ├── config/        # db.js (mongoose connect), cloudinary.js
│       ├── constants/     # roles.js
│       ├── controllers/   # 29 files, business logic
│       ├── routes/        # 29 files, one per resource
│       ├── models/        # 34 Mongoose schemas
│       ├── middleware/    # auth, role, multer, upload, otp rate limit, error handler
│       ├── services/      # email, SMS, GST lookup, product-image fetch, payment/
│       ├── jobs/           # 3 node-cron jobs
│       ├── socket/         # socketHandler.js — all Socket.IO event wiring
│       ├── utils/          # ApiError/ApiResponse, PDF/invoice/quotation generators, helpers
│       ├── seed/, seeds/   # DB seeding scripts
│       └── templates/      # email templates
└── frontend/               # Next.js 16 (App Router), own package.json
    └── src/
        ├── app/            # ~90 routed page directories (see §6)
        ├── components/     # ~100 components, organized by feature
        ├── contexts/        # 7 React Context providers (global state)
        ├── hooks/, lib/, config/, utils/, types/
```

Root `package.json` has scripts only (`npm run dev` = concurrently runs both backend and frontend dev servers via `dev:backend`/`dev:frontend`), plus `install:all` to install both. It is **not** an npm workspace root — backend and frontend each have independent `node_modules`.

---

## 3. Tech Stack

**Backend**
- Express 5, ES Modules (`"type": "module"` — always `import`/`export`, never `require`)
- MongoDB via Mongoose 9
- Auth: JWT (access + refresh), bcrypt password hashing, httpOnly cookies + Bearer header dual support
- Socket.IO 4 — real-time chat
- Multer + Cloudinary + `multer-storage-cloudinary` — file uploads (also local `/uploads` static serving)
- node-cron — background jobs
- Razorpay — payments
- MSG91 (primary) + Fast2SMS (fallback) — SMS/OTP
- Nodemailer — email
- PDFKit + Puppeteer — invoice/quotation PDF generation
- helmet, express-rate-limit, cors — security

**Frontend**
- Next.js 16.2.6 (App Router), React 19.2, TypeScript strict
- ⚠️ **`frontend/AGENTS.md` warns this Next.js version has breaking changes vs. training-data assumptions** — check `node_modules/next/dist/docs/` before using unfamiliar Next APIs.
- Tailwind CSS 4
- Axios (single configured client, see §7)
- Socket.IO client — chat
- Framer Motion, Swiper — animation/carousels
- Recharts — analytics charts
- react-hot-toast — notifications
- Jest + Testing Library — tests
- PapaParse — CSV (bulk product upload)

---

## 4. Database Models (34, in `backend/src/models/`)

Grouped by domain:

**Identity & Access**
- `User.js` — core account. Fields: name, email (unique), password (bcrypt, `select: false`), phone (Indian format, unique), `isMobileVerified`, `role` (buyer/seller/admin/premium), seller fields (companyName, gstNumber with regex validation, businessType), embedded `addressSchema` (street/city/state/pincode/country/isDefault).
- `OtpSession.js` — OTP verification sessions (mobile verify, password reset)

**Catalog**
- `Product.js` — the biggest model. Core fields: name, slug (unique), description, price/priceMax/comparePrice, currency, priceUnit (Piece/Kg/Meter/Liter/Box/Packet/Ton/Set), **`pricingSlabs`** (tiered/volume pricing: minQty/maxQty/price), category + subCategory refs, images (Cloudinary url + publicId + alt + image/video type), seller ref, brand ref, tags, specifications (key/value pairs), minOrderQuantity/maxOrderQuantity, stock, stockStatus (in_stock/out_of_stock/made_to_order), leadTime, cataloguePdf, `view360Images` (360° product view), city/state, views/inquiryCount stats. Also contains a large static `AUTO_VARIANTS` mapping (category → auto-generated variant templates like Weight/Pack Type/Grade per food/agriculture/clothing/etc. subcategories) used to auto-suggest product variants.
- `Category.js`, `Brand.js`
- `ProductAnalytics.js` — per-product view/inquiry tracking

**Buyer-Seller Communication**
- `Conversation.js`, `Message.js` — chat backbone (see §8 for live event flow)
- `Inquiry.js` — buyer inquiry on a product
- `Question.js` — Q&A on product pages
- `Negotiation.js` — price negotiation threads

**Sourcing / RFQ Workflow** (deeper than a typical clone)
- `BuyRequirement.js` — buyer posts a sourcing requirement (RFQ)
- `SourcingRequest.js` — seller-side response/sourcing flow
- `SupplierRelationship.js`, `SupplierReview.js`, `SellerShortlist.js` — buyer building a trusted supplier list
- `SampleRequest.js`, `SampleOrder.js` — sample-before-bulk-order flow
- `ProductionTracking.js` — post-order production stage tracking
- `DeliveryInspection.js` — QC/inspection before final acceptance
- `PurchaseOrder.js`

**Transactions**
- `Order.js`, `Payment.js` — Razorpay-backed
- `Subscription.js`, `SubscriptionPlan.js` — seller/buyer paid plans with quota limits

**Seller Trust & Ops**
- `ItrCertificate.js` — income tax return certificate upload/verification (seller KYC)
- `SellerAnalytics.js`
- `Customization.js` — buyer-requested product customization (logo/attachment uploads)
- `Service.js` — sellers can also list services, not just products

**Engagement**
- `Review.js`, `Wishlist.js`, `PriceAlert.js`, `Notification.js`, `Setting.js`, `Address.js`

---

## 5. Backend Request Flow

**`server.js`** (entry point):
1. `dotenv.config()` → `connectDB()` (Mongoose connect)
2. Seeds subscription plans (`seedDefaultPlans`) and categories (`seedCategories`) on boot
3. Starts 3 cron jobs: `initializeReminderJob` (inquiry reminders), `initializeFeaturedExpiryJob`, `scheduleExpiryJob` (subscription expiry)
4. Creates raw `http.Server` wrapping the Express `app`, attaches Socket.IO on top (`path: "/socket.io"`, CORS locked to `CLIENT_URL`)
5. Listens on `PORT` (default 8000)

**`app.js`** middleware chain (order matters):
1. `helmet` (CSP disabled — frontend loads cross-origin images)
2. `cors` (credentialed, origin = `CLIENT_URL`)
3. JSON/urlencoded body parsers (**500mb limit** — large for handling big file uploads inline)
4. `cookie-parser`
5. Static `/uploads` serving with a custom hand-rolled CORS + content-type + cache-control middleware (very verbose console logging — this is a debug hotspot, look here first for upload/image issues)
6. `GET /api/image-proxy` — manual proxy for `/uploads/products/*` files only (403s anything else) to dodge CSP
7. `GET /api/health` (mounted **before** the rate limiter, so it's never throttled)
8. Rate limiter (`express-rate-limit`) — **skipped entirely when `NODE_ENV=development`**
9. All 29 route groups mounted under `/api/*` (full list below)
10. 404 handler → Multer error handler → global `errorHandler` (must stay last)

**Full route mount table**:

| Base path | Router file |
|---|---|
| `/api/auth` | authRoutes.js |
| `/api/otp` | otpRoutes.js |
| `/api/settings` | settingRoutes.js |
| `/api/seller-verify` | sellerVerifyRoutes.js |
| `/api/itr-certificates` | itrCertificateRoutes.js |
| `/api/password-reset` | passwordResetRoutes.js |
| `/api/products` | productRoutes.js |
| `/api/categories` | categoryRoutes.js |
| `/api/inquiries` | inquiryRoutes.js |
| `/api/reviews` | reviewRoutes.js |
| `/api/sellers` | sellerRoutes.js |
| `/api/gallery` | galleryRoutes.js |
| `/api/buy-requirements` | buyRequirementRoutes.js |
| `/api/payments` | paymentRoutes.js |
| `/api/samples` | sampleRoutes.js |
| `/api/messages` | messageRoutes.js |
| `/api/admin` | adminRoutes.js |
| `/api/wishlist` | wishlistRoutes.js |
| `/api/notifications` | notificationRoutes.js |
| `/api/questions` | questionRoutes.js |
| `/api/price-alerts` | priceAlertRoutes.js |
| `/api/sourcing-requests` | sourcingRoutes.js |
| `/api/orders` | orderRoutes.js |
| `/api/chat` | chatRoutes.js |
| `/api/users` | userRoutes.js |
| `/api/analytics` | analyticsRoutes.js |
| `/api/images` | imageRoutes.js |
| `/api/customizations` | customization.js |
| `/api/services` | serviceRoutes.js |
| `/api/brands` | brandRoutes.js |

**Auth middleware** (`middleware/authMiddleware.js`): reads JWT from `req.cookies.accessToken` OR `Authorization: Bearer` header, verifies with `JWT_SECRET`, loads user (minus password/refreshToken), sets `req.user`. Heavy console logging (✅/❌ emoji) — noisy in dev, useful for debugging auth failures.

**Role middleware** (`middleware/roleMiddleware.js`): factory `roleMiddleware(...roles)`, flattens array/varargs, 403s if `req.user.role` not in allowed list. Always chain **after** auth: `router.patch("/:id", auth, roleMiddleware(["seller"]), controller)`.

**Error handling**: `ApiError` class (`utils/ApiError.js`) thrown in controllers, caught centrally by `errorHandler.js`. Controllers should never call `res.status(500).json(...)` directly.

---

## 6. Frontend Route Map (`frontend/src/app/`)

App Router, ~90 route directories. Grouped:

- **Public/marketing**: `/`, `/products`, `/products/[id]`, `/categories`, `/categories/[slug]`, `/brands`, `/brands/[id]`, `/sellers`, `/sellers/[id]`, `/seller-store/[id]`, `/services`, `/services/[id]`, `/compare`, `/help`, `/showcase`, demo pages (`product-carousel-demo`, `product-detail-demo`, `product-variants-demo`, `advanced-product-demo`)
- **Auth**: `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password/[token]`
- **Buyer area** (`/buyer/*`): dashboard, cart, checkout, orders, orders/[id], inquiries, requirements, messages, chats, wishlist, price-alerts, samples, subscription, plans, payment (+success/failed), transactions, account-manager, notifications, alerts, settings, verify-mobile, procurement/stage5, procurement/stage6
- **Seller area** (`/seller/*`): dashboard, products, products/[id], products/new, products/bulk-variants, bulk-upload, orders, inquiries, requirements, requirements/[id], requirements/my-responses, customizations, customizations/[id], samples, services, brands, billing, plans, payments, analytics (+ /competitors, /products, /reports), featured-products, itr-certificates, invitations, inbox, messages, profile, complete-profile, settings (+account/contact/notifications/requirements/security)
- **Admin area** (`/admin/*`): dashboard, users, products, categories, payments, seller-verification, settings
- **Standalone flows**: `/post-requirement`, `/buy-requirements`, `/buy-requirements/[id]`, `/buy-requirements/new`, `/checkout`, `/checkout/sample`, `/payment/{card,upi,netbanking,wallet}`, `/payments/history`, `/subscription/{plans,management}`, `/seller-register`, `/sell`, `/chat`, `/profile`
- **API routes** (Next.js route handlers, not the Express backend): `frontend/src/app/api/inquiries/[productId]` — check this before assuming *all* API calls go to Express; a few are Next-side.

---

## 7. Frontend State & API Client

**Axios client** (`frontend/src/lib/axios.ts`) — the *only* sanctioned way to call the backend:
- Base URL resolution: browser + prod → `${window.location.origin}/indiamart/api`; browser + dev → `/api` (relative, proxied); SSR → `NEXT_PUBLIC_API_URL` env fallback. **Note the prod path prefix is `/indiamart/api`, not just `/api`** — a deploy-path detail easy to miss.
- Request interceptor: pulls `accessToken` from `localStorage`, sets `Authorization: Bearer`; strips `Content-Type` for `FormData` payloads so the browser sets multipart boundaries itself.
- Response interceptor: auto-resolves relative `/uploads/...` image URLs in every response body via `resolveImagesInObject`; on `401` clears `accessToken`/`user` from localStorage **except** when on `/seller-register` or `/auth/*` (those pages run their own OTP-based flow and shouldn't be yanked mid-flow).

**Contexts** (`frontend/src/contexts/`, all wrap the app — check `layout.tsx` for nesting order):
- `AuthContext.tsx` (219 lines) — user state, `refreshUser()`, login/logout, token persistence
- `CartContext.tsx` (138 lines)
- `ChatContext.tsx` (747 lines — by far the largest; owns the Socket.IO client lifecycle, conversation list, message state, typing indicators)
- `BulkInquiryContext.tsx` (64 lines)
- `CompareContext.tsx` (85 lines) — product comparison tray
- `PaymentContext.tsx` (170 lines)
- `GuestVerifyContext.tsx` (69 lines) — guest checkout OTP verification, separate from full auth

CLAUDE.md also lists a "6 contexts" figure — actual count is 7 (GuestVerifyContext is the addition not mentioned there).

---

## 8. Real-Time Chat (Socket.IO)

`backend/src/socket/socketHandler.js` (388 lines) wires these events inside `io.on("connection", ...)`:

| Event | Purpose |
|---|---|
| `join_conversation` | Join a chat room by conversationId |
| `leave_conversation` | Leave a room |
| `send_message` | Persist + broadcast a new message (supports attachments, messageType) |
| `messages:read` | Mark read receipts |
| `typing` / `stop_typing` | Typing indicators |
| `add_reaction` / `remove_reaction` | Emoji reactions on messages |
| `delete_message` / `edit_message` | Message mutation |
| `disconnect` / `error` | Lifecycle/error logging |

Rooms are grouped by conversation ID (per CLAUDE.md). Frontend counterpart lives in `ChatContext.tsx` + `socket.io-client`.

---

## 9. File Uploads

- **Multer config**: `backend/src/middleware/multer.js` — exports field-specific upload configs (product images, customization logo/attachment, profile pics). 5MB/file limit, MIME-type filtered.
- **Storage**: `multer-storage-cloudinary` — uploads go to Cloudinary (config in `backend/src/config/cloudinary.js`, needs `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` env vars — **not listed in `.env.example`**, easy to miss when setting up a fresh environment). Local `/uploads` dir still exists and is statically served for legacy/local-dev files.
- **Field-name contract**: frontend `FormData.append(fieldName, file)` must exactly match the multer `.fields([{ name, maxCount }])` config — mismatches fail silently as missing files, not errors.
- **Middleware order**: always `auth → roleMiddleware → multer → controller`. Reversing auth and multer means unauthenticated users can trigger file processing.

---

## 10. Payments & Subscriptions

- Razorpay integration: `backend/src/services/payment/` — `razorpayWebhook.js` (webhook handler), `sellerPaymentService.js`, `adminPaymentAnalytics.js`.
- `SubscriptionPlan.js` model self-seeds default plans on server boot (`seedDefaultPlans()` in `server.js`).
- Quota enforcement: seller dashboard reads `GET /api/sellers/me/quota-status`; limits stored on `SubscriptionPlan.limits`, checked at product-creation time.
- `subscriptionExpiryJob.js` (cron) — downgrades/expires subscriptions on schedule.
- `featuredProductExpiryJob.js` (cron) — expires paid "featured product" placements.
- `inquiryReminderJob.js` (cron) — nudges sellers/buyers on stale inquiries.

---

## 11. Environment Variables

Backend `.env` (see `backend/.env.example` — this is the **authoritative** list; CLAUDE.md's `MONGODB_URI` name is **wrong**, the actual var is `MONGO_URI`):

```
PORT=8000
NODE_ENV=production|development        # dev disables rate limiting
MONGO_URI=mongodb://127.0.0.1:27017/indiamart
JWT_SECRET=...
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:3000        # drives CORS + Socket.IO origin
MSG91_AUTH_KEY=...                      # primary SMS/OTP provider
MSG91_TEMPLATE_ID=...
FAST2SMS_API_KEY=...                    # fallback SMS provider
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

Additionally required but **absent from `.env.example`** (found via code, not documented):
```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

Frontend has no `.env.example` file. From code: `NEXT_PUBLIC_API_URL` (SSR-only fallback for the axios base URL).

---

## 12. Known Gotchas (verified in code, beyond what CLAUDE.md states)

- **`node-fetch` crash**: `backend/src/services/productImageService.js` used to `import fetch from "node-fetch"` without the package listed as a backend dependency → `ERR_MODULE_NOT_FOUND` on boot. Fixed by removing the import and relying on Node's built-in global `fetch` (project runs on Node 24). If you see this class of error elsewhere, same fix pattern applies — check `backend/package.json` dependencies before importing.
- **`.env.example` var name mismatch**: CLAUDE.md says `MONGODB_URI`; actual code/`.env.example` use `MONGO_URI`. Trust the `.env.example` / `config/db.js`, not the prose doc.
- **Cloudinary env vars undocumented**: required by `config/cloudinary.js` but missing from `.env.example`.
- **Next.js 16 breaking changes**: `frontend/AGENTS.md` explicitly warns this Next.js version diverges from typical training data — check `node_modules/next/dist/docs/` for unfamiliar APIs before writing frontend routing/data-fetching code.
- **Prod API path has an extra segment**: `/indiamart/api` in production vs. `/api` in dev — a reverse-proxy/deploy-path detail baked into `lib/axios.ts`.
- **Heavy console logging in hot paths**: `authMiddleware.js` and the `/uploads` static-serving middleware in `app.js` log verbosely (emoji-prefixed) on every request — expected noise in dev, not a bug.
- **500mb body limit**: `express.json({ limit: "500mb" })` — unusually high; likely to accommodate base64 or large multipart payloads. Be aware if adding new large-payload endpoints.
- Rest of CLAUDE.md's "Specific Fixes & Gotchas" section (image alt text, upload field names, sellerId fallback logic, middleware ordering) still applies and is accurate.

---

## 13. Where to Look First

| Task | Start here |
|---|---|
| New API endpoint | `backend/src/routes/`, `backend/src/controllers/`, mount in `app.js` |
| New DB field | `backend/src/models/` — check for existing `.index()` on query fields |
| New buyer/seller page | `frontend/src/app/{buyer,seller}/<feature>/page.tsx` |
| Chat feature | `backend/src/socket/socketHandler.js` + `frontend/src/contexts/ChatContext.tsx` |
| File upload feature | `backend/src/middleware/multer.js` + matching controller + Cloudinary config |
| Payment/subscription logic | `backend/src/services/payment/`, `SubscriptionPlan.js`, `sellerRoutes.js` quota endpoints |
| Auth/role bug | `middleware/authMiddleware.js`, `middleware/roleMiddleware.js`, `contexts/AuthContext.tsx` |
| Cron/scheduled behavior | `backend/src/jobs/` |
