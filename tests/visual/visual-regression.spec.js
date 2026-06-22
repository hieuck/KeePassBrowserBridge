import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCREENSHOTS_DIR = path.join(__dirname, '__screenshots__', 'v2');

const SURFACES = {
  popup: '/extension/popup.html',
  options: '/extension/options.html',
  'inline-picker': '/tests/fixtures/picker-host.html',
  'save-prompt': '/tests/fixtures/prompt-host.html',
  'update-prompt': '/tests/fixtures/prompt-host.html',
};

const THEMES = ['light', 'dark'];

test.describe('Visual regression v2.0', () => {
  for (const [surface, url] of Object.entries(SURFACES)) {
    for (const theme of THEMES) {
      test(`${surface} - ${theme} mode`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: theme });
        await page.goto(url);

        if (surface === 'popup') {
          await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
          await page.waitForTimeout(500);
        } else if (surface === 'options') {
          await page.waitForSelector('.options-page', { timeout: 5000 });
          await page.waitForTimeout(500);
        } else if (surface === 'inline-picker') {
          await page.evaluate(() => {
            const picker = document.createElement('kbb-picker');
            picker.credentials = [
              { name: 'GitHub', username: 'octocat', url: 'https://github.com' },
              { name: 'GitLab', username: 'root', url: 'https://gitlab.com' },
              { name: 'AWS Console', username: 'admin', url: 'https://aws.amazon.com' },
            ];
            document.body.appendChild(picker);
            picker.style.top = '40px';
            picker.style.left = '40px';
          });
          await page.waitForTimeout(300);
        } else if (surface === 'save-prompt') {
          await page.evaluate(() => {
            const p = document.createElement('kbb-save-prompt');
            p.setAttribute('name', 'GitHub');
            p.setAttribute('url', 'https://github.com');
            p.setAttribute('username', 'octocat');
            p.setAttribute('password', 'secret123');
            document.body.appendChild(p);
          });
          await page.waitForTimeout(500);
        } else if (surface === 'update-prompt') {
          await page.evaluate(() => {
            const p = document.createElement('kbb-update-prompt');
            p.setAttribute('name', 'GitHub');
            p.setAttribute('old-username', 'octocat');
            p.setAttribute('username', 'octocat2');
            p.setAttribute('password', 'newpass');
            document.body.appendChild(p);
          });
          await page.waitForTimeout(500);
        }

        const screenshotName = `${surface}-${theme}.png`;
        await expect(page).toHaveScreenshot(screenshotName, {
          fullPage: true,
          animations: 'disabled',
        });
      });
    }
  }

  test('popup - search interaction', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('github');
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot('popup-search-active.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - dark mode with multiple credentials', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('popup-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('options - all tabs', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/options.html');
    await page.waitForSelector('.options-page', { timeout: 5000 });
    const tabs = ['General', 'Bridge', 'Auto-fill', 'Sites', 'Clients', 'Passkeys', 'About'];
    for (const tabName of tabs) {
      await page.locator('.options-sidebar__tab', { hasText: tabName }).click();
      await page.waitForTimeout(300);
      await expect(page).toHaveScreenshot(`options-tab-${tabName.toLowerCase().replace(/[^a-z]/g, '')}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });
});
