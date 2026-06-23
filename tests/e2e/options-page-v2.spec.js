import { test, expect } from '@playwright/test';

const OPTIONS_URL = '/extension/options.html';

test.describe('Options page v2', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });
  });

  test('renders the options page with header and sidebar', async ({ page }) => {
    await expect(page.locator('.options-page')).toBeVisible();
    await expect(page.locator('.options-page__header')).toBeVisible();
    await expect(page.locator('.options-page__brand')).toContainText('KeePass');
    await expect(page.locator('.options-page__version')).toContainText('v2.0.0');
    await expect(page.locator('.ant-menu')).toBeVisible();
  });

  test('sidebar lists 7 tabs', async ({ page }) => {
    const tabs = page.locator('.ant-menu-item');
    await expect(tabs).toHaveCount(7);
    await expect(tabs.nth(0)).toContainText('General');
    await expect(tabs.nth(1)).toContainText('Bridge');
    await expect(tabs.nth(2)).toContainText('Auto-fill');
    await expect(tabs.nth(3)).toContainText('Sites');
    await expect(tabs.nth(4)).toContainText('Clients');
    await expect(tabs.nth(5)).toContainText('Passkeys');
    await expect(tabs.nth(6)).toContainText('About');
  });

  test('general tab is active by default', async ({ page }) => {
    const activeTab = page.locator('.ant-menu-item-selected');
    await expect(activeTab).toHaveCount(1);
    await expect(activeTab).toContainText('General');
  });

  test('clicking a sidebar tab switches the active tab', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Bridge' }).click();
    await expect(page.locator('.ant-menu-item-selected')).toContainText('Bridge');
    await expect(page.locator('.options-page__content')).toContainText('Bridge endpoint');
  });

  test('general tab shows appearance and auto-lock sections', async ({ page }) => {
    await expect(page.locator('.ant-card', { hasText: 'Appearance' })).toBeVisible();
    await expect(page.locator('.ant-card', { hasText: 'Auto-lock' })).toBeVisible();
  });

  test('bridge tab shows endpoint and connection status', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Bridge' }).click();
    await expect(page.locator('.ant-card', { hasText: 'Bridge endpoint' })).toBeVisible();
    await expect(page.locator('.ant-card', { hasText: 'Connection status' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Test connection' })).toBeVisible();
  });

  test('auto-fill tab shows toggles and delay input', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Auto-fill' }).click();
    const toggles = page.locator('[role="switch"]');
    await expect(toggles).toHaveCount(2);
    await expect(page.locator('.ant-card', { hasText: 'Auto-fill' })).toBeVisible();
    await expect(page.locator('.ant-card', { hasText: 'Fill delay' })).toBeVisible();
  });

  test('sites tab shows add-rule form and empty state', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Sites' }).click();
    await expect(page.locator('.ant-card', { hasText: 'Per-site rules' })).toBeVisible();
    await expect(page.locator('.sites-empty')).toBeVisible();
    await expect(page.locator('input[placeholder="example.com"]')).toBeVisible();
    await expect(page.locator('button', { hasText: 'Add' })).toBeVisible();
  });

  test('passkey tab shows enable toggle and status badge', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Passkeys' }).click();
    await expect(page.locator('.ant-card', { hasText: 'Passkey support' })).toBeVisible();
    const toggles = page.locator('[role="switch"]');
    await expect(toggles).toHaveCount(1);
    await expect(page.locator('.ant-tag')).toBeVisible();
  });

  test('about tab shows version and GitHub link', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'About' }).click();
    await expect(page.locator('.ant-card', { hasText: 'KeePass Browser Bridge' })).toBeVisible();
    const link = page.locator('a[href*="github.com"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('href', /github\.com/);
    await expect(page.locator('button', { hasText: 'Export logs' })).toBeVisible();
  });

  test('footer is hidden when there are no unsaved changes', async ({ page }) => {
    await expect(page.locator('.options-page__footer')).toHaveCount(0);
  });

  test('theme toggle cycles through light/dark/system', async ({ page }) => {
    const themeBtn = page.locator('.options-page__header .ant-btn');
    await expect(themeBtn).toBeVisible();
    const initialLabel = await themeBtn.getAttribute('aria-label');
    await themeBtn.click();
    const nextLabel = await themeBtn.getAttribute('aria-label');
    expect(nextLabel).not.toBe(initialLabel);
  });

  test('uses design tokens (CSS custom properties)', async ({ page }) => {
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
    );
    expect(bgColor).not.toBe('');
    const accentColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    );
    expect(accentColor).not.toBe('');
  });

  test('is keyboard accessible (tab navigation works)', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.className || '');
    expect(focused).toMatch(/ant-(menu-item|btn)/);
  });

  test('sidebar tabs have proper labels', async ({ page }) => {
    const tabs = page.locator('.ant-menu-item');
    const count = await tabs.count();
    expect(count).toBe(7);
    const labels = ['General', 'Bridge', 'Auto-fill', 'Sites', 'Clients', 'Passkeys', 'About'];
    for (let i = 0; i < count; i++) {
      await expect(tabs.nth(i)).toContainText(labels[i]);
    }
  });

  test('sidebar nav has proper ARIA label', async ({ page }) => {
    const menu = page.locator('.ant-menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('role', 'menu');
  });

  test('after clicking Bridge tab, theme toggle still visible', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Bridge' }).click();
    const themeBtn = page.locator('.options-page__header .ant-btn');
    await expect(themeBtn).toBeVisible();
  });

  test('test connection button on bridge tab is interactive', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Bridge' }).click();
    const testBtn = page.locator('button', { hasText: 'Test connection' });
    await expect(testBtn).toBeEnabled();
  });

  test('auto-fill toggles are visible and interactive', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Auto-fill' }).click();
    const firstToggle = page.locator('[role="switch"]').first();
    await expect(firstToggle).toBeVisible();
    await expect(firstToggle).toBeEnabled();
  });

  test('sites tab with site rule input has proper placeholder', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Sites' }).click();
    const input = page.locator('input[placeholder="example.com"]');
    await expect(input).toHaveAttribute('placeholder', 'example.com');
  });

  test('about tab shows KeePass Browser Bridge title', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'About' }).click();
    await expect(page.locator('.ant-card', { hasText: 'KeePass Browser Bridge' })).toBeVisible();
  });

  test('about tab export logs button is enabled', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'About' }).click();
    const exportBtn = page.locator('button', { hasText: 'Export logs' });
    await expect(exportBtn).toBeEnabled();
  });

  test('sidebar navigation has proper ARIA attributes', async ({ page }) => {
    const menu = page.locator('.ant-menu');
    await expect(menu).toBeVisible();
    await expect(menu).toHaveAttribute('role', 'menu');
  });

  test('general tab appearance section shows theme toggle', async ({ page }) => {
    await expect(page.locator('.ant-card', { hasText: 'Appearance' })).toBeVisible();
    const themeBtn = page.locator('.options-page__header .ant-btn');
    await expect(themeBtn).toBeVisible();
  });

  test('auto-fill tab shows auto-submit toggle', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Auto-fill' }).click();
    const toggles = page.locator('[role="switch"]');
    await expect(toggles).toHaveCount(2);
  });

  test('sites tab add button renders', async ({ page }) => {
    await page.locator('.ant-menu-item', { hasText: 'Sites' }).click();
    await expect(page.locator('button', { hasText: 'Add' })).toBeVisible();
  });
});
