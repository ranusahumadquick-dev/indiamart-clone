const { chromium } = require('playwright');

async function verifyImagesWithLogin() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    console.log('🔐 Logging in to access products...\n');

    // Go to login page
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'domcontentloaded'
    });

    // Use demo credentials from seedUsers.js
    const testEmail = 'buyer@test.com';
    const testPassword = 'test1234';

    console.log(`📧 Attempting login with: ${testEmail}`);

    // Fill in email
    await page.fill('input[type="email"]', testEmail);
    await page.waitForTimeout(500);

    // Fill in password
    await page.fill('input[type="password"]', testPassword);
    await page.waitForTimeout(500);

    // Click login button
    await page.click('button:has-text("Login")');

    // Wait for navigation or error
    await page.waitForTimeout(3000);

    const currentUrl = page.url();
    console.log(`Current URL after login attempt: ${currentUrl}\n`);

    if (currentUrl.includes('/login')) {
      console.log('❌ Login failed with default credentials');
      console.log('⚠️ Trying to access products without authentication...\n');

      // Try accessing /products directly
      await page.goto('http://localhost:3000/products', {
        waitUntil: 'domcontentloaded'
      });
    } else {
      console.log('✓ Login successful!\n');
    }

    await page.waitForTimeout(2000);

    // Check if we're on products or if redirected to login
    const finalUrl = page.url();
    console.log(`Final URL: ${finalUrl}\n`);

    // Take screenshot
    console.log('📸 Capturing current page...');
    await page.screenshot({
      path: 'page-current-state.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: page-current-state.png\n');

    // Try to find products on page
    const pageContent = await page.content();

    if (pageContent.includes('product') || pageContent.includes('Product')) {
      console.log('✓ Products found on page\n');

      // Extract and display product info
      const productInfo = await page.evaluate(() => {
        const products = [];

        // Try multiple selectors to find products
        const selectors = [
          'div[class*="product"]',
          'div[class*="card"]',
          'article',
          'div[class*="grid"]'
        ];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            Array.from(elements).slice(0, 10).forEach(el => {
              const titleEl = el.querySelector('h3, h2, [class*="font-bold"], [class*="font-semibold"]');
              const imgEl = el.querySelector('img');

              if (titleEl && imgEl) {
                products.push({
                  title: titleEl.textContent.trim().substring(0, 60),
                  image: imgEl.src.substring(0, 100),
                  alt: imgEl.alt
                });
              }
            });

            if (products.length > 0) return products;
          }
        }

        return products;
      });

      if (productInfo.length > 0) {
        console.log(`📦 Found ${productInfo.length} products:\n`);
        productInfo.forEach((p, i) => {
          console.log(`${i + 1}. Title: "${p.title}"`);
          console.log(`   Image: ${p.image}...\n`);
        });
      } else {
        console.log('⚠️ Products HTML found but no product data extracted');
      }
    } else {
      console.log('❌ No products found on page');
    }

    // Keep browser open for inspection
    console.log('\n👀 Keeping browser open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png' });
    console.log('Screenshot saved: error-screenshot.png');
  } finally {
    await browser.close();
  }
}

verifyImagesWithLogin();
