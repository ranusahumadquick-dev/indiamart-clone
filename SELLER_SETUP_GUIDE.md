# 🔧 Seller Account Setup Guide

## Problem
Orders placed for one seller aren't visible to another seller.

## Solution
Each seller account needs the correct credentials.

---

## Test Sellers in System

### Seller 1: Test Seller (Main)
```
Email: seller@test.com
Password: test1234
ID: 6a14078ca64a3dd07bf09d8a
Status: ✅ Works
```

### Seller 2: Test Seller (Products)
```
Email: seller+1779260339167@example.com
ID: 6a0d5bb327baea5215dfa82e
Status: ❌ Password mismatch
NOTE: This seller owns the LED Panel product!
```

---

## Current Issue

**LED Panel Light Order:**
- Created for Seller ID: `6a0d5bb327baea5215dfa82e`
- But you logged in as Seller: `6a14078ca64a3dd07bf09d8a`
- **Result:** ❌ Order not visible

---

## How to Fix

### Option 1: Use Correct Seller Account
When you see an order from a product, login as the seller who owns that product:

1. Check which seller created the product
2. Get that seller's correct credentials
3. Login with those credentials
4. Now you'll see their orders

### Option 2: Reassign Product to Correct Seller
Use database or admin panel to assign product to correct seller

---

## Testing the Fix

✅ **For LED Panel order to show:**

```bash
# Find seller who owns LED Panel product
curl -X GET http://localhost:8000/api/products/{productId}

# Get their email/ID from response
# Login with their credentials
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"SELLER_EMAIL","password":"SELLER_PASSWORD"}'

# Now fetch sample requests
curl -X GET http://localhost:8000/api/samples/seller \
  -H "Authorization: Bearer TOKEN"

# ✅ LED Panel order should appear here
```

---

## Dashboard Visibility Rules

```
Buyer's Orders Dashboard:
  └─ Shows orders from ANY seller
  └─ Only buyer can see their own orders

Seller's Orders Dashboard:
  └─ Shows orders from ONLY their products
  └─ Only seller can see orders they received
  └─ Must login as that specific seller
```

---

## Creating Consistent Test Data

To avoid this issue, ensure:

1. **One test buyer:** `buyer@test.com` / `test1234`
   - Places sample requests

2. **One test seller:** `seller@test.com` / `test1234`
   - Owns all test products
   - Receives all sample requests

3. **All test products** created by `seller@test.com`

---

## Summary

🔴 **Current:** Orders assigned to wrong seller
✅ **Fix:** Login as the seller who owns the product
🟢 **Result:** Orders will appear in their dashboard

Make sure you're logged in as the **correct seller** for the products you're managing!
