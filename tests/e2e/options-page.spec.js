import { test, expect } from '@playwright/test';

async function installOptionsStorage(page, initial = {}) {
  await page.addInitScript((initialSettings) => {
    const store = { ...initialSettings };
    const bridgeHelloFails = Boolean(store.__bridgeHelloFails);
    const passkeysEnabled = Boolean(store.__passkeysEnabled);
    delete store.__bridgeHelloFails;
    delete store.__passkeysEnabled;
    const messages = [];
    const trustedClients = [
      {
        ClientId: 'client-current',
        ClientName: 'Chrome',
        ExtensionOrigin: 'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        Current: true,
        Permissions: ['read', 'write', 'manageClients'],
        CreatedUtcMs: 1779989000000,
        LastUsedUtcMs: 1779991000000
      },
      {
        ClientId: 'client-old',
        ClientName: 'Old Browser',
        ExtensionOrigin: 'chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        Current: false,
        Permissions: ['read'],
        CreatedUtcMs: 1779900000000,
        LastUsedUtcMs: 1779901000000
      }
    ];
    window.__kbbOptionsStore = store;
    window.__kbbOptionsMessages = messages;
    window.__kbbOptionsTrustedClients = trustedClients;
    window.__kbbOptionsPasskeysEnabled = passkeysEnabled;
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

          if (message.type === 'KBB_UPDATE_CLIENT_PERMISSIONS') {
            const client = trustedClients.find((candidate) => candidate.ClientId === message.clientId);
            if (client) {
              client.Permissions = message.permissions.slice();
            }
            return Promise.resolve({
              ok: true,
              response: {
                Updated: Boolean(client),
                ClientId: message.clientId,
                Permissions: client ? client.Permissions.slice() : []
              }
            });
          }

          if (message.type === 'KBB_GET_ABOUT') {
            return Promise.resolve({
              ok: true,
              response: {
                name: 'KeePass Browser Bridge',
                version: '0.9.0',
                pluginVersion: '0.9.0',
                browserId: 'abcdefghijklmnopabcdefghijklmnop',
                repositoryUrl: 'https://github.com/hieuck/KeePassBrowserBridge',
                releasesUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases',
                pluginPasskeysEnabled: window.__kbbOptionsPasskeysEnabled === true
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
      autoLockTimeoutMinutes: 0,
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
    await page.locator('#autoLockTimeoutMinutes').fill('15');
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
      autoLockTimeoutMinutes: 15,
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

  test('rejects invalid security timeout settings', async ({ page }) => {
    await installOptionsStorage(page, {
      autoLockTimeoutMinutes: 5,
      clipboardClearDelay: 30
    });

    await page.goto('/extension/options.html');
    await page.locator('#autoLockTimeoutMinutes').fill('-1');
    await page.locator('#saveSettings').click();

    await expect(page.locator('#message')).toHaveText('Auto-lock timeout must be between 0 and 1440 minutes.');
    await expect(page.locator('#message')).toHaveClass(/error/);

    await page.locator('#autoLockTimeoutMinutes').fill('15');
    await page.locator('#clipboardClearDelay').fill('301');
    await page.locator('#saveSettings').click();

    await expect(page.locator('#message')).toHaveText('Clipboard clear delay must be between 0 and 300 seconds.');
    const stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored.autoLockTimeoutMinutes).toBe(5);
    expect(stored.clipboardClearDelay).toBe(30);
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
    await expect(page.locator('#aboutPluginVersion')).toHaveText('0.9.0');
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
    await expect(page.locator('#trustedBrowserList')).toContainText('Read, Write, Manage browsers');
    await expect(page.locator('#trustedBrowserList')).toContainText('Old Browser');
    await expect(page.locator('.trusted-browser-row', { hasText: 'Old Browser' })).toContainText('Read');
    await expect(page.locator('.trusted-browser-row', { hasText: 'Old Browser' })).toContainText('chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    await expect(page.locator('.trusted-browser-row', { hasText: 'Old Browser' })).toContainText('Last used:');
    await expect(page.locator('#message')).toHaveText('2 trusted browser(s).');

    const revokeOldBrowser = page.locator('[data-client-id="client-old"] [data-action="revoke-client"]');
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Revoke browser "Old Browser"?');
      await dialog.dismiss();
    });
    await revokeOldBrowser.click();

    await expect(page.locator('#trustedBrowserList')).toContainText('Old Browser');
    await expect(page.locator('#message')).toHaveText('Revoke cancelled.');
    await expect.poll(() => page.evaluate(() =>
      window.__kbbOptionsMessages.filter((message) => message.type === 'KBB_REVOKE_CLIENT')
    )).toEqual([]);

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Revoke browser "Old Browser"?');
      await dialog.accept();
    });
    await revokeOldBrowser.click();

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

  test('updates trusted browser permissions from settings', async ({ page }) => {
    await installOptionsStorage(page);

    await page.goto('/extension/options.html');
    await page.locator('#refreshTrustedBrowsers').click();
    const oldBrowser = page.locator('.trusted-browser-row', { hasText: 'Old Browser' });
    await expect(oldBrowser).toContainText('Read');
    await expect(oldBrowser.locator('[data-permission="read"]')).toBeChecked();
    await expect(oldBrowser.locator('[data-permission="read"]')).toBeDisabled();
    await expect(oldBrowser.locator('[data-permission="write"]')).not.toBeChecked();

    await oldBrowser.locator('[data-permission="write"]').check();

    await expect(page.locator('#message')).toHaveText('Browser permissions updated.');
    await expect(oldBrowser).toContainText('Read, Write');
    const messages = await page.evaluate(() => window.__kbbOptionsMessages);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
          clientId: 'client-old',
          permissions: ['read', 'write']
        })
      ])
    );
  });

  test('gates passkey permission controls in settings on bridge feature discovery', async ({ page }) => {
    await installOptionsStorage(page);

    await page.goto('/extension/options.html');
    await page.locator('#refreshTrustedBrowsers').click();
    await expect(page.locator('[data-permission="passkeyRead"]')).toHaveCount(0);
    await expect(page.locator('[data-permission="passkeyWrite"]')).toHaveCount(0);

    await page.evaluate(() => {
      window.__kbbOptionsPasskeysEnabled = true;
    });
    await page.locator('#refreshTrustedBrowsers').click();

    const oldBrowser = page.locator('.trusted-browser-row', { hasText: 'Old Browser' });
    await expect(oldBrowser.locator('[data-permission="passkeyRead"]')).toBeVisible();
    await expect(oldBrowser.locator('[data-permission="passkeyWrite"]')).toBeVisible();
    await expect(oldBrowser.locator('[data-permission="passkeyRead"]')).not.toBeChecked();

    await oldBrowser.locator('[data-permission="passkeyWrite"]').check();

    await expect(page.locator('#message')).toHaveText('Browser permissions updated.');
    await expect(oldBrowser).toContainText('Read, Passkey write');
    const messages = await page.evaluate(() => window.__kbbOptionsMessages);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
          clientId: 'client-old',
          permissions: ['read', 'passkeyWrite']
        })
      ])
    );
  });

  test('explains when the current browser is revoked from settings', async ({ page }) => {
    await installOptionsStorage(page);

    await page.goto('/extension/options.html');
    await page.locator('#refreshTrustedBrowsers').click();

    const revokeCurrentBrowser = page.locator('[data-client-id="client-current"] [data-action="revoke-client"]');
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Revoke browser "Chrome"?');
      await dialog.accept();
    });
    await revokeCurrentBrowser.click();

    await expect(page.locator('#trustedBrowserList')).not.toContainText('Chrome');
    await expect(page.locator('#message')).toHaveText('This browser was revoked. Pair again to use KeePass.');
    const messages = await page.evaluate(() => window.__kbbOptionsMessages);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'KBB_REVOKE_CLIENT', clientId: 'client-current' })
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
      pairingStartedAt: 1779989000000,
      locked: true,
      lastCredentialActivityAt: 1779989200000
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
    expect(exported).not.toHaveProperty('locked');
    expect(exported).not.toHaveProperty('lastCredentialActivityAt');
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
        pairingStartedAt: 1779989000000,
        locked: true,
        lastCredentialActivityAt: 1779989200000
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
    expect(stored).not.toHaveProperty('locked');
    expect(stored).not.toHaveProperty('lastCredentialActivityAt');
  });

  test('rejects imported settings with a non-loopback endpoint', async ({ page }) => {
    await installOptionsStorage(page, {
      endpoint: 'http://127.0.0.1:19455/bridge',
      autoFillEnabled: true
    });

    await page.goto('/extension/options.html');
    await page.locator('#importFile').setInputFiles({
      name: 'kbb-settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        endpoint: 'https://evil.example/bridge',
        autoFillEnabled: false
      }))
    });

    await expect(page.locator('#message')).toHaveText('Failed to import settings: Bridge endpoint must be an http://127.0.0.1 URL.');
    await expect(page.locator('#message')).toHaveClass(/error/);
    const stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored.endpoint).toBe('http://127.0.0.1:19455/bridge');
    expect(stored.autoFillEnabled).toBe(true);
  });

  test('rejects imported settings with invalid security timeouts', async ({ page }) => {
    await installOptionsStorage(page, {
      autoLockTimeoutMinutes: 5,
      clipboardClearDelay: 30
    });

    await page.goto('/extension/options.html');
    await page.locator('#importFile').setInputFiles({
      name: 'kbb-settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        autoLockTimeoutMinutes: 1441,
        clipboardClearDelay: 30
      }))
    });

    await expect(page.locator('#message')).toHaveText('Failed to import settings: Auto-lock timeout must be between 0 and 1440 minutes.');
    await expect(page.locator('#message')).toHaveClass(/error/);

    await page.locator('#importFile').setInputFiles({
      name: 'kbb-settings.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({
        autoLockTimeoutMinutes: 15,
        clipboardClearDelay: -1
      }))
    });

    await expect(page.locator('#message')).toHaveText('Failed to import settings: Clipboard clear delay must be between 0 and 300 seconds.');
    const stored = await page.evaluate(() => window.__kbbOptionsStore);
    expect(stored.autoLockTimeoutMinutes).toBe(5);
    expect(stored.clipboardClearDelay).toBe(30);
  });
});
