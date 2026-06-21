import { test, expect } from '@playwright/test';

test.describe('KeePassBrowserBridge Extension', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const state = {
        endpoint: 'http://127.0.0.1:19455/bridge',
        paired: true,
        pairingSessionId: '',
        pairingExpiresAt: 0,
        autoFillEnabled: false,
        autoSubmitEnabled: false,
        locked: false
      };
      window.__kbbPopupMessages = [];
      window.__kbbPopupState = state;
      window.__kbbPopupStorage = {};
      window.__kbbPopupAbout = {
        name: 'KeePass Browser Bridge',
        version: '0.9.0',
        pluginVersion: '0.9.0',
        browserId: 'abcdefghijklmnopabcdefghijklmnop',
        repositoryUrl: 'https://github.com/hieuck/KeePassBrowserBridge',
        releasesUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases',
        pluginPasskeysEnabled: false
      };
      window.__kbbPopupTrustedClients = [
        {
          ClientId: 'client-current',
          ClientName: 'This Chrome',
          ExtensionOrigin: 'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          Current: true,
          Permissions: ['read', 'write', 'manageClients'],
          CreatedUtcMs: 1779990000000,
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
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          readText: async () => 'KeePass pairing code 955-963'
        }
      });
      window.__kbbPopupEntries = [
        {
          EntryId: 'entry-1',
          Title: 'Example',
          UserName: 'alice@example.com',
          Password: 'secret-password',
          OneTimePassword: '123456',
          Url: 'https://example.com/login',
          Group: 'Accounts/Work',
          UsageCount: 10,
          LastUsed: Date.now() - 3600000,
          CustomFields: [
            { Name: 'Tenant', Value: 'staging', IsProtected: false },
            { Name: 'Environment', Value: 'dev', IsProtected: false }
          ]
        }
      ];
      window.chrome = {
        runtime: {
          sendMessage: async (message) => {
            window.__kbbPopupMessages.push(message);
            if (message && message.type === 'KBB_GET_STATE') {
              return { ok: true, response: { ...state } };
            }
            if (message && message.type === 'KBB_HELLO') {
              return { ok: true, response: { Success: true } };
            }
            if (message && message.type === 'KBB_GET_ABOUT') {
              return { ok: true, response: { ...window.__kbbPopupAbout } };
            }
            if (message && message.type === 'KBB_STATUS') {
              return {
                ok: true,
                response: {
                  Trusted: true,
                  Permissions: window.__kbbPopupStatusPermissions || ['read', 'write', 'manageClients']
                }
              };
            }
            if (message && message.type === 'KBB_PAIR_BEGIN') {
              state.paired = false;
              state.pairingSessionId = 'session-1';
              state.pairingExpiresAt = Date.now() + (window.__kbbPairingDurationMs || 300000);
              return { ok: true, response: { ...state } };
            }
            if (message && message.type === 'KBB_PAIR_CANCEL') {
              state.pairingSessionId = '';
              state.pairingExpiresAt = 0;
              return { ok: true, response: { ...state } };
            }
            if (message && message.type === 'KBB_PAIR_COMPLETE') {
              state.paired = true;
              state.pairingSessionId = '';
              state.pairingExpiresAt = 0;
              return { ok: true, response: { ...state } };
            }
            if (message && message.type === 'KBB_SET_LOCKED') {
              state.locked = message.locked;
              return { ok: true, response: { ...state } };
            }
            if (message && message.type === 'KBB_QUERY_LOGINS') {
              if (state.locked) {
                return { ok: false, error: 'KeePass Bridge is locked.' };
              }
              return {
                ok: true,
                response: {
                  url: 'https://example.com/login',
                  entries: window.__kbbPopupEntries
                }
              };
            }
            if (message && message.type === 'KBB_FILL_LOGIN') {
              return { ok: true, response: { filled: true } };
            }
            if (message && message.type === 'KBB_COLLECT_PAGE_CREDENTIAL') {
              return {
                ok: true,
                response: {
                  collected: true,
                  credential: {
                    userName: 'typed@example.com',
                    password: 'typed-secret'
                  }
                }
              };
            }
            if (message && message.type === 'KBB_UPDATE_LOGIN') {
              return {
                ok: true,
                response: {
                  Success: true,
                  Entry: {
                    EntryId: message.login.entryId,
                    Title: message.login.title,
                    UserName: message.login.userName,
                    Url: message.login.url,
                    Password: message.login.password,
                    CustomFields: message.login.customFields || []
                  }
                }
              };
            }
            if (message && message.type === 'KBB_CREATE_LOGIN') {
              return {
                ok: true,
                response: {
                  Success: true,
                  Entry: {
                    EntryId: 'entry-created',
                    Title: message.login.title,
                    UserName: message.login.userName,
                    Url: message.login.url,
                    Password: message.login.password
                  }
                }
              };
            }
            if (message && message.type === 'KBB_COPY_TO_CLIPBOARD') {
              return { ok: true, response: { success: true } };
            }
            if (message && message.type === 'KBB_LIST_CLIENTS') {
              return {
                ok: true,
                response: {
                  Clients: window.__kbbPopupTrustedClients.map((client) => ({ ...client, Permissions: client.Permissions.slice() }))
                }
              };
            }
            if (message && message.type === 'KBB_REVOKE_CLIENT') {
              if (message.clientId === 'client-current') {
                state.paired = false;
              }
              return { ok: true, response: { Revoked: true } };
            }
            if (message && message.type === 'KBB_UPDATE_CLIENT_PERMISSIONS') {
              const client = window.__kbbPopupTrustedClients.find((candidate) => candidate.ClientId === message.clientId);
              if (client) {
                client.Permissions = message.permissions.slice();
              }
              return {
                ok: true,
                response: {
                  Updated: Boolean(client),
                  ClientId: message.clientId,
                  Permissions: client ? client.Permissions.slice() : []
                }
              };
            }

            return { ok: true, response: {} };
          }
        },
        storage: {
          local: {
            get(keys, callback) {
              let result = {};
              if (Array.isArray(keys)) {
                result = Object.fromEntries(keys.map((key) => [key, window.__kbbPopupStorage[key]]));
              } else if (typeof keys === 'object') {
                result = { ...keys, ...window.__kbbPopupStorage };
              } else if (typeof keys === 'string') {
                result = { [keys]: window.__kbbPopupStorage[keys] };
              }
              if (callback) callback(result);
              return Promise.resolve(result);
            },
            set(values, callback) {
              Object.assign(window.__kbbPopupStorage, values);
              if (callback) callback();
              return Promise.resolve();
            }
          }
        }
      };
    });
    await page.goto('/extension/popup.html');
  });

  test('should load popup HTML', async ({ page }) => {
    await expect(page).toHaveTitle('KeePass Browser Bridge');
  });

  test('should display status badge', async ({ page }) => {
    const statusBadge = page.locator('#statusBadge');
    await expect(statusBadge).toBeVisible();
  });

  test('should display endpoint input', async ({ page }) => {
    await page.locator('#showSettings').click();
    const endpointInput = page.locator('#endpoint');
    await expect(endpointInput).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    await expect(page.locator('#queryLogins')).toBeVisible();
    await page.locator('#showSettings').click();
    await expect(page.locator('#checkStatus')).toBeVisible();
    await expect(page.locator('#beginPair')).toBeVisible();
  });

  test('should display settings panel', async ({ page }) => {
    await page.locator('#showSettings').click();
    const autoFill = page.locator('#autoFill');
    const autoSubmit = page.locator('#autoSubmit');
    await expect(autoFill).toBeVisible();
    await expect(autoSubmit).toBeVisible();
  });

  test('starts and cancels pairing from the popup', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupState.paired = false;
    });
    await page.locator('#showSettings').click();
    await page.locator('#beginPair').click();

    await expect(page.locator('#pairingPanel')).toBeVisible();
    await expect(page.locator('#pairingTimer')).toContainText('Code expires in');
    await expect(page.locator('#pairingCode')).toBeFocused();
    await expect(page.locator('#message')).toHaveText('Enter the pairing code shown in KeePass.');

    await page.locator('#cancelPair').click();

    await expect(page.locator('#pairingPanel')).toBeHidden();
    await expect(page.locator('#message')).toHaveText('Pairing cancelled.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupMessages.map((message) => message.type))).toEqual(
      expect.arrayContaining(['KBB_PAIR_BEGIN', 'KBB_PAIR_CANCEL'])
    );
  });

  test('refreshes the active pairing countdown in the popup', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-05-30T16:00:00Z') });
    await page.evaluate(() => {
      window.__kbbPopupState.paired = false;
      window.__kbbPairingDurationMs = 125000;
    });
    await page.locator('#showSettings').click();
    await page.locator('#beginPair').click();

    await expect(page.locator('#pairingPanel')).toBeVisible();
    await expect(page.locator('#pairingTimer')).toHaveText('Code expires in 2:05');

    await page.clock.fastForward(10000);

    await expect(page.locator('#pairingTimer')).toHaveText('Code expires in 1:55');
  });

  test('pastes and submits a copied pairing code from clipboard', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupState.paired = false;
    });
    await page.locator('#showSettings').click();
    await page.locator('#beginPair').click();
    await page.locator('#pastePairingCode').click();

    await expect(page.locator('#pairingPanel')).toBeHidden();
    await expect(page.locator('#statusBadge')).toHaveText('Paired');
    await expect(page.locator('#message')).toHaveText('Browser paired with KeePass.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupMessages.map((message) => message.type))).toEqual(
      expect.arrayContaining(['KBB_PAIR_BEGIN', 'KBB_PAIR_COMPLETE'])
    );
  });

  test('expires active pairing from the popup', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupState.paired = false;
      window.__kbbPairingDurationMs = 750;
    });
    await page.locator('#showSettings').click();
    await page.locator('#beginPair').click();

    await expect(page.locator('#pairingPanel')).toBeVisible();
    await expect(page.locator('#pairingTimer')).toContainText('Code expires in');

    await expect(page.locator('#pairingPanel')).toBeHidden();
    await expect(page.locator('#message')).toHaveText('Pairing code expired. Start pairing again.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupMessages.map((message) => message.type))).toEqual(
      expect.arrayContaining(['KBB_PAIR_BEGIN', 'KBB_PAIR_CANCEL'])
    );
  });

  test('submits and cancels pairing from the pairing code input keyboard', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupState.paired = false;
    });
    await page.locator('#showSettings').click();
    await page.locator('#beginPair').click();
    await page.locator('#pairingCode').fill('955963');
    await page.locator('#pairingCode').press('Enter');

    await expect(page.locator('#pairingPanel')).toBeHidden();
    await expect(page.locator('#statusBadge')).toHaveText('Paired');
    await expect(page.locator('#message')).toHaveText('Browser paired with KeePass.');

    await page.evaluate(() => {
      window.__kbbPopupState.paired = false;
    });
    await page.locator('#beginPair').click();
    await page.locator('#pairingCode').press('Escape');

    await expect(page.locator('#pairingPanel')).toBeHidden();
    await expect(page.locator('#message')).toHaveText('Pairing cancelled.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupMessages.map((message) => message.type))).toEqual(
      expect.arrayContaining(['KBB_PAIR_COMPLETE', 'KBB_PAIR_CANCEL'])
    );
  });

  test('checks bridge status and renders matching logins', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupState.paired = false;
    });
    await page.locator('#showSettings').click();
    await page.locator('#checkStatus').click();

    await expect(page.locator('#statusBadge')).toHaveText('Ready');
    await expect(page.locator('#message')).toHaveText('KeePass bridge is reachable. Pair this browser to query logins.');
    await expect(page.locator('#queryLogins')).toBeDisabled();
    await expect(page.locator('#newLogin')).toBeDisabled();

    await page.evaluate(() => {
      window.__kbbPopupState.paired = true;
    });
    await page.locator('#checkStatus').click();
    await page.locator('#queryLogins').click();

    await expect(page.locator('#currentUrl')).toHaveText('https://example.com/login');
    await expect(page.locator('.item-title')).toHaveText('Example');
    await expect(page.locator('.item-subtitle')).toContainText('alice@example.com');
    await expect(page.locator('.item-meta')).toContainText('Accounts/Work');
    await expect(page.locator('#message')).toHaveText('1 login(s) found.');
  });

  test('shows read-only permission state and disables write actions', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupStatusPermissions = ['read'];
    });

    await page.locator('#showSettings').click();
    await page.locator('#checkStatus').click();

    await expect(page.locator('#stateNotice')).toHaveText('Read-only access: this browser can find logins, but cannot create or update KeePass entries.');
    await expect(page.locator('#queryLogins')).toBeEnabled();
    await expect(page.locator('#newLogin')).toBeDisabled();
  });

  test('shows a useful empty state when no logins match the current page', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupEntries = [];
    });

    await page.locator('#queryLogins').click();

    await expect(page.locator('#results')).toContainText('No KeePass logins found for this page.');
    await expect(page.locator('#results')).toContainText('Create a new entry or adjust URL matching in settings.');
    await expect(page.locator('#emptyCreateLogin')).toBeVisible();
    await expect(page.locator('#message')).toHaveText('No matching logins found.');

    await page.locator('#emptyCreateLogin').click();

    await expect(page.locator('.create-form')).toBeVisible();
    await expect(page.locator('.create-form [name="userName"]')).toHaveValue('typed@example.com');
    await expect(page.locator('.create-form [name="password"]')).toHaveValue('typed-secret');
    await expect(page.locator('#message')).toHaveText('Create a new KeePass login for this page.');
  });

  test('locks and unlocks credential access from the popup', async ({ page }) => {
    await expect(page.locator('#lockBridge')).toContainText('Lock');

    await page.locator('#lockBridge').click();

    await expect(page.locator('#lockBridge')).toContainText('Unlock');
    await expect(page.locator('#statusBadge')).toHaveText('Locked');
    await expect(page.locator('#message')).toHaveText('KeePass Bridge is locked.');
    await expect(page.locator('#queryLogins')).toBeDisabled();
    await expect(page.locator('#newLogin')).toBeDisabled();
    await expect(page.locator('#stateNotice')).toHaveText('Unlock KeePass Bridge to find, fill, create, or update logins.');

    await page.locator('#showSettings').click();
    await page.locator('#checkStatus').click();
    await expect(page.locator('#statusBadge')).toHaveText('Locked');
    await expect(page.locator('#message')).toHaveText('KeePass bridge is reachable. Unlock KeePass Bridge to use logins.');
    await expect(page.locator('#stateNotice')).toHaveText('Unlock KeePass Bridge to find, fill, create, or update logins.');

    await page.locator('#lockBridge').click();

    await expect(page.locator('#lockBridge')).toContainText('Lock');
    await expect(page.locator('#statusBadge')).toHaveText('Paired');
    await expect(page.locator('#message')).toHaveText('KeePass Bridge is unlocked.');
    await expect(page.locator('#queryLogins')).toBeEnabled();
    await expect(page.locator('#newLogin')).toBeEnabled();
    await expect(page.locator('#stateNotice')).toHaveText('Ready to find, fill, create, and update KeePass logins.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupMessages.map((message) => message.type))).toEqual(
      expect.arrayContaining(['KBB_SET_LOCKED'])
    );
  });

  test('fills a selected popup login through the background contract', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.btn-autofill').first().click();

    await expect(page.locator('#message')).toHaveText('Login filled.');
    const fillMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_FILL_LOGIN'));
    expect(fillMessage).toMatchObject({
      type: 'KBB_FILL_LOGIN',
      credential: {
        EntryId: 'entry-1',
        Title: 'Example',
        UserName: 'alice@example.com',
        Url: 'https://example.com/login'
      }
    });
  });

  test('fills a selected popup password into the focused field contract', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.btn-copy', { hasText: 'Copy P' }).click();

    await expect(page.locator('#message')).toHaveText('Copied password to clipboard.');
    const fillMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_COPY_TO_CLIPBOARD' && message.text === 'secret-password'
    ));
    expect(fillMessage).toMatchObject({
      type: 'KBB_COPY_TO_CLIPBOARD',
      text: 'secret-password'
    });
  });

  test('fills a selected popup OTP into the focused field contract', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.btn-copy', { hasText: 'OTP' }).click();

    await expect(page.locator('#message')).toHaveText('Copied OTP to clipboard.');
    const fillMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_COPY_TO_CLIPBOARD' && message.text === '123456'
    ));
    expect(fillMessage).toMatchObject({
      type: 'KBB_COPY_TO_CLIPBOARD',
      text: '123456'
    });
  });

  test('ranks frequently used popup logins first', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupEntries = [
        {
          EntryId: 'entry-rare',
          Title: 'Rare',
          UserName: 'rare@example.com',
          Password: 'rare-secret',
          Url: 'https://example.com/login',
          UsageCount: 1,
          LastUsed: 1000
        },
        {
          EntryId: 'entry-frequent',
          Title: 'Frequent',
          UserName: 'frequent@example.com',
          Password: 'frequent-secret',
          Url: 'https://example.com/login',
          UsageCount: 20,
          LastUsed: 2000
        }
      ];
    });

    await page.locator('#queryLogins').click();

    await expect(page.locator('.item-title').first()).toHaveText('Frequent');
    await page.keyboard.press('Enter');

    const fillMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_FILL_LOGIN'));
    expect(fillMessage).toMatchObject({
      credential: {
        EntryId: 'entry-frequent',
        UserName: 'frequent@example.com'
      }
    });
  });

  test('filters popup logins by title group username and url', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupEntries = [
        {
          EntryId: 'entry-personal',
          Title: 'Personal Mail',
          Group: 'Personal/Email',
          UserName: 'me@example.com',
          Password: 'personal-secret',
          Url: 'https://mail.example.com'
        },
        {
          EntryId: 'entry-work',
          Title: 'GitHub',
          Group: 'Accounts/Work',
          UserName: 'work@example.com',
          Password: 'work-secret',
          Url: 'https://github.com'
        },
        {
          EntryId: 'entry-bank',
          Title: 'Bank',
          Group: 'Finance',
          UserName: 'bank-user',
          Password: 'bank-secret',
          Url: 'https://bank.example.com'
        }
      ];
    });

    await page.locator('#queryLogins').click();
    await expect(page.locator('#loginSearch')).toBeVisible();
    await expect(page.locator('.item-title')).toHaveCount(3);

    await page.locator('#loginSearch').fill('work github');

    await expect(page.locator('.item-title')).toHaveCount(1);
    await expect(page.locator('.item-title')).toHaveText('GitHub');
    await expect(page.locator('#message')).toHaveText('1 of 3 login(s) shown.');

    await page.locator('#loginSearch').fill('missing');

    await expect(page.locator('.item-title')).toHaveCount(0);
    await expect(page.locator('#results')).toContainText('No matching logins in this list.');
    const filterSearchClear = page.locator('.search-clear');
    await expect(filterSearchClear).toBeVisible();

    await filterSearchClear.click();

    await expect(page.locator('#loginSearch')).toHaveValue('');
    await expect(page.locator('.item-title')).toHaveCount(3);
    await expect(page.locator('#message')).toHaveText('3 login(s) found.');

    await page.locator('#loginSearch').fill('bank');
    await expect(page.locator('.item-title')).toHaveCount(1);
    await page.locator('#loginSearch').press('Escape');

    await expect(page.locator('#loginSearch')).toHaveValue('');
    await expect(page.locator('.item-title')).toHaveCount(3);
    await expect(page.locator('#message')).toHaveText('3 login(s) found.');
  });

  test('filters popup logins by non-protected custom fields only', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupEntries = [
        {
          EntryId: 'entry-custom',
          Title: 'Custom Fields',
          UserName: 'custom@example.com',
          Password: 'custom-secret',
          Url: 'https://example.com/login',
          CustomFields: [
            { Name: 'Tenant', Value: 'production', IsProtected: false },
            { Name: 'ApiKey', Value: 'protected-secret', IsProtected: true }
          ]
        },
        {
          EntryId: 'entry-normal',
          Title: 'Normal Login',
          UserName: 'normal@example.com',
          Password: 'normal-secret',
          Url: 'https://example.com/login'
        }
      ];
    });

    await page.locator('#queryLogins').click();
    await expect(page.locator('#loginSearch')).toBeVisible();

    await page.locator('#loginSearch').fill('tenant production');
    await expect(page.locator('.item-title')).toHaveCount(1);
    await expect(page.locator('.item-title')).toHaveText('Custom Fields');

    await page.locator('#loginSearch').fill('protected-secret');
    await expect(page.locator('.item-title')).toHaveCount(0);
    await expect(page.locator('#results')).toContainText('No matching logins in this list.');
  });

  test('popup shows toast notification on copy action', async ({ page }) => {
    await page.locator('#queryLogins').click();

    const copyBtn = page.locator('.btn-copy').first();
    await copyBtn.click();

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();

    await expect(toast).toContainText(/copied|Copied/i);
  });

  test('copies username password and OTP from popup results', async ({ page }) => {
    await page.locator('#queryLogins').click();

    await page.locator('.btn-copy', { hasText: 'Copy U' }).click();
    await page.locator('.btn-copy', { hasText: 'Copy P' }).click();
    await page.locator('.btn-copy', { hasText: 'OTP' }).click();

    await expect(page.locator('#message')).toHaveText('Copied OTP to clipboard.');
    const copyMessages = await page.evaluate(() =>
      window.__kbbPopupMessages.filter((message) => message.type === 'KBB_COPY_TO_CLIPBOARD')
    );
    expect(copyMessages).toMatchObject([
      { type: 'KBB_COPY_TO_CLIPBOARD', text: 'alice@example.com' },
      { type: 'KBB_COPY_TO_CLIPBOARD', text: 'secret-password' },
      { type: 'KBB_COPY_TO_CLIPBOARD', text: '123456' }
    ]);
    expect(copyMessages.every((message) => message.clearAfterMs === 30000)).toBe(true);
  });

  test('does not copy protected custom fields from popup results', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupEntries = [
        {
          EntryId: 'entry-custom',
          Title: 'Custom Fields',
          UserName: 'custom@example.com',
          Password: 'custom-secret',
          Url: 'https://example.com/login',
          CustomFields: [
            { Name: 'Tenant', Value: 'production', IsProtected: false },
            { Name: 'ApiKey', Value: 'protected-secret', IsProtected: true }
          ]
        }
      ];
    });

    await page.locator('#queryLogins').click();

    await expect(page.locator('.custom-field', { hasText: 'Tenant' })).toContainText('production');
    await expect(page.locator('.custom-field', { hasText: 'ApiKey' })).toContainText('••••••••');
    await expect(page.locator('.custom-field', { hasText: 'ApiKey' })).not.toContainText('protected-secret');
    await expect(page.locator('.custom-field', { hasText: 'Tenant' }).locator('.copy-btn')).toHaveCount(1);
    await expect(page.locator('.custom-field', { hasText: 'Tenant' }).locator('button', { hasText: 'Fill Tenant' })).toHaveCount(1);
    await expect(page.locator('.custom-field', { hasText: 'ApiKey' }).locator('.copy-btn')).toHaveCount(0);
    await expect(page.locator('.custom-field', { hasText: 'ApiKey' }).locator('button', { hasText: 'Fill ApiKey' })).toHaveCount(0);

    await page.locator('.custom-field', { hasText: 'Tenant' }).locator('.copy-btn').click();
    await page.locator('.custom-field', { hasText: 'Tenant' }).locator('button', { hasText: 'Fill Tenant' }).click();
    const copyMessages = await page.evaluate(() =>
      window.__kbbPopupMessages.filter((message) => message.type === 'KBB_COPY_TO_CLIPBOARD')
    );
    expect(copyMessages).toMatchObject([
      { type: 'KBB_COPY_TO_CLIPBOARD', text: 'production' }
    ]);
    const customFillMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_FILL_LOGIN' && message.fieldRole === 'custom'
    ));
    expect(customFillMessage).toMatchObject({
      type: 'KBB_FILL_LOGIN',
      fieldRole: 'custom',
      customFieldName: 'Tenant',
      credential: {
        EntryId: 'entry-custom'
      }
    });
  });

  test('only shows popup passwords when enabled in settings', async ({ page }) => {
    await page.locator('#queryLogins').click();

    await expect(page.locator('.credential-item')).not.toContainText('secret-password');

    await page.evaluate(() => {
      window.__kbbPopupStorage.showPasswordsInPopup = true;
    });
    await page.locator('#queryLogins').click();

    await expect(page.locator('.btn-copy', { hasText: 'Copy P' })).toBeVisible();
  });

  test('uses configured clipboard clear delay for popup copy actions', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupStorage.clipboardClearDelay = 45;
    });
    await page.locator('#queryLogins').click();

    await page.locator('.btn-copy', { hasText: 'Copy P' }).click();

    const copyMessage = await page.evaluate(() =>
      window.__kbbPopupMessages.find((message) => message.type === 'KBB_COPY_TO_CLIPBOARD')
    );
    expect(copyMessage).toMatchObject({
      type: 'KBB_COPY_TO_CLIPBOARD',
      text: 'secret-password',
      clearAfterMs: 45000
    });
  });

  test('creates a new KeePass login from the popup', async ({ page }) => {
    await page.locator('#newLogin').click();

    const form = page.locator('.create-form');
    await expect(form).toBeVisible();
    await expect(form.locator('[name="url"]')).toHaveValue('https://example.com/login');
    await expect(form.locator('[name="userName"]')).toHaveValue('typed@example.com');
    await expect(form.locator('[name="password"]')).toHaveValue('typed-secret');
    await form.locator('[name="title"]').fill('New Example');
    await form.locator('[name="group"]').fill('Accounts/Work');
    await form.locator('[name="userName"]').fill('new@example.com');
    await form.locator('[name="password"]').fill('new-secret');
    await form.locator('[name="otp"]').fill('JBSWY3DPEHPK3PXP');
    await form.locator('[name="customFieldName"]').fill('Tenant');
    await form.locator('[name="customFieldValue"]').nth(0).fill('production');
    await form.locator('[data-action="add-custom-field"]').click();
    await form.locator('[name="customFieldName"]').nth(1).fill('Environment');
    await form.locator('[name="customFieldValue"]').nth(1).fill('prod-us');
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('#message')).toHaveText('Entry created.');
    await expect(page.locator('.item-title')).toContainText(['New Example']);
    const createMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        Title: 'New Example',
        Group: 'Accounts/Work',
        Url: 'https://example.com/login',
        UserName: 'new@example.com',
        Password: 'new-secret',
        Otp: 'JBSWY3DPEHPK3PXP',
        CustomFields: [
          { Name: 'Tenant', Value: 'production', IsProtected: false },
          { Name: 'Environment', Value: 'prod-us', IsProtected: false }
        ]
      }
    });
  });

  test('omits blank TOTP secret when creating a popup login', async ({ page }) => {
    await page.locator('#newLogin').click();

    const form = page.locator('.create-form');
    await expect(form).toBeVisible();
    await form.locator('[name="title"]').fill('No OTP Login');
    await form.locator('[name="userName"]').fill('no-otp@example.com');
    await form.locator('[name="password"]').fill('no-otp-secret');
    await form.locator('button[type="submit"]').click();

    const createMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage.login).not.toHaveProperty('Otp');
  });

  test('rejects duplicate custom field names when creating a popup login', async ({ page }) => {
    await page.locator('#newLogin').click();

    const form = page.locator('.create-form');
    await expect(form).toBeVisible();
    await form.locator('[name="title"]').fill('Duplicate Fields');
    await form.locator('[name="userName"]').fill('duplicate@example.com');
    await form.locator('[name="password"]').fill('duplicate-secret');
    await form.locator('[name="customFieldName"]').fill('Tenant');
    await form.locator('[name="customFieldValue"]').nth(0).fill('production');
    await form.locator('[data-action="add-custom-field"]').click();
    await form.locator('[name="customFieldName"]').nth(1).fill('tenant');
    await form.locator('[name="customFieldValue"]').nth(1).fill('staging');
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('#message')).toHaveText('Custom field "tenant" is duplicated.');
    await expect(page.locator('#message')).toHaveClass(/error/);
    const createMessages = await page.evaluate(() =>
      window.__kbbPopupMessages.filter((message) => message.type === 'KBB_CREATE_LOGIN')
    );
    expect(createMessages).toEqual([]);
  });

  test('toggles current site auto-fill override from the popup', async ({ page }) => {
    await page.locator('#showSettings').click();
    await page.locator('#toggleSiteAutoFill').click();

    await expect(page.locator('#message')).toHaveText('Auto-fill disabled for example.com.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupStorage.siteOverrides)).toEqual([
      {
        host: 'example.com',
        autoFillEnabled: false,
        autoSubmitEnabled: false
      }
    ]);

    await page.locator('#toggleSiteAutoFill').click();

    await expect(page.locator('#message')).toHaveText('Auto-fill enabled for example.com.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupStorage.siteOverrides)).toEqual([]);
  });

  test('toggles current site auto-submit override from the popup', async ({ page }) => {
    await page.locator('#showSettings').click();
    await page.locator('#toggleSiteAutoSubmit').click();

    await expect(page.locator('#message')).toHaveText('Auto-submit enabled for example.com.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupStorage.siteOverrides)).toEqual([
      {
        host: 'example.com',
        autoFillEnabled: true,
        autoSubmitEnabled: true
      }
    ]);

    await page.locator('#toggleSiteAutoSubmit').click();

    await expect(page.locator('#message')).toHaveText('Auto-submit disabled for example.com.');
    await expect.poll(() => page.evaluate(() => window.__kbbPopupStorage.siteOverrides)).toEqual([]);
  });

  test('edits and saves an existing login through the background contract', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.credential-item .btn-copy', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[name="title"]').fill('Example Updated');
    await form.locator('[name="group"]').fill('Accounts/Personal');
    await form.locator('[name="userName"]').fill('updated@example.com');
    await form.locator('[name="url"]').fill('https://example.com/account');
    await form.locator('[name="password"]').fill('updated-secret');
    await form.locator('[name="otp"]').fill('JBSWY3DPEHPK3PXP');
    await expect(form.locator('[name="customFieldName"]').nth(0)).toHaveValue('Tenant');
    await expect(form.locator('[name="customFieldName"]').nth(1)).toHaveValue('Environment');
    await form.locator('[name="customFieldValue"]').nth(0).fill('production');
    await form.locator('[data-action="remove-custom-field"]').nth(1).click();
    await expect(form.locator('[name="customFieldName"]')).toHaveCount(1);
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('#message')).toHaveText('Entry updated.');
    await expect(page.locator('.item-title')).toHaveText('Example Updated');
    await expect(page.locator('.item-subtitle')).toContainText('updated@example.com');
    await expect(page.locator('.item-meta')).toContainText('https://example.com/account');

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        EntryId: 'entry-1',
        Title: 'Example Updated',
        Group: 'Accounts/Personal',
        UserName: 'updated@example.com',
        Url: 'https://example.com/account',
        Password: 'updated-secret',
        Otp: 'JBSWY3DPEHPK3PXP',
        ReplaceCustomFields: true,
        CustomFields: [
          { Name: 'Tenant', Value: 'production', IsProtected: false }
        ]
      }
    });
  });

  test('omits blank TOTP secret when editing a popup login', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.credential-item .btn-copy', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[name="title"]').fill('Example Without OTP');
    await form.locator('[name="password"]').fill('updated-secret');
    await form.locator('button[type="submit"]').click();

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage.login).not.toHaveProperty('Otp');
  });

  test('can clear an existing TOTP secret when editing a popup login', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.credential-item .btn-copy', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[name="clearOtp"]').check();
    await form.locator('button[type="submit"]').click();

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        EntryId: 'entry-1',
        ClearOtp: true
      }
    });
    expect(updateMessage.login).not.toHaveProperty('Otp');
  });

  test('generates a new password while editing an existing login', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.credential-item .btn-copy', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[data-action="generate-password"]').click();

    const generatedPassword = await form.locator('[name="password"]').inputValue();
    expect(generatedPassword).toHaveLength(20);
    expect(generatedPassword).not.toBe('updated-secret');

    await form.locator('button[type="submit"]').click();

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage.login.Password).toBe(generatedPassword);
  });

  test('shows and hides password fields in popup create and edit forms', async ({ page }) => {
    await page.locator('#newLogin').click();

    const createForm = page.locator('.create-form');
    await expect(createForm).toBeVisible();
    await expect(createForm.locator('[name="password"]')).toHaveAttribute('type', 'password');

    await createForm.locator('[data-action="toggle-password-visibility"]').click();
    await expect(createForm.locator('[name="password"]')).toHaveAttribute('type', 'text');
    await expect(createForm.locator('[data-action="toggle-password-visibility"]')).toHaveText('Hide');

    await createForm.locator('[data-action="toggle-password-visibility"]').click();
    await expect(createForm.locator('[name="password"]')).toHaveAttribute('type', 'password');
    await expect(createForm.locator('[data-action="toggle-password-visibility"]')).toHaveText('Show');

    await createForm.locator('[data-action="cancel"]').click();
    await page.locator('#queryLogins').click();
    await page.locator('.credential-item .btn-copy', { hasText: 'Edit' }).click();

    const editForm = page.locator('.edit-form').last();
    await expect(editForm.locator('[name="password"]')).toHaveAttribute('type', 'password');
    await editForm.locator('[data-action="toggle-password-visibility"]').click();
    await expect(editForm.locator('[name="password"]')).toHaveAttribute('type', 'text');
  });

  test('lists trusted browsers and revokes a non-current browser', async ({ page }) => {
    await page.locator('#showSettings').click();
    await page.locator('#listClients').click();

    await expect(page.locator('#clientsPanel')).toBeVisible();
    await expect(page.locator('.client-title')).toContainText(['This Chrome', 'Old Browser']);
    await expect(page.locator('.client', { hasText: 'This Chrome' })).toContainText('Read, Write, Manage browsers');
    await expect(page.locator('.client', { hasText: 'Old Browser' })).toContainText('Read');
    await expect(page.locator('.client', { hasText: 'Old Browser' })).toContainText('chrome-extension://bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb');
    await expect(page.locator('.client', { hasText: 'Old Browser' })).toContainText('Last used:');
    await expect(page.locator('#message')).toHaveText('2 trusted browser(s).');

    const oldBrowserRevoke = page.locator('.client', { hasText: 'Old Browser' }).locator('button', { hasText: 'Revoke' });
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Revoke browser "Old Browser"?');
      await dialog.dismiss();
    });
    await oldBrowserRevoke.click();

    await expect(page.locator('#message')).toHaveText('Revoke cancelled.');
    await expect.poll(() => page.evaluate(() =>
      window.__kbbPopupMessages.filter((message) => message.type === 'KBB_REVOKE_CLIENT')
    )).toEqual([]);

    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('Revoke browser "Old Browser"?');
      await dialog.accept();
    });
    await oldBrowserRevoke.click();

    await expect(page.locator('#message')).toHaveText('Browser revoked.');
    const revokeMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_REVOKE_CLIENT' && message.clientId === 'client-old'
    ));
    expect(revokeMessage).toMatchObject({
      type: 'KBB_REVOKE_CLIENT',
      clientId: 'client-old'
    });
  });

  test('updates trusted browser permissions from the popup', async ({ page }) => {
    await page.locator('#showSettings').click();
    await page.locator('#listClients').click();

    const oldBrowser = page.locator('.client', { hasText: 'Old Browser' });
    await expect(oldBrowser).toContainText('Read');
    await expect(oldBrowser.locator('[data-permission="read"]')).toBeChecked();
    await expect(oldBrowser.locator('[data-permission="read"]')).toBeDisabled();
    await expect(oldBrowser.locator('[data-permission="write"]')).not.toBeChecked();

    await oldBrowser.locator('[data-permission="write"]').check();

    await expect(page.locator('#message')).toHaveText('Browser permissions updated.');
    await expect(oldBrowser).toContainText('Read, Write');
    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_UPDATE_CLIENT_PERMISSIONS' && message.clientId === 'client-old'
    ));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
      clientId: 'client-old',
      permissions: ['read', 'write']
    });
  });

  test('credential items show favicon from google favicon service when entry has URL', async ({ page }) => {
    await page.locator('#queryLogins').click();
    const firstAvatar = page.locator('.item-avatar').first();
    await expect(firstAvatar).toHaveCSS('background-image', /google\.com\/s2\/favicons/);
  });

  test('renders credential list with entry avatars and prominent username', async ({ page }) => {
  await page.evaluate(() => {
    window.__kbbPopupEntries = [
      {
        EntryId: 'entry-1',
        Title: 'Example',
        UserName: 'alice@example.com',
        Password: 'secret-password',
        Url: 'https://example.com/login',
        Group: 'Accounts/Work',
        UsageCount: 50
      },
      {
        EntryId: 'entry-2',
        Title: 'Test',
        UserName: 'bob@example.com',
        Password: 'secret2',
        Url: 'https://test.com',
        Group: 'Personal',
        UsageCount: 1
      }
    ];
  });

  await page.locator('#queryLogins').click();

  await expect(page.locator('.item-avatar')).toHaveCount(2);

  await expect(page.locator('.item-avatar').first()).toHaveText('E');
  await expect(page.locator('.item-avatar').first()).toHaveCSS('background-color', 'rgb(74, 144, 226)');

  await expect(page.locator('.item-avatar').nth(1)).toHaveText('T');

  await expect(page.locator('.item-subtitle').first()).toHaveText('alice@example.com');
  await expect(page.locator('.item-subtitle').nth(1)).toHaveText('bob@example.com');

  await expect(page.locator('.item-meta').first()).toContainText('Accounts/Work');
  await expect(page.locator('.item-meta').first()).toContainText('https://example.com/login');
  await expect(page.locator('.item-meta').first()).not.toContainText('alice@example.com');

  await page.locator('.btn-autofill').first().click();
  await expect(page.locator('#message')).toHaveText('Login filled.');
});

  test('popup renders with redesigned status bar', async ({ page }) => {
    await page.goto('/extension/popup.html');
    await expect(page.locator('.status-bar')).toBeVisible();
    const statusButtons = page.locator('.status-bar button');
    const count = await statusButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('popup header shows logo and lock button', async ({ page }) => {
    await expect(page.locator('.popup-header')).toBeVisible();
    await expect(page.locator('.popup-header .logo')).toBeVisible();
    await expect(page.locator('#lockBridge')).toBeVisible();
  });

  test('popup search bar has search icon', async ({ page }) => {
    await expect(page.locator('.search-wrapper')).toBeVisible();
    await expect(page.locator('.search-wrapper .search-icon')).toBeVisible();
    await expect(page.locator('#loginSearch')).toBeVisible();
  });

  test('credential items show as cards with autofill and copy actions', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupEntries = [
        {
          EntryId: 'entry-1',
          Title: 'Example',
          UserName: 'alice@example.com',
          Password: 'secret-password',
          Url: 'https://example.com/login',
          Group: 'Accounts/Work',
          UsageCount: 50
        },
        {
          EntryId: 'entry-2',
          Title: 'Test',
          UserName: 'bob@example.com',
          Password: 'secret2',
          Url: 'https://test.com',
          Group: 'Personal',
          UsageCount: 1
        }
      ];
    });
    await page.locator('#queryLogins').click();
    await expect(page.locator('.credential-item')).toHaveCount(2);
    const firstItem = page.locator('.credential-item').first();
    await expect(firstItem.locator('.btn-autofill')).toBeVisible();
    await expect(firstItem.locator('.btn-copy').first()).toBeVisible();
  });

  test('popup has status bar at bottom showing lock state', async ({ page }) => {
    await expect(page.locator('.status-bar')).toBeVisible();
    await expect(page.locator('.status-bar .lock-status')).toBeVisible();
  });

  test('popup shows empty state with new login option', async ({ page }) => {
    await page.evaluate(() => { window.__kbbPopupEntries = []; });
    await page.locator('#queryLogins').click();
    await expect(page.locator('.empty-state')).toBeVisible();
    await expect(page.locator('.empty-state .btn-new-login')).toBeVisible();
  });

  test('credentials grouped by folder with section headers', async ({ page }) => {
  const entries = [
    { Title: 'GitHub', UserName: 'dev', Group: 'Work', Url: 'https://github.com', Password: 'p1' },
    { Title: 'Gmail', UserName: 'me', Group: 'Personal', Url: 'https://gmail.com', Password: 'p2' },
    { Title: 'AWS', UserName: 'admin', Group: 'Work', Url: 'https://aws.com', Password: 'p3' }
  ];
  await page.evaluate((data) => { window.__kbbPopupEntries = data; }, entries);
  await page.locator('#queryLogins').click();

  const headers = page.locator('.folder-header');
  await expect(headers).toHaveCount(2);
  await expect(headers.first()).toContainText('Personal');
  await expect(headers.nth(1)).toContainText('Work');

  const groups = page.locator('.credential-group');
  await expect(groups).toHaveCount(2);

  const firstGroupItems = groups.first().locator('.credential-item');
  const secondGroupItems = groups.nth(1).locator('.credential-item');
  await expect(firstGroupItems).toHaveCount(1);
  await expect(secondGroupItems).toHaveCount(2);
});

test('clicking credential item shows detail view with all fields', async ({ page }) => {
  await page.locator('#queryLogins').click();

  await page.locator('.credential-item').first().click();

  await expect(page.locator('.detail-view')).toBeVisible();
  await expect(page.locator('.detail-title')).toBeVisible();
  await expect(page.locator('.detail-field').first()).toBeVisible();
  await expect(page.locator('.detail-fields')).not.toBeEmpty();
  await expect(page.locator('.detail-fill-btn')).toBeVisible();
  await expect(page.locator('.detail-back-btn')).toBeVisible();

  await page.locator('.detail-back-btn').click();
  await expect(page.locator('.detail-view')).toBeHidden();
  await expect(page.locator('.vault-list')).not.toBeHidden();
});

test('popup has password generator panel', async ({ page }) => {
  await page.locator('#generatePassword').click();
  await expect(page.locator('.password-generator')).toBeVisible();
  await expect(page.locator('.generated-password')).toBeVisible();
  await expect(page.locator('.gen-length')).toBeVisible();
  await expect(page.locator('.gen-copy-btn')).toBeVisible();
  await expect(page.locator('.gen-fill-btn')).toBeVisible();
});

test('credential items show password strength indicator', async ({ page }) => {
  await page.locator('#queryLogins').click();

  const strengthBars = page.locator('.strength-bar');
  const count = await strengthBars.count();
  expect(count).toBeGreaterThan(0);

  const lastUsed = page.locator('.last-used');
  await expect(lastUsed.first()).toBeVisible();
});

test('popup has smooth view transitions with CSS animations', async ({ page }) => {
  await page.goto('/extension/popup.html');

  const vaultList = page.locator('.vault-list');
  await expect(vaultList).toHaveCSS('transition', /opacity|transform/);

  await page.locator('#queryLogins').click();
  await page.locator('.credential-item').first().click();
  const detailView = page.locator('.detail-view');
  await expect(detailView).toHaveCSS('transition', /opacity|transform/);
});

  test('popup shows filter chips for credential groups', async ({ page }) => {
    const entries = [
      { Title: 'GitHub', UserName: 'dev', Group: 'Root/Work', Url: 'https://github.com', Password: 'p1' },
      { Title: 'Gmail', UserName: 'me', Group: 'Root/Personal', Url: 'https://gmail.com', Password: 'p2' },
      { Title: 'AWS', UserName: 'admin', Group: 'Root/Work', Url: 'https://aws.com', Password: 'p3' }
    ];
    await page.evaluate((data) => { window.__kbbPopupEntries = data; }, entries);
    await page.locator('#queryLogins').click();

    const filterBar = page.locator('#filterBar');
    await expect(filterBar).toBeVisible();

    const chips = page.locator('.filter-chip');
    await expect(chips).toHaveCount(3);

    await expect(page.locator('.filter-chip-all')).toContainText('All');
    await expect(page.locator('.filter-chip-all')).toHaveClass(/active/);

    const workChip = page.locator('.filter-chip[data-group="Root/Work"]');
    await expect(workChip).toContainText('Work');
    await workChip.click();

    await expect(workChip).toHaveClass(/active/);

    const items = page.locator('.credential-item');
    await expect(items).toHaveCount(2);
    await expect(items.first()).toContainText('GitHub');
    await expect(items.nth(1)).toContainText('AWS');

    await page.locator('.filter-chip-all').click();
    await expect(page.locator('.credential-item')).toHaveCount(3);
  });

  test('gates passkey permission controls in the popup on bridge feature discovery', async ({ page }) => {
    await page.locator('#showSettings').click();
    await page.locator('#listClients').click();
    await expect(page.locator('[data-permission="passkeyRead"]')).toHaveCount(0);
    await expect(page.locator('[data-permission="passkeyWrite"]')).toHaveCount(0);

    await page.evaluate(() => {
      window.__kbbPopupAbout.pluginPasskeysEnabled = true;
    });
    await page.locator('#listClients').click();

    const oldBrowser = page.locator('.client', { hasText: 'Old Browser' });
    await expect(oldBrowser.locator('[data-permission="passkeyRead"]')).toBeVisible();
    await expect(oldBrowser.locator('[data-permission="passkeyWrite"]')).toBeVisible();
    await expect(oldBrowser.locator('[data-permission="passkeyRead"]')).not.toBeChecked();

    await oldBrowser.locator('[data-permission="passkeyRead"]').check();

    await expect(page.locator('#message')).toHaveText('Browser permissions updated.');
    await expect(oldBrowser).toContainText('Read, Passkey read');
    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_UPDATE_CLIENT_PERMISSIONS' && message.clientId === 'client-old'
    ));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
      clientId: 'client-old',
      permissions: ['read', 'passkeyRead']
    });
  });

  test('follows system color scheme preference by default and remembers manual toggle', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/extension/popup.html');

    await expect(page.locator('#themeToggle')).toBeVisible();
    let theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('dark');

    await page.locator('#themeToggle').click();
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');

    const stored = await page.evaluate(() => localStorage.getItem('kbbTheme'));
    expect(stored).toBe('light');

    await page.reload();
    theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(theme).toBe('light');
  });
});
