import { test, expect } from '@playwright/test';

test.describe('Fallback picker with customElements = null', () => {
  test('shows fallback HTML picker when customElements is null', async ({ page }) => {
    // Set up mock chrome APIs via addInitScript (runs before page scripts)
    await page.addInitScript(() => {
      window.__kbbFillResults = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [
                { Title: 'GitHub', UserName: 'octocat', Password: 'hunter2', Url: 'https://github.com' },
                { Title: 'GitLab', UserName: 'root', Password: 'toor', Url: 'https://gitlab.com' }
              ] } };
            }
            if (message.type === 'KBB_FILL') {
              window.__kbbFillResults.push(message);
              return { ok: true, response: { filled: true } };
            }
            return { ok: true, response: {} };
          }
        },
        storage: {
          local: {
            get: (keys, cb) => cb({ paired: true, locked: false, autoFillEnabled: true }),
            set: (obj, cb) => { if (cb) cb(); }
          }
        }
      };
    });

    // Navigate first
    await page.goto('/tests/fixtures/login-page.html');

    // Load content script after page load
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.waitForTimeout(2000);

    // Verify content script loaded
    const loaded = await page.evaluate(() => window.__keepassBrowserBridgeContentScriptLoaded);
    expect(loaded).toBe(true);

    // Verify inline button appeared
    const buttons = page.locator('.kbb-inline-button');
    await expect(buttons.first()).toBeVisible({ timeout: 5000 });

    // Block customElements to force fallback
    await page.evaluate(() => { delete window.customElements; });

    // Click the K button
    await buttons.first().click();
    await page.waitForTimeout(500);

    // Verify fallback picker appeared
    const picker = page.locator('.kbb-inline-picker--simple');
    await expect(picker).toBeVisible({ timeout: 5000 });
    await expect(picker).toContainText('GitHub');

    // Click credential to fill
    await picker.locator('button[role="option"]').first().click();
    await page.waitForTimeout(300);

    // Verify username was filled (role="username" button on the username field)
    const usernameVal = await page.locator('#username').inputValue();
    expect(usernameVal).toBe('octocat');
    // Picker should be closed now
    await expect(picker).not.toBeVisible();
  });
});
