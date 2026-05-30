import { test, expect } from '@playwright/test';

test.describe('KeePassBrowserBridge Extension', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const state = {
        endpoint: 'http://127.0.0.1:19455/bridge',
        paired: false,
        pairingSessionId: '',
        pairingExpiresAt: 0,
        autoFillEnabled: false,
        autoSubmitEnabled: false
      };
      window.__kbbPopupMessages = [];
      window.__kbbPopupState = state;
      window.__kbbPopupStorage = {};
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
          Group: 'Accounts/Work'
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
            if (message && message.type === 'KBB_PAIR_BEGIN') {
              state.paired = false;
              state.pairingSessionId = 'session-1';
              state.pairingExpiresAt = Date.now() + 300000;
              return { ok: true, response: { ...state } };
            }
            if (message && message.type === 'KBB_PAIR_CANCEL') {
              state.pairingSessionId = '';
              state.pairingExpiresAt = 0;
              return { ok: true, response: { ...state } };
            }
            if (message && message.type === 'KBB_QUERY_LOGINS') {
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
                    Password: message.login.password
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
                  Clients: [
                    {
                      ClientId: 'client-current',
                      ClientName: 'This Chrome',
                      Current: true,
                      CreatedUtcMs: 1779990000000
                    },
                    {
                      ClientId: 'client-old',
                      ClientName: 'Old Browser',
                      Current: false,
                      CreatedUtcMs: 1779900000000
                    }
                  ]
                }
              };
            }
            if (message && message.type === 'KBB_REVOKE_CLIENT') {
              if (message.clientId === 'client-current') {
                state.paired = false;
              }
              return { ok: true, response: { Revoked: true } };
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
    const endpointInput = page.locator('#endpoint');
    await expect(endpointInput).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    await expect(page.locator('#checkStatus')).toBeVisible();
    await expect(page.locator('#beginPair')).toBeVisible();
    await expect(page.locator('#queryLogins')).toBeVisible();
  });

  test('should display settings panel', async ({ page }) => {
    const autoFill = page.locator('#autoFill');
    const autoSubmit = page.locator('#autoSubmit');
    await expect(autoFill).toBeVisible();
    await expect(autoSubmit).toBeVisible();
  });

  test('starts and cancels pairing from the popup', async ({ page }) => {
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

  test('pastes a copied pairing code from clipboard', async ({ page }) => {
    await page.locator('#beginPair').click();
    await page.locator('#pastePairingCode').click();

    await expect(page.locator('#pairingCode')).toHaveValue('955963');
    await expect(page.locator('#completePair')).toBeEnabled();
    await expect(page.locator('#message')).toHaveText('Pairing code pasted.');
  });

  test('checks bridge status and renders matching logins', async ({ page }) => {
    await page.locator('#checkStatus').click();

    await expect(page.locator('#statusBadge')).toHaveText('Ready');
    await expect(page.locator('#message')).toHaveText('KeePass bridge is reachable. Pair this browser to query logins.');

    await page.locator('#queryLogins').click();

    await expect(page.locator('#currentUrl')).toHaveText('https://example.com/login');
    await expect(page.locator('.login-title')).toHaveText('Example');
    await expect(page.locator('.login-meta')).toContainText('alice@example.com');
    await expect(page.locator('.login-meta')).toContainText('Accounts/Work');
    await expect(page.locator('#message')).toHaveText('1 login(s) found.');
  });

  test('fills a selected popup login through the background contract', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.login button', { hasText: 'Fill' }).click();

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
    await page.locator('.login button', { hasText: 'Pass Field' }).click();

    await expect(page.locator('#message')).toHaveText('Password filled into focused field.');
    const fillMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_FILL_LOGIN' && message.fieldRole === 'password'
    ));
    expect(fillMessage).toMatchObject({
      type: 'KBB_FILL_LOGIN',
      fieldRole: 'password',
      credential: {
        EntryId: 'entry-1',
        Password: 'secret-password'
      }
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

    await expect(page.locator('.login-title').first()).toHaveText('Frequent');
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
    await expect(page.locator('.login-title')).toHaveCount(3);

    await page.locator('#loginSearch').fill('work github');

    await expect(page.locator('.login-title')).toHaveCount(1);
    await expect(page.locator('.login-title')).toHaveText('GitHub');
    await expect(page.locator('#message')).toHaveText('1 of 3 login(s) shown.');

    await page.locator('#loginSearch').fill('missing');

    await expect(page.locator('.login-title')).toHaveCount(0);
    await expect(page.locator('#results')).toContainText('No matching logins in this list.');
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
    await expect(page.locator('.login-title')).toHaveCount(1);
    await expect(page.locator('.login-title')).toHaveText('Custom Fields');

    await page.locator('#loginSearch').fill('protected-secret');
    await expect(page.locator('.login-title')).toHaveCount(0);
    await expect(page.locator('#results')).toContainText('No matching logins in this list.');
  });

  test('copies username password and OTP from popup results', async ({ page }) => {
    await page.locator('#queryLogins').click();

    await page.locator('.login button', { hasText: 'Copy User' }).click();
    await page.locator('.login button', { hasText: 'Copy Pass' }).click();
    await page.locator('.login button', { hasText: 'Copy OTP' }).click();

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
    await expect(page.locator('.custom-field', { hasText: 'Tenant' }).locator('button', { hasText: 'Field' })).toHaveCount(1);
    await expect(page.locator('.custom-field', { hasText: 'ApiKey' }).locator('.copy-btn')).toHaveCount(0);
    await expect(page.locator('.custom-field', { hasText: 'ApiKey' }).locator('button', { hasText: 'Field' })).toHaveCount(0);

    await page.locator('.custom-field', { hasText: 'Tenant' }).locator('.copy-btn').click();
    await page.locator('.custom-field', { hasText: 'Tenant' }).locator('button', { hasText: 'Field' }).click();
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

    await expect(page.locator('.login-secret')).toBeHidden();
    await expect(page.locator('.login')).not.toContainText('secret-password');

    await page.evaluate(() => {
      window.__kbbPopupStorage.showPasswordsInPopup = true;
    });
    await page.locator('#queryLogins').click();

    await expect(page.locator('.login-secret')).toHaveText('Password: secret-password');
  });

  test('uses configured clipboard clear delay for popup copy actions', async ({ page }) => {
    await page.evaluate(() => {
      window.__kbbPopupStorage.clipboardClearDelay = 45;
    });
    await page.locator('#queryLogins').click();

    await page.locator('.login button', { hasText: 'Copy Pass' }).click();

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
    await form.locator('[name="customFieldValue"]').fill('production');
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('#message')).toHaveText('Entry created.');
    await expect(page.locator('.login-title')).toContainText(['New Example']);
    const createMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        title: 'New Example',
        group: 'Accounts/Work',
        url: 'https://example.com/login',
        userName: 'new@example.com',
        password: 'new-secret',
        otp: 'JBSWY3DPEHPK3PXP',
        customFields: [
          { name: 'Tenant', value: 'production', isProtected: false }
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
    expect(createMessage.login).not.toHaveProperty('otp');
  });

  test('toggles current site auto-fill override from the popup', async ({ page }) => {
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
    await page.locator('.login button', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[name="title"]').fill('Example Updated');
    await form.locator('[name="group"]').fill('Accounts/Personal');
    await form.locator('[name="userName"]').fill('updated@example.com');
    await form.locator('[name="url"]').fill('https://example.com/account');
    await form.locator('[name="password"]').fill('updated-secret');
    await form.locator('[name="otp"]').fill('JBSWY3DPEHPK3PXP');
    await form.locator('button[type="submit"]').click();

    await expect(page.locator('#message')).toHaveText('Entry updated.');
    await expect(page.locator('.login-title')).toHaveText('Example Updated');
    await expect(page.locator('.login-meta')).toContainText('updated@example.com');
    await expect(page.locator('.login-meta')).toContainText('https://example.com/account');

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        entryId: 'entry-1',
        title: 'Example Updated',
        group: 'Accounts/Personal',
        userName: 'updated@example.com',
        url: 'https://example.com/account',
        password: 'updated-secret',
        otp: 'JBSWY3DPEHPK3PXP'
      }
    });
  });

  test('omits blank TOTP secret when editing a popup login', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.login button', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[name="title"]').fill('Example Without OTP');
    await form.locator('[name="password"]').fill('updated-secret');
    await form.locator('button[type="submit"]').click();

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage.login).not.toHaveProperty('otp');
  });

  test('can clear an existing TOTP secret when editing a popup login', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.login button', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[name="clearOtp"]').check();
    await form.locator('button[type="submit"]').click();

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        entryId: 'entry-1',
        clearOtp: true
      }
    });
    expect(updateMessage.login).not.toHaveProperty('otp');
  });

  test('generates a new password while editing an existing login', async ({ page }) => {
    await page.locator('#queryLogins').click();
    await page.locator('.login button', { hasText: 'Edit' }).click();

    const form = page.locator('.edit-form');
    await expect(form).toBeVisible();
    await form.locator('[data-action="generate-password"]').click();

    const generatedPassword = await form.locator('[name="password"]').inputValue();
    expect(generatedPassword).toHaveLength(20);
    expect(generatedPassword).not.toBe('updated-secret');

    await form.locator('button[type="submit"]').click();

    const updateMessage = await page.evaluate(() => window.__kbbPopupMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage.login.password).toBe(generatedPassword);
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
    await page.locator('.login button', { hasText: 'Edit' }).click();

    const editForm = page.locator('.edit-form').last();
    await expect(editForm.locator('[name="password"]')).toHaveAttribute('type', 'password');
    await editForm.locator('[data-action="toggle-password-visibility"]').click();
    await expect(editForm.locator('[name="password"]')).toHaveAttribute('type', 'text');
  });

  test('lists trusted browsers and revokes a non-current browser', async ({ page }) => {
    await page.locator('#listClients').click();

    await expect(page.locator('#clientsPanel')).toBeVisible();
    await expect(page.locator('.client-title')).toContainText(['This Chrome', 'Old Browser']);
    await expect(page.locator('#message')).toHaveText('2 trusted browser(s).');

    await page.locator('.client', { hasText: 'Old Browser' }).locator('button', { hasText: 'Revoke' }).click();

    await expect(page.locator('#message')).toHaveText('Browser revoked.');
    const revokeMessage = await page.evaluate(() => window.__kbbPopupMessages.find(
      (message) => message.type === 'KBB_REVOKE_CLIENT' && message.clientId === 'client-old'
    ));
    expect(revokeMessage).toMatchObject({
      type: 'KBB_REVOKE_CLIENT',
      clientId: 'client-old'
    });
  });
});
