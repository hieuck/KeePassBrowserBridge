import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const viewport = { width: 1280, height: 800 };
const outputDir = resolveOutputDir();
const extensionManifest = JSON.parse(await fs.readFile(path.join(repoRoot, 'extension', 'manifest.json'), 'utf8'));
const releaseVersion = String(extensionManifest.version || '').trim();

if (!releaseVersion) {
  throw new Error('Cannot determine release version from extension/manifest.json.');
}

const entries = [
  {
    EntryId: 'entry-work',
    Title: 'Work Portal',
    Group: 'Accounts/Work',
    UserName: 'work@example.test',
    Password: 'not-shown-in-store-screenshot',
    OneTimePassword: '123456',
    Url: 'https://example.test/login',
    UsageCount: 12,
    LastUsed: 1779990400000,
    CustomFields: [
      { Name: 'Tenant', Value: 'production', IsProtected: false },
      { Name: 'ApiKey', Value: 'protected-value', IsProtected: true }
    ]
  },
  {
    EntryId: 'entry-personal',
    Title: 'Personal Account',
    Group: 'Accounts/Personal',
    UserName: 'personal@example.test',
    Password: 'not-shown-in-store-screenshot',
    Url: 'https://example.test/login',
    UsageCount: 3,
    LastUsed: 1779900000000
  }
];

const trustedClients = [
  {
    ClientId: 'client-current',
    ClientName: 'Chrome profile',
    ExtensionOrigin: 'chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    Current: true,
    Permissions: ['read', 'write', 'manageClients'],
    CreatedUtcMs: 1779990000000,
    LastUsedUtcMs: 1779991200000
  },
  {
    ClientId: 'client-firefox',
    ClientName: 'Firefox profile',
    ExtensionOrigin: 'moz-extension://bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    Current: false,
    Permissions: ['read'],
    CreatedUtcMs: 1779900000000,
    LastUsedUtcMs: 1779900600000
  }
];

await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch();
try {
  await capturePopupPairing(browser);
  await capturePopupAccountPicker(browser);
  await captureInlinePicker(browser);
  await captureSavePrompt(browser);
  await captureSettingsTrustedBrowsers(browser);
} finally {
  await browser.close();
}

console.log(`Store screenshots written to ${outputDir}`);

function resolveOutputDir() {
  const outIndex = process.argv.indexOf('--out');
  if (outIndex >= 0 && process.argv[outIndex + 1]) {
    return path.resolve(process.cwd(), process.argv[outIndex + 1]);
  }

  return path.join(repoRoot, 'docs', 'store-assets', 'screenshots');
}

function repoFile(...segments) {
  return path.join(repoRoot, ...segments);
}

function repoFileUrl(...segments) {
  return pathToFileURL(repoFile(...segments)).href;
}

async function newCapturePage(browser) {
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(15000);
  return page;
}

async function capture(page, fileName) {
  await page.evaluate(() => document.fonts && document.fonts.ready);
  await page.screenshot({
    path: path.join(outputDir, fileName),
    fullPage: false
  });
}

async function installPopupMock(page, stateOverrides = {}) {
  await page.addInitScript(({ entries, trustedClients, releaseVersion, stateOverrides }) => {
    const state = {
      endpoint: 'http://127.0.0.1:19455/bridge',
      paired: true,
      pairingSessionId: '',
      pairingExpiresAt: 0,
      autoFillEnabled: true,
      autoSubmitEnabled: false,
      locked: false,
      permissions: ['read', 'write', 'manageClients'],
      ...stateOverrides
    };
    const storage = {
      theme: 'light',
      showPasswordsInPopup: false,
      clipboardClearDelay: 30,
      siteOverrides: []
    };

    window.chrome = {
      runtime: {
        sendMessage(message) {
          if (message.type === 'KBB_GET_STATE') {
            return Promise.resolve({ ok: true, response: { ...state } });
          }
          if (message.type === 'KBB_HELLO') {
            return Promise.resolve({ ok: true, response: { Success: true } });
          }
          if (message.type === 'KBB_STATUS') {
            return Promise.resolve({
              ok: true,
              response: { Trusted: state.paired, Permissions: state.permissions }
            });
          }
          if (message.type === 'KBB_PAIR_BEGIN') {
            state.paired = false;
            state.pairingSessionId = 'store-session';
            state.pairingExpiresAt = Date.now() + 300000;
            return Promise.resolve({ ok: true, response: { ...state } });
          }
          if (message.type === 'KBB_QUERY_LOGINS') {
            return Promise.resolve({
              ok: true,
              response: {
                url: 'https://example.test/login',
                entries
              }
            });
          }
          if (message.type === 'KBB_COLLECT_PAGE_CREDENTIAL') {
            return Promise.resolve({
              ok: true,
              response: {
                collected: true,
                credential: {
                  userName: 'typed@example.test',
                  password: 'typed-secret'
                }
              }
            });
          }
          if (message.type === 'KBB_LIST_CLIENTS') {
            return Promise.resolve({ ok: true, response: { Clients: trustedClients } });
          }
          if (message.type === 'KBB_GET_ABOUT') {
            return Promise.resolve({
              ok: true,
              response: {
                name: 'KeePass Browser Bridge',
                version: releaseVersion,
                pluginVersion: releaseVersion,
                browserId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                repositoryUrl: 'https://github.com/hieuck/KeePassBrowserBridge',
                releasesUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases'
              }
            });
          }
          return Promise.resolve({ ok: true, response: {} });
        }
      },
      storage: {
        local: {
          get(keys, callback) {
            let result = {};
            if (keys === null) {
              result = { ...storage };
            } else if (Array.isArray(keys)) {
              result = Object.fromEntries(keys.map((key) => [key, storage[key]]));
            } else if (typeof keys === 'object') {
              result = { ...keys, ...storage };
            } else if (typeof keys === 'string') {
              result = { [keys]: storage[keys] };
            }
            if (callback) callback(result);
            return Promise.resolve(result);
          },
          set(values, callback) {
            Object.assign(storage, values);
            if (callback) callback();
            return Promise.resolve();
          }
        }
      }
    };
  }, { entries, trustedClients, releaseVersion, stateOverrides });
}

async function centerPopupForStore(page) {
  await page.addStyleTag({
    content: `
      html {
        width: 1280px;
        min-height: 800px;
        background: #e8edf3;
      }

      body {
        width: 1280px !important;
        min-height: 800px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 20px;
        background: #e8edf3 !important;
      }

      .shell {
        width: 360px;
        background: var(--bg);
        border: 1px solid #d7dde5;
        border-radius: 8px;
        box-shadow: 0 18px 54px rgba(15, 23, 42, 0.22);
        transform: scale(0.92);
        transform-origin: top center;
      }
    `
  });
}

async function capturePopupPairing(browser) {
  const page = await newCapturePage(browser);
  await installPopupMock(page, {
    paired: false,
    permissions: ['read']
  });
  await page.goto(repoFileUrl('extension', 'popup.html'));
  await centerPopupForStore(page);
  await page.locator('#beginPair').click();
  await page.locator('#pairingCode').fill('955963');
  await page.locator('#pairingPanel').waitFor({ state: 'visible' });
  await capture(page, '01-popup-pairing.png');
  await page.close();
}

async function capturePopupAccountPicker(browser) {
  const page = await newCapturePage(browser);
  await installPopupMock(page);
  await page.goto(repoFileUrl('extension', 'popup.html'));
  await centerPopupForStore(page);
  await page.locator('#queryLogins').click();
  await page.locator('.login-title').first().waitFor({ state: 'visible' });
  await page.locator('#loginSearch').fill('work');
  await capture(page, '02-popup-account-picker.png');
  await page.close();
}

async function installContentScriptMock(page, mode) {
  await page.addInitScript(({ entries, mode }) => {
    window.__kbbMessages = [];
    window.chrome = {
      runtime: {
        onMessage: { addListener() {} },
        sendMessage(message) {
          window.__kbbMessages.push(message);
          if (message.type === 'KBB_QUERY_FOR_URL') {
            return Promise.resolve({
              ok: true,
              response: {
                entries: mode === 'save-prompt' ? [] : entries
              }
            });
          }
          if (message.type === 'KBB_REMEMBER_SUBMITTED_CREDENTIAL') {
            return Promise.resolve({ ok: true, response: { remembered: true } });
          }
          if (message.type === 'KBB_CONSUME_SUBMITTED_CREDENTIAL') {
            return Promise.resolve({ ok: true, response: { credential: null } });
          }
          if (message.type === 'KBB_CREATE_LOGIN') {
            return Promise.resolve({ ok: true, response: { Success: true } });
          }
          if (message.type === 'KBB_FILL_ACK') {
            return Promise.resolve({ ok: true, response: { Success: true } });
          }
          return Promise.resolve({ ok: true, response: {} });
        }
      }
    };
  }, { entries, mode });
}

async function injectContentScripts(page) {
  await page.addScriptTag({ path: repoFile('extension', 'customFields.js') });
  await page.addScriptTag({ path: repoFile('extension', 'contentScript.js') });
}

async function captureInlinePicker(browser) {
  const page = await newCapturePage(browser);
  await installContentScriptMock(page, 'inline-picker');
  await page.goto(repoFileUrl('tests', 'fixtures', 'login-page.html'));
  await injectContentScripts(page);
  await page.locator('.kbb-inline-button[aria-label="Fill username from KeePass"]').click();
  await page.locator('.kbb-inline-picker').waitFor({ state: 'visible' });
  await capture(page, '03-inline-picker.png');
  await page.close();
}

async function captureSavePrompt(browser) {
  const page = await newCapturePage(browser);
  await installContentScriptMock(page, 'save-prompt');
  await page.goto(repoFileUrl('tests', 'fixtures', 'login-page.html'));
  await injectContentScripts(page);
  await page.evaluate(() => {
    document.querySelector('form').addEventListener('submit', (event) => event.preventDefault());
  });
  await page.locator('#username').fill('new@example.test');
  await page.locator('#password').fill('stored-only-in-keepass');
  await page.locator('button[type="submit"]').click();
  await page.locator('.kbb-save-prompt').waitFor({ state: 'visible' });
  await capture(page, '04-save-login-prompt.png');
  await page.close();
}

async function installOptionsMock(page) {
  await page.addInitScript(({ trustedClients, releaseVersion }) => {
    const storage = {
      endpoint: 'http://127.0.0.1:19455/bridge',
      theme: 'light',
      autoFillEnabled: true,
      autoSubmitEnabled: false,
      autoFillDelay: 1200,
      strictUrlMatching: false,
      regexUrlMatching: false,
      showPasswordsInPopup: false,
      notificationsEnabled: true,
      autoLockTimeoutMinutes: 15,
      clipboardClearDelay: 30,
      debugMode: false,
      siteOverrides: [
        { host: 'bank.example.test', autoFillEnabled: false, autoSubmitEnabled: false },
        { host: 'portal.example.test', autoFillEnabled: true, autoSubmitEnabled: true }
      ]
    };

    window.chrome = {
      runtime: {
        sendMessage(message) {
          if (message.type === 'KBB_GET_ABOUT') {
            return Promise.resolve({
              ok: true,
              response: {
                name: 'KeePass Browser Bridge',
                version: releaseVersion,
                pluginVersion: releaseVersion,
                browserId: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                repositoryUrl: 'https://github.com/hieuck/KeePassBrowserBridge',
                releasesUrl: 'https://github.com/hieuck/KeePassBrowserBridge/releases'
              }
            });
          }
          if (message.type === 'KBB_HELLO') {
            return Promise.resolve({ ok: true, response: { Success: true } });
          }
          if (message.type === 'KBB_LIST_CLIENTS') {
            return Promise.resolve({ ok: true, response: { Clients: trustedClients } });
          }
          return Promise.resolve({ ok: true, response: {} });
        }
      },
      storage: {
        local: {
          get(keys, callback) {
            let result = {};
            if (keys === null) {
              result = { ...storage };
            } else if (Array.isArray(keys)) {
              result = Object.fromEntries(keys.map((key) => [key, storage[key]]));
            } else if (typeof keys === 'object') {
              result = { ...keys, ...storage };
            } else if (typeof keys === 'string') {
              result = { [keys]: storage[keys] };
            }
            if (callback) callback(result);
            return Promise.resolve(result);
          },
          set(values, callback) {
            Object.assign(storage, values);
            if (callback) callback();
            return Promise.resolve();
          }
        }
      }
    };
  }, { trustedClients, releaseVersion });
}

async function captureSettingsTrustedBrowsers(browser) {
  const page = await newCapturePage(browser);
  await installOptionsMock(page);
  await page.goto(repoFileUrl('extension', 'options.html'));
  await page.locator('#refreshTrustedBrowsers').click();
  await page.locator('#trustedBrowserList').waitFor({ state: 'visible' });
  await page.locator('#trustedBrowserList').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await capture(page, '05-settings-trusted-browsers.png');
  await page.close();
}
