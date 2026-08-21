import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();

  // Search overlay desktop (no cart drawer open)
  const d = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await d.goto('http://localhost:3010/', { waitUntil: 'networkidle', timeout: 60000 });
  await d.waitForTimeout(1000);
  await d.locator('button[aria-label="Search"]').click();
  await d.waitForTimeout(1000);
  await d.keyboard.type('oud');
  await d.waitForTimeout(1200);
  await d.screenshot({ path: 'visual-review/search-desktop.png' });

  // Track page desktop
  await d.goto('http://localhost:3010/track', { waitUntil: 'networkidle', timeout: 60000 });
  await d.waitForTimeout(1000);
  await d.screenshot({ path: 'visual-review/track-desktop.png' });

  // Account notifications desktop
  await d.goto('http://localhost:3010/account/notifications', { waitUntil: 'networkidle', timeout: 60000 });
  await d.waitForTimeout(1000);
  await d.screenshot({ path: 'visual-review/account-notifications-desktop.png' });

  // Home full mobile
  const m = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto('http://localhost:3010/', { waitUntil: 'networkidle', timeout: 60000 });
  await m.waitForTimeout(1500);
  await m.screenshot({ path: 'visual-review/home-mobile-full.png', fullPage: true });

  // Mobile bottom nav visible
  await m.screenshot({ path: 'visual-review/mobile-bottom-nav.png' });

  await browser.close();
  console.log('done');
})();