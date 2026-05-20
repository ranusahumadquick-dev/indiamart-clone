# 🛒 IndiaMart — B2B Marketplace Platform

A full-stack B2B marketplace platform inspired by IndiaMart, connecting buyers with verified suppliers across India.

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Node.js, Express 5, JWT Auth |
| **Database** | MongoDB with Mongoose ODM |
| **File Upload** | Cloudinary + Multer |
| **Payments** | Razorpay (Indian payment gateway) |

## 📁 Project Structure

```
indiamart/
├── backend/                  # Express API server
│   ├── src/
│   │   ├── app.js           # Express app configuration
│   │   ├── server.js        # Entry point
│   │   ├── config/          # DB, Cloudinary configs
│   │   ├── constants/       # Roles, statuses, HTTP codes
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, roles, error handling, uploads
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API route definitions
│   │   └── utils/           # Helpers (ApiError, ApiResponse, etc.)
│   ├── .env                 # Environment variables
│   └── package.json
│
├── frontend/                 # Next.js App Router
│   ├── src/
│   │   ├── app/             # Pages (App Router)
│   │   │   ├── page.tsx     # Homepage
│   │   │   ├── products/    # Product listing + detail
│   │   │   ├── categories/  # Category browser
│   │   │   ├── auth/        # Login + Register
│   │   │   └── admin/       # Admin panel
│   │   ├── components/      # Reusable UI components
│   │   ├── lib/             # Axios instance, helpers
│   │   └── providers/       # Context providers
│   ├── public/              # Static assets
│   └── package.json
│
└── README.md
```

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally or Atlas URI
- npm or yarn

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file:
```env
PORT=8000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/indiamart
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=1d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRY=7d
CLIENT_URL=http://localhost:3000
```

```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

```bash
npm run dev
```

### 3. Access

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api |

## 🔑 Features

### Buyer Features
- 🔍 Search products with advanced filtering
- 📦 Browse categories and product listings
- 💬 Send enquiries to suppliers
- ⭐ Leave ratings and reviews
- 🛒 View supplier profiles

### Supplier Features
- 📋 Product listing management (CRUD)
- 📊 Supplier dashboard
- 💰 Subscription plans (Free/Basic/Premium)
- ✅ Verified supplier badge
- 📩 Enquiry inbox

### Admin Features
- 👥 User management
- 📦 Product approval system
- 🏷️ Category management
- 📊 Platform analytics dashboard

## 📜 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register buyer/supplier |
| POST | `/api/auth/login` | Login |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:id` | Product details |
| POST | `/api/products` | Create product (supplier) |
| GET | `/api/categories` | List categories |
| POST | `/api/inquiries` | Send enquiry |
| POST | `/api/reviews` | Submit review |

## 📄 License

MIT License — free for personal and commercial use.
