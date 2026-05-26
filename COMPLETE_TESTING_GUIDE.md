# 🧪 COMPLETE PROJECT TESTING GUIDE

**Status**: Project diagnostic complete - Ready for testing
**Date**: May 26, 2026

---

## ✅ WHAT'S BEEN FIXED

1. ✅ Image upload FormData issue (removed explicit Content-Type header)
2. ✅ CORS blocking image display (fixed headers in app.js)
3. ✅ Order placement (orders auto-create and appear in seller dashboard)
4. ✅ Mongoose require() statements (converted to ES6 imports)

---

## 🚀 STEP-BY-STEP TEST

### STEP 1: Verify Servers Running

```powershell
# Check backend
Test-NetConnection -ComputerName localhost -Port 8000
# Should show: TcpTestSucceeded : True

# Check frontend
Test-NetConnection -ComputerName localhost -Port 3000
# Should show: TcpTestSucceeded : True
```

### STEP 2: Authentication Test

**URL**: http://localhost:3000/login

1. Login with existing seller account
2. Check if dashboard loads
3. ✅ Should see seller dashboard

**Expected**: Login successful, dashboard visible

---

### STEP 3: Product Creation Test (NO IMAGES)

**URL**: http://localhost:3000/seller/products/new

1. Fill form:
   - Name: "Test Product 1"
   - Description: "Test description"
   - Price: "500"
   - Category: Select any
   - Stock: "100"

2. Click "Create Product"

3. Check:
   - ✅ "Product listed successfully" toast
   - ✅ Redirects to /seller/products
   - ✅ Product appears in list

**Expected**: Product created without images

---

### STEP 4: Product WITH Images Test (CRITICAL)

**URL**: http://localhost:3000/seller/products/new

1. **BEFORE UPLOADING** - Press F12 (open browser console)

2. Fill form:
   - Name: "Blue Shirt"
   - Description: "Premium blue shirt"
   - Price: "1000"
   - Category: Select any
   - Stock: "50"

3. **Click "Choose Images"** - select the blue shirt image

4. **Watch browser console** - should see:
   ```
   🖼️ [ImageUpload] Processing 1 files
   ✅ [ImageUpload] File valid: {name: "shirt.jpg", ...}
   🎨 [ImageUpload] Preview created
   ✅ [ImageUpload] Added 1 images
   ```

5. **Click "Create Product"**

6. **Watch backend console** (PowerShell where server running):
   ```
   🔍 [Multer] Checking file: shirt.jpg
   ✅ [Multer] File type accepted: image/jpeg
   📤 [Multer] Saving image to: ...uploads/products
   ✅ [Multer] Generated filename: 1234567890-987654321.jpg
   
   🔵 [createProduct] Starting product creation...
   📤 [createProduct] Processing images...
   ✅ [createProduct] Images processed: 1 images
   💾 [createProduct] Saving product to database...
   🎉 [createProduct] Product created successfully!
      Images stored: 1
   ```

7. **Check results**:
   - ✅ "Product listed successfully" toast
   - ✅ Redirects to /seller/products
   - ✅ **Product shows with image thumbnail** (NOT "Image unavailable")
   - ✅ Browser console shows no CORS errors

**Expected**: Product created with image visible

---

### STEP 5: Image Display Test

**URL**: http://localhost:3000/seller/products

1. Look at product table
2. Check "Blue Shirt" product
3. Verify:
   - ✅ Image thumbnail visible
   - ✅ NOT showing "Image unavailable"
   - ✅ Image loads quickly

**Expected**: All product images display correctly

---

### STEP 6: Order Placement Test

**URL**: http://localhost:3000/products (Buyer perspective)

1. Login as BUYER (different account)
2. Find a product from a seller
3. Click product
4. Click "Request Sample" button
5. Fill sample details:
   - Quantity: 10
6. Submit

**Check Seller Side**:
1. Logout, login as SELLER
2. Go to: http://localhost:3000/seller/inquiries
3. Find the sample request from buyer
4. Click "Accept"
5. Enter sample price: "500"
6. Click "Confirm Accept"

**Check Buyer Side**:
1. Logout, login as BUYER
2. Go to: http://localhost:3000/buyer/samples
3. Find the accepted sample
4. Click "Pay Now"
5. Complete Razorpay payment:
   - Card: 4111 1111 1111 1111
   - Expiry: 12/25
   - CVV: 123

**Check Seller Orders**:
1. Logout, login as SELLER
2. **Go to: http://localhost:3000/seller/orders**
3. **✅ ORDER SHOULD APPEAR HERE** (THIS IS THE MAIN TEST)

**Expected**: Order appears in seller dashboard after buyer payment

---

### STEP 7: Order Management Test

1. In `/seller/orders`, find the order
2. Click on order to expand
3. Verify you can see:
   - ✅ Buyer name
   - ✅ Buyer email
   - ✅ Items purchased
   - ✅ Total amount
4. Change status dropdown to "processing"
5. Enter tracking number: "TRACK123"
6. Select courier: "Fedex"
7. Click "Save Changes"
8. ✅ Should see: "Order updated successfully"

**Expected**: Order status updates successfully

---

## 📋 RESULT TRACKING

| Test | Expected | Result | Status |
|------|----------|--------|--------|
| Backend running | Port 8000 responding | ? | 🔄 |
| Frontend running | Port 3000 responding | ? | 🔄 |
| Login works | Dashboard loads | ? | 🔄 |
| Product no images | Creates successfully | ? | 🔄 |
| Product with images | Creates + displays | ? | 🔄 |
| Images visible | Thumbnails in table | ? | 🔄 |
| Order placement | Order appears | ? | 🔄 |
| Order management | Status updates | ? | 🔄 |

---

## 🐛 TROUBLESHOOTING

### Problem 1: "Image unavailable" showing

**Check These**:
1. Browser console (F12) - any CORS errors?
2. Backend console - any error logs?
3. File exists: `ls C:\Users\RANU\Desktop\indiamart\backend\uploads\products\`
4. Direct URL works: `http://localhost:8000/uploads/products/filename.jpg`

### Problem 2: Product not created

**Check These**:
1. All required fields filled?
2. Category selected?
3. Browser console for validation errors?
4. Backend console for database errors?

### Problem 3: Order not appearing

**Check These**:
1. Payment completed successfully?
2. Backend console shows "Order created"?
3. Database has order: `db.orders.countDocuments()`
4. Seller viewing correct /seller/orders endpoint?

### Problem 4: Images not uploading

**Check These**:
1. Browser console shows `🖼️ [ImageUpload]` logs?
2. Backend console shows `✅ [Multer] Generated filename`?
3. Files in uploads folder?
4. File < 5MB?
5. Image is JPG/PNG/WebP?

---

## ✨ SUCCESS INDICATORS

### Phase 1: Basic Setup ✅
- [ ] Backend server running (port 8000)
- [ ] Frontend server running (port 3000)
- [ ] Database connected
- [ ] Can login/logout

### Phase 2: Product Management ✅
- [ ] Create product without images
- [ ] Create product with images
- [ ] Images appear in product table
- [ ] No "Image unavailable" messages

### Phase 3: Order Management ✅
- [ ] Sample request works
- [ ] Seller can accept sample
- [ ] Buyer can pay
- [ ] **Order appears in seller dashboard** ← KEY TEST
- [ ] Seller can update order status
- [ ] Tracking info displays

### Phase 4: No Errors 🔍
- [ ] No red errors in browser console
- [ ] No red errors in backend console
- [ ] No CORS errors
- [ ] No 404 errors

---

## 📝 WHAT TO REPORT

After running tests, tell me:

1. **Did all tests pass?** (Yes/No)
2. **Which test failed?** (if any)
3. **What was the exact error?** (paste text or screenshot)
4. **Browser console errors?** (F12 → Console)
5. **Backend console errors?** (PowerShell)
6. **Any strange behavior?** (describe)

---

## 🎯 FINAL GOAL

**After all tests pass:**
- ✅ Project is working end-to-end
- ✅ No critical errors
- ✅ Ready for production use
- ✅ Can handle real users

---

**Ready to test? Start with STEP 1 above! 🚀**

