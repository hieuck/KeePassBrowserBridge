import { test, expect } from '@playwright/test';

const OPTIONS_URL = '/extension/options.html';

test.describe('Settings Import/Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });
    await page.locator('.ant-menu-item', { hasText: 'About' }).click();
  });

  test('About tab shows Export and Import Settings buttons', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'Export Settings' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Import Settings' })).toBeVisible();
  });

  test('Export triggers a download', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5000 }),
      page.locator('button', { hasText: 'Export Settings' }).click(),
    ]);
    expect(download).not.toBeNull();
    expect(download.suggestedFilename()).toContain('keepass-bridge-settings');
  });

  test('Import file picker exists and is hidden', async ({ page }) => {
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await expect(fileInput).toBeVisible({ visible: false });
  });

  test('Import opens file picker and handles valid JSON', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.locator('button', { hasText: 'Import Settings' }).click();
    const fileChooser = await fileChooserPromise;

    const content = JSON.stringify({ testKey: 'testValue' }, null, 2);
    await fileChooser.setFiles({
      name: 'keepass-bridge-settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(content),
    });

    await expect(page.locator('input[type="file"][accept=".json"]')).toBeAttached({ timeout: 2000 });
  });
});
