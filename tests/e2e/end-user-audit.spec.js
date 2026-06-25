import { test, expect } from '@playwright/test';

test('end-user audit', async ({ page }) => {
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });

  await page.goto('/extension/popup.html');
  await page.waitForTimeout(2000);

  // Check console errors
  test.info().annotations.push({ type: 'console', description: String(consoleErrors.length) + ' errors: ' + consoleErrors.join('; ') });
  expect(consoleErrors.length === 0).toBeTruthy();

  const unlabeled = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])'))
      .filter(b => !b.textContent.trim())
      // Exclude Ant Design internal icon-only buttons (search clear, etc.)
      .filter(b => !b.className.includes('ant-input-search-button') && !b.className.includes('anticon'))
      .length;
  });
  test.info().annotations.push({ type: 'unlabeled-buttons', description: String(unlabeled) });
  expect(unlabeled === 0).toBeTruthy();

  const noAlt = await page.evaluate(() => {
    return document.querySelectorAll('img:not([alt])').length;
  });
  test.info().annotations.push({ type: 'images-no-alt', description: String(noAlt) });
  expect(noAlt === 0).toBeTruthy();

  await expect(page.locator('.popup')).toBeVisible();
  await expect(page.locator('.footer-bar')).toBeVisible();

  await page.goto('/extension/options.html');
  await page.waitForTimeout(2000);
  await expect(page.locator('.options-page')).toBeVisible();
});
