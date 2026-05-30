import { test, expect } from '@playwright/test';

async function installOptionsStorage(page, initial = {}) {
  await page.addInitScript((initialSettings) => {
    const store = { ...initialSettings };
    const bridgeHelloFails = Boolean(store.__bridgeHelloFails);
    delete store.__bridgeHelloFails;
    const messages = [];
    const trustedClients = [
      {
        ClientId: 'client-current',
        ClientName: 'Chrome',
        Current: true,
        CreatedUtcMs: 1779989000000
      },
      {
        ClientId: 'client-old',
        ClientName: 'Old Browser',
        Current: false,
        CreatedUtcMs: 1779900000000
      }
    ];
    window.__kbbOptionsStore = store;
    window.__kbbOptionsMessages = messages;
    window.__kbbOptionsTrustedClients = trustedClients;
    window.chrome = {
      runtime: {
        sendMessage(message) {
          messages.push(message);
          if (message.type === 'KBB_HELLO') {
            if (bridgeHelloFails) {
              return Promise.resolve({
                ok: false,
                error: 'Failed to fetch'
              });
            }

            return Promise.resolve({
              ok: true,
              response: {
                ProtocolVersion: 1,
                Success: true
              }
            });
          }

          if (message.type === 'KBB_LIST_CLIENTS') {
            return Promise.resolve({
              ok: true,
              response: { Clients: trustedClients.slice() }
            });
          }

          if (message.type === 'KBB_REVOKE_CLIENT') {
            const index = trustedClients.findIndex((client) => client.ClientId === message.clientId);
            if (index >= 0) {
              trustedClients.splice(index, 1);
            }
            return Promise.resolve({
              ok: true,
              response: { Revoked: index >= 0 }
            });
          }

          if (message.type === 'KBB_GET_ABOUT') {
            return Promise.resolve({
              ok: true,
              response: {
                name: 'KeePass Browser Bridge',
                version: '0.9.0',
                browserId: 'abcdefghijklmnopabcdefghijklmnop',
                repositoryUrl: 'https://github.com/hieuck/KeePassBrowserBridge',
                releasesUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases'
              }
            });
          }

          if (message.type === 'KBB_CHECK_UPDATES') {
            return Promise.resolve({
              ok: true,
              response: {
                currentVersion: '0.9.0',
                latestVersion: '0.10.0',
                updateAvailable: true,
                releaseUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases/tag/v0.10.0'
              }
            });
          }

          return Promise.resolve({ ok: false, error: 'Unknown message type.' });
        }
      },
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
      notificationsEnabled: true,
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
    await page.locator('#notificationsEnabled').uncheck();
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
      notificationsEnabled: false,
      clipboardClearDelay: 45,
      debugMode: true
    });
  });

  test('checks bridge connectivity from settings', async ({ page }) => {
    await installOptionsStorage(page);

    await page.goto('/extension/options.html');
    await expect(page.locator('#bridgeStatus')).toHaveText('Not checked');
    await page.locator('#checkBridgeStatus').click();

    await expect(page.locator('#bridgeStatus')).toHaveText('Reachable');
    await expect(page.locator('#bridgeStatus')).toHaveClass(/success/);
    await expect(page.locator('#message')).toHaveText('KeePass bridge is reachable.');
    const messages = await page.evaluate(() => window.__kbbOptionsMessages.map((message) => message.type));
    expect(messages).toContain('KBB_HELLO');
  });

  test('reports unavailable bridge from settings', async ({ page }) => {
    await installOptionsStorage(page, {
      __bridgeHelloFails: true
    });

    await page.goto('/extension/options.html');
    await page.locator('#checkBridgeStatus').click();

    await expect(page.locator('#bridgeStatus')).toHaveText('Unavailable');
    await expect(page.locator('#bridgeStatus')).toHaveClass(/error/);
    await expect(page.locator('#message')).toHaveText('KeePass bridge is unavailable: Failed to fetch');
  });

  test('rejects non-loopback bridge endpoint in settings', async ({ page }) => {
    await installOptionsStorage(page, {
      endpoint: 'http://127.0.0.1:19455/bridge'
    });

    await page.goto('/extension/options.html');
    await page.locator('#bridgeEndpoint').fill('https://evil.example/bridge');
    await page.locator('#saveSettings').click();

    await expect(page.locator('#message')).toHaveText('Bridge endpoint must be an http://127.0.0.1 URL.');
    await expect(page.locator('#message')).toHaveClass(/error/);
    const stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored.endpoint).toBe('http://127.0.0.1:19455/bridge');
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
      notificationsEnabled: false,
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
      notificationsEnabled: true,
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

  test('shows about information and checks GitHub releases for updates', async ({ page }) => {
    await installOptionsStorage(page);

    await page.goto('/extension/options.html');

    await expect(page.locator('#aboutVersion')).toHaveText('0.9.0');
    await expect(page.locator('#aboutBrowserId')).toHaveText('abcdefghijklmnopabcdefghijklmnop');
    await expect(page.locator('#repositoryLink')).toHaveAttribute('href', 'https://github.com/hieuck/KeePassBrowserBridge');
    await expect(page.locator('#releasesLink')).toHaveAttribute('href', 'https://github.com/hieuck/KeePassBrowserBridge/releases');

    await page.locator('#checkUpdates').click();

    await expect(page.locator('#message')).toHaveText('Update 0.10.0 is available. Open GitHub Releases to install it.');
    await expect(page.locator('#releasesLink')).toHaveAttribute('href', 'https://github.com/hieuck/KeePassBrowserBridge/releases/tag/v0.10.0');
    const messages = await page.evaluate(() => window.__kbbOptionsMessages.map((message) => message.type));
    expect(messages).toContain('KBB_GET_ABOUT');
    expect(messages).toContain('KBB_CHECK_UPDATES');
  });

  test('lists and revokes trusted browsers from settings', async ({ page }) => {
    await installOptionsStorage(page);

    await page.goto('/extension/options.html');
    await page.locator('#refreshTrustedBrowsers').click();

    await expect(page.locator('#trustedBrowserList')).toContainText('Chrome');
    await expect(page.locator('#trustedBrowserList')).toContainText('This browser');
    await expect(page.locator('#trustedBrowserList')).toContainText('Old Browser');
    await expect(page.locator('#message')).toHaveText('2 trusted browser(s).');

    await page.locator('[data-client-id="client-old"] [data-action="revoke-client"]').click();

    await expect(page.locator('#trustedBrowserList')).not.toContainText('Old Browser');
    await expect(page.locator('#message')).toHaveText('Browser revoked.');
    const messages = await page.evaluate(() => window.__kbbOptionsMessages);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'KBB_LIST_CLIENTS' }),
        expect.objectContaining({ type: 'KBB_REVOKE_CLIENT', clientId: 'client-old' })
      ])
    );
  });

  test('exports settings without pairing secrets', async ({ page }) => {
    await installOptionsStorage(page, {
      endpoint: 'http://127.0.0.1:19455/bridge',
      autoFillEnabled: true,
      clientId: 'client-secret-id',
      sharedSecret: 'super-secret-hmac-key',
      pairingSessionId: 'pairing-session',
      pairingStartedAt: 1779989000000
    });
    await page.addInitScript(() => {
      window.__kbbExportedSettingsText = '';
      window.__kbbDownloadHref = '';
      URL.createObjectURL = (blob) => {
        blob.text().then((text) => {
          window.__kbbExportedSettingsText = text;
        });
        return 'blob:kbb-settings';
      };
      URL.revokeObjectURL = () => {};
      HTMLAnchorElement.prototype.click = function () {
        window.__kbbDownloadHref = this.href;
      };
    });

    await page.goto('/extension/options.html');
    await page.locator('#exportSettings').click();
    await expect(page.locator('#message')).toHaveText('Settings exported successfully!');
    await expect.poll(() => page.evaluate(() => window.__kbbExportedSettingsText)).not.toBe('');

    const exported = JSON.parse(await page.evaluate(() => window.__kbbExportedSettingsText));
    expect(exported.endpoint).toBe('http://127.0.0.1:19455/bridge');
    expect(exported.autoFillEnabled).toBe(true);
    expect(exported).not.toHaveProperty('clientId');
    expect(exported).not.toHaveProperty('sharedSecret');
    expect(exported).not.toHaveProperty('pairingSessionId');
    expect(exported).not.toHaveProperty('pairingStartedAt');
  });

  test('imports settings without accepting pairing secrets', async ({ page }) => {
    await installOptionsStorage(page);

    await page.goto('/extension/options.html');
    await page.locator('#importFile').setInputFiles({
      name: 'kbb-settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        endpoint: 'http://127.0.0.1:19456/bridge',
        autoFillEnabled: false,
        clientId: 'imported-client-id',
        sharedSecret: 'imported-shared-secret',
        pairingSessionId: 'imported-pairing-session',
        pairingStartedAt: 1779989000000
      }))
    });

    await expect(page.locator('#message')).toHaveText('Settings imported successfully!');
    const stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored.endpoint).toBe('http://127.0.0.1:19456/bridge');
    expect(stored.autoFillEnabled).toBe(false);
    expect(stored).not.toHaveProperty('clientId');
    expect(stored).not.toHaveProperty('sharedSecret');
    expect(stored).not.toHaveProperty('pairingSessionId');
    expect(stored).not.toHaveProperty('pairingStartedAt');
  });
});
