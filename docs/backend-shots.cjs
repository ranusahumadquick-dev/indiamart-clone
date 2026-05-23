const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const OUT = path.join(__dirname, "screenshots");
const API = "http://localhost:8000/api";

async function shot(page, url, filename) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 10000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, filename), fullPage: true });
    console.log("  ✓ " + filename);
  } catch(e) {
    console.log("  ✗ " + filename + " — " + e.message.split("\n")[0]);
  }
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: "Mozilla/5.0 Chrome/120"
  }).then(c => c.newPage());

  // Style JSON nicely
  await page.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const pre = document.querySelector("pre");
      if (pre) { pre.style.cssText = "background:#1e1e2e;color:#cdd6f4;padding:20px;font-size:13px;border-radius:8px;overflow:auto;font-family:monospace"; }
    });
  });

  console.log("\n📸 Backend API Screenshots");
  await shot(page, `${API}/products?limit=3`, "api-products.png");
  await shot(page, `${API}/categories`, "api-categories.png");
  await shot(page, `${API}/sellers?limit=3`, "api-sellers.png");
  await shot(page, `${API}/buy-requirements?limit=3`, "api-rfq.png");
  await shot(page, `${API}/payments/plans`, "api-plans.png");
  await shot(page, `${API}/health`, "api-health.png");

  await browser.close();
  console.log("\n✅ Backend API screenshots done");
})();
