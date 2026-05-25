const { chromium } = require('playwright');

async function testProductImagesWithAuth() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('🔐 Step 1: Visiting login page...');
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✓ Login page loaded');

    // Get test user from database or create one
    // For now, let's try to access the products page directly without login
    // since some products might be public
    console.log('\n📍 Step 2: Navigating to products page (public access)...');
    await page.goto('http://localhost:3000/products', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Check if we got redirected to login
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    if (currentUrl.includes('/auth/login')) {
      console.log('❌ Products page requires authentication');
      console.log('📝 Testing product image API directly instead...\n');

      // Test the image API endpoint
      const response = await page.goto(
        'http://localhost:8000/api/health',
        { timeout: 10000 }
      );

      const healthCheck = await page.evaluate(() => {
        return document.body.innerText;
      });

      console.log('Backend Health Check:', healthCheck);

      // Let's fetch a product and test its image endpoint
      console.log('\n🔍 Step 3: Testing product image API endpoint...');

      const imageApiTest = await page.goto(
        'http://localhost:8000/api/images/products/test/image?title=Solar%20Panel%2010W&category=electrical',
        { timeout: 10000 }
      );

      const imageApiResponse = await page.evaluate(() => {
        return document.body.innerText;
      });

      console.log('Image API Response:', imageApiResponse);

      return;
    }

    console.log('✓ Products page loaded without redirect');

    // Wait for product cards to load
    const loaded = await page.waitForSelector('[class*="rounded"]', {
      timeout: 10000
    }).catch(() => false);

    if (!loaded) {
      console.log('⚠️  Product cards not found, waiting longer...');
      await page.waitForTimeout(3000);
    }

    // Get all product data
    const products = await page.evaluate(() => {
      const cards = document.querySelectorAll('div[class*="rounded-xl"]');
      const results = [];

      cards.forEach((card) => {
        const titleEl = card.querySelector('h3, h2, .font-semibold');
        const imgEl = card.querySelector('img');

        if (imgEl && imgEl.src) {
          results.push({
            title: titleEl?.textContent?.trim() || 'Unknown',
            imageSrc: imgEl.src,
            imageAlt: imgEl.alt,
            imageHeight: imgEl.height,
            imageWidth: imgEl.width,
          });
        }
      });

      return results.slice(0, 10);
    });

    if (products.length === 0) {
      console.log('❌ No product images found on the page');
      console.log('📸 Checking page screenshot...');
      await page.screenshot({ path: 'products-page-error.png' });
      console.log('Screenshot saved to: products-page-error.png');
      return;
    }

    console.log(`\n✓ Found ${products.length} products with images:\n`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. "${product.title}"`);
      console.log(`   Image URL: ${product.imageSrc.substring(0, 80)}...`);
      console.log(`   Size: ${product.imageWidth}x${product.imageHeight}`);
      console.log('');
    });

    // Take a screenshot of the products page
    console.log('📸 Capturing screenshot of products page...');
    await page.screenshot({ path: 'products-page-screenshot.png' });
    console.log('✓ Screenshot saved to: products-page-screenshot.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
    try {
      await page.screenshot({ path: 'error-screenshot.png' });
      console.log('Error screenshot saved');
    } catch (e) {}
  } finally {
    await browser.close();
  }
}

testProductImagesWithAuth();
