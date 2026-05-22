const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const BASE = "http://localhost:3000";
const OUT = path.join(__dirname, "screenshots");

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const CREDENTIALS = {
  buyer:  { email: "buyer@test.com",  password: "test1234" },
  seller: { email: "seller@test.com", password: "test1234" },
  admin:  { email: "admin@test.com",  password: "test1234" },
};

async function apiLogin(role) {
  const cred = CREDENTIALS[role];
  const http = require("http");
  return new Promise((resolve) => {
    const body = JSON.stringify({ email: cred.email, password: cred.password });
    const req = http.request(
      { hostname: "localhost", port: 8000, path: "/api/auth/login", method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve(null); } });
      }
    );
    req.on("error", () => resolve(null));
    req.write(body);
    req.end();
  });
}

async function injectAuth(page, role) {
  const result = await apiLogin(role);
  if (!result?.data?.accessToken) { console.log(`  ⚠ Could not login as ${role}`); return false; }
  try {
    await page.evaluate(({ token, user }) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    }, { token: result.data.accessToken, user: result.data.user });
  } catch (e) {
    console.log(`  ⚠ Failed to inject auth for ${role}: ${e.message}`);
    return false;
  }
  return true;
}

async function shot(page, url, filename, waitFor = 2500) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
    await page.waitForTimeout(waitFor);
    // Close any modal/dialog that might be open
    try {
      const closeBtn = page.locator('[aria-label="Close"], button:has-text("×"), button:has-text("Close")').first();
      if (await closeBtn.isVisible({ timeout: 500 })) await closeBtn.click();
    } catch {}
    await page.screenshot({ path: path.join(OUT, filename), fullPage: true });
    console.log(`  ✓ ${filename}`);
  } catch (e) {
    console.log(`  ✗ ${filename} — ${e.message.split("\n")[0]}`);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  // ── AUTH (buyer token) injected for ALL pages to prevent login modal popup
  const buyerResult = await apiLogin("buyer");
  const sellerResult = await apiLogin("seller");
  const adminResult = await apiLogin("admin");

  // ── PUBLIC PAGES (with buyer auth to prevent login modal) ──────────────
  console.log("\n📸 Public Pages");
  const pubCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pubPage = await pubCtx.newPage();

  // Inject buyer auth first so no login modal appears
  if (buyerResult?.data?.accessToken) {
    await pubPage.goto(BASE, { waitUntil: "domcontentloaded" });
    await pubPage.evaluate(({ token, user }) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    }, { token: buyerResult.data.accessToken, user: buyerResult.data.user });
  }

  await shot(pubPage, `${BASE}`, "home.png", 3500);
  await shot(pubPage, `${BASE}/products`, "products.png", 3000);
  await shot(pubPage, `${BASE}/products?search=steel`, "search.png", 3000);
  await shot(pubPage, `${BASE}/categories`, "categories.png", 2500);
  await shot(pubPage, `${BASE}/sellers`, "sellers.png", 2500);
  await shot(pubPage, `${BASE}/buy-requirements`, "rfq-board.png", 2500);
  await shot(pubPage, `${BASE}/subscription/plans`, "plans.png", 2500);
  await shot(pubPage, `${BASE}/compare`, "compare.png", 2500);

  // ── PRODUCT DETAIL & SELLER PROFILE (need real IDs) ─────────────────────
  console.log("\n📸 Detail Pages");
  try {
    const http = require("http");
    const prodData = await new Promise((resolve) => {
      http.get("http://localhost:8000/api/products?limit=1", (res) => {
        let d = ""; res.on("data", c => d += c);
        res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
      }).on("error", () => resolve(null));
    });
    const prod = prodData?.data?.products?.[0];
    if (prod) {
      await shot(pubPage, `${BASE}/products/${prod._id}`, "product-detail.png", 3000);
    } else {
      console.log("  ⚠ No products found for detail page");
    }

    const sellerData = await new Promise((resolve) => {
      http.get("http://localhost:8000/api/sellers?limit=1", (res) => {
        let d = ""; res.on("data", c => d += c);
        res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve(null); } });
      }).on("error", () => resolve(null));
    });
    const seller = sellerData?.data?.sellers?.[0];
    if (seller) {
      await shot(pubPage, `${BASE}/sellers/${seller._id}`, "seller-profile-public.png", 3000);
    } else {
      console.log("  ⚠ No sellers found for profile page");
    }
  } catch (e) {
    console.log("  ⚠ Detail pages error:", e.message);
  }
  await pubCtx.close();

  // ── AUTH PAGES (no auth) ────────────────────────────────────────────────
  console.log("\n📸 Auth Pages");
  const authCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const authPage = await authCtx.newPage();
  await shot(authPage, `${BASE}/auth/login`, "login.png", 2000);
  await shot(authPage, `${BASE}/auth/register`, "register.png", 2000);
  await authCtx.close();

  // ── BUYER PAGES ────────────────────────────────────────────────────────
  console.log("\n📸 Buyer Dashboard Pages");
  const buyerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const buyerPage = await buyerCtx.newPage();
  if (buyerResult?.data?.accessToken) {
    await buyerPage.goto(BASE, { waitUntil: "domcontentloaded" });
    await buyerPage.evaluate(({ token, user }) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    }, { token: buyerResult.data.accessToken, user: buyerResult.data.user });
    await buyerPage.waitForTimeout(500);
  }

  await shot(buyerPage, `${BASE}/buyer/dashboard`, "buyer-dashboard.png", 2500);
  await shot(buyerPage, `${BASE}/buyer/inquiries`, "buyer-inquiries.png", 2000);
  await shot(buyerPage, `${BASE}/buyer/requirements`, "buyer-requirements.png", 2000);
  await shot(buyerPage, `${BASE}/buyer/samples`, "buyer-samples.png", 2000);
  await shot(buyerPage, `${BASE}/buyer/wishlist`, "buyer-wishlist.png", 2000);
  await shot(buyerPage, `${BASE}/buyer/notifications`, "notifications.png", 2000);
  await shot(buyerPage, `${BASE}/buyer/alerts`, "price-alerts.png", 2000);
  await shot(buyerPage, `${BASE}/profile`, "account-profile.png", 2000);
  await buyerCtx.close();

  // ── SELLER PAGES ────────────────────────────────────────────────────────
  console.log("\n📸 Seller Dashboard Pages");
  const sellerCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const sellerPage = await sellerCtx.newPage();
  if (sellerResult?.data?.accessToken) {
    await sellerPage.goto(BASE, { waitUntil: "domcontentloaded" });
    await sellerPage.evaluate(({ token, user }) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    }, { token: sellerResult.data.accessToken, user: sellerResult.data.user });
    await sellerPage.waitForTimeout(500);
  }

  await shot(sellerPage, `${BASE}/seller/dashboard`, "seller-dashboard.png", 2500);
  await shot(sellerPage, `${BASE}/seller/products`, "seller-products.png", 2000);
  await shot(sellerPage, `${BASE}/seller/products/new`, "add-product.png", 2000);
  await shot(sellerPage, `${BASE}/seller/inquiries`, "seller-inquiries.png", 2000);
  await shot(sellerPage, `${BASE}/seller/samples`, "seller-samples.png", 2000);
  await shot(sellerPage, `${BASE}/seller/profile`, "seller-biz-profile.png", 2500);
  await shot(sellerPage, `${BASE}/seller/complete-profile`, "seller-onboarding.png", 2000);
  await sellerCtx.close();

  // ── ADMIN PAGES ─────────────────────────────────────────────────────────
  console.log("\n📸 Admin Panel Pages");
  const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminCtx.newPage();
  if (adminResult?.data?.accessToken) {
    await adminPage.goto(BASE, { waitUntil: "domcontentloaded" });
    await adminPage.evaluate(({ token, user }) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    }, { token: adminResult.data.accessToken, user: adminResult.data.user });
    await adminPage.waitForTimeout(500);
  }

  await shot(adminPage, `${BASE}/admin/dashboard`, "admin-dashboard.png", 2500);
  await shot(adminPage, `${BASE}/admin/users`, "admin-users.png", 2000);
  await shot(adminPage, `${BASE}/admin/products`, "admin-products.png", 2000);
  await shot(adminPage, `${BASE}/admin/categories`, "admin-categories.png", 2000);
  await adminCtx.close();

  // ── MOBILE VIEW ──────────────────────────────────────────────────────────
  console.log("\n📸 Mobile Responsive Views");
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1"
  });
  const mobilePage = await mobileCtx.newPage();
  // Inject auth on mobile too
  if (buyerResult?.data?.accessToken) {
    await mobilePage.goto(BASE, { waitUntil: "domcontentloaded" });
    await mobilePage.evaluate(({ token, user }) => {
      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(user));
    }, { token: buyerResult.data.accessToken, user: buyerResult.data.user });
  }
  await shot(mobilePage, `${BASE}`, "mobile-home.png", 3000);
  await shot(mobilePage, `${BASE}/products`, "mobile-products.png", 2500);
  await mobileCtx.close();

  // ── BACKEND API SCREENSHOTS ──────────────────────────────────────────────
  console.log("\n📸 Backend API Responses");
  const apiCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const apiPage = await apiCtx.newPage();
  await apiPage.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      document.body.style.fontFamily = "monospace";
      document.body.style.fontSize = "13px";
      document.body.style.background = "#0f172a";
      document.body.style.color = "#e2e8f0";
      document.body.style.padding = "20px";
    });
  });

  const apiShot = async (url, file) => {
    try {
      await apiPage.goto(url, { waitUntil: "networkidle", timeout: 10000 });
      await apiPage.waitForTimeout(1000);
      await apiPage.screenshot({ path: path.join(OUT, file), fullPage: false });
      console.log(`  ✓ ${file}`);
    } catch (e) {
      console.log(`  ✗ ${file} — ${e.message.split("\n")[0]}`);
    }
  };

  await apiShot("http://localhost:8000/api/health", "api-health.png");
  await apiShot("http://localhost:8000/api/products?limit=2", "api-products.png");
  await apiShot("http://localhost:8000/api/categories", "api-categories.png");
  await apiShot("http://localhost:8000/api/sellers?limit=2", "api-sellers.png");
  await apiShot("http://localhost:8000/api/buy-requirements", "api-rfq.png");
  await apiShot("http://localhost:8000/api/payments/plans", "api-plans.png");
  await apiCtx.close();

  await browser.close();

  const files = fs.readdirSync(OUT).filter(f => f.endsWith(".png"));
  console.log(`\n✅ Done! ${files.length} screenshots saved to docs/screenshots/`);
})();
