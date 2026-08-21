import { chromium } from '@playwright/test';
import fs from 'fs';

const BASE = 'http://localhost:3010';
const OUT = 'visual-review';

const VIEWPORTS = [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1280', width: 1280, height: 800 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-375', width: 375, height: 667 },
];

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/shop', name: 'shop' },
  { path: '/track', name: 'track' },
  { path: '/account', name: 'account' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await ctx.newPage();
    for (const p of PAGES) {
      try {
        await page.goto(BASE + p.path, { waitUntil: 'networkidle', timeout: 45000 });
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${OUT}/${p.name}-${vp.name}.png`, fullPage: false });
        // horizontal overflow check
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        console.log(`${p.name} @ ${vp.name}: overflowX=${overflow}px`);
      } catch (e) {
        console.log(`${p.name} @ ${vp.name}: ERROR ${e.message}`);
      }
    }
    await ctx.close();
  }
  await browser.close();
})();
