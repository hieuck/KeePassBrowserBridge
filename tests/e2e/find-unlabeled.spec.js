import { test, expect } from '@playwright/test';

test('find unlabeled buttons', async ({ page }) => {
  await page.goto('/extension/popup.html');
  await page.waitForTimeout(2000);
  
  const details = await page.evaluate(() => {
    const unlabeled = Array.from(document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])'))
      .filter(b => !b.textContent.trim());
    return unlabeled.map(b => ({
      tag: b.tagName,
      class: b.className,
      html: b.outerHTML.slice(0, 120),
      parentClass: b.parentElement?.className || ''
    }));
  });
  
  console.log('Unlabeled buttons:', JSON.stringify(details, null, 2));
  expect(details.length).toBe(0);
});
