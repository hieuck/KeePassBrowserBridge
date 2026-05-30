import { test, expect } from '@playwright/test';

async function installContentScript(page) {
  await page.addInitScript(() => {
    window.chrome = {
      runtime: {
        onMessage: { addListener() {} },
        sendMessage: async () => ({ ok: true, response: { entries: [] } })
      }
    };
  });
}

test.describe('content script form detection', () => {
  test('prompts to save a new login after form submit', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              sessionStorage.setItem('__testKbbPendingSubmittedCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingSubmittedCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              sessionStorage.removeItem('__testKbbPendingSubmittedCredential');
              return { ok: true, response: { credential: pending.credential } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            if (message.type === 'KBB_CREATE_LOGIN') {
              return { ok: true, response: { Success: true } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('new@example.com');
    await page.locator('#password').fill('new-secret');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.kbb-save-prompt')).toBeVisible();
    await expect(page.locator('.kbb-save-prompt')).toContainText('Save login to KeePass?');
    await page.locator('.kbb-save-prompt button', { hasText: 'Save' }).click();
    await expect(page.locator('.kbb-save-prompt button', { hasText: 'Saved' })).toBeVisible();

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        userName: 'new@example.com',
        password: 'new-secret'
      }
    });
    expect(createMessage.login).not.toHaveProperty('otp');
    expect(createMessage.login.url).toContain('/tests/fixtures/login-page.html');
  });

  test('save prompt allows editing title and username before creating login', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              sessionStorage.setItem('__testKbbPendingSubmittedCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingSubmittedCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              sessionStorage.removeItem('__testKbbPendingSubmittedCredential');
              return { ok: true, response: { credential: pending.credential } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            if (message.type === 'KBB_CREATE_LOGIN') {
              return { ok: true, response: { Success: true } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('typed@example.com');
    await page.locator('#password').fill('typed-secret');
    await page.locator('button[type="submit"]').click();

    const prompt = page.locator('.kbb-save-prompt');
    await expect(prompt).toBeVisible();
    await prompt.locator('[name="title"]').fill('Edited Login');
    await prompt.locator('[name="group"]').fill('Accounts/Work');
    await prompt.locator('[name="userName"]').fill('edited@example.com');
    await prompt.locator('[name="otp"]').fill('JBSWY3DPEHPK3PXP');
    await prompt.locator('button', { hasText: 'Save' }).click();

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        title: 'Edited Login',
        group: 'Accounts/Work',
        userName: 'edited@example.com',
        password: 'typed-secret',
        otp: 'JBSWY3DPEHPK3PXP'
      }
    });
  });

  test('restores save prompt after form submit navigates to another page', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              sessionStorage.setItem('__testKbbPendingSubmittedCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingSubmittedCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              sessionStorage.removeItem('__testKbbPendingSubmittedCredential');
              return { ok: true, response: { credential: pending.credential } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-submit-redirect.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('#redirect-username').fill('redirect@example.com');
    await page.locator('#redirect-password').fill('redirect-secret');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/login-page\.html/);

    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await expect(page.locator('.kbb-save-prompt')).toBeVisible();
    await expect(page.locator('.kbb-save-prompt [name="userName"]')).toHaveValue('redirect@example.com');
    const queryMessages = await page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_QUERY_FOR_URL'));
    expect(queryMessages.length).toBeGreaterThan(0);
  });

  test('prompts to update an existing login when submitted password changes', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-1',
                      Title: 'Example',
                      UserName: 'alice@example.com',
                      Password: 'old-secret',
                      Url: 'https://example.com/login'
                    }
                  ]
                }
              };
            }
            if (message.type === 'KBB_UPDATE_LOGIN') {
              return { ok: true, response: { Success: true } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('alice@example.com');
    await page.locator('#password').fill('new-secret');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.kbb-update-prompt')).toBeVisible();
    await expect(page.locator('.kbb-update-prompt')).toContainText('Update KeePass password?');
    await page.locator('.kbb-update-prompt button', { hasText: 'Update' }).click();
    await expect(page.locator('.kbb-update-prompt button', { hasText: 'Updated' })).toBeVisible();

    const updateMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        entryId: 'entry-1',
        userName: 'alice@example.com',
        password: 'new-secret'
      }
    });
    expect(updateMessage.login).not.toHaveProperty('otp');
    expect(updateMessage.login.pageUrl).toContain('/tests/fixtures/login-page.html');
  });

  test('update prompt allows editing entry metadata before updating login', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-1',
                      Title: 'Example',
                      Group: 'Accounts/Old',
                      UserName: 'alice@example.com',
                      Password: 'old-secret',
                      Url: 'https://example.com/login'
                    }
                  ]
                }
              };
            }
            if (message.type === 'KBB_UPDATE_LOGIN') {
              return { ok: true, response: { Success: true } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('alice@example.com');
    await page.locator('#password').fill('captured-secret');
    await page.locator('button[type="submit"]').click();

    const prompt = page.locator('.kbb-update-prompt');
    await expect(prompt).toBeVisible();
    await expect(prompt.locator('[name="title"]')).toHaveValue('Example');
    await expect(prompt.locator('[name="group"]')).toHaveValue('Accounts/Old');
    await expect(prompt.locator('[name="url"]')).toHaveValue('https://example.com/login');
    await prompt.locator('[name="title"]').fill('Example Updated');
    await prompt.locator('[name="group"]').fill('Accounts/New');
    await prompt.locator('[name="url"]').fill('https://example.com/account');
    await prompt.locator('[name="userName"]').fill('edited@example.com');
    await prompt.locator('[name="password"]').fill('edited-secret');
    await prompt.locator('[name="otp"]').fill('JBSWY3DPEHPK3PXP');
    await prompt.locator('button', { hasText: 'Update' }).click();

    const updateMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        entryId: 'entry-1',
        title: 'Example Updated',
        group: 'Accounts/New',
        url: 'https://example.com/account',
        userName: 'edited@example.com',
        password: 'edited-secret',
        otp: 'JBSWY3DPEHPK3PXP'
      }
    });
  });

  test('update prompt can clear an existing TOTP secret', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-1',
                      Title: 'Example',
                      UserName: 'alice@example.com',
                      Password: 'old-secret',
                      Url: 'https://example.com/login',
                      OneTimePassword: '123456'
                    }
                  ]
                }
              };
            }
            if (message.type === 'KBB_UPDATE_LOGIN') {
              return { ok: true, response: { Success: true } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('alice@example.com');
    await page.locator('#password').fill('new-secret');
    await page.locator('button[type="submit"]').click();

    const prompt = page.locator('.kbb-update-prompt');
    await expect(prompt).toBeVisible();
    await prompt.locator('[name="clearOtp"]').check();
    await prompt.locator('button', { hasText: 'Update' }).click();

    const updateMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        entryId: 'entry-1',
        password: 'new-secret',
        clearOtp: true
      }
    });
    expect(updateMessage.login).not.toHaveProperty('otp');
  });

  test('inline picker fills the selected matching login when multiple entries exist', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_FILL_ACK') {
              return { ok: true, response: { Success: true } };
            }
            if (message.type === 'KBB_REMEMBER_PENDING_CREDENTIAL') {
              sessionStorage.setItem('__testKbbPendingMultiStepCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_PENDING_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingMultiStepCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              sessionStorage.removeItem('__testKbbPendingMultiStepCredential');
              return { ok: true, response: { credential: pending.credential } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  {
                    Title: 'Personal',
                    EntryId: 'entry-personal',
                    UserName: 'personal@example.com',
                    Password: 'personal-secret',
                    Url: 'https://example.com'
                  },
                  {
                    Title: 'Work',
                    EntryId: 'entry-work',
                    UserName: 'work@example.com',
                    Password: 'work-secret',
                    Url: 'https://example.com',
                    Group: 'Accounts/Work'
                  }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"]')).toContainText('Accounts/Work');
    await page.getByRole('menuitem', { name: /Work/ }).click();

    await expect(page.locator('#username')).toHaveValue('work@example.com');
    await expect(page.locator('#password')).toHaveValue('');
    const ackMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_FILL_ACK'));
    expect(ackMessage).toMatchObject({
      type: 'KBB_FILL_ACK',
      entryId: 'entry-work'
    });
    expect(ackMessage.url).toContain('/tests/fixtures/login-page.html');
  });

  test('inline picker explains when no logins are available for the page', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: { entries: [] }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();

    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker-empty')).toContainText('No KeePass logins found for this page.');
    await expect(page.locator('.kbb-inline-picker-empty')).toContainText('Enter a username and password, then submit the form to save a new KeePass entry.');
    await page.locator('.kbb-inline-picker-close').click();
    await expect(page.locator('.kbb-inline-picker')).toHaveCount(0);
  });

  test('inline picker explains KeePass query errors at the field', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: false,
            error: 'KeePass Bridge is locked.'
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();

    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker-error')).toContainText('KeePass Bridge is locked.');
    await expect(page.locator('.kbb-inline-picker-error')).toContainText('Open the extension popup to unlock or pair this browser.');
    await page.locator('.kbb-inline-picker-close').click();
    await expect(page.locator('.kbb-inline-picker')).toHaveCount(0);
  });

  test('inline picker can fill a selected password field action', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Personal',
                  UserName: 'personal@example.com',
                  Password: 'personal-secret',
                  OneTimePassword: '111111',
                  Url: 'https://example.com'
                },
                {
                  Title: 'Work',
                  UserName: 'work@example.com',
                  Password: 'work-secret',
                  OneTimePassword: '222222',
                  Url: 'https://example.com'
                }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="password"]').click();

    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('work-secret');
  });

  test('inline picker can copy selected field values without filling the page', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_COPY_TO_CLIPBOARD') {
              return { ok: true, response: { success: true } };
            }
            return {
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Personal',
                  UserName: 'personal@example.com',
                  Password: 'personal-secret',
                  OneTimePassword: '111111',
                  Url: 'https://example.com'
                },
                {
                  Title: 'Work',
                  UserName: 'work@example.com',
                  Password: 'work-secret',
                  OneTimePassword: '222222',
                  Url: 'https://example.com'
                }
              ]
            }
            };
          }
        },
        storage: {
          local: {
            get: async () => ({ clipboardClearDelay: 45 })
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="copy-password"]').click();

    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
    await expect.poll(async () => page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_COPY_TO_CLIPBOARD'))).toMatchObject([
      { type: 'KBB_COPY_TO_CLIPBOARD', text: 'work-secret', clearAfterMs: 45000 }
    ]);
  });

  test('inline picker can fill a selected custom field action', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Personal',
                  UserName: 'personal@example.com',
                  Password: 'personal-secret',
                  Url: 'https://example.com'
                },
                {
                  Title: 'Work',
                  UserName: 'work@example.com',
                  Password: 'work-secret',
                  Url: 'https://example.com',
                  CustomFields: [
                    { Name: 'Tenant', Value: 'production', IsProtected: false }
                  ]
                }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="custom-field"][data-kbb-custom-field="Tenant"]').click();

    await expect(page.locator('#username')).toHaveValue('production');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('inline picker can copy a selected custom field without filling the page', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_COPY_TO_CLIPBOARD') {
              return { ok: true, response: { success: true } };
            }
            return {
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Personal',
                  UserName: 'personal@example.com',
                  Password: 'personal-secret',
                  Url: 'https://example.com'
                },
                {
                  Title: 'Work',
                  UserName: 'work@example.com',
                  Password: 'work-secret',
                  Url: 'https://example.com',
                  CustomFields: [
                    { Name: 'Tenant', Value: 'production', IsProtected: false }
                  ]
                }
              ]
            }
            };
          }
        },
        storage: {
          local: {
            get: async () => ({ clipboardClearDelay: 30 })
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="copy-custom-field"][data-kbb-custom-field="Tenant"]').click();

    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
    await expect.poll(async () => page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_COPY_TO_CLIPBOARD'))).toMatchObject([
      { type: 'KBB_COPY_TO_CLIPBOARD', text: 'production', clearAfterMs: 30000 }
    ]);
  });

  test('inline picker does not expose protected custom field actions', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Personal',
                  UserName: 'personal@example.com',
                  Password: 'personal-secret',
                  Url: 'https://example.com'
                },
                {
                  Title: 'Work',
                  UserName: 'work@example.com',
                  Password: 'work-secret',
                  Url: 'https://example.com',
                  CustomFields: [
                    { Name: 'Tenant', Value: 'production', IsProtected: false },
                    { Name: 'ApiKey', Value: 'protected-secret', IsProtected: true }
                  ]
                }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-custom-field="Tenant"]')).toHaveCount(2);
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-custom-field="ApiKey"]')).toHaveCount(0);
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"]')).not.toContainText('protected-secret');
  });

  test('inline picker supports keyboard selection', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Personal',
                  UserName: 'personal@example.com',
                  Password: 'personal-secret',
                  Url: 'https://example.com'
                },
                {
                  Title: 'Work',
                  UserName: 'work@example.com',
                  Password: 'work-secret',
                  Url: 'https://example.com'
                }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Personal"]')).toBeFocused();

    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"]')).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.locator('#username')).toHaveValue('work@example.com');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('inline picker ranks frequently used logins first', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Rare',
                  UserName: 'rare@example.com',
                  Password: 'rare-secret',
                  Url: 'https://example.com',
                  UsageCount: 1,
                  LastUsed: 1000
                },
                {
                  Title: 'Frequent',
                  UserName: 'frequent@example.com',
                  Password: 'frequent-secret',
                  Url: 'https://example.com',
                  UsageCount: 25,
                  LastUsed: 2000
                }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();

    await expect(page.locator('.kbb-inline-picker [role="menuitem"]').first()).toHaveAttribute('data-kbb-entry-title', 'Frequent');
    await page.keyboard.press('Enter');

    await expect(page.locator('#username')).toHaveValue('frequent@example.com');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('inline picker expands hidden matching logins before filling', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                { Title: 'Login 1', UserName: 'one@example.com', Password: 'one-secret', Url: 'https://example.com' },
                { Title: 'Login 2', UserName: 'two@example.com', Password: 'two-secret', Url: 'https://example.com' },
                { Title: 'Login 3', UserName: 'three@example.com', Password: 'three-secret', Url: 'https://example.com' },
                { Title: 'Login 4', UserName: 'four@example.com', Password: 'four-secret', Url: 'https://example.com' },
                { Title: 'Login 5', UserName: 'five@example.com', Password: 'five-secret', Url: 'https://example.com' },
                { Title: 'Hidden Work', UserName: 'hidden@example.com', Password: 'hidden-secret', Url: 'https://example.com' }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Work"]')).toBeHidden();

    await page.locator('.kbb-inline-picker [data-kbb-action="show-more"]').click();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Work"]')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Work"] [data-kbb-action="username"]').click();

    await expect(page.locator('#username')).toHaveValue('hidden@example.com');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('inline picker focuses search and fills the first filtered login with Enter', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                { Title: 'Login 1', UserName: 'one@example.com', Password: 'one-secret', Url: 'https://example.com' },
                { Title: 'Login 2', UserName: 'two@example.com', Password: 'two-secret', Url: 'https://example.com' },
                { Title: 'Login 3', UserName: 'three@example.com', Password: 'three-secret', Url: 'https://example.com' },
                { Title: 'Login 4', UserName: 'four@example.com', Password: 'four-secret', Url: 'https://example.com' },
                { Title: 'Login 5', UserName: 'five@example.com', Password: 'five-secret', Url: 'https://example.com' },
                { Title: 'Hidden Work', UserName: 'hidden@example.com', Password: 'hidden-secret', Url: 'https://example.com' },
                { Title: 'Hidden Admin', UserName: 'admin@example.com', Password: 'admin-secret', Url: 'https://example.com' }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker-search')).toBeFocused();

    await page.keyboard.type('admin');
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Admin"]')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Work"]')).toBeHidden();

    await page.keyboard.press('Escape');

    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker-search')).toHaveValue('');
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Login 1"]')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Admin"]')).toBeHidden();

    await page.keyboard.type('admin');
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Admin"]')).toBeVisible();

    await page.keyboard.press('Control+A');
    await page.keyboard.type('missing');
    await expect(page.locator('.kbb-inline-picker-empty')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker-empty')).toContainText('No matching logins');
    await expect(page.locator('.kbb-inline-picker-clear-search')).toBeVisible();

    await page.locator('.kbb-inline-picker-clear-search').click();

    await expect(page.locator('.kbb-inline-picker-search')).toHaveValue('');
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Login 1"]')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Admin"]')).toBeHidden();

    await page.keyboard.type('admin');
    await expect(page.locator('.kbb-inline-picker [data-kbb-entry-title="Hidden Admin"]')).toBeVisible();

    await page.keyboard.press('Enter');

    await expect(page.locator('#username')).toHaveValue('admin@example.com');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test('remembers selected login across username-first multi-step flow', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_FILL_ACK') {
              return { ok: true, response: { Success: true } };
            }
            if (message.type === 'KBB_REMEMBER_PENDING_CREDENTIAL') {
              sessionStorage.setItem('__testKbbPendingMultiStepCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_PENDING_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingMultiStepCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              sessionStorage.removeItem('__testKbbPendingMultiStepCredential');
              return { ok: true, response: { credential: pending.credential } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  {
                    EntryId: 'entry-personal',
                    Title: 'Personal',
                    UserName: 'personal@example.com',
                    Password: 'personal-secret',
                    Url: 'https://example.com'
                  },
                  {
                    EntryId: 'entry-work',
                    Title: 'Work',
                    UserName: 'work@example.com',
                    Password: 'work-secret',
                    Url: 'https://example.com'
                  }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/multi-step-username.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="username"]').click();
    await expect(page.locator('#step-username')).toHaveValue('work@example.com');
    await expect.poll(async () => page.evaluate(() => window.__kbbMessages.map((message) => message.type))).toContain('KBB_REMEMBER_PENDING_CREDENTIAL');
    await page.waitForFunction(() => Boolean(sessionStorage.getItem('__testKbbPendingMultiStepCredential')));

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/multi-step-password\.html/);
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await expect(page.locator('#step-password')).toHaveValue('work-secret');
    const ackMessages = await page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_FILL_ACK'));
    expect(ackMessages.some((message) => message.entryId === 'entry-work')).toBe(true);
  });

  test('prompts to update selected login from username-first password-only submit', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_FILL_ACK') {
              return { ok: true, response: { Success: true } };
            }
            if (message.type === 'KBB_REMEMBER_PENDING_CREDENTIAL') {
              sessionStorage.setItem('__testKbbPendingMultiStepCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_PENDING_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingMultiStepCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              return { ok: true, response: { credential: pending.credential } };
            }
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              sessionStorage.setItem('__testKbbPendingSubmittedCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingSubmittedCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              sessionStorage.removeItem('__testKbbPendingSubmittedCredential');
              return { ok: true, response: { credential: pending.credential } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-personal',
                      Title: 'Personal',
                      UserName: 'personal@example.com',
                      Password: 'personal-secret',
                      Url: 'https://example.com'
                    },
                    {
                      EntryId: 'entry-work',
                      Title: 'Work',
                      UserName: 'work@example.com',
                      Password: 'work-secret',
                      Url: 'https://example.com'
                    }
                  ]
                }
              };
            }
            if (message.type === 'KBB_UPDATE_LOGIN') {
              return { ok: true, response: { Success: true } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  {
                    EntryId: 'entry-personal',
                    Title: 'Personal',
                    UserName: 'personal@example.com',
                    Password: 'personal-secret',
                    Url: 'https://example.com'
                  },
                  {
                    EntryId: 'entry-work',
                    Title: 'Work',
                    UserName: 'work@example.com',
                    Password: 'work-secret',
                    Url: 'https://example.com'
                  }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/multi-step-username.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="username"]').click();
    await page.waitForFunction(() => Boolean(sessionStorage.getItem('__testKbbPendingMultiStepCredential')));

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/multi-step-password\.html/);
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('#step-password').fill('changed-secret');
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.kbb-update-prompt')).toBeVisible();
    await expect(page.locator('.kbb-update-prompt [name="userName"]')).toHaveValue('work@example.com');
    await page.locator('.kbb-update-prompt button', { hasText: 'Update' }).click();

    const updateMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        entryId: 'entry-work',
        userName: 'work@example.com',
        password: 'changed-secret'
      }
    });
  });

  test('fills password after same-page username-first step reveals password field', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_FILL_ACK') {
              return { ok: true, response: { Success: true } };
            }
            if (message.type === 'KBB_REMEMBER_PENDING_CREDENTIAL') {
              await new Promise((resolve) => setTimeout(resolve, 60));
              sessionStorage.setItem('__testKbbPendingMultiStepCredential', JSON.stringify({
                origin: message.origin,
                credential: message.credential
              }));
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_PENDING_CREDENTIAL') {
              const pending = JSON.parse(sessionStorage.getItem('__testKbbPendingMultiStepCredential') || 'null');
              if (!pending || pending.origin !== message.origin) {
                return { ok: true, response: { credential: null } };
              }
              sessionStorage.removeItem('__testKbbPendingMultiStepCredential');
              return { ok: true, response: { credential: pending.credential } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  {
                    EntryId: 'entry-dropbox',
                    Title: 'Dropbox',
                    UserName: 'dropbox@example.com',
                    Password: 'dropbox-secret',
                    Url: 'https://www.dropbox.com/login'
                  }
                ]
              }
            };
          }
        }
      };
    });

    await page.goto('/tests/fixtures/same-page-username-first.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('#same-page-username')).toHaveValue('dropbox@example.com');

    await page.locator('#continue').click();

    await expect(page.locator('#same-page-password')).toHaveValue('dropbox-secret');
    const ackMessages = await page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_FILL_ACK'));
    expect(ackMessages.some((message) => message.entryId === 'entry-dropbox')).toBe(true);
  });

  test('fills username and password on a standard login form', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: {
            UserName: 'alice@example.com',
            Password: 'correct horse battery staple'
          }
        },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      filled: true,
      result: {
        usernameFilled: true,
        passwordFilled: true
      }
    });
    await expect(page.locator('#username')).toHaveValue('alice@example.com');
    await expect(page.locator('#password')).toHaveValue('correct horse battery staple');
  });

  test('does not add KeePass inline button to dashboard search input', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/dashboard-search-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);
  });

  test('does not add KeePass inline button to newsletter email signup', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/non-login-email-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);
  });

  test('adds OTP inline button to Google-style Vietnamese authenticator input', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/google-totp-vi-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    const otpButton = page.locator('.kbb-inline-button[aria-label="Fill one-time code from KeePass"]');
    await expect(otpButton).toHaveCount(1);
  });

  test('fills OTP on Google-style Vietnamese authenticator input', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/google-totp-vi-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: { OneTimePassword: '123456' }
        },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      filled: true,
      result: { otpFilled: true }
    });
    await expect(page.locator('input.xyezD')).toHaveValue('123456');
    await expect(page.locator('#username')).toHaveCount(0);
  });

  test('fills split OTP inputs across sibling labels', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/split-otp-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    const otpButton = page.locator('.kbb-inline-button[aria-label="Fill one-time code from KeePass"]');
    await expect(otpButton).toHaveCount(1);

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: { OneTimePassword: '654321' }
        },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      filled: true,
      result: { otpFilled: true }
    });
    await expect(page.locator('#otp-1')).toHaveValue('6');
    await expect(page.locator('#otp-2')).toHaveValue('5');
    await expect(page.locator('#otp-3')).toHaveValue('4');
    await expect(page.locator('#otp-4')).toHaveValue('3');
    await expect(page.locator('#otp-5')).toHaveValue('2');
    await expect(page.locator('#otp-6')).toHaveValue('1');
  });

  test('detects OTP input described by ARIA references', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/aria-otp-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    const otpButton = page.locator('.kbb-inline-button[aria-label="Fill one-time code from KeePass"]');
    await expect(otpButton).toHaveCount(1);

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: { OneTimePassword: '246810' }
        },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      filled: true,
      result: { otpFilled: true }
    });
    await expect(page.locator('#challenge-field')).toHaveValue('246810');
    await expect(page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]')).toHaveCount(0);
  });

  test('does not treat ordinary phone input as OTP because nearby copy mentions verification code', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/verification-copy-phone-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await expect(page.locator('.kbb-inline-button[aria-label="Fill one-time code from KeePass"]')).toHaveCount(0);
  });

  test('fills username and password inside open Shadow DOM login forms', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/shadow-login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: {
            UserName: 'shadow@example.com',
            Password: 'shadow-secret'
          }
        },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      filled: true,
      result: {
        usernameFilled: true,
        passwordFilled: true
      }
    });
    const values = await page.evaluate(() => {
      const root = document.querySelector('shadow-login').shadowRoot;
      return {
        username: root.querySelector('#shadow-username').value,
        password: root.querySelector('#shadow-password').value
      };
    });
    expect(values).toEqual({
      username: 'shadow@example.com',
      password: 'shadow-secret'
    });
  });

  test('adds inline buttons when an open Shadow DOM login form renders later', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                {
                  Title: 'Delayed Shadow',
                  UserName: 'late-shadow@example.com',
                  Password: 'late-shadow-secret',
                  Url: 'https://example.com'
                }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/delayed-shadow-login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    const shadowUsernameButton = page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]');
    await expect(shadowUsernameButton).toHaveCount(1);
    await shadowUsernameButton.click();

    const values = await page.evaluate(() => {
      const root = document.querySelector('delayed-shadow-login').shadowRoot;
      return {
        username: root.querySelector('#delayed-shadow-username').value,
        password: root.querySelector('#delayed-shadow-password').value
      };
    });
    expect(values).toEqual({
      username: 'late-shadow@example.com',
      password: ''
    });
  });

  test('prompts to save a new login after a Shadow DOM form submit', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            if (message.type === 'KBB_CREATE_LOGIN') {
              return { ok: true, response: { Success: true } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/shadow-login-page.html');
    await page.addScriptTag({ path: 'extension/contentScript.js' });

    await page.evaluate(() => {
      const root = document.querySelector('shadow-login').shadowRoot;
      root.querySelector('#shadow-username').value = 'shadow-new@example.com';
      root.querySelector('#shadow-password').value = 'shadow-new-secret';
      root.querySelector('button[type="submit"]').click();
    });

    await expect(page.locator('.kbb-save-prompt')).toBeVisible();
    await page.locator('.kbb-save-prompt button', { hasText: 'Save' }).click();

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        userName: 'shadow-new@example.com',
        password: 'shadow-new-secret'
      }
    });
  });
});
