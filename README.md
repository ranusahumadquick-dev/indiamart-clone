# IndiaMart — B2B Marketplace Platform

A full-stack B2B marketplace platform inspired by IndiaMart, connecting buyers with verified suppliers across India.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Node.js, Express 5, JWT Auth, bcrypt |
| **Database** | MongoDB with Mongoose ODM |
| **File Upload** | Cloudinary + Multer |
| **Payments** | Razorpay (Indian payment gateway) |
| **Security** | Helmet, express-rate-limit, CORS |

## Project Structure

```
indiamart/
├── backend/                      # Primary Express API server
│   └── src/
│       ├── app.js                # Express app configuration
│       ├── server.js             # Entry point
│       ├── config/               # DB, Cloudinary configs
│       ├── constants/            # Roles, statuses, HTTP codes
│       ├── controllers/          # Route handlers
│       │   ├── authController.js
│       │   ├── productController.js
│       │   ├── categoryController.js
│       │   ├── sellerController.js
│       │   ├── inquiryController.js
│       │   ├── reviewController.js
│       │   ├── buyRequirementController.js
│       │   └── paymentController.js
│       ├── middleware/           # Auth, roles, error handling, uploads
│       ├── models/               # Mongoose schemas
│       ├── routes/               # API route definitions
│       ├── seed/                 # Database seed scripts
│       └── utils/                # ApiError, ApiResponse helpers
│
├── frontend/                     # Next.js App Router (TypeScript)
│   └── src/
│       ├── app/                  # Pages (App Router)
│       │   ├── page.tsx          # Homepage
│       │   ├── auth/             # Login & Register
│       │   ├── products/         # Product listing + detail
│       │   ├── categories/       # Category browser
│       │   ├── seller/           # Seller dashboard, inbox, products
│       │   ├── buyer/            # Buyer enquiry history
│       │   ├── sellers/          # Public seller profiles
│       │   ├── buy-requirements/ # Post buy requirements
│       │   ├── subscription/     # Subscription plans
│       │   ├── payments/         # Payment history
│       │   └── admin/            # Admin panel
│       ├── components/           # Reusable UI components
│       ├── contexts/             # React context providers
│       ├── lib/                  # Axios instance, helpers
│       └── types/                # TypeScript type definitions
│
├── package.json                  # Root — runs frontend + backend concurrently
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB running locally or a MongoDB Atlas URI
- Cloudinary account (for image uploads)
- Razorpay account (for payments)

### 1. Install All Dependencies

From the project root:

```bash
npm run install:all
```

### 2. Backend Environment

Create `backend/.env`:

```env
PORT=8000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/indiamart

# JWT
JWT_SECRET=your-jwt-secret
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret

# Client
CLIENT_URL=http://localhost:3000
```

### 3. Frontend Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 4. Run in Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Or run individually
npm run dev:backend    # http://localhost:8000
npm run dev:frontend   # http://localhost:3000
```

### 5. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |
| Health Check | http://localhost:8000/api/health |

## Features

### Buyer
- Search and browse products with filters
- Browse categories and product listings
- Send enquiries to suppliers
- Post buy requirements
- Leave ratings and reviews
- View supplier profiles

### Seller / Supplier
- Complete seller profile setup
- Product listing management (create, edit, delete)
- Seller dashboard with analytics
- Enquiry inbox
- Subscription plans (Free / Basic / Premium)
- Verified supplier badge

### Admin
- User management
- Product approval system
- Category management
- Platform analytics dashboard

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register buyer or supplier |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:id` | Product details |
| POST | `/api/products` | Create product (seller) |
| PUT | `/api/products/:id` | Update product (seller) |
| DELETE | `/api/products/:id` | Delete product (seller) |
| GET | `/api/categories` | List categories |
| POST | `/api/inquiries` | Send enquiry to seller |
| GET | `/api/inquiries` | List enquiries (seller inbox) |
| POST | `/api/reviews` | Submit a review |
| GET | `/api/sellers/:id` | Seller public profile |
| GET | `/api/buy-requirements` | List buy requirements |
| POST | `/api/buy-requirements` | Post a buy requirement |
| POST | `/api/payment/order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment |

## Scripts

```bash
npm run dev            # Run frontend + backend concurrently
npm run dev:backend    # Backend only
npm run dev:frontend   # Frontend only
npm run build          # Build frontend for production
npm run install:all    # Install dependencies for backend + frontend
```

## Screenshots

### Home Page
![Home Page](docs/screenshots/home.png)

### Login Page
![Login Page](docs/screenshots/login.png)

### Register / Signup Page
![Register Page](docs/screenshots/register.png)

### Product Listing
![Products](docs/screenshots/products.png)

### Product Detail Page
![Product Detail](docs/screenshots/product-detail.png)

### Product Search
![Search Results](docs/screenshots/search.png)

### Categories Page
![Categories](docs/screenshots/categories.png)

### Seller Directory
![Sellers](docs/screenshots/sellers.png)

### Public Seller Profile
![Seller Profile](docs/screenshots/seller-profile-public.png)

### Compare Products
![Compare](docs/screenshots/compare.png)

### Buy Requirements (RFQ Board)
![RFQ Board](docs/screenshots/rfq-board.png)

### Subscription Plans
![Plans](docs/screenshots/plans.png)

---

### Buyer Dashboard
![Buyer Dashboard](docs/screenshots/buyer-dashboard.png)

### Buyer Inquiries
![Buyer Inquiries](docs/screenshots/buyer-inquiries.png)

### Buyer Requirements
![Buyer Requirements](docs/screenshots/buyer-requirements.png)

### Buyer Sample Requests
![Buyer Samples](docs/screenshots/buyer-samples.png)

### Buyer Wishlist
![Wishlist](docs/screenshots/buyer-wishlist.png)

### Notifications
![Notifications](docs/screenshots/notifications.png)

### Price Alerts
![Price Alerts](docs/screenshots/price-alerts.png)

### Account Profile Settings
![Profile Settings](docs/screenshots/account-profile.png)

---

### Seller Dashboard
![Seller Dashboard](docs/screenshots/seller-dashboard.png)

### Seller Products
![Seller Products](docs/screenshots/seller-products.png)

### Add New Product
![Add Product](docs/screenshots/add-product.png)

### Seller Inquiries Inbox
![Seller Inquiries](docs/screenshots/seller-inquiries.png)

### Seller Sample Requests
![Seller Samples](docs/screenshots/seller-samples.png)

### Seller Business Profile
![Business Profile](docs/screenshots/seller-biz-profile.png)

### Seller Onboarding Wizard
![Onboarding](docs/screenshots/seller-onboarding.png)

---

### Admin Dashboard
![Admin Dashboard](docs/screenshots/admin-dashboard.png)

### Admin User Management
![Admin Users](docs/screenshots/admin-users.png)

### Admin Product Moderation
![Admin Products](docs/screenshots/admin-products.png)

### Admin Categories
![Admin Categories](docs/screenshots/admin-categories.png)

---

### Mobile Responsive — Home
![Mobile Home](docs/screenshots/mobile-home.png)

### Mobile Responsive — Products
![Mobile Products](docs/screenshots/mobile-products.png)

---

## License

MIT — free for personal and commercial use.
