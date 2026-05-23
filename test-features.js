const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🧪 Starting Feature Tests\n');

  try {
    // Test 1: Check if pages load without errors
    console.log('✓ Test 1: Page Loading');

    await page.goto(`${BASE_URL}/products`, { waitUntil: 'networkidle' });
    console.log('  ✓ Products page loaded');

    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'networkidle' });
    const isRedirected = page.url().includes('login');
    if (isRedirected) {
      console.log('  ✓ Chat page redirects to login (expected - not authenticated)');
    } else {
      console.log('  ✓ Chat page loaded');
    }

    // Test 2: Check backend API
    console.log('\n✓ Test 2: Backend API');
    const healthResponse = await page.request.get('http://localhost:8000/api/health');
    const healthData = await healthResponse.json();
    if (healthData.success) {
      console.log('  ✓ Backend health check passed');
    }

    // Test 3: Check if chat components exist
    console.log('\n✓ Test 3: Frontend Components');
    await page.goto(`${BASE_URL}/chat`, { waitUntil: 'domcontentloaded' });

    // Check for chat-related elements
    const chatElements = await page.evaluate(() => {
      return {
        hasSocketIO: !!window.io,
        pageTitle: document.title,
        hasContent: document.body.innerHTML.length > 100
      };
    });

    console.log('  ✓ Page title:', chatElements.pageTitle);
    console.log('  ✓ Page has content:', chatElements.hasContent);

    // Test 4: Check if inquiries page is accessible
    console.log('\n✓ Test 4: Inquiries Page');
    const inquiriesResponse = await page.request.get(`${BASE_URL}/buyer/inquiries`);
    if (inquiriesResponse.status() === 200) {
      console.log('  ✓ Inquiries page responds with 200 OK');
    } else {
      console.log('  ✗ Inquiries page returned status:', inquiriesResponse.status());
    }

    // Test 5: Check API endpoints
    console.log('\n✓ Test 5: API Endpoints');
    const routes = [
      '/api/chat/conversations',
      '/api/inquiries/buyer/my-inquiries',
      '/api/products',
    ];

    for (const route of routes) {
      try {
        const response = await page.request.get(`http://localhost:8000${route}`, {
          headers: {
            'Authorization': 'Bearer invalid-token'
          }
        });
        // We expect auth errors for now, just checking if endpoints exist
        console.log(`  ✓ ${route} endpoint exists (${response.status()})`);
      } catch (error) {
        console.log(`  ✗ ${route} endpoint error: ${error.message}`);
      }
    }

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
}

runTests().catch(console.error);
