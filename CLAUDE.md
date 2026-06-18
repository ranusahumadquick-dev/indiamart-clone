# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
# Backend (Express API)
cd backend
npm install
npm run dev              # Start with nodemon (port 8000)
npm run seed            # Seed products database

# Frontend (Next.js)
cd frontend
npm install
npm run dev             # Start dev server (port 3000)
npm run build           # Production build
npm run lint            # Run ESLint
npm run test            # Run Jest tests
```

## Architecture Overview

IndiaMart is a monorepo with **clear separation between frontend and backend**:

### Frontend (Next.js 16 + React 19)
- **App Router**: All routes in `src/app/` using file-based routing
- **Context API**: Global state management across 6 contexts (Auth, Cart, Chat, Bulk Inquiry, Compare, Payment)
- **Axios Client**: Single `lib/axios.ts` instance with pre-configured `/api` base URL—**use this for all API calls, never use fetch**
- **Components**: ~100 reusable components organized by feature (ProductDetail/, ProductShowcase/, chat/, seller/, etc.)
- **TypeScript**: Strict mode enforced; all components must have proper types

### Backend (Express.js + MongoDB)
- **ES Modules**: `"type": "module"` in package.json—use `import/export`, not CommonJS
- **Middleware Chain**: Auth → Role Check → Multer (if needed) → Controller
- **Mongoose Models**: 12+ models in `src/models/`, each with proper validation and refs
- **Controllers**: Business logic separated from routes; named exports for each handler
- **Routes**: Mounted at `/api/[resource]` with auth/role checks at route level
- **File Uploads**: Multer-based with `/uploads/` directory structure (products/, customizations/, profiles/)

### Database (MongoDB)
- **Collections**: Users, Products, Customizations, Inquiries, Messages, Orders, Subscriptions, etc.
- **Authentication**: `userId` references use ObjectId to User model; always `.populate()` when needed
- **Seller-specific**: Customization requests indexed by `sellerId` for fast seller dashboard queries

### Real-time (Socket.IO)
- **Chat**: WebSocket connection for live messaging
- **Events**: `message`, `user-online`, `user-offline`, `typing`
- **Pattern**: Rooms grouped by conversation ID

---

## Key Patterns & Conventions

### Frontend Patterns

**Authentication Flow**
- `AuthContext` stores `user` and `refreshUser()` function
- JWT stored in memory (access token) + httpOnly cookie (refresh token)
- Protected routes: Wrap with `<ProtectedRoute allowedRoles={["seller"]}>`
- Always check `user?.role` before rendering role-specific UI

**API Calls**
```typescript
import api from "@/lib/axios";
// Correctly use relative path (axios client prefixes /api automatically)
const response = await api.get("/customizations");
const response = await api.post("/customizations", formData, {
  headers: { "Content-Type": "multipart/form-data" }
});
// ❌ WRONG: api.get("/api/customizations") — double /api prefix
```

**File Uploads**
- Use `FormData` API to construct multipart requests
- Append files with exact field names matching backend multer config
- Include `onUploadProgress` callback for progress tracking
- Always provide meaningful alt text for all `<Image />` components (WCAG compliance)
- Fallback pattern: `alt={variable?.property || 'default text'}`

**Image Components**
- All Next.js `<Image>` components must have alt attributes with fallbacks
- Gallery images: `alt={`${product.name} image ${index + 1}`}`
- Product images: `alt={product.name}`
- Variant images: `alt={selectedVariant?.name || 'Product variant'}`

**Modal & Form Patterns**
- Modals use React state (`isOpen`) with conditional rendering
- Forms validate on submit, not on change (except for UX feedback)
- Toast notifications via `react-hot-toast` for success/error feedback

### Backend Patterns

**Authentication Middleware**
```javascript
// File: src/middleware/authMiddleware.js
// Extracts JWT from cookies or Authorization header
// Sets req.user to authenticated user object
// Call as: app.use(auth) or router.post("/", auth, controller)
```

**Role-Based Access**
```javascript
// File: src/middleware/roleMiddleware.js
// Factory function: roleMiddleware(["seller", "admin"])
// Returns middleware that checks req.user.role
// Use: router.patch("/:id", auth, roleMiddleware(["seller"]), controller)
```

**File Upload Middleware**
```javascript
// File: src/middleware/multer.js
// Exports: productUpload, customizationUpload, profileUpload
// Validation: MIME type, file size (5MB per file)
// Usage: router.post("/", multer, controller)
// Access files via: req.files.logo[0] or req.files.attachment array
// Error handling: Wrap with manual next(err) callback for better error messages
```

**Error Handling Pattern**
```javascript
// Centralized error handler catches all errors
// Custom ApiError class: new ApiError(statusCode, message, errors)
// Controller pattern: Use try/catch, throw ApiError, let global handler respond
// ❌ DON'T: res.status(500).json({...}) in every catch block
```

**Mongoose Patterns**
- Use `.populate("fieldName", "selectFields")` to include referenced data
- Always define `.index()` on frequently queried fields (e.g., sellerId on Customization)
- Validation: Use Mongoose schema validators, throw ApiError in pre-save hooks if needed
- Timestamps: Most models have `createdAt` and `updatedAt` auto-managed

---

## Critical Code Locations

### Frontend Entry Points
- `src/lib/axios.ts` — Single API client instance; always use this for HTTP
- `src/contexts/AuthContext.tsx` — User state, login/logout
- `src/app/seller/dashboard/page.tsx` — Example of multi-context dashboard (customizations, analytics, subscriptions)
- `src/components/ProductDetail/AdvancedProductDetailPage.tsx` — Complex component with file uploads, chat, customization modal

### Backend Entry Points
- `src/server.js` — Express app initialization, route mounting
- `src/app.js` — Middleware setup, route registration, static file serving
- `src/routes/customization.js` — Example of properly chained middlewares (auth → multer → controller)
- `src/controllers/customizationController.js` — Complete CRUD with file handling and seller filtering

### Common Customization Flows
- **Logo upload**: `req.files.logo[0].filename` → save to `/uploads/customizations/`
- **Multiple attachments**: `req.files.attachment.map(file => file.filename)`
- **Seller filtering**: Query by `{ sellerId: req.user._id }` with `.populate()`
- **Dashboard display**: Fetch customizations, paginate, sort by `createdAt: -1`

---

## Specific Fixes & Gotchas

### Image Alt Attributes
All `<Image />` components must have non-empty alt. Use optional chaining + fallback:
```typescript
alt={product?.name || 'Product'} // ✅ Good
alt={selectedVariant?.title || 'Variant'} // ✅ Good
alt={product.name} // ❌ Bad if product could be undefined
```

### File Upload Field Names
Multer config and FormData field names must match exactly:
```javascript
// Backend multer config
multer.fields([
  { name: "logo", maxCount: 1 },
  { name: "attachment", maxCount: 10 }
])

// Frontend FormData
formData.append("logo", logoFile);
customizationAttachments.forEach(file => formData.append("attachment", file));
```

### Seller ID in Customization Requests
- Frontend sends: `formData.append('sellerId', product.seller.id)`
- Backend receives: `const { sellerId } = req.body` OR fallback to `product.seller`
- Save to DB: `customizationData.sellerId = sellerId`
- Query for seller: `Customization.find({ sellerId: req.user._id })`

### Axios Client Configuration
The axios instance at `lib/axios.ts` is **pre-configured with `/api` base URL**:
```typescript
// ✅ Correct
api.get("/customizations") → GET http://localhost:8000/api/customizations

// ❌ Wrong
api.get("/api/customizations") → GET http://localhost:8000/api/api/customizations
```

### Middleware Chain Errors
If adding new routes, ensure middleware chain is correct:
```javascript
// ✅ Correct
router.post("/", auth, multer.fields([...]), controller);

// ❌ Wrong
router.post("/", multer.fields([...]), auth, controller); // Auth after file processing
```

### Modal State Management
Don't store modal state globally; keep it local to component:
```typescript
const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);
// Not: Use Context for every modal
```

---

## Development Workflows

### Adding a New Seller Feature
1. **Backend**: Create route in `src/routes/sellerRoutes.js`, add controller function
2. **Middleware**: Ensure auth and roleMiddleware check for seller role
3. **Database**: If new data, add model or extend existing with `.populate()`
4. **Frontend**: Create page in `src/app/seller/[feature]/`, use AuthContext to check role
5. **API calls**: Use axios client instance from `lib/axios.ts`
6. **Testing**: Navigate to feature as logged-in seller, verify data loads

### Adding File Upload Support
1. **Multer config**: Add to `src/middleware/multer.js` with file filters and size limits
2. **Route**: Use multer middleware in correct position (after auth, before controller)
3. **Controller**: Access `req.files.[fieldName]` array, map to filenames
4. **Frontend**: Construct FormData with matching field names, include validation
5. **Error handling**: Let multer error handler catch validation failures

### Debugging Authentication Issues
1. Check `AuthContext`: Is user being set after login?
2. Check cookies: Are tokens being stored? (DevTools → Application → Cookies)
3. Check axios instance: Does it send Authorization header? (DevTools → Network)
4. Check backend logs: Does auth middleware see the token?
5. Check role middleware: Is `req.user.role` set correctly?

---

## Deployment Notes

**Environment Variables**
- Backend `.env`: PORT, MONGODB_URI, JWT_SECRET, CLIENT_URL, STRIPE_SECRET_KEY
- Frontend `.env.local`: NEXT_PUBLIC_API_URL, NEXT_PUBLIC_STRIPE_KEY
- Never commit `.env` files; use example `.env.example` instead

**File Uploads**
- Local development: Files saved to `backend/uploads/` directory
- Production: Consider migrating to S3/Cloudinary (already imported but not configured)
- Public access: `/uploads` route is static-served in `app.js`

**Database**
- Connection string must include database name: `mongodb://...../indiamart`
- Indexes created on frequently queried fields (e.g., `sellerId` on Customization)
- Backups recommended for production; Atlas auto-backups if using cloud

---

## Recent Architectural Decisions

1. **Customization System**: Uses `sellerId` field (indexed) in Customization model for fast seller queries. Seller ID is either sent from frontend or extracted from product.seller.
2. **File Uploads**: Multer with `.fields()` for multiple field support; files saved locally with timestamp-based names.
3. **Dashboard Customizations**: Seller dashboard fetches customizations via `GET /api/sellers/customizations` with pagination (default 20 per page).
4. **Image Compliance**: All `<Image>` components use optional chaining (`?.`) with meaningful fallback alt text to ensure WCAG compliance.
5. **Subscription Quota**: Seller dashboard displays real-time usage via `GET /api/sellers/me/quota-status` endpoint.

---

## Common Tasks

**Viewing Seller Customization Requests**
- Fetch: `GET /api/sellers/customizations?page=1&limit=20&status=pending`
- DB query: `Customization.find({ sellerId, status })`
- Dashboard: `/seller/dashboard` shows recent 5 requests in table

**Uploading Files with Validation**
- Frontend validation: MIME type, size (5MB max)
- Backend validation: Multer + file filter callback
- Storage: `/uploads/customizations/{timestamp}-{randomId}.{ext}`
- Response: Returns `logoUrl` and `attachmentUrls` array

**Handling Subscription Quota**
- Fetch plans: `GET /api/payments/subscription-plans?planFor=seller`
- Current status: `GET /api/sellers/me/quota-status`
- Quota limits: Stored in `SubscriptionPlan.limits` and checked at product creation

---

## Version & Status

- **Version**: 1.0.0
- **Status**: Production Ready
- **Last Updated**: June 2026
- **Total Features**: 50+
- **API Endpoints**: 40+
- **Database Models**: 12+
