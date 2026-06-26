import { test, expect } from '@playwright/test';

const SURFACES = {
  popup: '/extension/popup.html',
  options: '/extension/options.html',
  'inline-picker': '/tests/fixtures/picker-host.html',
  'save-prompt': '/tests/fixtures/prompt-host.html',
  'update-prompt': '/tests/fixtures/prompt-host.html',
};

const THEMES = ['light', 'dark'];

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

function createCredentials(count) {
  const sites = ['GitHub', 'GitLab', 'AWS Console', 'Dropbox', 'Google', 'Facebook', 'Twitter', 'Slack', 'Trello', 'Notion'];
  return sites.slice(0, count).map((title, i) => ({
    Uuid: `uuid-${i}`,
    Title: title,
    UserName: `${title.toLowerCase()}@example.com`,
    Password: 'secret-' + Math.random().toString(36).slice(2, 8),
    Url: `https://${title.toLowerCase()}.com`,
    Group: i < 3 ? 'Work' : 'Personal',
    UsageCount: Math.max(0, 5 - i),
    LastUsed: Date.now() - i * 86400000,
  }));
}

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
    await mockPopup(page, { entries: createCredentials(5) });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
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
    await mockPopup(page, { entries: createCredentials(5) });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('popup-dark-mode.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - empty state with no credentials', async ({ page }) => {
    await mockPopup(page, { entries: [] });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('popup-empty-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - empty state dark mode', async ({ page }) => {
    await mockPopup(page, { entries: [] });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('popup-empty-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - locked state', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3), locked: true });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('popup-locked-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - locked state dark mode', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3), locked: true });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('popup-locked-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - expanded card', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3) });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.credential-card', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('popup-expanded-card-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - expanded card dark mode', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3) });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.credential-card', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('popup-expanded-card-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - edit form', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3) });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.credential-card', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(200);
    const editBtn = card.locator('button:has-text("Edit")');
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot('popup-edit-form-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - edit form dark mode', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3) });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.credential-card', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const card = page.locator('.credential-card').first();
    await card.click();
    await page.waitForTimeout(200);
    const editBtn = card.locator('button:has-text("Edit")');
    if (await editBtn.count() > 0) {
      await editBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot('popup-edit-form-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - new login form', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3) });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const newBtn = page.locator('button:has-text("New login"), button[aria-label="New login"]').first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot('popup-new-login-form-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - new login form dark mode', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(3) });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const newBtn = page.locator('button:has-text("New login"), button[aria-label="New login"]').first();
    if (await newBtn.count() > 0) {
      await newBtn.click();
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot('popup-new-login-form-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - search filter active with no results', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(5) });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('nonexistententry');
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot('popup-search-no-results-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - search filter active dark mode', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(5) });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    const searchInput = page.locator('input[type="text"], input[type="search"]').first();
    if (await searchInput.count() > 0) {
      await searchInput.fill('nonexistententry');
      await page.waitForTimeout(300);
    }
    await expect(page).toHaveScreenshot('popup-search-no-results-dark.png', {
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
      await page.locator('.ant-menu-item', { hasText: tabName }).click();
      await page.waitForTimeout(300);
      const slug = tabName.toLowerCase().replace(/[^a-z]/g, '');
      await expect(page).toHaveScreenshot(`options-tab-${slug}.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('options - all tabs - dark mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/options.html');
    await page.waitForSelector('.options-page', { timeout: 5000 });
    const tabs = ['General', 'Bridge', 'Auto-fill', 'Sites', 'Clients', 'Passkeys', 'About'];
    for (const tabName of tabs) {
      await page.locator('.ant-menu-item', { hasText: tabName }).click();
      await page.waitForTimeout(300);
      const slug = tabName.toLowerCase().replace(/[^a-z]/g, '');
      await expect(page).toHaveScreenshot(`options-tab-${slug}-dark.png`, {
        fullPage: true,
        animations: 'disabled',
      });
    }
  });

  test('inline-picker - expanded entry', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/tests/fixtures/picker-host.html');
    await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [
        { name: 'GitHub', username: 'octocat', url: 'https://github.com' },
        { name: 'GitLab', username: 'root', url: 'https://gitlab.com' },
      ];
      document.body.appendChild(picker);
      picker.style.top = '40px';
      picker.style.left = '40px';
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const picker = document.querySelector('kbb-picker');
      if (picker) picker._expandedIndex = 0;
      if (picker) picker._render();
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('inline-picker-expanded-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('inline-picker - custom fields', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/tests/fixtures/picker-host.html');
    await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [
        { name: 'GitHub', username: 'octocat', url: 'https://github.com', customFields: [
          { Name: 'API Token', Value: 'ghp_xxxx', IsProtected: false },
          { Name: 'Team', Value: 'core', IsProtected: false },
        ]},
        { name: 'GitLab', username: 'root', url: 'https://gitlab.com' },
      ];
      document.body.appendChild(picker);
      picker.style.top = '40px';
      picker.style.left = '40px';
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const picker = document.querySelector('kbb-picker');
      if (picker) picker._expandedIndex = 0;
      if (picker) picker._render();
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('inline-picker-custom-fields-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('inline-picker - search active', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/tests/fixtures/picker-host.html');
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
    await page.evaluate(() => {
      const input = document.querySelector('kbb-picker').shadowRoot.querySelector('.picker-search-input');
      if (input) {
        input.value = 'git';
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('inline-picker-search-active-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('inline-picker - dark mode with custom fields', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/tests/fixtures/picker-host.html');
    await page.evaluate(() => {
      const picker = document.createElement('kbb-picker');
      picker.credentials = [
        { name: 'GitHub', username: 'octocat', url: 'https://github.com', customFields: [{ Name: 'Team', Value: 'core', IsProtected: false }] },
        { name: 'GitLab', username: 'root', url: 'https://gitlab.com' },
      ];
      document.body.appendChild(picker);
      picker.style.top = '40px';
      picker.style.left = '40px';
    });
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      const picker = document.querySelector('kbb-picker');
      if (picker) picker._expandedIndex = 0;
      if (picker) picker._render();
    });
    await page.waitForTimeout(300);
    await expect(page).toHaveScreenshot('inline-picker-dark-custom.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('save-prompt - editable fields expanded', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/tests/fixtures/prompt-host.html');
    await page.evaluate(() => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'GitHub');
      p.setAttribute('url', 'https://github.com');
      p.setAttribute('username', 'octocat');
      p.setAttribute('password', 'secret123');
      p.setAttribute('title', 'My GitHub');
      p.setAttribute('folder', 'Work');
      document.body.appendChild(p);
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('save-prompt-editable-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('save-prompt - dark mode expanded fields', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/tests/fixtures/prompt-host.html');
    await page.evaluate(() => {
      const p = document.createElement('kbb-save-prompt');
      p.setAttribute('name', 'GitHub');
      p.setAttribute('url', 'https://github.com/login');
      p.setAttribute('username', 'octocat');
      p.setAttribute('password', 'secret123');
      p.setAttribute('title', 'My GitHub');
      p.setAttribute('folder', 'Work');
      document.body.appendChild(p);
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('save-prompt-dark-expanded.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('update-prompt - dark mode with diff', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/tests/fixtures/prompt-host.html');
    await page.evaluate(() => {
      const p = document.createElement('kbb-update-prompt');
      p.setAttribute('name', 'GitHub');
      p.setAttribute('old-username', 'old_user');
      p.setAttribute('username', 'new_user');
      p.setAttribute('password', 'newpass456');
      document.body.appendChild(p);
    });
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('update-prompt-dark-diff.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - scroll with many entries', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(10) });
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('popup-scroll-many-light.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

  test('popup - scroll with many entries dark mode', async ({ page }) => {
    await mockPopup(page, { entries: createCredentials(10) });
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');
    await page.waitForSelector('.popup, [class*="popup"]', { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(800);
    await expect(page).toHaveScreenshot('popup-scroll-many-dark.png', {
      fullPage: true,
      animations: 'disabled',
    });
  });

});
