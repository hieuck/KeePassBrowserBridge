import { test, expect } from '@playwright/test';

function mockPopup(page, opts = {}) {
  const { entries } = { entries: [], ...opts };
  return page.addInitScript((args) => {
    const { entries: mockEntries } = args;
    window.__kbbPopupMessages = [];
    window.chrome = {
      runtime: {
        onMessage: { addListener() {} },
        sendMessage: (message, callback) => {
          window.__kbbPopupMessages.push(message);
          let response = { ok: true, response: {} };
          if (message.type === 'KBB_QUERY_LOGINS') {
            response = { ok: true, response: { url: 'https://example.com', entries: mockEntries } };
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
  }, { entries });
}

const SAMPLE_ENTRIES = [
  { Uuid: '1', Title: 'GitHub', UserName: 'octocat', Password: 'hunter2', Url: 'https://github.com' },
  { Uuid: '2', Title: 'GitLab', UserName: 'root', Password: 't0ps3cr3t', Url: 'https://gitlab.com' },
];

test.describe('Popup copy actions', () => {
  test.beforeEach(async ({ page }) => {
    await mockPopup(page, { entries: SAMPLE_ENTRIES });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.credential-card', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
  });

  test('copy username button appears in expanded card', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const copyBtn = card.locator('button[aria-label*="Copy"]').first();
    await expect(copyBtn).toBeVisible();
  });

  test('copy password button appears in expanded card', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const copyPasswordBtn = card.locator('button[aria-label="Copy password"]');
    await expect(copyPasswordBtn).toBeVisible();
  });

  test('fill form button is visible in expanded card', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    const fillButton = card.locator('button:has-text("Fill form")');
    await expect(fillButton).toBeVisible();
  });

  test('expanded card shows username field', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(200);
    const subtitle = card.locator('.credential-card__subtitle');
    await expect(subtitle).toContainText('octocat');
  });

  test('expanded card shows title', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(200);
    const title = card.locator('.credential-card__title');
    await expect(title).toContainText('GitHub');
  });

  test('clicking chevron toggles card expansion', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await expect(card).toHaveAttribute('aria-expanded', 'false');
    await card.locator('.credential-card__chevron').click();
    await expect(card).toHaveAttribute('aria-expanded', 'true');
    await card.locator('.credential-card__chevron').click();
    await expect(card).toHaveAttribute('aria-expanded', 'false');
  });

  test('copy username button is clickable', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const copyBtn = card.locator('button[aria-label="Copy username"]');
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).toBeEnabled();
  });

  test('Fill form button is enabled in expanded card', async ({ page }) => {
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    const fillButton = card.locator('button:has-text("Fill form")');
    await expect(fillButton).toBeVisible();
    await expect(fillButton).toBeEnabled();
  });

  test('second credential card renders correctly', async ({ page }) => {
    const cards = page.locator('.credential-card');
    await expect(cards).toHaveCount(2);
    const secondCard = cards.nth(1);
    await secondCard.click();
    await page.waitForTimeout(200);
    const subtitle = secondCard.locator('.credential-card__subtitle');
    await expect(subtitle).toContainText('root');
  });

  test('expand one card, then expand another collapses first', async ({ page }) => {
    const cards = page.locator('.credential-card');
    await cards.nth(0).click();
    await page.waitForTimeout(200);
    await expect(cards.nth(0)).toHaveAttribute('aria-expanded', 'true');
    await cards.nth(1).click();
    await page.waitForTimeout(200);
    await expect(cards.nth(0)).toHaveAttribute('aria-expanded', 'false');
    await expect(cards.nth(1)).toHaveAttribute('aria-expanded', 'true');
  });
});
