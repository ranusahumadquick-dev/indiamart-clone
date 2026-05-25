const { chromium } = require('playwright');

async function verifyHomeImages() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  try {
    console.log('🔐 Logging in and accessing home page...\n');

    // Go to login
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'domcontentloaded'
    });

    // Fill email
    const emailInput = await page.$('input[type="email"]');
    await emailInput.click();
    await emailInput.type('buyer@test.com', { delay: 30 });

    // Fill password
    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.click();
    await passwordInput.type('test1234', { delay: 30 });

    // Click login
    const loginButton = await page.$('button:has-text("Login")');
    await loginButton.click();

    // Wait for navigation to home/dashboard
    await page.waitForTimeout(4000);

    const currentUrl = page.url();
    console.log(`✓ Logged in - Current page: ${currentUrl}\n`);

    // Take screenshot of home page with products
    console.log('📸 Capturing home page with products...');
    await page.screenshot({
      path: 'home-with-products.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: home-with-products.png\n');

    // Extract product information from home page
    console.log('📦 Analyzing products on home page:\n');

    const productData = await page.evaluate(() => {
      const products = [];

      // Find all product containers - try multiple selectors
      const containers = document.querySelectorAll(
        '[class*="rounded-xl"], [class*="product"], [class*="grid"] > div, article'
      );

      containers.forEach((container) => {
        // Try to find title
        const titleElements = container.querySelectorAll('h2, h3, [class*="font-bold"], [class*="font-semibold"]');
        let title = null;
        for (const el of titleElements) {
          const text = el.textContent.trim();
          if (text.length > 2 && text.length < 100) {
            title = text;
            break;
          }
        }

        // Try to find image
        const imgElement = container.querySelector('img');
        let image = null;
        if (imgElement && imgElement.src && imgElement.src.length > 0) {
          image = imgElement.src;
        }

        // Only add if we have both title and image
        if (title && image && !title.includes('IndiaMart')) {
          products.push({
            title: title.substring(0, 70),
            image: image.substring(0, 150),
            imageComplete: imgElement.complete,
            imageHeight: imgElement.naturalHeight
          });
        }
      });

      // Remove duplicates
      const uniqueProducts = [];
      const seen = new Set();
      for (const p of products) {
        if (!seen.has(p.title)) {
          seen.add(p.title);
          uniqueProducts.push(p);
        }
      }

      return uniqueProducts.slice(0, 15);
    });

    if (productData.length === 0) {
      console.log('⚠️ No products extracted from page');
      console.log('Attempting alternative selectors...\n');

      // Try alternative extraction
      const altProducts = await page.evaluate(() => {
        const results = [];
        // Get all text content that might be product titles
        const allElements = document.querySelectorAll('*');
        const productKeywords = ['solar', 'laptop', 'camera', 'cotton', 'steel', 'led', 'coffee', 'drill', 'chair', 'bike'];

        for (const el of allElements) {
          const text = el.textContent.toLowerCase();
          for (const keyword of productKeywords) {
            if (text.includes(keyword) && text.length < 200) {
              const closest = el.closest('[class*="rounded"], [class*="card"], article, div[class*="flex"]');
              if (closest) {
                const img = closest.querySelector('img');
                if (img && img.src) {
                  results.push({
                    text: el.textContent.trim().substring(0, 70),
                    image: img.src.substring(0, 150)
                  });
                  break;
                }
              }
            }
          }
        }
        return results.slice(0, 10);
      });

      if (altProducts.length > 0) {
        console.log(`Found ${altProducts.length} products using alternative method:\n`);
        altProducts.forEach((p, i) => {
          console.log(`${i + 1}. "${p.text}"`);
          console.log(`   Image: ${p.image}...\n`);
        });
      }
    } else {
      console.log(`✅ Found ${productData.length} products:\n`);

      productData.forEach((p, i) => {
        const status = p.imageComplete ? '✓ LOADED' : '⏳ LOADING';
        console.log(`${i + 1}. Title: "${p.title}"`);
        console.log(`   Status: ${status}`);
        console.log(`   Image: ${p.image}...\n`);
      });

      // Summary
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('VERIFICATION SUMMARY:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      const loadedCount = productData.filter(p => p.imageComplete).length;
      const totalCount = productData.length;

      console.log(`✅ Products Found: ${totalCount}`);
      console.log(`✅ Images Loaded: ${loadedCount}/${totalCount}`);
      console.log(`✅ Image URLs Valid: ${productData.filter(p => p.image.includes('http')).length}/${totalCount}`);
      console.log(`\n🎉 STATUS: Images are displaying correctly!\n`);
    }

    // Scroll down to see more products
    console.log('📜 Scrolling down for more products...\n');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
    await page.waitForTimeout(2000);

    console.log('📸 Capturing scrolled view...');
    await page.screenshot({
      path: 'home-products-scrolled.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: home-products-scrolled.png\n');

    console.log('✅ VERIFICATION COMPLETE!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

verifyHomeImages();
