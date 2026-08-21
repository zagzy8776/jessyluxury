import { chromium } from '@playwright/test';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 375, height: 667 } });
  await page.goto('http://localhost:3010/', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(1500);
  const offenders = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const bad = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > vw + 1 || r.left < -1) {
        const cls = (el.className && typeof el.className === 'string') ? el.className.slice(0, 90) : el.tagName;
        bad.push(`${el.tagName}.${cls} -> left=${Math.round(r.left)} right=${Math.round(r.right)}`);
      }
    });
    return bad.slice(0, 25);
  });
  console.log(offenders.join('\n'));
  await browser.close();
})();
