const { chromium } = require('playwright');

async function testProductImages() {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  try {
    console.log('📍 Navigating to products page...');
    await page.goto('http://localhost:3000/products', {
      waitUntil: 'networkidle',
      timeout: 30000,
    });

    console.log('✓ Products page loaded');

    // Wait for product cards to load
    await page.waitForSelector('[class*="rounded-xl"]', { timeout: 5000 }).catch(() => {});

    // Get all product cards and their images
    const products = await page.evaluate(() => {
      const productCards = document.querySelectorAll('a[href*="/products/"]');
      const results = [];

      productCards.forEach((card) => {
        const titleEl = card.querySelector('h3, .font-semibold');
        const imgEl = card.querySelector('img');

        if (titleEl && imgEl) {
          results.push({
            title: titleEl.textContent.trim(),
            imageSrc: imgEl.src,
            imageAlt: imgEl.alt,
          });
        }
      });

      return results.slice(0, 10); // First 10 products
    });

    if (products.length === 0) {
      console.log('❌ No products found on the page');
      return;
    }

    console.log(`\n📦 Found ${products.length} products:\n`);
    products.forEach((product, index) => {
      console.log(`${index + 1}. ${product.title}`);
      console.log(`   Image: ${product.imageSrc}`);
      console.log(`   Alt: ${product.imageAlt || 'N/A'}`);
      console.log('');
    });

    // Check if images are loading properly
    console.log('🔍 Verifying image URLs are valid...');
    for (const product of products) {
      const isValidUrl = product.imageSrc.startsWith('http');
      const status = isValidUrl ? '✓' : '❌';
      console.log(`${status} ${product.title}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

testProductImages();
