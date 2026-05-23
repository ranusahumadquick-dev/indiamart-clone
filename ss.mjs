import { chromium } from './node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync } from 'fs';

const TOKEN = readFileSync(process.env.TEMP + '/token.txt', 'utf8').trim();
const br = await chromium.launch({ headless: true });
const page = await br.newPage();
await page.setViewportSize({ width: 1280, height: 900 });

await page.goto('http://localhost:3000');
await page.evaluate((tok) => {
  localStorage.setItem('token', tok);
  localStorage.setItem('accessToken', tok);
}, TOKEN);

await page.goto('http://localhost:3000/seller/products/new');
await page.waitForLoadState('networkidle');
await page.waitForTimeout(3500);
console.log('URL:', page.url());
await page.screenshot({ path: process.env.TEMP + '/add-product.png', fullPage: true });
console.log('screenshot saved');
await br.close();
