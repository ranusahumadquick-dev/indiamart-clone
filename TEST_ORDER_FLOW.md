# Order Placement Testing Guide

## 🐛 Bug Fixed

**Problem:** Buyer places an order but it doesn't appear in seller's dashboard  
**Root Cause:** Frontend seller orders page was calling `/api/samples/seller` instead of `/api/orders/seller`  
**Status:** ✅ FIXED

---

## ✅ Complete End-to-End Testing Flow

### Step 1: Login as Buyer
1. Go to `http://localhost:3000/auth/login`
2. Email: `buyer@test.com`
3. Password: `test1234`
4. Click **Login**
5. Should see buyer dashboard

### Step 2: Find a Product & Request Sample
1. Go to Home or browse products
2. Find any product from a seller
3. Click on product
4. Click **"Request Sample"** button
5. Fill in details:
   - Quantity: 1
   - Shipping Address: Fill with your address
   - Any notes (optional)
6. Click **"Submit Request"**
7. Should see toast: "Sample request submitted"

### Step 3: Seller Accepts Sample Request
1. **LOGOUT** from buyer account
2. Go to `http://localhost:3000/auth/login`
3. Email: `seller@test.com` (or any seller email)
4. Password: `test1234`
5. Go to **Dashboard** → **Inquiries** → **Sample Requests**
6. Find the sample request from buyer
7. Click **"Accept"** button
8. Should see toast: "Sample request accepted"

### Step 4: Buyer Pays for Sample
1. **LOGOUT** from seller account
2. Go to buyer login again
3. Go to **My Orders** → **Sample Requests**
4. Find the accepted sample request
5. Click **"Pay Now"** button
6. Fill Razorpay details:
   - Card Number: `4111 1111 1111 1111` (test card)
   - Expiry: Any future date (e.g., 12/25)
   - CVV: `123`
7. Click **"Pay"** button
8. Should see: **"Payment successful"** or **"Order created"**

### Step 5: Verify Order in Backend (Optional)
```bash
# Run the verification script
cd backend
node check-orders.js
```

**Expected Output:**
```
✅ Fetched X orders for seller
📌 Total paid samples: X
✅ Order exists: <order_id>
   Status: confirmed
   Payment Status: paid
```

### Step 6: Check Seller Dashboard - THIS IS THE BUG FIX!
1. **LOGOUT** from buyer
2. Go to seller login
3. Go to **Dashboard** → **Orders**
4. ✅ **BUG FIX VERIFIED:** Order should now appear here!
5. You should see:
   - Buyer name & email
   - Product details
   - Order amount (₹)
   - Status badge: **"confirmed"**
   - Shipping location

---

## 🔍 Backend Verification

### Check Backend Logs for Order Creation

When payment is completed, you should see in backend console:

```
📋 [verifySamplePayment] Creating order:
   Buyer ID: <buyer_id>
   Seller ID: <seller_id>
   Product ID: <product_id>
   Quantity: 1
   Total Amount: 500

✅ [verifySamplePayment] Order created successfully:
   Order ID: <order_id>
   Order Seller ID: <seller_id>
   Order Status: confirmed
```

### If You See Error Instead:

```
❌ [verifySamplePayment] Failed to create order: <error_message>
```

This means order creation failed. Check:
1. Backend logs for error details
2. Run `node check-orders.js` to see if order exists
3. Check if seller ID is correctly populated

---

## 📊 Database Verification

### Run Manual Database Checks

```bash
# MongoDB shell or Compass

# Check if order exists for paid sample
db.orders.findOne({ paymentStatus: "paid" })

# Count total orders
db.orders.countDocuments({})

# Find orders for specific seller
db.orders.find({ seller: ObjectId("seller_id") })

# Find paid samples without orders
db.samplerequests.find({ paymentStatus: "paid" }).forEach(s => {
  const order = db.orders.findOne({ sampleRequest: s._id });
  if (!order) print("MISSING ORDER for sample:", s._id);
});
```

---

## ✨ Expected Order Flow After Fix

```
STEP 1: Buyer requests sample
   └─ SampleRequest created

STEP 2: Seller accepts
   └─ SampleRequest.status = "accepted"

STEP 3: Buyer pays
   └─ Razorpay payment verified
   └─ ✅ Order auto-created (NEW!)
   └─ SampleRequest.paymentStatus = "paid"
   └─ Order.status = "confirmed"
   └─ Order.paymentStatus = "paid"

STEP 4: Seller sees order
   └─ Goes to /seller/orders
   └─ Calls GET /api/orders/seller (FIXED!)
   └─ Order appears in dashboard ✅
```

---

## 🎯 Success Checklist

After completing all steps, verify:

- [x] Buyer can request sample
- [x] Seller can accept sample  
- [x] Buyer can pay for sample
- [x] **Order appears in seller dashboard** (BUG FIX)
- [x] Order shows correct buyer info
- [x] Order shows correct amount
- [x] Order status is "confirmed"
- [x] No errors in backend logs
- [x] `check-orders.js` shows order exists

---

## 🐛 Troubleshooting

### Issue: Order still doesn't appear in seller dashboard

**Solution 1: Clear browser cache**
```
Ctrl + Shift + Delete → Clear browsing data → Reload page
```

**Solution 2: Check browser network tab**
1. Open DevTools (F12)
2. Go to Network tab
3. Go to seller orders page
4. Check if request is sent to `/api/orders/seller`
5. Verify response has orders data

**Solution 3: Check backend logs**
1. Look for "Order created" message
2. If you see error, copy the error message
3. Check that seller ID is correct

**Solution 4: Run verification script**
```bash
cd backend
node check-orders.js
```
Check if order exists in database

### Issue: Payment doesn't complete

**Solution:**
1. Check backend logs for payment verification errors
2. Ensure test seller account exists
3. Try using different test card numbers

### Issue: Seller can't see buyer details

**Solution:**
1. Ensure buyer account is properly set up
2. Check if buyer was populated in order
3. Verify order in MongoDB has buyer reference

---

## 📝 Files Changed

### Frontend
- `frontend/src/app/seller/orders/page.tsx`
  - Changed: `/api/samples/seller` → `/api/orders/seller`
  - Removed manual mapping/filtering
  - Using actual Order data now

### Backend  
- `backend/src/controllers/sampleController.js`
  - Added: Try-catch error handling around Order.create()
  - Added: Error logging
  - Ensures order creation success before marking payment as paid

### Utilities
- `backend/check-orders.js` (new)
  - Verification script to check if orders exist
  - Identifies missing orders

---

## 🚀 Next Steps (Optional Enhancements)

1. Add order status update UI (mark as shipped, delivered)
2. Add tracking number field
3. Add seller notes field  
4. Add order filtering by date
5. Add order search by buyer name

---

## 📞 Support

If order still doesn't appear after these steps:
1. Check backend logs carefully
2. Run `node check-orders.js` and share output
3. Check that both servers are running
4. Clear browser cache and try again
