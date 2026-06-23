import { test } from '@playwright/test';

test('popup v2 inspection', async ({ page }) => {
  await page.setViewportSize({ width: 400, height: 600 });
  await page.goto('http://127.0.0.1:3000/extension/popup.html');
  await page.waitForSelector('.popup-header, .kbb-popup', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(500);

  // 1. Light mode - empty state
  await page.screenshot({ path: 'tests/visual/__screenshots__/v2/popup-empty-light.png', fullPage: true });

  // 2. Toggle theme twice to reach dark mode
  const themeBtn = page.locator('[aria-label*="Theme"]').first();
  if (await themeBtn.count() > 0) {
    await themeBtn.click();
    await page.waitForTimeout(200);
    await themeBtn.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: 'tests/visual/__screenshots__/v2/popup-empty-dark.png', fullPage: true });

  // 3. Reset to light mode by clicking again
  await page.locator('[aria-label*="Theme"]').first().click();
  await page.waitForTimeout(200);
});
