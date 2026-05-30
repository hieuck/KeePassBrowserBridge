import { test, expect } from '@playwright/test';

async function installOptionsStorage(page, initial = {}) {
  await page.addInitScript((initialSettings) => {
    const store = { ...initialSettings };
    window.__kbbOptionsStore = store;
    window.chrome = {
      storage: {
        local: {
          get(keys, callback) {
            let result = {};
            if (keys === null) {
              result = { ...store };
            } else if (Array.isArray(keys)) {
              result = Object.fromEntries(keys.map((key) => [key, store[key]]));
            } else if (typeof keys === 'object') {
              result = { ...keys, ...store };
            } else if (typeof keys === 'string') {
              result = { [keys]: store[keys] };
            }
            if (callback) callback(result);
            return Promise.resolve(result);
          },
          set(values, callback) {
            Object.assign(store, values);
            if (callback) callback();
            return Promise.resolve();
          }
        }
      }
    };
  }, initial);
}

test.describe('options page settings', () => {
  test('loads existing settings and saves edited settings', async ({ page }) => {
    await installOptionsStorage(page, {
      endpoint: 'http://127.0.0.1:19455/bridge',
      theme: 'light',
      autoFillEnabled: true,
      autoSubmitEnabled: false,
      autoFillDelay: 1200,
      strictUrlMatching: false,
      regexUrlMatching: false,
      showPasswordsInPopup: false,
      clipboardClearDelay: 30,
      debugMode: false
    });

    await page.goto('/extension/options.html');

    await expect(page).toHaveTitle('KeePass Browser Bridge - Settings');
    await expect(page.locator('#bridgeEndpoint')).toHaveValue('http://127.0.0.1:19455/bridge');
    await expect(page.locator('#autoFillEnabled')).toBeChecked();

    await page.locator('#bridgeEndpoint').fill('http://127.0.0.1:19456/bridge');
    await page.locator('#theme').selectOption('dark');
    await page.locator('#autoFillEnabled').uncheck();
    await page.locator('#autoSubmitEnabled').check();
    await page.locator('#autoFillDelay').fill('800');
    await page.locator('#strictUrlMatching').check();
    await page.locator('#regexUrlMatching').check();
    await page.locator('#showPasswordsInPopup').check();
    await page.locator('#clipboardClearDelay').fill('45');
    await page.locator('#debugMode').check();
    await page.locator('#saveSettings').click();

    await expect(page.locator('#message')).toHaveText('Settings saved successfully!');
    const stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored).toMatchObject({
      endpoint: 'http://127.0.0.1:19456/bridge',
      theme: 'dark',
      autoFillEnabled: false,
      autoSubmitEnabled: true,
      autoFillDelay: 800,
      strictUrlMatching: true,
      regexUrlMatching: true,
      showPasswordsInPopup: true,
      clipboardClearDelay: 45,
      debugMode: true
    });
  });

  test('resets settings to defaults after confirmation', async ({ page }) => {
    await installOptionsStorage(page, {
      endpoint: 'http://127.0.0.1:19456/bridge',
      theme: 'dark',
      autoFillEnabled: false,
      autoSubmitEnabled: true,
      autoFillDelay: 800,
      strictUrlMatching: true,
      regexUrlMatching: true,
      showPasswordsInPopup: true,
      clipboardClearDelay: 45,
      debugMode: true
    });

    await page.goto('/extension/options.html');
    page.once('dialog', (dialog) => dialog.accept());
    await page.locator('#resetSettings').click();

    await expect(page.locator('#message')).toHaveText('Settings reset to defaults!');
    const stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored).toMatchObject({
      theme: 'system',
      autoFillEnabled: true,
      autoSubmitEnabled: false,
      autoFillDelay: 1200,
      strictUrlMatching: false,
      regexUrlMatching: false,
      showPasswordsInPopup: false,
      clipboardClearDelay: 30,
      debugMode: false
    });
  });

  test('manages site-specific auto-fill overrides', async ({ page }) => {
    await installOptionsStorage(page, {
      siteOverrides: [
        { host: 'old.example.com', autoFillEnabled: false, autoSubmitEnabled: false }
      ]
    });

    await page.goto('/extension/options.html');

    await expect(page.locator('#siteOverrideList')).toContainText('old.example.com');
    await page.locator('#siteOverrideHost').fill('Example.COM');
    await page.locator('#siteOverrideAutoFill').uncheck();
    await page.locator('#siteOverrideAutoSubmit').check();
    await page.locator('#addSiteOverride').click();

    await expect(page.locator('#siteOverrideList')).toContainText('example.com');
    await page.locator('#saveSettings').click();

    let stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored.siteOverrides).toEqual([
      { host: 'old.example.com', autoFillEnabled: false, autoSubmitEnabled: false },
      { host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: true }
    ]);

    await page.locator('[data-host="old.example.com"] [data-action="remove-site-override"]').click();
    await expect(page.locator('#siteOverrideList')).not.toContainText('old.example.com');
    await page.locator('#saveSettings').click();

    stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored.siteOverrides).toEqual([
      { host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: true }
    ]);
  });
});
