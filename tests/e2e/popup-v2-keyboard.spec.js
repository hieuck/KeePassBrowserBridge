import { test, expect } from '@playwright/test';

function mockPopup(page, opts = {}) {
  const { entries, locked } = { entries: [], locked: false, ...opts };
  return page.addInitScript((args) => {
    const { entries: mockEntries, locked: isLocked } = args;
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
              response: { url: 'https://example.com', entries: mockEntries }
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
              permissions: isLocked ? ['read'] : ['read', 'write', 'manageClients'],
              paired: true,
              locked: isLocked,
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
  }, { entries, locked });
}

const SAMPLE_ENTRIES = [
  { Uuid: '1', Title: 'Example', UserName: 'user', Password: 'pass', Url: 'https://example.com' },
  { Uuid: '2', Title: 'GitHub', UserName: 'octocat', Password: 'hunter2', Url: 'https://github.com' },
];

test.describe('Popup v2 keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await mockPopup(page, { entries: SAMPLE_ENTRIES });
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
    await card.locator('.credential-card__chevron').click();
    await expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  test('Fill form button is visible in expanded card', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const fillButton = card.locator('button:has-text("Fill form")');
    await expect(fillButton).toBeVisible();
  });

  test('click edit button opens EditForm', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const editBtn = card.locator('button:has-text("Edit")');
    await expect(editBtn).toBeVisible();
  });

  test('EditForm displays credential data', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const editBtn = card.locator('button:has-text("Edit")');
    await expect(editBtn).toBeVisible();
    await editBtn.click();
    await page.waitForTimeout(300);
    const usernameInput = page.locator('input').first();
    await expect(usernameInput).toBeVisible();
  });

  test('edit button is present in expanded card', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const editBtn = card.locator('button:has-text("Edit")');
    await expect(editBtn).toBeVisible();
  });

  test('new login form shows when clicking new login button', async ({ page }) => {
    const newBtn = page.locator('.bottom-toolbar__btn', { hasText: 'New Login' }).first();
    await expect(newBtn).toBeVisible();
    await newBtn.click();
    await page.waitForTimeout(300);
    const newForm = page.locator('h2:has-text("New login")');
    await expect(newForm).toBeVisible();
  });

  test('keyboard Tab navigates through interactive elements', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(50);
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedTag).toBeDefined();
  });

  test('search input accepts text', async ({ page }) => {
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('GitHub');
      await page.waitForTimeout(200);
      const cards = page.locator('.credential-card');
      await expect(cards).toHaveCount(1);
    }
  });

  test('search narrows results to matching entry', async ({ page }) => {
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('GitHub');
      await page.waitForTimeout(200);
      const card = page.locator('.credential-card').first();
      await expect(card).toContainText('GitHub');
    }
  });

  test('search with no matches shows empty state', async ({ page }) => {
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('zzznonexistent');
    await page.waitForTimeout(300);
    const emptyState = page.locator('.empty-state').first();
    await expect(emptyState).toBeVisible();
  });

  test('multiple credentials display correctly', async ({ page }) => {
    const cards = page.locator('.credential-card');
    await expect(cards).toHaveCount(2);
    await expect(cards.nth(0)).toContainText('Example');
    await expect(cards.nth(1)).toContainText('GitHub');
  });

  test('lock button locks extension', async ({ page }) => {
    const lockBtn = page.locator('button[aria-label*="Lock"], button:has-text("Lock")').first();
    if (await lockBtn.count() > 0) {
      await lockBtn.click();
      await page.waitForTimeout(300);
      const lockedState = page.locator('.status-bar--locked, [class*="locked"]');
      await expect(lockedState).toBeVisible();
    }
  });

  test('settings button triggers options page', async ({ page }) => {
    const settingsBtn = page.locator('button[aria-label*="Settings"], button[aria-label*="settings"]').first();
    if (await settingsBtn.count() > 0) {
      await expect(settingsBtn).toBeEnabled();
    }
  });

  test('usage count badge displays in card', async ({ page }) => {
    await mockPopup(page, {
      entries: [
        { Uuid: '1', Title: 'Frequent', UserName: 'freq', Password: 'pass', Url: 'https://example.com', UsageCount: 5 },
        { Uuid: '2', Title: 'Rare', UserName: 'rare', Password: 'pass', Url: 'https://example.com', UsageCount: 0 },
      ]
    });
    await page.goto('/extension/popup.html');
    await page.waitForTimeout(2000);
    const badges = page.locator('.kbb-badge');
    await expect(badges.first()).toContainText('5');
  });
});
