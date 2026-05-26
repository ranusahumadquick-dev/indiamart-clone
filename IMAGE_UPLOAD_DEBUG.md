# 🔍 IMAGE UPLOAD DEBUG GUIDE

**Date**: May 26, 2026
**Issue**: Images not uploading when creating products

---

## 📋 STEP-BY-STEP DEBUG

### STEP 1: Test in Browser (Frontend)

**Open**: http://localhost:3000/seller/products/new

**Before uploading**:
1. Press `F12` to open Developer Tools
2. Go to **Console** tab
3. Go to **Network** tab

**Action**: Try to upload a product with images

**In Console, look for**:
```
🖼️ [ImageUpload] Processing X files
✅ [ImageUpload] File valid: ...
📝 [Submit] Starting product creation...
📤 [Submit] Appending X images to FormData
🚀 [Submit] Sending FormData to API...
```

**If you see ❌ errors**:
- Note the exact error message
- Screenshot it

**In Network tab, look for**:
- Request to `POST /api/products`
- Check the response status (should be 200 or 201)
- Click on request and check **Request** → **Form Data**
- Images should show up as "images: (binary)"

---

### STEP 2: Check Backend Logs

**Open PowerShell** where backend is running

**Look for logs like**:
```
🔵 [createProduct] Starting product creation...
📤 [createProduct] Processing images...
✅ [createProduct] Images processed: X images
```

**If you see ❌ [Multer] errors**:
- Images are NOT reaching the backend
- Problem: Frontend or network issue

**If you see ❌ [createProduct] errors**:
- Images reached backend but processing failed
- Problem: Backend validation or file system

---

### STEP 3: Check File System

**Open PowerShell** and run:
```powershell
# List all product images
Get-ChildItem "C:\Users\RANU\Desktop\indiamart\backend\uploads\products\" | Select-Object Name, Length, LastWriteTime | Sort-Object LastWriteTime -Descending | Head -10
```

**Expected**: Recently created files (from when you tried uploading)
**If empty**: Images never reached disk

---

### STEP 4: Database Check

**If images file exist but product has no images**:
```
Product created BUT images field is empty in database
→ Problem: Image processing logic
```

---

## 🎯 COMMON ISSUES & FIXES

### Issue 1: FormData Not Sending Files

**Symptom**:
- Browser console shows: ` 🖼️ [ImageUpload] Processing 1 files`
- BUT Network tab shows NO images in Form Data
- Backend logs show: `Files received: 0`

**Root Cause**: Images not being appended to FormData

**Fix**: Check lines 212-216 in `/frontend/src/app/seller/products/new/page.tsx`
```typescript
imageFiles.forEach((f, idx) => {
  fd.append("images", f);  // ← This line is critical
});
```

**Test**:
```javascript
// In browser console:
const fd = new FormData();
fd.append("test", "value");
console.log(fd.entries());  // Should show entries
```

---

### Issue 2: Multer Not Receiving Files

**Symptom**:
- Frontend console: ✅ images appended
- Network tab: ✅ images in Form Data
- Backend logs: ❌ `Files received: 0`

**Root Cause**: Multer middleware not working

**Fix**: Verify route configuration
```javascript
// Should be in productRoutes.js
router.post(
  "/",
  authMiddleware,
  roleMiddleware("seller"),
  uploadProductImages,  // ← MUST be here
  createProduct
);
```

---

### Issue 3: Files Received But Not Saved

**Symptom**:
- Backend logs: ✅ `[Multer] Generated filename: ...`
- But files folder is empty
- OR files are there but 0 bytes

**Root Cause**: Permissions issue or disk space

**Fix**:
```powershell
# Check folder permissions
Get-Acl "C:\Users\RANU\Desktop\indiamart\backend\uploads\products"

# Create if missing
New-Item -ItemType Directory -Path "C:\Users\RANU\Desktop\indiamart\backend\uploads\products" -Force
```

---

### Issue 4: Images Saved But Product Has No Images

**Symptom**:
- ✅ Backend logs show order created with images
- ✅ Files exist in uploads/products/
- ❌ Product in database has empty images array

**Root Cause**: Image processing/saving to database failed

**Fix**: Check imageHandler.js line 25-67
- Verify `file.path` is correct
- Verify relative path extraction works
- Add logging if needed

---

## 🧪 QUICK TEST

**Run this in browser console** on `/seller/products/new` page:

```javascript
// Test 1: Check if imageFiles state exists
console.log("Image files state available");

// Test 2: Create minimal FormData
const test_fd = new FormData();
test_fd.append("name", "Test Product");
test_fd.append("description", "Test");
test_fd.append("price", "100");
test_fd.append("category", "123");

// Test 3: Send to API
fetch("/api/products", {
  method: "POST",
  body: test_fd,
  headers: { "Authorization": `Bearer ${localStorage.getItem("accessToken")}` }
})
.then(r => r.json())
.then(d => console.log("Response:", d))
.catch(e => console.error("Error:", e));
```

---

## 📝 DETAILED LOGS TO CHECK

### Frontend Console Should Show:
```
🖼️ [ImageUpload] Processing N files
✅ [ImageUpload] File valid: {name, size, type}
🎨 [ImageUpload] Preview created  
✅ [ImageUpload] Added N images
📝 [Submit] Starting product creation...
✅ [Submit] Form validation passed
   Product: <name>
   Price: <price>
   Images: N
📤 [Submit] Appending N images to FormData
  [1] image.jpg (XXXKB)
  [2] image.png (XXXKB)
🚀 [Submit] Sending FormData to API...
🎉 [Submit] Product created successfully!
```

### Backend Console Should Show:
```
🔍 [Multer] Checking file: image.jpg
✅ [Multer] File type accepted: image/jpeg
📤 [Multer] Saving image to: ...uploads/products
✅ [Multer] Generated filename: 1234567890-987654321.jpg

🔵 [createProduct] Starting product creation...
   Seller: <id>
✅ [createProduct] All required fields present
📤 [createProduct] Processing images...
   Files received: N
✅ [createProduct] Images processed: N images
   First image URL: http://localhost:8000/uploads/products/...
💾 [createProduct] Saving product to database...
🎉 [createProduct] Product created successfully!
   Images stored: N
```

---

## 🔧 QUICK FIXES TO TRY

1. **Hard refresh frontend**:
   ```
   Ctrl + Shift + R  (Windows)
   Cmd + Shift + R   (Mac)
   ```

2. **Clear browser cache**:
   - F12 → Application → Clear storage

3. **Restart backend**:
   ```powershell
   # Kill all Node processes
   taskkill /IM node.exe /F
   
   # Restart
   cd C:\Users\RANU\Desktop\indiamart\backend
   npm run dev
   ```

4. **Check CORS** - open browser console and look for:
   ```
   Access to XMLHttpRequest has been blocked by CORS policy
   ```
   If you see this: CORS is broken (shouldn't happen with current setup)

---

## 📊 VERIFICATION TABLE

| Component | Status | How to Check |
|-----------|--------|-------------|
| Frontend sends images | ? | Network tab, Form Data |
| Backend receives images | ? | Backend console logs |
| Files saved to disk | ? | `ls uploads/products/` |
| Product created | ? | Database query |
| Images in product | ? | Product.find() images array |

---

**NEXT STEP**: 
Try creating a product now with these debug tools open and report:
1. All console logs (frontend + backend)
2. Network response status and body
3. Whether files appear in uploads/products/
4. Whether product has images in database
