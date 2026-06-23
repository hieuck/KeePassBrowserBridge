import { test, expect } from '@playwright/test';

const OPTIONS_URL = '/extension/options.html';
const POPUP_URL = '/extension/popup.html';

test.describe('Theme switching', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });
    await page.evaluate(() => localStorage.removeItem('kbb-theme'));
  });

  test('options respects light color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
    );
    expect(bgColor).toBe('#fafbfc');
  });

  test('options respects dark color scheme', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');
    const bgColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
    );
    expect(bgColor).toBe('#0f172a');
  });

  test('theme toggle cycles through light/dark/system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });

    const themeBtn = page.locator('.options-page__header button');
    await expect(themeBtn).toBeVisible();

    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

    // First click: should switch theme
    await themeBtn.click();
    await page.waitForTimeout(200);
    const afterFirst = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // The theme should have changed (light -> dark -> system -> light)
    const themesBefore = [initialTheme, afterFirst];

    // Second click: should switch again
    await themeBtn.click();
    await page.waitForTimeout(200);
    const afterSecond = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // Should be different from both previous
    expect(themesBefore).not.toContain(afterSecond);
  });

  test('design tokens change correctly on theme switch', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });
    await page.waitForTimeout(300);

    const lightBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
    );
    expect(lightBg).toBe('#fafbfc');

    // Switch to dark
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });
    await page.waitForTimeout(300);

    const darkBg = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
    );
    expect(darkBg).toBe('#0f172a');
    expect(darkBg).not.toBe(lightBg);
  });

  test('theme preference persists across page reloads', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto(OPTIONS_URL);
    await page.waitForSelector('.options-page', { timeout: 5000 });

    // Explicitly set dark theme and reload
    await page.evaluate(() => {
      localStorage.setItem('kbb-theme', 'dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    });

    // Navigate to popup and check theme persists
    await page.goto(POPUP_URL);
    await page.waitForTimeout(1000);

    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    // The popup also reads from localStorage, so it should be 'dark'
    expect(theme).toBe('dark');

    const accentColor = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim()
    );
    expect(accentColor).toBe('#60a5fa');
  });
});
