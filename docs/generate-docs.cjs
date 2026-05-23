const fs = require("fs");
const path = require("path");

const OUT = path.join(__dirname, "screenshots");

function img(filename, caption) {
  const fp = path.join(OUT, filename);
  if (!fs.existsSync(fp)) return `<div class="missing">[ Screenshot: ${filename} not found ]</div>`;
  const b64 = fs.readFileSync(fp).toString("base64");
  return `<figure><img src="data:image/png;base64,${b64}" alt="${caption || filename}" />${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
}

function step(n, text) {
  return `<div class="step-row"><span class="step">${n}</span><p>${text}</p></div>`;
}

const css = `
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; line-height: 1.6; }
.cover { background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 60%, #7f0000 100%); color: #fff; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 40px; page-break-after: always; }
.cover h1 { font-size: 52px; font-weight: 800; margin-bottom: 14px; }
.cover h2 { font-size: 22px; font-weight: 400; opacity: 0.9; margin-bottom: 40px; }
.cover .badge { background: rgba(255,255,255,0.15); border: 2px solid rgba(255,255,255,0.3); border-radius: 50px; padding: 8px 22px; font-size: 14px; display: inline-block; margin: 5px; }
.cover .stack { margin-top: 30px; display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; }
.divider { width: 80px; height: 4px; background: rgba(255,255,255,0.4); border-radius: 2px; margin: 28px auto; }
.section { padding: 60px 80px; page-break-before: always; }
h1.sec { font-size: 32px; color: #d32f2f; border-bottom: 3px solid #d32f2f; padding-bottom: 12px; margin-bottom: 30px; }
h2.sub { font-size: 21px; color: #1a1a2e; margin: 32px 0 14px; border-left: 4px solid #d32f2f; padding-left: 12px; }
p { margin: 10px 0; color: #333; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px; }
th { background: #d32f2f; color: #fff; padding: 10px 14px; text-align: left; }
td { padding: 9px 14px; border-bottom: 1px solid #eee; }
tr:nth-child(even) td { background: #fafafa; }
figure { margin: 20px 0; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
figure img { width: 100%; display: block; }
figcaption { background: #f5f5f5; padding: 8px 16px; font-size: 13px; color: #666; border-top: 1px solid #e0e0e0; }
.missing { background: #fff3e0; border: 2px dashed #ff9800; padding: 16px; border-radius: 8px; color: #e65100; text-align: center; margin: 16px 0; }
.grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
ul { margin: 10px 0 10px 24px; }
li { margin: 5px 0; color: #333; }
.step { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; background: #d32f2f; color: #fff; border-radius: 50%; font-weight: 700; font-size: 14px; margin-right: 10px; flex-shrink: 0; }
.step-row { display: flex; align-items: center; margin: 12px 0; }
.step-row p { margin: 0; }
.info-box { background: #e3f2fd; border-left: 4px solid #1976d2; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 16px 0; }
.success-box { background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 14px 18px; border-radius: 0 8px 8px 0; margin: 16px 0; }
code { font-family: monospace; background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
@media print { .section { padding: 40px 60px; } @page { margin: 15mm; size: A4; } }
`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>IndiaMart Clone — Project Documentation</title>
<style>${css}</style>
</head>
<body>

<div class="cover">
  <div style="font-size:72px;margin-bottom:20px;">🏭</div>
  <h1>IndiaMart Clone</h1>
  <h2>B2B Marketplace Platform — Complete Project Documentation</h2>
  <div class="divider"></div>
  <p style="opacity:0.85;font-size:16px;max-width:600px">A full-stack B2B marketplace connecting buyers with verified suppliers. Frontend + Backend + Real-time chat + Payments + Admin panel.</p>
  <div class="stack">
    <span class="badge">Next.js 16</span>
    <span class="badge">Node.js + Express</span>
    <span class="badge">MongoDB</span>
    <span class="badge">Razorpay</span>
    <span class="badge">Socket.io</span>
    <span class="badge">Cloudinary</span>
    <span class="badge">JWT Auth</span>
    <span class="badge">TypeScript</span>
  </div>
  <div class="divider"></div>
  <p style="opacity:0.7;font-size:14px;margin-top:20px">Full Stack MERN Web Application &nbsp;|&nbsp; Portfolio / Internship / College Major Project</p>
</div>

<!-- ── 1. PROJECT OVERVIEW ── -->
<div class="section">
  <h1 class="sec">1. Project Overview</h1>
  <p>IndiaMart Clone is a B2B (Business-to-Business) marketplace platform inspired by IndiaMart.com. It connects buyers and suppliers across India for product discovery, inquiry management, quotation handling, and secure payments.</p>
  <h2 class="sub">Three User Roles</h2>
  <table>
    <tr><th>Role</th><th>What They Can Do</th></tr>
    <tr><td><strong>Buyer</strong></td><td>Browse products, send inquiries, post RFQs, request samples, compare products, wishlist</td></tr>
    <tr><td><strong>Seller</strong></td><td>List products, manage inquiries, upload certificates, add company video, receive orders</td></tr>
    <tr><td><strong>Admin</strong></td><td>Approve/reject products, verify sellers, manage users and categories</td></tr>
  </table>
  <h2 class="sub">Technology Stack</h2>
  <table>
    <tr><th>Layer</th><th>Technology</th><th>Purpose</th></tr>
    <tr><td>Frontend</td><td>Next.js 16 (App Router) + TypeScript</td><td>UI and routing</td></tr>
    <tr><td>Styling</td><td>Tailwind CSS 4</td><td>Responsive design</td></tr>
    <tr><td>Backend</td><td>Node.js + Express 5</td><td>REST API server</td></tr>
    <tr><td>Database</td><td>MongoDB + Mongoose</td><td>Data persistence (18 collections)</td></tr>
    <tr><td>Auth</td><td>JWT + bcrypt</td><td>Secure authentication</td></tr>
    <tr><td>File Upload</td><td>Multer + Cloudinary</td><td>Images, PDFs, Videos</td></tr>
    <tr><td>Payments</td><td>Razorpay</td><td>Subscription billing</td></tr>
    <tr><td>Real-time</td><td>Socket.io</td><td>Live buyer-seller chat</td></tr>
    <tr><td>API Client</td><td>Axios</td><td>Frontend-to-backend calls</td></tr>
    <tr><td>State</td><td>React Context API</td><td>Auth, compare, inquiry state</td></tr>
  </table>
</div>

<!-- ── 2. PUBLIC PAGES ── -->
<div class="section">
  <h1 class="sec">2. Frontend — Public Pages</h1>
  <p>Accessible to all visitors without login.</p>

  <h2 class="sub">Step 1 — Home Page</h2>
  <p>Landing page with hero search bar, featured products grid, category browse, trust badges, and recently viewed products.</p>
  ${img("home.png", "Home Page — Hero search, featured products, category grid")}

  <h2 class="sub">Step 2 — Login Page</h2>
  <p>Email + password login. JWT token stored in localStorage. Role-based redirect after login.</p>
  ${img("login.png", "Login Page — Email + password, JWT authentication")}

  <h2 class="sub">Step 3 — Register / Signup Page</h2>
  <p>User selects role (Buyer or Seller) during registration. Different fields shown based on role selection.</p>
  ${img("register.png", "Register Page — Role selection Buyer / Seller")}

  <h2 class="sub">Step 4 — Product Listing Page</h2>
  <p>Browse all products with filters: category, price range, city, rating, MOQ, samples. Compare and bulk inquiry buttons on each card.</p>
  ${img("products.png", "Products Page — Filter sidebar, product grid, compare & inquiry buttons")}

  <h2 class="sub">Step 5 — Product Search Results</h2>
  <p>Full-text product search with results and filter sidebar.</p>
  ${img("search.png", "Search Results — Keyword search with filters")}

  <h2 class="sub">Step 6 — Product Detail Page</h2>
  <p>Full product page: image gallery, price range, MOQ, seller info, Q&A section, reviews, and Request Sample button.</p>
  ${img("product-detail.png", "Product Detail — Gallery, price, MOQ, seller info, Q&A, reviews")}

  <h2 class="sub">Step 7 — Categories Page</h2>
  <p>Industry category grid for browsing products by type.</p>
  ${img("categories.png", "Categories Page — Browse by industry")}

  <h2 class="sub">Step 8 — Sellers Directory</h2>
  <p>Browse all verified sellers with search and filter by city/category.</p>
  ${img("sellers.png", "Seller Directory — Browse and search suppliers")}

  <h2 class="sub">Step 9 — Public Seller Profile</h2>
  <p>Full seller page: products tab, About & Certifications tab (certifications, company video, business details), reviews tab. Send Enquiry and Chat Now buttons.</p>
  ${img("seller-profile-public.png", "Public Seller Profile — Products, certifications, video, reviews")}

  <h2 class="sub">Step 10 — Compare Products</h2>
  <p>Side-by-side comparison of up to 4 products. Compare bar appears at bottom when products are selected.</p>
  ${img("compare.png", "Compare Page — Side-by-side product comparison")}

  <h2 class="sub">Step 11 — Buy Requirements Board (RFQ)</h2>
  <p>Public board where buyers post product requirements. Sellers can browse and respond with quotes.</p>
  ${img("rfq-board.png", "RFQ Board — Buy requirements listing")}

  <h2 class="sub">Step 12 — Subscription Plans</h2>
  <p>Plan selection page for sellers (Free / Basic ₹499/mo / Premium ₹1499/mo) and buyers (Free / Business / Enterprise).</p>
  ${img("plans.png", "Subscription Plans — Pricing tiers")}
</div>

<!-- ── 3. BUYER DASHBOARD ── -->
<div class="section">
  <h1 class="sec">3. Frontend — Buyer Dashboard</h1>
  <p>Protected pages accessible only to logged-in buyers.</p>

  <h2 class="sub">Step 13 — Buyer Dashboard</h2>
  <p>Overview with stats cards: total inquiries sent, active requirements, sample requests, and order history.</p>
  ${img("buyer-dashboard.png", "Buyer Dashboard — Stats overview")}

  <h2 class="sub">Step 14 — Buyer Inquiries</h2>
  <p>All inquiries sent by the buyer with seller reply status, product name, and inquiry date.</p>
  ${img("buyer-inquiries.png", "Inquiries — Sent inquiries with seller reply status")}

  <h2 class="sub">Step 15 — My Buy Requirements (RFQs)</h2>
  <p>Manage posted requirements. See seller response count, boost to priority, invite more sellers, or close and select supplier.</p>
  ${img("buyer-requirements.png", "My Requirements — Posted RFQs management")}

  <h2 class="sub">Step 16 — Sample Requests</h2>
  <p>All sample requests with status timeline: Requested → Accepted → Shipped → Delivered.</p>
  ${img("buyer-samples.png", "Sample Requests — Full lifecycle status tracking")}

  <h2 class="sub">Step 17 — Wishlist</h2>
  <p>Saved products and seller shortlist in one place with collection names.</p>
  ${img("buyer-wishlist.png", "Wishlist — Saved products and sellers")}

  <h2 class="sub">Step 18 — Notifications</h2>
  <p>All platform notifications: inquiry replies, sample updates, RFQ responses, system alerts.</p>
  ${img("notifications.png", "Notifications — All activity alerts")}

  <h2 class="sub">Step 19 — Price Alerts</h2>
  <p>Set price or stock alerts on specific products. Get notified when price drops or stock restores.</p>
  ${img("price-alerts.png", "Price Alerts — Price & stock alert management")}

  <h2 class="sub">Step 20 — Account Profile Settings</h2>
  <p>Update display name, change password, upload avatar. Shows role badge and account security checklist. Sellers see "Go to Business Profile" link.</p>
  ${img("account-profile.png", "Account Settings — Name, password, avatar")}
</div>

<!-- ── 4. SELLER DASHBOARD ── -->
<div class="section">
  <h1 class="sec">4. Frontend — Seller Dashboard</h1>
  <p>Protected pages accessible only to logged-in sellers.</p>

  <h2 class="sub">Step 21 — Seller Dashboard</h2>
  <p>Stats overview: total products, profile views, inquiries received, revenue, and current subscription plan card.</p>
  ${img("seller-dashboard.png", "Seller Dashboard — Products, views, inquiries, subscription")}

  <h2 class="sub">Step 22 — My Products</h2>
  <p>Product list with approval status badges (Approved / Pending / Rejected). Quick edit and delete actions per product.</p>
  ${img("seller-products.png", "My Products — List with approval status")}

  <h2 class="sub">Step 23 — Add New Product</h2>
  <p>Product creation form: up to 5 images (Cloudinary), price range min/max, MOQ, tags, sample settings, detailed description.</p>
  ${img("add-product.png", "Add Product — Images, price range, MOQ, tags, samples")}

  <h2 class="sub">Step 24 — Seller Inquiries Inbox</h2>
  <p>All received buyer inquiries. Seller views details and can reply directly from this page.</p>
  ${img("seller-inquiries.png", "Inquiry Inbox — Received inquiries with reply")}

  <h2 class="sub">Step 25 — Sample Requests Management</h2>
  <p>Sample requests from buyers. Seller can Accept, Reject, or mark as Shipped with a tracking number.</p>
  ${img("seller-samples.png", "Sample Requests — Accept / Reject / Ship workflow")}

  <h2 class="sub">Step 26 — Business Profile Page</h2>
  <p>Full business profile with: profile completeness score (0-100%), logo, company description, GST, certification cards (ISO/FSSAI/BIS with file upload), company video (YouTube embed), and virtual tour link.</p>
  ${img("seller-biz-profile.png", "Business Profile — Score, certifications, company video, GST")}

  <h2 class="sub">Step 27 — 4-Step Onboarding Wizard</h2>
  <p>First-time seller setup: Step 1 Business Identity → Step 2 Location & Contact → Step 3 Capabilities → Step 4 Trust & Compliance (GST, certifications, payment terms).</p>
  ${img("seller-onboarding.png", "Onboarding Wizard — 4-step seller profile setup")}
</div>

<!-- ── 5. ADMIN PANEL ── -->
<div class="section">
  <h1 class="sec">5. Frontend — Admin Panel</h1>
  <p>Protected pages accessible only to admin users.</p>

  <h2 class="sub">Step 28 — Admin Dashboard</h2>
  <p>Platform-wide stats: total registered users, total products, revenue overview, pending product approvals count.</p>
  ${img("admin-dashboard.png", "Admin Dashboard — Platform statistics")}

  <h2 class="sub">Step 29 — User Management</h2>
  <p>View all users (buyers, sellers). Admin can verify sellers (gives platform-verified badge), deactivate accounts, or delete users.</p>
  ${img("admin-users.png", "User Management — Verify, deactivate, delete users")}

  <h2 class="sub">Step 30 — Product Moderation</h2>
  <p>Review products submitted by sellers (status: Pending). Admin can Approve → product goes live, or Reject with a reason sent back to seller.</p>
  ${img("admin-products.png", "Product Moderation — Approve / Reject pending products")}

  <h2 class="sub">Step 31 — Category Management</h2>
  <p>Full CRUD for product categories. Supports parent + sub-category hierarchy for product classification.</p>
  ${img("admin-categories.png", "Categories — Hierarchical category management")}
</div>

<!-- ── 6. MOBILE RESPONSIVE ── -->
<div class="section">
  <h1 class="sec">6. Mobile Responsive Design</h1>
  <p>The entire UI is fully responsive for mobile (390px), tablet, laptop, and desktop using Tailwind CSS responsive classes, flexbox, and CSS grid.</p>
  <div class="grid2">
    ${img("mobile-home.png", "Mobile Home Page (390px width)")}
    ${img("mobile-products.png", "Mobile Products Page (390px width)")}
  </div>
  <h2 class="sub">Responsive Features</h2>
  <ul>
    <li>Mobile hamburger menu with slide-out navigation drawer</li>
    <li>Flexible product grid (1 col mobile → 2 cols tablet → 4 cols desktop)</li>
    <li>Responsive dashboard sidebar collapses to icon-only on mobile</li>
    <li>Touch-friendly buttons and card tap areas</li>
    <li>Horizontal scroll on comparison tables for small screens</li>
  </ul>
</div>

<!-- ── 7. BACKEND API ── -->
<div class="section">
  <h1 class="sec">7. Backend — REST API</h1>
  <p>Node.js + Express 5 backend following MVC architecture. All responses use standard <code>ApiResponse</code> wrapper: <code>{ success, statusCode, message, data }</code></p>
  <div class="info-box">
    <strong>Base URL:</strong> <code>http://localhost:8000/api</code> &nbsp;|&nbsp;
    <strong>Auth:</strong> <code>Authorization: Bearer &lt;token&gt;</code> header
  </div>

  <h2 class="sub">Step 32 — Server Health Check API</h2>
  <p>Confirms backend server is running and MongoDB is connected.</p>
  ${img("api-health.png", "GET /api/health — Server health check")}

  <h2 class="sub">Step 33 — Products API Response</h2>
  <p>Returns paginated products with seller info, images, price range, category. Supports filters: category, price, city, rating, MOQ.</p>
  ${img("api-products.png", "GET /api/products — Product listing API response")}

  <h2 class="sub">Step 34 — Categories API Response</h2>
  <p>Returns full category hierarchy with parent and sub-categories for navigation menus.</p>
  ${img("api-categories.png", "GET /api/categories — Categories API response")}

  <h2 class="sub">Step 35 — Sellers Directory API Response</h2>
  <p>Returns paginated sellers with profile completeness scores, verification status, and ratings.</p>
  ${img("api-sellers.png", "GET /api/sellers — Seller directory API response")}

  <h2 class="sub">Step 36 — Buy Requirements (RFQ) API Response</h2>
  <p>Returns active buy requirements posted by buyers, available for sellers to browse and respond to.</p>
  ${img("api-rfq.png", "GET /api/buy-requirements — RFQ listing API response")}

  <h2 class="sub">Step 37 — Subscription Plans API Response</h2>
  <p>Returns available subscription plans with features, pricing, and limits for sellers.</p>
  ${img("api-plans.png", "GET /api/payments/plans — Subscription plans API response")}

  <h2 class="sub">All API Endpoints</h2>
  <table>
    <tr><th>Method</th><th>Endpoint</th><th>Role</th><th>Description</th></tr>
    <tr><td>POST</td><td>/api/auth/register</td><td>Public</td><td>Register new user (buyer/seller)</td></tr>
    <tr><td>POST</td><td>/api/auth/login</td><td>Public</td><td>Login — returns JWT access + refresh token</td></tr>
    <tr><td>GET</td><td>/api/auth/me</td><td>Auth</td><td>Get own profile</td></tr>
    <tr><td>PUT</td><td>/api/auth/profile</td><td>Auth</td><td>Update name, city, phone</td></tr>
    <tr><td>POST</td><td>/api/auth/change-password</td><td>Auth</td><td>Change password (bcrypt)</td></tr>
    <tr><td>PUT</td><td>/api/auth/update-avatar</td><td>Auth</td><td>Upload profile photo to Cloudinary</td></tr>
    <tr><td>GET</td><td>/api/products</td><td>Public</td><td>List products with filters + pagination</td></tr>
    <tr><td>GET</td><td>/api/products/:id</td><td>Public</td><td>Single product detail</td></tr>
    <tr><td>POST</td><td>/api/products</td><td>Seller</td><td>Create product (pending admin approval)</td></tr>
    <tr><td>PUT</td><td>/api/products/:id</td><td>Seller</td><td>Update product</td></tr>
    <tr><td>DELETE</td><td>/api/products/:id</td><td>Seller</td><td>Delete product</td></tr>
    <tr><td>GET</td><td>/api/categories</td><td>Public</td><td>Category hierarchy</td></tr>
    <tr><td>GET</td><td>/api/sellers</td><td>Public</td><td>Seller directory</td></tr>
    <tr><td>GET</td><td>/api/sellers/:id</td><td>Public</td><td>Public seller profile</td></tr>
    <tr><td>PUT</td><td>/api/sellers/me</td><td>Seller</td><td>Update business profile</td></tr>
    <tr><td>POST</td><td>/api/sellers/me/certifications</td><td>Seller</td><td>Upload certificate (JPG/PNG/PDF)</td></tr>
    <tr><td>DELETE</td><td>/api/sellers/me/certifications/:id</td><td>Seller</td><td>Remove certificate</td></tr>
    <tr><td>POST</td><td>/api/sellers/me/video</td><td>Seller</td><td>Upload company video (MP4/MOV)</td></tr>
    <tr><td>POST</td><td>/api/inquiries/:productId</td><td>Buyer</td><td>Send inquiry to seller</td></tr>
    <tr><td>POST</td><td>/api/inquiries/bulk</td><td>Buyer</td><td>Bulk inquiry to multiple sellers</td></tr>
    <tr><td>GET</td><td>/api/inquiries/seller/inbox</td><td>Seller</td><td>Received inquiries inbox</td></tr>
    <tr><td>PUT</td><td>/api/inquiries/:id/reply</td><td>Seller</td><td>Reply to inquiry</td></tr>
    <tr><td>GET</td><td>/api/buy-requirements</td><td>Public</td><td>Public RFQ board</td></tr>
    <tr><td>POST</td><td>/api/buy-requirements</td><td>Buyer</td><td>Post new requirement</td></tr>
    <tr><td>POST</td><td>/api/buy-requirements/:id/respond</td><td>Seller</td><td>Send quote to buyer</td></tr>
    <tr><td>GET</td><td>/api/notifications</td><td>Auth</td><td>My notifications</td></tr>
    <tr><td>GET</td><td>/api/notifications/unread-count</td><td>Auth</td><td>Unread count for navbar bell</td></tr>
    <tr><td>POST</td><td>/api/payments/create-order</td><td>Auth</td><td>Create Razorpay order</td></tr>
    <tr><td>POST</td><td>/api/payments/verify-payment/:id</td><td>Auth</td><td>Verify Razorpay payment</td></tr>
    <tr><td>GET</td><td>/api/payments/plans</td><td>Public</td><td>Available subscription plans</td></tr>
    <tr><td>GET</td><td>/api/admin/dashboard</td><td>Admin</td><td>Platform stats</td></tr>
    <tr><td>PATCH</td><td>/api/admin/products/:id</td><td>Admin</td><td>Approve or reject product</td></tr>
    <tr><td>GET</td><td>/api/admin/users</td><td>Admin</td><td>All users list</td></tr>
    <tr><td>PATCH</td><td>/api/admin/users/:id</td><td>Admin</td><td>Verify / deactivate user</td></tr>
  </table>
</div>

<!-- ── 8. DATABASE MODELS ── -->
<div class="section">
  <h1 class="sec">8. Backend — Database Models (18 Collections)</h1>
  <table>
    <tr><th>#</th><th>Model</th><th>Purpose</th><th>Key Fields</th></tr>
    <tr><td>1</td><td><strong>User</strong></td><td>All users</td><td>name, email, password, role, companyName, gstNumber, certificationDocs[], companyVideo, isVerified</td></tr>
    <tr><td>2</td><td><strong>Product</strong></td><td>Seller products</td><td>name, price, priceMax, category, images[], seller, stock, allowSamples, status</td></tr>
    <tr><td>3</td><td><strong>Category</strong></td><td>Categories</td><td>name, slug, parentCategory (hierarchy)</td></tr>
    <tr><td>4</td><td><strong>Inquiry</strong></td><td>Buyer→Seller contact</td><td>buyer, seller, product, message, sellerReply, status</td></tr>
    <tr><td>5</td><td><strong>BuyRequirement</strong></td><td>Buyer RFQ</td><td>productName, quantity, budget, responses[], invitedSellers, isPriority</td></tr>
    <tr><td>6</td><td><strong>SampleRequest</strong></td><td>Sample lifecycle</td><td>buyer, seller, product, quantity, unitPrice, status, trackingNumber</td></tr>
    <tr><td>7</td><td><strong>Order</strong></td><td>Purchase orders</td><td>buyer, seller, items[], totalAmount, status, paymentStatus</td></tr>
    <tr><td>8</td><td><strong>Payment</strong></td><td>Razorpay transactions</td><td>razorpayOrderId, amount, paymentFor, status, completedAt</td></tr>
    <tr><td>9</td><td><strong>Subscription</strong></td><td>Active plan</td><td>userId, plan, startDate, endDate, status, features</td></tr>
    <tr><td>10</td><td><strong>SubscriptionPlan</strong></td><td>Plan catalog</td><td>name, price, duration, maxProducts, maxInquiries, features</td></tr>
    <tr><td>11</td><td><strong>Review</strong></td><td>Reviews</td><td>user, product, rating(1-5), title, comment, helpfulVotes</td></tr>
    <tr><td>12</td><td><strong>Notification</strong></td><td>In-app alerts</td><td>user, type, title, message, isRead, link</td></tr>
    <tr><td>13</td><td><strong>Message</strong></td><td>Chat messages</td><td>conversation, sender, text, attachments, readBy</td></tr>
    <tr><td>14</td><td><strong>Conversation</strong></td><td>Chat threads</td><td>participants[], product, lastMessage, unreadCount</td></tr>
    <tr><td>15</td><td><strong>Question</strong></td><td>Product Q&A</td><td>product, seller, askedBy, question, answer, upvotes</td></tr>
    <tr><td>16</td><td><strong>PriceAlert</strong></td><td>Price/Stock alerts</td><td>user, product, targetPrice, alertType, isActive</td></tr>
    <tr><td>17</td><td><strong>Wishlist</strong></td><td>Saved products</td><td>user, product, note, collectionName</td></tr>
    <tr><td>18</td><td><strong>SellerShortlist</strong></td><td>Saved sellers</td><td>user, seller, note, collectionName</td></tr>
  </table>

  <h2 class="sub">Authentication Flow</h2>
  ${step(1,"User registers — password encrypted with <strong>bcrypt (10 rounds)</strong>")}
  ${step(2,"User logs in — <strong>JWT Access Token (1 day)</strong> + Refresh Token (7 days) generated")}
  ${step(3,"Tokens stored in <strong>localStorage</strong> on frontend")}
  ${step(4,"Every protected API call sends <code>Authorization: Bearer &lt;token&gt;</code> header")}
  ${step(5,"<strong>authMiddleware</strong> verifies token, decodes payload, attaches <code>req.user</code>")}
  ${step(6,"<strong>roleMiddleware</strong> checks <code>req.user.role</code> — blocks wrong roles with 403 Forbidden")}
</div>

<!-- ── 9. SECURITY & FEATURES ── -->
<div class="section">
  <h1 class="sec">9. Backend — Security & Middleware</h1>

  <table>
    <tr><th>Middleware</th><th>Purpose</th></tr>
    <tr><td>authMiddleware.js</td><td>Verifies JWT token, attaches req.user to every protected request</td></tr>
    <tr><td>roleMiddleware.js</td><td>Role check (buyer / seller / admin) — returns 403 if wrong role</td></tr>
    <tr><td>uploadProductImages</td><td>Multer + Cloudinary — up to 5 product images, 5MB each, JPG/PNG/WebP</td></tr>
    <tr><td>uploadCertificate</td><td>Multer + Cloudinary — certificates JPG/PNG/PDF up to 10MB</td></tr>
    <tr><td>uploadVideo</td><td>Multer + Cloudinary — company video MP4/MOV/WebM up to 100MB</td></tr>
    <tr><td>uploadAvatar</td><td>Multer + Cloudinary — profile photo 2MB, auto-cropped 300×300px</td></tr>
    <tr><td>errorHandler.js</td><td>Global error handler — converts all errors to ApiError JSON format</td></tr>
  </table>

  <h2 class="sub">Security Features</h2>
  <ul>
    <li><strong>Helmet.js</strong> — Sets secure HTTP response headers</li>
    <li><strong>express-rate-limit</strong> — Prevents brute-force login attacks</li>
    <li><strong>CORS</strong> — Configured for frontend origin only</li>
    <li><strong>bcrypt (10 rounds)</strong> — Password hashing, never stored in plain text</li>
    <li><strong>JWT short-lived tokens</strong> — Access token 1 day, refresh token 7 days</li>
    <li><strong>dotenv</strong> — All secrets in .env file, never in source code</li>
    <li><strong>Input validation</strong> — Required field checks on all POST/PUT routes</li>
  </ul>

  <h2 class="sub">Real-Time Chat (Socket.io)</h2>
  <table>
    <tr><th>Event</th><th>Direction</th><th>What Happens</th></tr>
    <tr><td>connection</td><td>Client → Server</td><td>JWT verified on connect — unauthorized disconnected</td></tr>
    <tr><td>join_conversation</td><td>Client → Server</td><td>User joins a Socket.io room (conversation ID)</td></tr>
    <tr><td>send_message</td><td>Client → Server</td><td>Message saved to MongoDB, broadcast to all room members</td></tr>
    <tr><td>new_message</td><td>Server → Client</td><td>New message pushed to all participants in real-time</td></tr>
    <tr><td>typing / stop_typing</td><td>Client ↔ Server</td><td>Typing indicator shown to other participant</td></tr>
  </table>

  <h2 class="sub">Key Features Summary</h2>
  <table>
    <tr><th>Feature</th><th>Description</th></tr>
    <tr><td>Product Compare</td><td>Side-by-side comparison up to 4 products with floating compare bar</td></tr>
    <tr><td>Bulk Inquiry</td><td>One inquiry form sent to up to 10 sellers at once</td></tr>
    <tr><td>RFQ System</td><td>Buyers post requirements, sellers quote, buyer selects best supplier</td></tr>
    <tr><td>Sample Lifecycle</td><td>Request → Accept → Pay → Ship (with tracking) → Deliver confirmation</td></tr>
    <tr><td>Profile Score</td><td>Dynamic completeness score (0-100%) across 17 seller profile criteria</td></tr>
    <tr><td>Cert Upload</td><td>ISO/FSSAI/BIS certs stored in Cloudinary with admin-verified badge</td></tr>
    <tr><td>Company Video</td><td>YouTube URL embed or direct MP4 file upload for seller profile</td></tr>
    <tr><td>Price Alerts</td><td>Notify buyer when product price drops or comes back in stock</td></tr>
    <tr><td>Razorpay</td><td>Order creation + payment verification for subscription billing</td></tr>
  </table>
</div>

<!-- ── 10. FINAL SUMMARY ── -->
<div class="section">
  <h1 class="sec">10. Final Project Summary</h1>

  <h2 class="sub">Project Workflow (Step-by-Step Development)</h2>
  ${step(1,"<strong>UI Planning</strong> — Wireframes for all 40+ pages, component hierarchy")}
  ${step(2,"<strong>Database Design</strong> — 18 Mongoose models with relationships and indexes")}
  ${step(3,"<strong>Backend REST API</strong> — 100+ endpoints with MVC architecture and JWT auth")}
  ${step(4,"<strong>Frontend Pages</strong> — Next.js App Router, protected routes, Context API state management")}
  ${step(5,"<strong>API Integration</strong> — Axios with JWT interceptor, error handling, loading states")}
  ${step(6,"<strong>Advanced Features</strong> — Socket.io chat, Cloudinary uploads, Razorpay payments")}
  ${step(7,"<strong>Responsive Design</strong> — Mobile-first Tailwind CSS, tested on all screen sizes")}
  ${step(8,"<strong>Admin Panel</strong> — User management, product moderation, category management")}
  ${step(9,"<strong>Testing & Documentation</strong> — API testing, auth flows, project documentation")}

  <div class="success-box" style="margin-top:30px">
    <p style="font-size:18px;font-weight:700;margin-bottom:12px">✅ Project Successfully Completed</p>
    <ul>
      <li>40+ Frontend pages across Public, Buyer, Seller, and Admin sections</li>
      <li>100+ Backend REST API endpoints with full role-based access control</li>
      <li>18 MongoDB collections covering the full B2B marketplace domain</li>
      <li>Real-time buyer-seller chat via Socket.io</li>
      <li>Razorpay payment gateway for subscription billing</li>
      <li>Cloudinary storage for product images, certificates, and company videos</li>
      <li>Complete JWT authentication with role-based access (buyer/seller/admin)</li>
      <li>Fully responsive mobile-first UI using Tailwind CSS</li>
    </ul>
    <p style="margin-top:14px"><strong>Suitable for:</strong> Portfolio · Internship Submission · College Major Project · Placement Interviews · Full-Stack Development Showcase</p>
  </div>

  <div style="text-align:center;margin-top:60px;padding:40px 0;border-top:2px solid #e0e0e0">
    <p style="font-size:22px;font-weight:800;color:#d32f2f">IndiaMart Clone — B2B Marketplace Platform</p>
    <p style="color:#666;margin-top:10px;font-size:15px">Stack: Next.js 16 · Node.js + Express · MongoDB · Razorpay · Socket.io · Cloudinary</p>
    <p style="color:#999;font-size:13px;margin-top:8px">End of Documentation</p>
  </div>
</div>

</body>
</html>`;

const outPath = path.join(__dirname, "IndiaMart-Clone-Documentation.html");
fs.writeFileSync(outPath, html);
const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(1);
console.log(`✅ Documentation generated: docs/IndiaMart-Clone-Documentation.html`);
console.log(`📦 File size: ${sizeMB} MB (screenshots embedded as base64)`);
console.log(`\n📄 To save as PDF:`);
console.log(`   1. Open the file in Chrome browser`);
console.log(`   2. Press Ctrl+P`);
console.log(`   3. Select "Save as PDF"`);
console.log(`   4. Set margins to "None" or "Minimum"`);
console.log(`   5. Enable "Background graphics"`);
console.log(`   6. Click Save`);
