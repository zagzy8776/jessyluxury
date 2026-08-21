import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  // Full-page home at desktop
  const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto('http://localhost:3010/', { waitUntil: 'networkidle', timeout: 45000 });
  await d.waitForTimeout(1500);
  await d.screenshot({ path: 'visual-review/home-desktop-full.png', fullPage: true });

  // Shop + PDP + cart drawer at mobile
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto('http://localhost:3010/shop', { waitUntil: 'networkidle', timeout: 45000 });
  await m.waitForTimeout(1500);
  await m.screenshot({ path: 'visual-review/shop-mobile-full.png', fullPage: true });

  // PDP — click first product
  await m.locator('a[href^="/shop/"]').first().click();
  await m.waitForLoadState('networkidle');
  await m.waitForTimeout(1500);
  await m.screenshot({ path: 'visual-review/pdp-mobile-full.png', fullPage: true });

  // Add to cart → drawer
  const addBtn = m.locator('#purchase-block button.btn-primary');
  if (await addBtn.count()) {
    await addBtn.first().click();
    await m.waitForTimeout(1200);
    await m.screenshot({ path: 'visual-review/cart-mobile.png' });
  }

  // Home mobile full
  await m.goto('http://localhost:3010/', { waitUntil: 'networkidle', timeout: 45000 });
  await m.waitForTimeout(1500);
  await m.screenshot({ path: 'visual-review/home-mobile-full.png', fullPage: true });

  await browser.close();
  console.log('done');
})();
