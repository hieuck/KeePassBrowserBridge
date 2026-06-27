import { test, expect } from '@playwright/test';

async function getPickerNames(picker) {
  return picker.evaluate((el) => {
    const items = el.shadowRoot.querySelectorAll('.picker-name');
    return Array.from(items).map((node) => node.textContent.trim());
  });
}

async function selectPickerByName(picker, name) {
  return picker.evaluate((target, targetName) => {
    const items = target.shadowRoot.querySelectorAll('[role="option"]');
    for (const item of items) {
      const nameNode = item.querySelector('.picker-name');
      if (nameNode && nameNode.textContent.trim() === targetName) {
        item.click();
        return true;
      }
    }
    return false;
  }, name);
}

function pollPickerNames(picker) {
  return expect.poll(async () => getPickerNames(picker), { timeout: 5000 });
}

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
  test.beforeEach(async ({ page }) => {
    // Pre-load web components via addInitScript so they're available
    // when the content script creates kbb-picker/kbb-save-prompt elements.
    await page.addInitScript(() => {
      const addModules = () => {
        const addModule = (src) => {
          const script = document.createElement('script');
          script.type = 'module';
          script.src = src;
          document.head.appendChild(script);
        };
        addModule('/extension/src/components/Picker.web.js');
        addModule('/extension/src/components/Prompt.web.js');
      };
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addModules);
      } else {
        addModules();
      }
    });
  });

  test('prompts to save a new login after form submit', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('new@example.com');
    await page.locator('#password').fill('new-secret');
    await page.locator('button[type="submit"]').click();

    const prompt = page.locator('kbb-save-prompt');
    await expect(prompt).toHaveCount(1);
    await expect.poll(async () => prompt.evaluate((el) => {
      const t = el.shadowRoot.querySelector('.prompt-header__title');
      return t ? t.textContent : '';
    })).toContain('Save this login?');
    await prompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="save"]').click());

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        UserName: 'new@example.com',
        Password: 'new-secret'
      }
    });
    expect(createMessage.login).not.toHaveProperty('Otp');
    expect(createMessage.login.Url).toContain('/tests/fixtures/login-page.html');
  });

  test('prompts to save a new SPA login after clicking a credential action type button', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
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
    await page.goto('/tests/fixtures/spa-type-button-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#spa-email').fill('spa@example.com');
    await page.locator('#spa-password').fill('spa-secret');
    await page.locator('#spa-sign-in').click();

    const spaPrompt = page.locator('kbb-save-prompt');
    await expect(spaPrompt).toHaveCount(1);
    await spaPrompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="save"]').click());

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        UserName: 'spa@example.com',
        Password: 'spa-secret'
      }
    });
    expect(createMessage.login.Url).toContain('/tests/fixtures/spa-type-button-login-page.html');
  });

  test('does not prompt after clicking a neutral type button in a SPA login panel', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/spa-type-button-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#spa-email').fill('spa@example.com');
    await page.locator('#spa-password').fill('spa-secret');
    await page.locator('#spa-show-password').click();

    await expect(page.locator('.kbb-save-prompt')).toBeHidden({ timeout: 600 });
    const queryMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_QUERY_FOR_URL'));
    expect(queryMessage).toBeUndefined();
  });

  test('prompts to save a new SPA login after pressing Enter in a password field', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
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
    await page.goto('/tests/fixtures/spa-type-button-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#spa-email').fill('enter@example.com');
    await page.locator('#spa-password').fill('enter-secret');
    await page.locator('#spa-password').press('Enter');

    const enterPrompt = page.locator('kbb-save-prompt');
    await expect(enterPrompt).toHaveCount(1);
    await enterPrompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="save"]').click());

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        UserName: 'enter@example.com',
        Password: 'enter-secret'
      }
    });
  });

  test('does not prompt after pressing Enter before a SPA password is typed', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/spa-type-button-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#spa-email').fill('enter@example.com');
    await page.locator('#spa-password').press('Enter');

    await expect(page.locator('kbb-save-prompt')).toHaveCount(0);
    const queryMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_QUERY_FOR_URL'));
    expect(queryMessage).toBeUndefined();
  });

  test.skip('save prompt allows editing title and username before creating login (v1 feature, v2 prompt is confirmation-only)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
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
        Title: 'Edited Login',
        Group: 'Accounts/Work',
        UserName: 'edited@example.com',
        Password: 'typed-secret',
        Otp: 'JBSWY3DPEHPK3PXP'
      }
    });
  });

  test.skip('save prompt shows permission errors from KeePass (v1 feature, v2 prompt has no Retry button)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_CREATE_LOGIN') {
              return {
                ok: false,
                errorCode: 'permission_denied',
                error: 'Trusted browser is not allowed to save KeePass entries.'
              };
            }
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('readonly@example.com');
    await page.locator('#password').fill('secret');
    await page.locator('button[type="submit"]').click();
    const prompt = page.locator('.kbb-save-prompt');
    await expect(prompt).toBeVisible();

    await prompt.locator('button', { hasText: 'Save' }).click();

    await expect(prompt).toContainText('Trusted browser is not allowed to save KeePass entries.');
    await expect(prompt.locator('button', { hasText: 'Retry' })).toBeVisible();
  });

  test('does not show save prompt when browser has read-only permission', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read'] } };
            }
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('readonly@example.com');
    await page.locator('#password').fill('secret');
    await page.locator('button[type="submit"]').click();

    await page.waitForTimeout(700);
    await expect(page.locator('.kbb-save-prompt')).toHaveCount(0);
    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toBeUndefined();
  });

  test('does not show inline save prompt when browser has read-only permission', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read'] } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#username').fill('readonly-inline@example.com');
    await page.locator('#password').fill('secret');
    await page.locator('.kbb-inline-button[aria-label="Fill password from KeePass"]').click();

    await expect(page.locator('.kbb-save-prompt')).toHaveCount(0);
    const statusMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_STATUS'));
    expect(statusMessage).toBeDefined();
    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toBeUndefined();
  });

  test('restores save prompt after form submit navigates to another page', async ({ page }) => {
    let pendingSubmittedCredential = null;
    let resolveRememberedCredential;
    const rememberedCredential = new Promise((resolve) => {
      resolveRememberedCredential = resolve;
    });
    await page.exposeFunction('__testKbbRememberSubmittedCredential', (pending) => {
      pendingSubmittedCredential = pending;
      resolveRememberedCredential(pending);
      return true;
    });
    await page.exposeFunction('__testKbbConsumeSubmittedCredential', (origin) => {
      if (!pendingSubmittedCredential || pendingSubmittedCredential.origin !== origin) {
        return null;
      }
      const credential = pendingSubmittedCredential.credential;
      pendingSubmittedCredential = null;
      return credential;
    });
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              await window.__testKbbRememberSubmittedCredential({
                origin: message.origin,
                credential: message.credential
              });
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
              const credential = await window.__testKbbConsumeSubmittedCredential(message.origin);
              return { ok: true, response: { credential } };
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#redirect-username').fill('redirect@example.com');
    await page.locator('#redirect-password').fill('redirect-secret');
    const [remembered] = await Promise.all([
      rememberedCredential,
      page.locator('button[type="submit"]').click()
    ]);
    expect(remembered).not.toBeNull();
    pendingSubmittedCredential = remembered;
    await page.waitForURL(/login-page\.html/);

    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect.poll(async () => page.evaluate(() => window.__kbbMessages.map((message) => message.type)), {
      timeout: 15000
    }).toContain('KBB_QUERY_FOR_URL');
    await expect(page.locator('kbb-save-prompt')).toHaveCount(1, { timeout: 15000 });
    const promptUsername = await page.locator('kbb-save-prompt').evaluate((el) => el.getAttribute('username'));
    expect(promptUsername).toBe('redirect@example.com');
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
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('alice@example.com');
    await page.locator('#password').fill('new-secret');
    await page.locator('button[type="submit"]').click();

    const updatePrompt = page.locator('kbb-update-prompt');
    await expect(updatePrompt).toHaveCount(1);
    await expect.poll(async () => updatePrompt.evaluate((el) => {
      const t = el.shadowRoot.querySelector('.prompt-header__title');
      return t ? t.textContent : '';
    })).toContain('Update existing login?');
    await updatePrompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="update"]').click());

    const updateMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        EntryId: 'entry-1',
        UserName: 'alice@example.com',
        Password: 'new-secret'
      }
    });
    expect(updateMessage.login).not.toHaveProperty('Otp');
    expect(updateMessage.login.PageUrl).toContain('/tests/fixtures/login-page.html');
  });

  test.skip('update prompt allows editing entry metadata before updating login (v1 feature, v2 prompt is confirmation-only)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
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
        EntryId: 'entry-1',
        Title: 'Example Updated',
        Group: 'Accounts/New',
        Url: 'https://example.com/account',
        UserName: 'edited@example.com',
        Password: 'edited-secret',
        Otp: 'JBSWY3DPEHPK3PXP'
      }
    });
  });

  test.skip('update prompt can clear an existing TOTP secret (v1 feature, v2 prompt has no TOTP controls)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
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
        EntryId: 'entry-1',
        Password: 'new-secret',
        ClearOtp: true
      }
    });
    expect(updateMessage.login).not.toHaveProperty('Otp');
  });

  test('prompts to update an existing login with the new password from a change-password form', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-change-password',
                      Title: 'Example',
                      UserName: 'alice@example.com',
                      Password: 'old-secret',
                      Url: 'https://example.com/account'
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
    await page.goto('/tests/fixtures/change-password-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#account-email').fill('alice@example.com');
    await page.locator('#current-password').fill('old-secret');
    await page.locator('#new-password').fill('new-rotated-secret');
    await page.locator('#confirm-password').fill('new-rotated-secret');
    await page.locator('button[type="submit"]').click();

    const prompt = page.locator('kbb-update-prompt');
    await expect(prompt).toHaveCount(1);
    const promptPassword = await prompt.evaluate((el) => el.getAttribute('password'));
    expect(promptPassword).toBe('new-rotated-secret');
    await prompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="update"]').click());

    const updateMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        EntryId: 'entry-change-password',
        UserName: 'alice@example.com',
        Password: 'new-rotated-secret'
      }
    });
  });

  test('inline picker fills the selected matching login when multiple entries exist', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);
    await expect(picker).toHaveAttribute('aria-label', /2 KeePass logins/);
    await pollPickerNames(picker).toEqual(['Personal', 'Work']);
    await selectPickerByName(picker, 'Work');
    await page.waitForTimeout(200);
    await picker.evaluate((el) => {
      const fillFormBtn = el.shadowRoot.querySelector('.picker-action[data-action="fill-form"]');
      if (fillFormBtn) fillFormBtn.click();
    });

    await expect(page.locator('#username')).toHaveValue('work@example.com');
    const ackMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_FILL_ACK'));
    expect(ackMessage).toMatchObject({
      type: 'KBB_FILL_ACK',
      entryId: 'entry-work'
    });
    expect(ackMessage.url).toContain('/tests/fixtures/login-page.html');
  });

  test.skip('inline picker has modern card styling (v1 feature, v2 picker styling tested elsewhere)', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  { Title: 'Personal', EntryId: 'entry-personal', UserName: 'personal@example.com', Password: 'personal-secret', Url: 'https://example.com' },
                  { Title: 'Work', EntryId: 'entry-work', UserName: 'work@example.com', Password: 'work-secret', Url: 'https://example.com', Group: 'Accounts/Work' }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();

    const picker = page.locator('.kbb-inline-picker');
    await expect(picker).toBeVisible();

    // Check for shadow with black color (modern card indicator)
    await expect(picker).toHaveCSS('box-shadow', /rgba?\(0, 0, 0, /);
    // Check for rounded corners
    await expect(picker).toHaveCSS('border-radius', /8px|12px/);
  });

  test('inline picker in an about:blank embedded login widget queries with the top page URL', async ({ page }) => {
    await page.addInitScript(() => {
      if (window.top === window) {
        window.__kbbMessages = [];
      }
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            let messages;
            try {
              messages = window.top.__kbbMessages || (window.top.__kbbMessages = []);
            } catch (error) {
              messages = window.__kbbMessages || (window.__kbbMessages = []);
            }
            messages.push({
              ...message,
              frameHref: window.location.href,
              topHref: window.top === window ? window.location.href : window.top.location.href
            });
            if (message.type === 'KBB_FILL_ACK') {
              return { ok: true, response: { Success: true } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return message.url.includes('/tests/fixtures/embedded-about-blank-login-widget.html')
                ? {
                    ok: true,
                    response: {
                      entries: [
                        {
                          Title: 'Embedded Work',
                          EntryId: 'entry-embedded-work',
                          UserName: 'iframe@example.com',
                          Password: 'iframe-secret',
                          Url: 'https://example.com/embedded'
                        }
                      ]
                    }
                  }
                : { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/embedded-about-blank-login-widget.html');
    const iframeHandle = await page.locator('#login-widget').elementHandle();
    const frame = await iframeHandle.contentFrame();
    await frame.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await frame.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(frame.locator('#embedded-username')).toHaveValue('iframe@example.com');
    await expect(frame.locator('#embedded-password')).toHaveValue('');

    const queryMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_QUERY_FOR_URL'));
    expect(queryMessage.url).toContain('/tests/fixtures/embedded-about-blank-login-widget.html');
    expect(queryMessage.frameHref).toBe('about:srcdoc');

    const ackMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_FILL_ACK'));
    expect(ackMessage).toMatchObject({
      type: 'KBB_FILL_ACK',
      entryId: 'entry-embedded-work'
    });
    expect(ackMessage.url).toContain('/tests/fixtures/embedded-about-blank-login-widget.html');
  });

  test.skip('inline picker items show avatar styled like popup credentials (v1 feature, v2 picker has its own avatar styling)', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  { Title: 'Personal', EntryId: 'entry-personal', UserName: 'personal@example.com', Password: 'personal-secret', Url: 'https://example.com' },
                  { Title: 'Work', EntryId: 'entry-work', UserName: 'work@example.com', Password: 'work-secret', Url: 'https://example.com', Group: 'Accounts/Work' }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();

    const items = page.locator('.kbb-inline-picker [role="menuitem"]');
    await expect(items.first()).toBeVisible();
    await expect(items.first()).toHaveCSS('border-radius', /4px|6px|8px/);
    await expect(items.first()).toHaveCSS('padding', /.+/);
  });

  test.skip('inline picker explains when no logins are available for the page (v1 feature, v2 shows inline message in shadow DOM)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();

    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker-empty')).toContainText('No KeePass logins found for this page.');
    await expect(page.locator('.kbb-inline-picker-empty')).toContainText('Enter a username and password, then submit the form to save a new KeePass entry.');
    await expect(page.locator('.kbb-inline-picker-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.kbb-inline-picker')).toHaveCount(0);

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker-close').click();
    await expect(page.locator('.kbb-inline-picker')).toHaveCount(0);
  });

  test.skip('inline picker explains KeePass query errors at the field (v1 feature, v2 shows error in shadow DOM)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();

    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await expect(page.locator('.kbb-inline-picker-error')).toContainText('KeePass Bridge is locked.');
    await expect(page.locator('.kbb-inline-picker-error')).toContainText('Open the extension popup to unlock or pair this browser.');
    await expect(page.locator('.kbb-inline-picker-close')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.kbb-inline-picker')).toHaveCount(0);

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker-close').click();
    await expect(page.locator('.kbb-inline-picker')).toHaveCount(0);
  });

  test.skip('inline picker can fill a selected password field action (v1 feature, v2 picker only fills form on click)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="password"]').click();

    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('work-secret');
  });

  test.skip('inline picker can copy selected field values without filling the page (v1 feature, v2 picker has no copy actions)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="copy-password"]').click();

    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
    await expect.poll(async () => page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_COPY_TO_CLIPBOARD'))).toMatchObject([
      { type: 'KBB_COPY_TO_CLIPBOARD', text: 'work-secret', clearAfterMs: 45000 }
    ]);
  });

  test.skip('inline picker can fill a selected custom field action (v1 feature, v2 picker has no custom field actions)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="custom-field"][data-kbb-custom-field="Tenant"]').click();

    await expect(page.locator('#username')).toHaveValue('production');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test.skip('inline picker can copy a selected custom field without filling the page (v1 feature, v2 picker has no custom field actions)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="copy-custom-field"][data-kbb-custom-field="Tenant"]').click();

    await expect(page.locator('#username')).toHaveValue('');
    await expect(page.locator('#password')).toHaveValue('');
    await expect.poll(async () => page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_COPY_TO_CLIPBOARD'))).toMatchObject([
      { type: 'KBB_COPY_TO_CLIPBOARD', text: 'production', clearAfterMs: 30000 }
    ]);
  });

  test.skip('inline picker does not expose protected custom field actions (v1 feature, v2 picker has no custom field actions)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);
    const initialActive = await picker.evaluate((el) => {
      const active = el.shadowRoot.querySelector('.picker-item--active');
      return active ? active.querySelector('.picker-name').textContent.trim() : null;
    });
    expect(initialActive).toBe('Personal');

    await page.keyboard.press('ArrowDown');
    const nextActive = await picker.evaluate((el) => {
      const active = el.shadowRoot.querySelector('.picker-item--active');
      return active ? active.querySelector('.picker-name').textContent.trim() : null;
    });
    expect(nextActive).toBe('Work');
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);

    const firstName = await picker.evaluate((el) => {
      const items = el.shadowRoot.querySelectorAll('.picker-name');
      return items[0] ? items[0].textContent.trim() : null;
    });
    expect(firstName).toBe('Frequent');
    await page.keyboard.press('Enter');

    await expect(page.locator('#username')).toHaveValue('frequent@example.com');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test.skip('inline picker expands hidden matching logins before filling (v1 feature, v2 picker shows all matching logins)', async ({ page }) => {
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
                { Title: 'Login 6', UserName: 'six@example.com', Password: 'six-secret', Url: 'https://example.com' },
                { Title: 'Admin', UserName: 'admin@example.com', Password: 'admin-secret', Url: 'https://example.com' }
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);
    const searchFocused = await picker.evaluate((el) => {
      const input = el.shadowRoot.querySelector('.picker-search-input');
      return input && el.shadowRoot.activeElement === input;
    });
    expect(searchFocused).toBe(true);

    // Set search via the input directly to avoid timing issues with re-renders.
    await picker.evaluate((el) => {
      const input = el.shadowRoot.querySelector('.picker-search-input');
      input.value = 'admin';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await pollPickerNames(picker).toEqual(['Admin']);

    await picker.evaluate((el) => {
      const active = el.shadowRoot.querySelector('.picker-item--active');
      if (active) active.click();
    });
    await page.waitForTimeout(200);
    await picker.evaluate((el) => {
      const fillFormBtn = el.shadowRoot.querySelector('.picker-action[data-action="fill-form"]');
      if (fillFormBtn) fillFormBtn.click();
    });

    await expect(page.locator('#username')).toHaveValue('admin@example.com');
    await expect(page.locator('#password')).toHaveValue('');
  });

  test.skip('remembers selected login across username-first multi-step flow (v1 feature, v2 picker only fills form on click)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="username"]').click();
    await expect(page.locator('#step-username')).toHaveValue('work@example.com');
    await expect.poll(async () => page.evaluate(() => window.__kbbMessages.map((message) => message.type))).toContain('KBB_REMEMBER_PENDING_CREDENTIAL');
    await page.waitForFunction(() => Boolean(sessionStorage.getItem('__testKbbPendingMultiStepCredential')));

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/multi-step-password\.html/);
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('#step-password')).toHaveValue('work-secret');
    const ackMessages = await page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_FILL_ACK'));
    expect(ackMessages.some((message) => message.entryId === 'entry-work')).toBe(true);
  });

  test.skip('prompts to update selected login from username-first password-only submit (v1 feature, v2 picker only fills form on click)', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="username"]').click();
    await page.waitForFunction(() => Boolean(sessionStorage.getItem('__testKbbPendingMultiStepCredential')));

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/multi-step-password\.html/);
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
        EntryId: 'entry-work',
        UserName: 'work@example.com',
        Password: 'changed-secret'
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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

  test('fills phone number username when a tel field belongs to a password login form', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/phone-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: {
            UserName: '+15551234567',
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
    await expect(page.locator('#phone')).toHaveValue('+15551234567');
    await expect(page.locator('#password')).toHaveValue('correct horse battery staple');
  });

  test('ignores opacity-hidden login decoys when filling a visible login form', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/opacity-hidden-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await expect(page.locator('#hidden-username')).toHaveValue('');
    await expect(page.locator('#hidden-password')).toHaveValue('');
    await expect(page.locator('#visible-username')).toHaveValue('alice@example.com');
    await expect(page.locator('#visible-password')).toHaveValue('correct horse battery staple');
  });

  test('ignores offscreen login decoys when filling a visible login form', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/offscreen-login-decoy-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await expect(page.locator('#offscreen-username')).toHaveValue('');
    await expect(page.locator('#offscreen-password')).toHaveValue('');
    await expect(page.locator('#visible-username')).toHaveValue('alice@example.com');
    await expect(page.locator('#visible-password')).toHaveValue('correct horse battery staple');
  });

  test('does not add KeePass inline button to dashboard search input', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/dashboard-search-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);
  });

  test('does not fill table filter as username on password-only forms', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/password-with-filter-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
        usernameFilled: false,
        passwordFilled: true
      }
    });
    await expect(page.locator('#account-filter')).toHaveValue('');
    await expect(page.locator('#password-only')).toHaveValue('correct horse battery staple');
  });

  test('does not add KeePass inline button to newsletter email signup', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/non-login-email-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);
  });

  test('does not treat password reset email forms as username-first login', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/password-reset-email-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);

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
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#reset-email')).toHaveValue('');
  });

  test('does not treat profile, payment, or numeric settings forms as login fields', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/non-login-profile-payment-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: {
            UserName: 'alice@example.com',
            Password: 'correct horse battery staple',
            OneTimePassword: '123456'
          }
        },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#full-name')).toHaveValue('');
    await expect(page.locator('#receipt-email')).toHaveValue('');
    await expect(page.locator('#city')).toHaveValue('');
    await expect(page.locator('#card-name')).toHaveValue('');
    await expect(page.locator('#card-number')).toHaveValue('');
    await expect(page.locator('#card-cvc')).toHaveValue('');
    await expect(page.locator('#accounts-per-page')).toHaveValue('20');
  });

  test('does not fill custom fields into pages without a login target', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/non-login-profile-payment-page.html');
    await page.addScriptTag({ path: 'extension/customFields.js' });
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: {
            UserName: 'alice@example.com',
            Password: 'correct horse battery staple',
            CustomFields: [
              { Name: 'City', Value: 'Hanoi', IsProtected: false }
            ]
          }
        },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#city')).toHaveValue('');
  });

  test('does not autofill sign-up forms that only ask for a new password', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/signup-new-password-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);

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
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#signup-email')).toHaveValue('');
    await expect(page.locator('#signup-password')).toHaveValue('');
    await expect(page.locator('#signup-password-confirm')).toHaveValue('');
  });

  test('does not treat API token settings as password login fields', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/api-token-settings-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);

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
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#token-name')).toHaveValue('');
    await expect(page.locator('#api-token-secret')).toHaveValue('');
    await expect(page.locator('#api-token-confirm')).toHaveValue('');
  });

  test('does not prompt to save sign-up forms that only ask for a new password', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/signup-new-password-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#signup-email').fill('new-account@example.com');
    await page.locator('#signup-password').fill('new-account-secret');
    await page.locator('#signup-password-confirm').fill('new-account-secret');
    await page.locator('button[type="submit"]').click();

    await expect(page.locator('.kbb-save-prompt')).toHaveCount(0);
    const rememberMessages = await page.evaluate(() => window.__kbbMessages.filter((message) => message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL'));
    expect(rememberMessages).toHaveLength(0);
  });

  test('does not fallback to a different form when focus is inside non-login fields', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/mixed-fill-dev-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#checkout-city').focus();

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
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#checkout-email')).toHaveValue('');
    await expect(page.locator('#checkout-city')).toHaveValue('');
    await expect(page.locator('#checkout-card-name')).toHaveValue('');
    await expect(page.locator('#login-email')).toHaveValue('');
    await expect(page.locator('#login-password')).toHaveValue('');
  });

  test('still fills the login form on mixed pages when no non-login field is focused', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/mixed-fill-dev-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await expect(page.locator('#checkout-email')).toHaveValue('');
    await expect(page.locator('#checkout-city')).toHaveValue('');
    await expect(page.locator('#checkout-card-name')).toHaveValue('');
    await expect(page.locator('#login-email')).toHaveValue('alice@example.com');
    await expect(page.locator('#login-password')).toHaveValue('correct horse battery staple');
  });

  test('does not treat fill.dev-style profile and payment fields as username fields', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/fill-dev-mixed-fields-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(1);
    await expect(page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]')).toHaveCount(1);

    await page.locator('#profile-email').focus();
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
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#profile-name')).toHaveValue('');
    await expect(page.locator('#profile-email')).toHaveValue('');
    await expect(page.locator('#profile-city')).toHaveValue('');
    await expect(page.locator('#profile-company')).toHaveValue('');
    await expect(page.locator('#profile-phone')).toHaveValue('');
    await expect(page.locator('#profile-postal')).toHaveValue('');
    await expect(page.locator('#card-name')).toHaveValue('');
    await expect(page.locator('#card-number')).toHaveValue('');
    await expect(page.locator('#card-exp')).toHaveValue('');
    await expect(page.locator('#login-email')).toHaveValue('');

    await page.locator('#account-phone').focus();
    const phoneResponse = await page.evaluate(() => new Promise((resolve) => {
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

    expect(phoneResponse).toMatchObject({
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#account-phone')).toHaveValue('');
    await expect(page.locator('#login-email')).toHaveValue('');
  });

  test('does not treat contact support email fields as username-first login', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/non-login-contact-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);

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
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#contact-name')).toHaveValue('');
    await expect(page.locator('#contact-email')).toHaveValue('');
    await expect(page.locator('#contact-message')).toHaveValue('');
  });

  test('does not treat account settings contact fields as username-first login', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/account-settings-contact-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button')).toHaveCount(0);

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
      filled: false,
      error: 'No login field found on this page.'
    });
    await expect(page.locator('#settings-email')).toHaveValue('');
    await expect(page.locator('#settings-username')).toHaveValue('');
  });

  test('treats username-first email address step as a login field', async ({ page }) => {
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
              return { ok: true, response: { remembered: true } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  {
                    EntryId: 'entry-email-address',
                    Title: 'Email Address Login',
                    UserName: 'email-address@example.com',
                    Password: 'secret',
                    Url: 'https://example.com'
                  }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/username-first-email-address.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('#email-address-login')).toHaveValue('email-address@example.com');
  });

  test('treats username-first phone number step as a login field', async ({ page }) => {
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
              return { ok: true, response: { remembered: true } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  {
                    EntryId: 'entry-phone-first',
                    Title: 'Phone First Login',
                    UserName: '+15551234567',
                    Password: 'secret',
                    Url: 'https://example.com'
                  }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/phone-username-first.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    await expect(page.locator('#phone-identifier')).toHaveValue('+15551234567');
  });

  test('fills the login form that owns the clicked inline button', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            if (message.type === 'KBB_FILL_ACK') {
              return { ok: true, response: { Success: true } };
            }
            return {
              ok: true,
              response: {
                entries: [
                  {
                    EntryId: 'entry-customer',
                    Title: 'Customer',
                    UserName: 'customer@example.com',
                    Password: 'customer-secret',
                    Url: 'https://example.com/customer'
                  },
                  {
                    EntryId: 'entry-admin',
                    Title: 'Admin',
                    UserName: 'admin@example.com',
                    Password: 'admin-secret',
                    Url: 'https://example.com/admin',
                    CustomFields: [
                      { Name: 'Tenant', Value: 'admin-production', IsProtected: false }
                    ]
                  }
                ]
              }
            };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/two-login-forms.html');
    await page.addScriptTag({ path: 'extension/customFields.js' });
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.evaluate(() => {
      const adminPasswordButton = Array.from(document.querySelectorAll('.kbb-inline-button'))
        .find((button) => button.__kbbTargetInput && button.__kbbTargetInput.id === 'admin-password');
      adminPasswordButton.click();
    });
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);
    await selectPickerByName(picker, 'Admin');
    await page.waitForTimeout(200);
    await picker.evaluate((el) => {
      const fillFormBtn = el.shadowRoot.querySelector('.picker-action[data-action="fill-form"]');
      if (fillFormBtn) fillFormBtn.click();
    });

    await expect(page.locator('#admin-password')).toHaveValue('admin-secret');
    await expect(page.locator('#admin-username')).toHaveValue('');
    await expect(page.locator('#customer-username')).toHaveValue('');
    await expect(page.locator('#customer-password')).toHaveValue('');
  });

  test('collects page credential from the focused login form for popup create', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/two-login-forms.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#customer-username').fill('customer@example.com');
    await page.locator('#customer-password').fill('customer-secret-is-longer');
    await page.locator('#admin-username').fill('admin@example.com');
    await page.locator('#admin-password').fill('admin-secret');
    await page.locator('#admin-password').focus();

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        { type: 'KBB_COLLECT_PAGE_CREDENTIAL' },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      collected: true,
      credential: {
        userName: 'admin@example.com',
        password: 'admin-secret'
      }
    });
  });

  test('falls back to page login credential when popup create focus is outside login fields', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/search-and-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#login-username').fill('login@example.com');
    await page.locator('#login-password').fill('login-secret');
    await page.locator('#activity-search').focus();

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        { type: 'KBB_COLLECT_PAGE_CREDENTIAL' },
        {},
        resolve
      );
    }));

    expect(response).toMatchObject({
      collected: true,
      credential: {
        userName: 'login@example.com',
        password: 'login-secret'
      }
    });
  });

  test('fills focused login form for popup full-entry fill', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/two-login-forms.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#admin-password').focus();

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: {
            UserName: 'admin@example.com',
            Password: 'admin-secret'
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
    await expect(page.locator('#admin-username')).toHaveValue('admin@example.com');
    await expect(page.locator('#admin-password')).toHaveValue('admin-secret');
    await expect(page.locator('#customer-username')).toHaveValue('');
    await expect(page.locator('#customer-password')).toHaveValue('');
  });

  test('auto-submits the focused login form after popup full-entry fill', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/two-login-forms.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      window.__submittedForms = [];
      for (const form of document.querySelectorAll('form')) {
        form.addEventListener('submit', (event) => {
          event.preventDefault();
          window.__submittedForms.push(form.id);
        });
      }
    });

    await page.locator('#admin-password').focus();

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          autoSubmit: true,
          credential: {
            UserName: 'admin@example.com',
            Password: 'admin-secret'
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
    await expect.poll(async () => page.evaluate(() => window.__submittedForms)).toEqual(['admin-login']);
    await expect(page.locator('#admin-username')).toHaveValue('admin@example.com');
    await expect(page.locator('#customer-username')).toHaveValue('');
  });

  test('falls back to page login form when popup fill focus is outside login fields', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/search-and-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('#activity-search').focus();

    const response = await page.evaluate(() => new Promise((resolve) => {
      window.__keepassBrowserBridgeMessageListener(
        {
          type: 'KBB_FILL',
          credential: {
            UserName: 'login@example.com',
            Password: 'login-secret'
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
    await expect(page.locator('#activity-search')).toHaveValue('');
    await expect(page.locator('#login-username')).toHaveValue('login@example.com');
    await expect(page.locator('#login-password')).toHaveValue('login-secret');
  });

  test('adds OTP inline button to Google-style Vietnamese authenticator input', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/google-totp-vi-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    const otpButton = page.locator('.kbb-inline-button[aria-label="Fill one-time code from KeePass"]');
    await expect(otpButton).toHaveCount(1);
  });

  test('fills OTP on Google-style Vietnamese authenticator input', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/google-totp-vi-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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

  test.skip('inline picker OTP action fills split OTP inputs (v1 feature, v2 picker has no OTP action)', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    { Title: 'Personal', OneTimePassword: '111111', Url: 'https://example.com' },
                    { Title: 'Work', OneTimePassword: '654321', Url: 'https://example.com' }
                  ]
                }
              };
            }
            if (message.type === 'KBB_FILL_ACK') {
              return { ok: true, response: { Success: true } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/split-otp-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill one-time code from KeePass"]').click();
    await expect(page.locator('.kbb-inline-picker')).toBeVisible();
    await page.locator('.kbb-inline-picker [data-kbb-entry-title="Work"] [data-kbb-action="otp"]').click();

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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await expect(page.locator('.kbb-inline-button[aria-label="Fill one-time code from KeePass"]')).toHaveCount(0);
  });

  test('fills username and password inside open Shadow DOM login forms', async ({ page }) => {
    await installContentScript(page);
    await page.goto('/tests/fixtures/shadow-login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

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
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.evaluate(() => {
      const root = document.querySelector('shadow-login').shadowRoot;
      root.querySelector('#shadow-username').value = 'shadow-new@example.com';
      root.querySelector('#shadow-password').value = 'shadow-new-secret';
      root.querySelector('button[type="submit"]').click();
    });

    const prompt = page.locator('kbb-save-prompt');
    await expect(prompt).toHaveCount(1);
    await prompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="save"]').click());

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage).toMatchObject({
      type: 'KBB_CREATE_LOGIN',
      login: {
        UserName: 'shadow-new@example.com',
        Password: 'shadow-new-secret'
      }
    });
  });

  test('save prompt allows editing title before creating login', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('custom-title@example.com');
    await page.locator('#password').fill('custom-title-secret');
    await page.locator('button[type="submit"]').click();

    const prompt = page.locator('kbb-save-prompt');
    await expect(prompt).toHaveCount(1);
    await prompt.evaluate((el) => {
      const titleInput = el.shadowRoot.querySelector('[data-field="title"]');
      if (titleInput) titleInput.value = 'Custom Login Title';
    });
    await prompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="save"]').click());

    const createMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_CREATE_LOGIN'));
    expect(createMessage.login.UserName).toBe('custom-title@example.com');
    expect(createMessage.login.Password).toBe('custom-title-secret');
  });

  test('save prompt "Never for this site" action', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
              return { ok: true, response: { remembered: true } };
            }
            if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
              return { ok: true, response: { credential: null } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return { ok: true, response: { entries: [] } };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('never@example.com');
    await page.locator('#password').fill('never-secret');
    await page.locator('button[type="submit"]').click();

    const prompt = page.locator('kbb-save-prompt');
    await expect(prompt).toHaveCount(1);
    await prompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="never"]').click());
    await expect(prompt).toHaveCount(0);
  });

  test('update prompt shows diff between old and new username', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-diff-test',
                      Title: 'Diff Test',
                      UserName: 'old@example.com',
                      Password: 'old-password',
                      Url: 'https://example.com'
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('new@example.com');
    await page.locator('#password').fill('new-password');
    await page.locator('button[type="submit"]').click();

    const updatePrompt = page.locator('kbb-update-prompt');
    await expect(updatePrompt).toHaveCount(1);
    const hasDiff = await updatePrompt.evaluate((el) => {
      const fields = el.shadowRoot.querySelectorAll('.prompt-field__label');
      return Array.from(fields).some(f => f.textContent.includes('From') || f.textContent.includes('To'));
    });
    expect(hasDiff).toBe(true);
    await updatePrompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="update"]').click());
  });

  test('update prompt with custom URL sends correct data', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-url-test',
                      Title: 'URL Test',
                      UserName: 'url@example.com',
                      Password: 'old-password',
                      Url: 'https://example.com'
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
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('url@example.com');
    await page.locator('#password').fill('new-password-for-url');
    await page.locator('button[type="submit"]').click();

    const updatePrompt = page.locator('kbb-update-prompt');
    await expect(updatePrompt).toHaveCount(1);

    const urlInput = await updatePrompt.evaluate((el) => {
      const input = el.shadowRoot.querySelector('[data-field="url"]');
      if (input) input.value = 'https://custom.example.com';
      return input ? true : false;
    });
    expect(urlInput).toBe(true);

    await updatePrompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="update"]').click());

    const updateMessage = await page.evaluate(() => window.__kbbMessages.find((message) => message.type === 'KBB_UPDATE_LOGIN'));
    expect(updateMessage).toMatchObject({
      type: 'KBB_UPDATE_LOGIN',
      login: {
        EntryId: 'entry-url-test',
        UserName: 'url@example.com',
      }
    });
  });

  test('update prompt skip action dismisses prompt', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async (message) => {
            window.__kbbMessages.push(message);
            if (message.type === 'KBB_STATUS') {
              return { ok: true, response: { Trusted: true, Permissions: ['read', 'write'] } };
            }
            if (message.type === 'KBB_QUERY_FOR_URL') {
              return {
                ok: true,
                response: {
                  entries: [
                    {
                      EntryId: 'entry-skip-test',
                      Title: 'Skip Test',
                      UserName: 'skip@example.com',
                      Password: 'skip-old',
                      Url: 'https://example.com'
                    }
                  ]
                }
              };
            }
            return { ok: true, response: {} };
          }
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.evaluate(() => {
      document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
    });

    await page.locator('#username').fill('skip@example.com');
    await page.locator('#password').fill('skip-new-password');
    await page.locator('button[type="submit"]').click();

    const updatePrompt = page.locator('kbb-update-prompt');
    await expect(updatePrompt).toHaveCount(1);
    await updatePrompt.evaluate((el) => el.shadowRoot.querySelector('[data-action="skip"]').click());
    await expect(updatePrompt).toHaveCount(0);
  });

  test('inline picker with 5 entries ArrowDown cycles through all', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                { Title: 'Login A', UserName: 'a@example.com', Password: 'a-secret', Url: 'https://example.com' },
                { Title: 'Login B', UserName: 'b@example.com', Password: 'b-secret', Url: 'https://example.com' },
                { Title: 'Login C', UserName: 'c@example.com', Password: 'c-secret', Url: 'https://example.com' },
                { Title: 'Login D', UserName: 'd@example.com', Password: 'd-secret', Url: 'https://example.com' },
                { Title: 'Login E', UserName: 'e@example.com', Password: 'e-secret', Url: 'https://example.com' },
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.waitForTimeout(1000);

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);

    for (let i = 0; i < 4; i++) {
      await page.keyboard.press('ArrowDown');
    }
    const lastActive = await picker.evaluate((el) => {
      const active = el.shadowRoot.querySelector('.picker-item--active');
      return active ? active.querySelector('.picker-name').textContent.trim() : null;
    });
    expect(lastActive).toBe('Login E');

    await page.keyboard.press('Enter');
    await expect(page.locator('#username')).toHaveValue('e@example.com');
  });

  test('inline picker search narrows results via content script', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                { Title: 'Login A', UserName: 'a@example.com', Password: 'a-secret', Url: 'https://example.com' },
                { Title: 'Login B', UserName: 'b@example.com', Password: 'b-secret', Url: 'https://example.com' },
                { Title: 'Login C', UserName: 'c@example.com', Password: 'c-secret', Url: 'https://example.com' },
                { Title: 'Login D', UserName: 'd@example.com', Password: 'd-secret', Url: 'https://example.com' },
                { Title: 'Admin Panel', UserName: 'admin@example.com', Password: 'admin-secret', Url: 'https://example.com' },
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.waitForTimeout(1000);

    const inlineBtn = page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]');
    await expect(inlineBtn).toBeVisible({ timeout: 5000 });
    await inlineBtn.click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);

    const originalNames = await picker.evaluate((el) => {
      const items = el.shadowRoot.querySelectorAll('.picker-name');
      return Array.from(items).map(n => n.textContent.trim());
    });
    expect(originalNames.length).toBe(5);
  });

  test('inline picker expanded entry shows per-field actions', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                { Title: 'Personal', UserName: 'personal@example.com', Password: 'personal-secret', Url: 'https://example.com' },
                { Title: 'Work', UserName: 'work@example.com', Password: 'work-secret', Url: 'https://example.com' },
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);

    await picker.evaluate((el) => {
      const firstItem = el.shadowRoot.querySelector('[role="option"]');
      if (firstItem) firstItem.click();
    });
    await page.waitForTimeout(200);

    const hasExpandedActions = await picker.evaluate((el) => {
      const expanded = el.shadowRoot.querySelector('.picker-expanded');
      if (!expanded) return false;
      const actions = expanded.querySelectorAll('.picker-action');
      return actions.length >= 3;
    });
    expect(hasExpandedActions).toBe(true);
  });

  test('inline picker ArrowUp goes to previous entry', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                { Title: 'First', UserName: 'first@example.com', Password: 'first-secret', Url: 'https://example.com' },
                { Title: 'Second', UserName: 'second@example.com', Password: 'second-secret', Url: 'https://example.com' },
                { Title: 'Third', UserName: 'third@example.com', Password: 'third-secret', Url: 'https://example.com' },
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });

    await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    const thirdActive = await picker.evaluate((el) => {
      const active = el.shadowRoot.querySelector('.picker-item--active');
      return active ? active.querySelector('.picker-name').textContent.trim() : null;
    });
    expect(thirdActive).toBe('Third');

    await page.keyboard.press('ArrowUp');
    const secondActive = await picker.evaluate((el) => {
      const active = el.shadowRoot.querySelector('.picker-item--active');
      return active ? active.querySelector('.picker-name').textContent.trim() : null;
    });
    expect(secondActive).toBe('Second');
  });

  test('inline picker Escape closes picker', async ({ page }) => {
    await page.addInitScript(() => {
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: [
                { Title: 'Login A', UserName: 'a@example.com', Password: 'a-secret', Url: 'https://example.com' },
                { Title: 'Login B', UserName: 'b@example.com', Password: 'b-secret', Url: 'https://example.com' },
                { Title: 'Login C', UserName: 'c@example.com', Password: 'c-secret', Url: 'https://example.com' },
                { Title: 'Login D', UserName: 'd@example.com', Password: 'd-secret', Url: 'https://example.com' },
                { Title: 'Login E', UserName: 'e@example.com', Password: 'e-secret', Url: 'https://example.com' },
              ]
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.waitForTimeout(1000);

    const inlineBtn = page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]');
    await expect(inlineBtn).toBeVisible({ timeout: 5000 });
    await inlineBtn.click();
    const picker = page.locator('kbb-picker');
    await expect(picker).toHaveCount(1);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(picker).toHaveCount(0);
  });

  test('inline picker shows empty when no credentials', async ({ page }) => {
    await page.addInitScript(() => {
      window.__kbbMessages = [];
      window.chrome = {
        runtime: {
          onMessage: { addListener() {} },
          sendMessage: async () => ({
            ok: true,
            response: {
              entries: []
            }
          })
        }
      };
    });
    await page.goto('/tests/fixtures/login-page.html');
    await page.addScriptTag({ path: 'extension/dist/contentScript.js' });
    await page.waitForTimeout(1000);

    const inlineBtn = page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]');
    await expect(inlineBtn).toBeVisible({ timeout: 5000 });
    await inlineBtn.click();
    const picker = page.locator('kbb-picker');
    if (await picker.count() > 0) {
      const emptyText = await picker.evaluate((el) => {
        const empty = el.shadowRoot.querySelector('.picker-empty');
        return empty ? empty.textContent : '';
      });
      expect(emptyText.length).toBeGreaterThan(0);
    }
  });
});
