import { test, expect } from '@playwright/test';

test.describe('Popup v2 keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbPopupMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: (message, callback) => {
            window.__kbbPopupMessages.push(message);
            let response = { ok: true, response: {} };
            if (message.type === 'KBB_QUERY_LOGINS') {
              response = {
                ok: true,
                response: {
                  url: 'https://example.com',
                  entries: [
                    { Uuid: '1', Title: 'Example', UserName: 'user', Password: 'pass', Url: 'https://example.com' },
                    { Uuid: '2', Title: 'GitHub', UserName: 'octocat', Password: 'hunter2', Url: 'https://github.com' },
                  ]
                }
              };
            }
            if (callback) callback(response);
            return true;
          }
        },
        storage: {
          local: {
            get: (keys, callback) => {
              const data = {
                endpoint: 'http://127.0.0.1:19455/bridge',
                clientId: 'a'.repeat(32),
                sharedSecret: 'k'.repeat(64),
                permissions: ['read', 'write', 'manageClients'],
                paired: true,
                locked: false,
                autoFillEnabled: true,
                autoSubmitEnabled: false,
              };
              if (typeof keys === 'function') callback(data);
              else if (Array.isArray(keys)) {
                const result = {};
                for (const k of keys) result[k] = data[k];
                callback(result);
              } else callback(data);
            },
            set: (obj, callback) => { if (callback) callback(); }
          }
        }
      };
    });
    await page.goto('/extension/popup.html');
    await page.waitForTimeout(2000);
  });

  test('credential cards render after page load', async ({ page }) => {
    const cards = page.locator('.credential-card');
    await expect(cards).toHaveCount(2, { timeout: 5000 });
  });

  test('clicking a credential card expands it', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await expect(card).toBeVisible();
    await card.click();
    await expect(card).toHaveAttribute('aria-expanded', 'true');
  });

  test('clicking expanded card again collapses it', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await expect(card).toHaveAttribute('aria-expanded', 'true');
    await card.click();
    await expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  test('Fill form button is visible in expanded card', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    const fillButton = card.locator('button:has-text("Fill form")');
    await expect(fillButton).toBeVisible();
  });
});
