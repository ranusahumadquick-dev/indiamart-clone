const { chromium } = require('playwright');

async function checkProductTitlesAndImages() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 900 });

  try {
    console.log('🔐 Logging in...\n');

    // Login
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'domcontentloaded'
    });

    const emailInput = await page.$('input[type="email"]');
    await emailInput.click();
    await emailInput.type('buyer@test.com', { delay: 30 });

    const passwordInput = await page.$('input[type="password"]');
    await passwordInput.click();
    await passwordInput.type('test1234', { delay: 30 });

    const loginButton = await page.$('button:has-text("Login")');
    await loginButton.click();

    await page.waitForTimeout(4000);

    console.log('✓ Logged in\n');

    // Now check product images directly
    console.log('🔍 Checking Product Titles and Images:\n');

    const pageData = await page.evaluate(() => {
      const products = [];

      // Get all images on page with their context
      const images = document.querySelectorAll('img');

      images.forEach((img) => {
        // Get nearby text that might be the product title
        let title = '';
        let parent = img.closest('div[class*="rounded"], div[class*="card"], article');

        if (parent) {
          const textElements = parent.querySelectorAll('h2, h3, [class*="font-bold"], [class*="font-semibold"]');
          for (const el of textElements) {
            const text = el.textContent.trim();
            if (text && text.length > 3 && text.length < 100 && !text.includes('%')) {
              title = text;
              break;
            }
          }
        }

        // Only include if we have a meaningful title
        if (title && title.length > 5 && img.src && img.src.includes('http')) {
          // Extract the meaningful part of the image URL
          let imageSrc = img.src;
          if (imageSrc.includes('?')) {
            imageSrc = imageSrc.split('?')[0];
          }

          products.push({
            title: title,
            imageSrc: imageSrc,
            isLocalImage: imageSrc.includes('localhost'),
            isExternalImage: imageSrc.includes('unsplash') || imageSrc.includes('pexels') || imageSrc.includes('picsum')
          });
        }
      });

      // Remove duplicates
      const unique = [];
      const seen = new Set();
      for (const p of products) {
        if (!seen.has(p.title)) {
          seen.add(p.title);
          unique.push(p);
        }
      }

      return unique.slice(0, 12);
    });

    console.log('📋 Products Found on Page:\n');
    console.log('┌─────────────────────────────────────────────────────────────────────┐');

    pageData.forEach((product, index) => {
      console.log(`\n${index + 1}. Product Title: "${product.title}"`);
      console.log(`   Image Source: ${product.imageSrc.substring(0, 80)}...`);

      let analysis = '🔍 Analysis: ';
      if (product.isLocalImage) {
        analysis += '⚠️ Using local/cached image';
      } else if (product.isExternalImage) {
        analysis += '✅ Using external smart image (API matched)';
      } else {
        analysis += '❓ Image source unknown';
      }

      console.log(`   ${analysis}`);
    });

    console.log('\n└─────────────────────────────────────────────────────────────────────┘');

    // Now test the image API with actual product titles
    console.log('\n\n🔗 Testing Image API with Product Titles:\n');

    const testProducts = [
      { title: 'LED Panel Light 18W', category: 'electrical' },
      { title: 'Urea Fertilizer', category: 'food' },
      { title: 'Solar Panel', category: 'electrical' },
      { title: 'Laptop Computer', category: 'electronics' },
    ];

    for (const testProduct of testProducts) {
      try {
        const response = await fetch(
          `http://localhost:8000/api/images/products/test-id/image?title=${encodeURIComponent(testProduct.title)}&category=${encodeURIComponent(testProduct.category)}`,
          { timeout: 5000 }
        );

        const data = await response.json();

        if (data.success) {
          console.log(`✅ "${testProduct.title}" → Image fetched`);
          console.log(`   URL: ${data.data.imageUrl.substring(0, 80)}...\n`);
        } else {
          console.log(`❌ "${testProduct.title}" → Failed\n`);
        }
      } catch (error) {
        console.log(`❌ "${testProduct.title}" → Error: ${error.message}\n`);
      }
    }

    // Take final screenshot
    console.log('📸 Taking final screenshot...');
    await page.screenshot({
      path: 'final-verification.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved: final-verification.png\n');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ VERIFICATION COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

checkProductTitlesAndImages();
