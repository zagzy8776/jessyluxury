import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });

  // PDP direct
  await m.goto('http://localhost:3010/shop/1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await m.waitForSelector('h1', { timeout: 60000 });
  await m.waitForTimeout(2500);
  await m.screenshot({ path: 'visual-review/pdp-mobile-full.png', fullPage: true });

  // Add to cart → drawer opens
  await m.locator('#purchase-block button.btn-primary').first().click();
  await m.waitForTimeout(1500);
  await m.screenshot({ path: 'visual-review/cart-mobile.png' });
  await m.keyboard.press('Escape');
  await m.locator('aside [aria-label="Close cart"]').click().catch(() => {});
  await m.waitForTimeout(600);

  // Desktop PDP + cart
  const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto('http://localhost:3010/shop/1', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await d.waitForSelector('h1', { timeout: 60000 });
  await d.waitForTimeout(2000);
  await d.screenshot({ path: 'visual-review/pdp-desktop.png' });
  await d.locator('#purchase-block button.btn-primary').first().click();
  await d.waitForTimeout(1500);
  await d.screenshot({ path: 'visual-review/cart-desktop.png' });

  // Search overlay desktop
  await d.keyboard.press('Escape');
  await d.locator('button[aria-label="Search"]').click();
  await d.waitForTimeout(800);
  await d.keyboard.type('oud');
  await d.waitForTimeout(1200);
  await d.screenshot({ path: 'visual-review/search-desktop.png' });

  // Track page desktop
  await d.goto('http://localhost:3010/track', { waitUntil: 'networkidle', timeout: 60000 });
  await d.waitForTimeout(1000);
  await d.screenshot({ path: 'visual-review/track-desktop.png' });

  await browser.close();
  console.log('done');
})();
