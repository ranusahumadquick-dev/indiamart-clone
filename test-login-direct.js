const { chromium } = require('playwright');

async function testLoginDirect() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--no-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 720 });

  try {
    console.log('📍 Navigating to login page...');
    await page.goto('http://localhost:3000/auth/login', {
      waitUntil: 'domcontentloaded'
    });

    await page.waitForTimeout(2000);

    console.log('🔍 Analyzing login form...');

    // Get all input fields
    const inputs = await page.$$eval('input', els => {
      return els.map(el => ({
        type: el.type,
        name: el.name,
        id: el.id,
        placeholder: el.placeholder
      }));
    });

    console.log('Found inputs:', inputs);

    // Take screenshot before filling
    await page.screenshot({ path: 'login-form-initial.png' });

    console.log('\n📝 Filling login form...');

    // Find email input and fill it
    const emailInput = await page.$('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]');
    if (emailInput) {
      await emailInput.click();
      await emailInput.type('buyer@test.com', { delay: 50 });
      console.log('✓ Filled email field');
    }

    await page.waitForTimeout(500);

    // Find password input and fill it
    const passwordInput = await page.$('input[type="password"], input[placeholder*="password"], input[placeholder*="Password"]');
    if (passwordInput) {
      await passwordInput.click();
      await passwordInput.type('test1234', { delay: 50 });
      console.log('✓ Filled password field');
    }

    await page.waitForTimeout(500);

    // Take screenshot after filling
    await page.screenshot({ path: 'login-form-filled.png' });

    // Find and click login button
    const loginButton = await page.$('button:has-text("Login"), button[type="submit"]');
    if (loginButton) {
      console.log('Clicking login button...');
      await loginButton.click();

      // Wait for navigation
      await Promise.race([
        page.waitForNavigation({ timeout: 5000 }).catch(() => {}),
        page.waitForTimeout(5000)
      ]);

      console.log(`✓ Login button clicked`);
      console.log(`Current URL: ${page.url()}`);

      await page.waitForTimeout(2000);

      // Take screenshot after login
      await page.screenshot({ path: 'login-after-attempt.png', fullPage: true });

      const finalUrl = page.url();
      if (finalUrl.includes('login')) {
        console.log('❌ Still on login page - authentication may have failed');
      } else {
        console.log('✅ Navigated away from login page!');
      }
    } else {
      console.log('❌ Login button not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testLoginDirect();
