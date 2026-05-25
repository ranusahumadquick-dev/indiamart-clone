const { chromium } = require('playwright');

async function verifyProductImages() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Set viewport for better screenshots
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    console.log('🔍 Verifying Product Images...\n');

    // Navigate to home page
    console.log('📍 Loading home page...');
    await page.goto('http://localhost:3000/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Take screenshot of home page
    console.log('📸 Capturing home page with products...');
    await page.screenshot({
      path: 'verify-home-products.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: verify-home-products.png\n');

    // Navigate to products page
    console.log('📍 Navigating to /products page...');
    await page.goto('http://localhost:3000/products', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Take screenshot of products list
    console.log('📸 Capturing products page...');
    await page.screenshot({
      path: 'verify-products-list.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: verify-products-list.png\n');

    // Get product details from the page
    console.log('📦 Extracting product information...\n');

    const products = await page.evaluate(() => {
      const productElements = document.querySelectorAll('[class*="product"], [class*="card"]');
      const results = [];

      productElements.forEach((el) => {
        const titleEl = el.querySelector('h3, h2, [class*="font-semibold"]');
        const imgEl = el.querySelector('img');

        if (titleEl && imgEl && imgEl.src) {
          results.push({
            title: titleEl.textContent.trim().substring(0, 50),
            imageSrc: imgEl.src.substring(0, 100),
            imageLoaded: imgEl.complete && imgEl.naturalHeight > 0
          });
        }
      });

      return results.slice(0, 15); // First 15 products
    });

    if (products.length > 0) {
      console.log(`✓ Found ${products.length} products with images:\n`);
      products.forEach((product, index) => {
        const status = product.imageLoaded ? '✓' : '⏳';
        console.log(`${index + 1}. "${product.title}"`);
        console.log(`   ${status} Image: ${product.imageSrc}...\n`);
      });
    } else {
      console.log('⚠️ No products found on the page');
    }

    // Try to scroll and load more products
    console.log('\n📜 Scrolling to load more products...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    // Take another screenshot after scrolling
    console.log('📸 Capturing scrolled view...');
    await page.screenshot({
      path: 'verify-products-scrolled.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: verify-products-scrolled.png\n');

    console.log('✅ Verification complete!');
    console.log('\n📊 Summary:');
    console.log(`   - Total products found: ${products.length}`);
    console.log(`   - Images loaded: ${products.filter(p => p.imageLoaded).length}`);
    console.log(`   - Screenshots taken: 3`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Close browser after 5 seconds
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

verifyProductImages();
