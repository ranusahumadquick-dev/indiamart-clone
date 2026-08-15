# 🛍️ Alibaba-Style Dynamic Purchase System - Complete Guide

## Overview

The Dynamic Purchase System is an intelligent, category-aware purchase interface that automatically adapts to show appropriate purchase options (Wholesale, Customization, or Both) based on the product's category.

## Features

✅ **Automatic Category Detection** - Detects category and shows relevant purchase tabs
✅ **Dual Purchase Modes** - Wholesale & Customization with smooth tab switching
✅ **Bulk Pricing Tiers** - Smart pricing calculation for wholesale orders
✅ **Customization Options** - Logo printing, OEM/ODM, custom design support
✅ **Mobile Responsive** - Perfect on all screen sizes
✅ **Smooth Animations** - Framer Motion for tab transitions
✅ **Real-time Calculations** - Instant price updates based on quantity
✅ **Seller Integration** - Direct chat & contact with sellers

---

## 📂 File Structure

```
src/
├── config/
│   └── purchaseModes.js           # Category configuration
├── components/
│   └── ProductDetail/
│       ├── DynamicPurchaseSystem.tsx      # Main component
│       ├── WholesaleSection.tsx           # Wholesale tab content
│       ├── CustomizationSection.tsx       # Customization tab content
│       ├── ProductPurchaseIntegration.tsx # Example integration
│       └── PURCHASE_SYSTEM_GUIDE.md       # This file
```

---

## 🚀 Quick Start

### 1. Installation

Ensure you have the required dependencies:

```bash
npm install framer-motion react-hot-toast react-icons
```

### 2. Import in Your Product Detail Page

```jsx
import DynamicPurchaseSystem from '@/components/ProductDetail/DynamicPurchaseSystem';

export default function ProductDetailPage({ product, seller }) {
  return (
    <div>
      {/* ... other product details ... */}
      <DynamicPurchaseSystem product={product} seller={seller} />
    </div>
  );
}
```

### 3. Prepare Product Data

Your product object should have:

```javascript
{
  _id: string;                              // Product ID
  name: string;                             // Product name
  price: number;                            // Base price
  stock: number;                            // Available stock
  moq?: number;                             // Minimum Order Quantity (default: 100)
  bulkPrices?: Array<{                      // Bulk pricing tiers
    quantity: number;
    price: number;
  }>;
  category?: {                              // Primary category
    name: string;
    slug: string;  // IMPORTANT: determines which tabs show!
  };
  subCategory?: {                           // Subcategory
    name: string;
    slug: string;
  };
}
```

### 4. Prepare Seller Data

```javascript
{
  _id: string;                              // Seller ID
  name: string;                             // Seller name
  companyName?: string;                     // Company name
}
```

---

## 🏷️ Category Configuration

### Categories Supporting BOTH Wholesale & Customization

These categories show BOTH tabs with full functionality:

- ✅ Industrial Machinery
- ✅ Hydraulic Equipment
- ✅ Solar Products
- ✅ Electronics Components
- ✅ LED Lights
- ✅ Packaging Machines
- ✅ Agriculture Equipment
- ✅ Furniture
- ✅ Apparel & Textiles
- ✅ Promotional Products

**Slug format:** `industrial-machinery` (lowercase, hyphenated)

### Categories Supporting ONLY Wholesale

These categories show ONLY the Wholesale section:

- 🏭 Laptops
- 📱 Mobile Accessories
- 🧴 Water Bottles
- 🧸 Kids Toys
- 🏠 Home Appliances
- 💻 Consumer Electronics
- 🛒 Grocery Products
- 📋 Office Supplies

---

## 🎨 Customization UI Breakdown

### Wholesale Tab Shows:

```
├─ Header: "🏭 Wholesale Purchase"
├─ Pricing Tiers Table
├─ Quantity Selector
│  ├─ -10 button
│  ├─ Quantity input
│  └─ +10 button
├─ Price Summary
│  ├─ Unit Price
│  ├─ Quantity
│  ├─ Savings (if applicable)
│  └─ Total Amount
└─ Action Buttons
   ├─ 🚀 Start Order (primary)
   ├─ Add to Cart (secondary)
   └─ 💬 Chat Now (tertiary)
```

### Customization Tab Shows:

```
├─ Header: "🎨 Customization Options"
├─ Checkboxes for:
│  ├─ 📌 Logo Printing
│  ├─ ⚙️ OEM/ODM Support
│  └─ 🎨 Custom Design
├─ Quantity Input
├─ Selection Summary (if any selected)
└─ Action Buttons
   ├─ ✏️ Customize Now (primary)
   ├─ Send Inquiry (secondary)
   └─ 💬 Chat Now (tertiary)
```

---

## 📝 Bulk Pricing Configuration

### Example Setup:

```javascript
const bulkPrices = [
  { quantity: 10, price: 50000 },     // 1-24: ₹50,000/unit
  { quantity: 25, price: 48000 },     // 25-49: ₹48,000/unit
  { quantity: 50, price: 45000 },     // 50-99: ₹45,000/unit
  { quantity: 100, price: 42000 },    // 100-499: ₹42,000/unit
  { quantity: 500, price: 40000 }     // 500+: ₹40,000/unit
];
```

### Price Calculation Logic:

```javascript
// If ordering 150 units
// Find the highest tier where quantity <= 150
// Result: 100-unit tier = ₹42,000/unit
// Total: 150 × ₹42,000 = ₹6,300,000
// Savings vs base: (₹50,000 - ₹42,000) × 150 = ₹1,200,000
```

---

## 🔧 Customization Options Details

### Logo Printing

- Single or multi-color printing
- Custom placement on product
- High-quality finish
- Supported formats: AI, PSD, PDF

### OEM/ODM Support

- Custom specifications
- Packaging design consultation
- Technical support during production
- Quality assurance at every stage

### Custom Design

- Expert consultation
- Multiple design iterations
- 3D mockup visualization
- Unlimited revisions (up to 5 rounds)

---

## 📱 Mobile Responsive Design

The system is fully responsive with:

- **Mobile (< 640px):** Single column, optimized touch targets
- **Tablet (640px - 1024px):** Responsive grid adjustments
- **Desktop (> 1024px):** Full featured layout

Key mobile optimizations:

- Larger tap targets (48px minimum)
- Vertical button stacking
- Simplified tables
- Touch-friendly quantity selector

---

## 🎯 Integration Checklist

- [ ] Install required dependencies (framer-motion, react-hot-toast, react-icons)
- [ ] Copy purchaseModes.js to src/config/
- [ ] Copy component files to src/components/ProductDetail/
- [ ] Verify category slugs match your database
- [ ] Update product API response to include category slug
- [ ] Import DynamicPurchaseSystem in your product detail page
- [ ] Test with both Wholesale and Customization categories
- [ ] Test mobile responsiveness
- [ ] Configure error handling (toast messages)
- [ ] Set up backend endpoints for:
  - Start Order
  - Add to Cart
  - Send Inquiry
  - Chat with Seller

---

## 🔗 Backend Integration Points

### Required Endpoints:

1. **Start Order**
   - POST `/api/orders/start`
   - Params: `productId`, `quantity`, `mode`

2. **Add to Cart**
   - POST `/api/cart/add`
   - Params: `productId`, `quantity`

3. **Send Inquiry**
   - POST `/api/inquiries/create`
   - Params: `productId`, `customizationOptions`, `quantity`

4. **Chat with Seller**
   - Redirect to `/chat/{sellerId}`

---

## 🎨 Styling & Customization

### Color Scheme:

- **Wholesale:** Blue (#3B82F6)
- **Customization:** Purple/Pink (#9333EA - #EC4899)
- **Success:** Green (#16A34A)
- **Warning:** Yellow (#FBBF24)

### Tailwind Classes Used:

- `gradient-to-r` - Gradient backgrounds
- `hover:scale-105` - Hover effects
- `active:scale-95` - Active states
- `transition transform` - Smooth animations
- Responsive grid: `lg:col-span-2`

### Customizing Colors:

```jsx
// In component className
className="bg-gradient-to-r from-blue-600 to-blue-700"  // Wholesale
className="bg-gradient-to-r from-purple-600 to-pink-600" // Customization
```

---

## 📊 Analytics Events to Track

Consider tracking these user actions:

- Tab switched: `wholesale` → `customization`
- Quantity changed
- "Start Order" clicked
- "Add to Cart" clicked
- "Send Inquiry" clicked
- "Chat Now" clicked
- Customization option selected

---

## 🐛 Troubleshooting

### Issue: "Customization tab not showing"

**Solution:** Verify category slug is in PURCHASE_MODE_CONFIG.BOTH array

### Issue: "Price not updating on quantity change"

**Solution:** Check bulkPrices array is properly formatted with correct quantities

### Issue: "Mobile buttons not responsive"

**Solution:** Ensure Tailwind CSS is properly configured and built

### Issue: "Animations not working"

**Solution:** Verify framer-motion is installed: `npm install framer-motion`

---

## 📖 Example Product Objects

### Solar Panel (Both Modes):

```javascript
{
  _id: 'sol123',
  name: 'Industrial Solar Panel System',
  price: 50000,
  stock: 500,
  moq: 10,
  bulkPrices: [
    { quantity: 10, price: 50000 },
    { quantity: 50, price: 48000 },
    { quantity: 100, price: 45000 }
  ],
  category: {
    name: 'Solar Products',
    slug: 'solar-products'  // ✅ Shows both tabs
  }
}
```

### Laptop (Wholesale Only):

```javascript
{
  _id: 'lap456',
  name: 'Business Laptop XPS 15',
  price: 95000,
  stock: 200,
  moq: 5,
  bulkPrices: [
    { quantity: 5, price: 95000 },
    { quantity: 10, price: 92000 }
  ],
  category: {
    name: 'Electronics',
    slug: 'laptops'  // ✅ Shows wholesale only
  }
}
```

---

## 🚀 Performance Tips

1. **Lazy load bulk price calculations** - Don't calculate until quantity changes
2. **Debounce quantity input** - Wait 300ms before recalculating
3. **Cache category configuration** - Use React.useMemo
4. **Optimize images** - Use next/image for product images
5. **Code split components** - Use dynamic imports for large sections

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the example integration
3. Verify category slugs match configuration
4. Check browser console for errors

---

## 📄 License

This component is part of the IndiaMART B2B Marketplace project.

---

**Last Updated:** 2026-06-10
**Version:** 1.0.0
**Status:** Production Ready ✅
