const { chromium } = require('playwright');

async function testProductsWithLogin() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox']
  });

  const page = await browser.newPage();

  try {
    console.log('🔐 Logging into application...');

    // Go to login page
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'networkidle'
    });

    // Try to find test credentials or use demo account
    // For now, let's just take a screenshot and navigate to products as a guest

    console.log('📍 Navigating to products page...');
    await page.goto('http://localhost:3000/products', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.waitForTimeout(3000);

    // Check the current page content
    const pageTitle = await page.title();
    const pageUrl = page.url();

    console.log(`Page Title: ${pageTitle}`);
    console.log(`Page URL: ${pageUrl}`);

    // Take a screenshot
    console.log('📸 Taking screenshot of products page...');
    await page.screenshot({
      path: 'products-page-full.png',
      fullPage: true
    });

    console.log('✓ Screenshot saved: products-page-full.png');

    // Get page HTML to analyze
    const html = await page.content();

    // Check if ProductImage component is present
    const hasProductImage = html.includes('ProductImage') || html.includes('img');
    console.log(`Image elements found: ${hasProductImage ? 'Yes' : 'No'}`);

    // Get image count
    const imageCount = (html.match(/<img/g) || []).length;
    console.log(`Total <img> tags found: ${imageCount}`);

    // Try to find product cards
    const products = await page.evaluate(() => {
      const cards = document.querySelectorAll('[class*="rounded-xl"], [class*="product"]');
      return {
        totalCards: cards.length,
        imagesInCards: Array.from(cards).filter(c => c.querySelector('img')).length
      };
    });

    console.log(`Product cards found: ${products.totalCards}`);
    console.log(`Cards with images: ${products.imagesInCards}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    // Keep browser open for manual inspection for 10 seconds
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testProductsWithLogin();
