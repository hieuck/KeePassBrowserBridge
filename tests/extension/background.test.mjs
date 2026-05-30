import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const storage = {
  endpoint: 'http://127.0.0.1:19455/bridge',
  pairingSessionId: 'expired-session',
  pairingStartedAt: 1000
};
const requests = [];
const extensionSessionStorage = {};
const notifications = [];
const badgeCalls = [];
let now = 10000;
let loginEntries = [];

const sandbox = {
  console,
  URL,
  TextEncoder,
  Date: class extends Date {
    static now() {
      return now;
    }
  },
  btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
  crypto: {
    randomUUID: () => '00112233-4455-6677-8899-aabbccddeeff',
    getRandomValues(bytes) {
      bytes.fill(1);
      return bytes;
    },
    subtle: {
      importKey: async () => ({}),
      sign: async () => new Uint8Array([1, 2, 3]).buffer
    }
  },
  fetch: async (url, options) => {
    if (String(url).startsWith('https://api.github.com/repos/hieuck/KeePassBrowserBridge/releases/latest')) {
      return {
        ok: true,
        json: async () => ({
          tag_name: 'v0.10.0',
          html_url: 'https://github.com/hieuck/KeePassBrowserBridge/releases/tag/v0.10.0'
        })
      };
    }

    const request = JSON.parse(options.body);
    requests.push(request);
    if (request.Method === 'hello') {
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: '{"ProductName":"KeePass Browser Bridge","ProtocolVersion":1}'
        })
      };
    }

    if (request.Method === 'pair.cancel') {
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: '{"Cancelled":true,"PairingSessionId":"cancel-session"}'
        })
      };
    }

    if (request.Method === 'pair.begin') {
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: '{"PairingSessionId":"fresh-session"}'
        })
      };
    }

    if (request.Method === 'logins.query') {
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: JSON.stringify({ Entries: loginEntries })
        })
      };
    }

    if (request.Method === 'logins.fillAck') {
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: '{"Success":true}'
        })
      };
    }

    if (request.Method === 'logins.create' || request.Method === 'logins.update') {
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: JSON.stringify({
            Success: true,
            Entry: {
              EntryId: 'entry-saved',
              Title: 'Saved Entry',
              UserName: 'saved@example.com',
              Url: 'https://example.com/login'
            }
          })
        })
      };
    }

    return {
      ok: true,
      json: async () => ({
        ProtocolVersion: 1,
        RequestId: request.RequestId,
        Success: false,
        ErrorCode: 'pairing_session_expired',
        Error: 'Pairing session has expired.'
      })
    };
  },
  chrome: {
    runtime: {
      id: 'abcdefghijklmnopabcdefghijklmnop',
      getURL: () => 'chrome-extension://abcdefghijklmnopabcdefghijklmnop/',
      getManifest: () => ({
        name: 'KeePass Browser Bridge',
        version: '0.9.0'
      }),
      onMessage: { addListener(fn) { sandbox.runtimeMessageHandler = fn; } },
      onInstalled: { addListener() {} }
    },
    action: {
      setBadgeText: async (details) => {
        badgeCalls.push({ method: 'setBadgeText', details });
      },
      setBadgeBackgroundColor: async (details) => {
        badgeCalls.push({ method: 'setBadgeBackgroundColor', details });
      }
    },
    tabs: {
      onUpdated: { addListener(fn) { sandbox.tabsUpdatedHandler = fn; } },
      query: async () => []
    },
    scripting: {
      executeScript: async () => {}
    },
    storage: {
      local: {
        get: async (keys) => {
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, storage[key]]));
          }

          return { ...storage };
        },
        set: async (values) => {
          Object.assign(storage, values);
        },
        remove: async (keys) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete storage[key];
          }
        }
      },
      session: {
        get: async (keys) => {
          if (Array.isArray(keys)) {
            return Object.fromEntries(keys.map((key) => [key, extensionSessionStorage[key]]));
          }

          return { ...extensionSessionStorage };
        },
        set: async (values) => {
          Object.assign(extensionSessionStorage, values);
        },
        remove: async (keys) => {
          for (const key of Array.isArray(keys) ? keys : [keys]) {
            delete extensionSessionStorage[key];
          }
        }
      }
    },
    contextMenus: {
      create: () => {},
      onClicked: { addListener(fn) { sandbox.contextMenuHandler = fn; } }
    },
    webRequest: {
      onAuthRequired: {
        addListener(fn, filter, extraInfoSpec) {
          sandbox.httpAuthRequiredHandler = fn;
          sandbox.httpAuthFilter = filter;
          sandbox.httpAuthExtraInfoSpec = extraInfoSpec;
        }
      }
    },
    notifications: {
      create: async (id, options) => {
        notifications.push({ id, options });
        return id;
      }
    }
  }
};
sandbox.globalThis = sandbox;

const source = fs.readFileSync(new URL('../../extension/background.js', import.meta.url), 'utf8');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'background.js' });

const externalMessageResponse = await new Promise((resolve) => {
  sandbox.runtimeMessageHandler(
    { type: 'KBB_GET_STATE' },
    { id: 'externalextensionexternalextension' },
    resolve
  );
});
assert.equal(externalMessageResponse.ok, false, 'background should reject messages from other extensions');
assert.match(externalMessageResponse.error, /not allowed/i, 'external sender error should be explicit');

const about = await sandbox.handleMessage({ type: 'KBB_GET_ABOUT' });
assert.equal(about.name, 'KeePass Browser Bridge', 'about should include extension name');
assert.equal(about.version, '0.9.0', 'about should include extension version');
assert.equal(about.repositoryUrl, 'https://github.com/hieuck/KeePassBrowserBridge', 'about should include repository URL');
assert.equal(about.releasesUrl, 'https://github.com/hieuck/KeePassBrowserBridge/releases', 'about should include releases URL');
assert.equal(about.browserId, 'abcdefghijklmnopabcdefghijklmnop', 'about should include browser extension id');

const updateCheck = await sandbox.handleMessage({ type: 'KBB_CHECK_UPDATES' });
assert.equal(updateCheck.currentVersion, '0.9.0', 'update check should include current version');
assert.equal(updateCheck.latestVersion, '0.10.0', 'update check should normalize latest tag version');
assert.equal(updateCheck.updateAvailable, true, 'newer GitHub release should be reported');
assert.equal(updateCheck.releaseUrl, 'https://github.com/hieuck/KeePassBrowserBridge/releases/tag/v0.10.0', 'update check should include latest release URL');

requests.length = 0;
storage.endpoint = 'https://evil.example/bridge';
await assert.rejects(
  () => sandbox.handleMessage({ type: 'KBB_HELLO' }),
  /Endpoint must be an http:\/\/127\.0\.0\.1 URL\./,
  'background should reject a non-loopback endpoint loaded from storage before network access'
);
assert.equal(requests.length, 0, 'background should not send bridge requests to a non-loopback endpoint');
storage.endpoint = 'http://127.0.0.1:19455/bridge';

requests.length = 0;
sandbox.chrome.runtime.getURL = () => 'moz-extension://12345678-90ab-cdef-1234-567890abcdef/';
await sandbox.handleMessage({ type: 'KBB_HELLO' });
assert.equal(requests[0].Origin, 'moz-extension://12345678-90ab-cdef-1234-567890abcdef', 'background should derive request origin from runtime URL for Firefox');
sandbox.chrome.runtime.getURL = () => 'chrome-extension://abcdefghijklmnopabcdefghijklmnop/';

storage.pairingSessionId = 'active-session';
storage.pairingStartedAt = 1000;
now = 2000;
const activePairingState = await sandbox.getState();
assert.equal(activePairingState.pairingSessionId, 'active-session', 'active pairing session should remain visible before expiry');
assert.equal(activePairingState.pairingExpiresAt, 301000, 'state should expose pairing expiry time for popup feedback');
assert.equal(activePairingState.autoFillEnabled, true, 'first-run state should default auto-fill to enabled like the options page');
assert.equal(activePairingState.autoSubmitEnabled, false, 'first-run state should default auto-submit to disabled like the options page');

storage.pairingSessionId = 'expired-session';
storage.pairingStartedAt = 1000;
now = 302000;
const locallyExpiredState = await sandbox.getState();
assert.equal(locallyExpiredState.pairingSessionId, '', 'locally expired pairing session should be cleared');
assert.equal(storage.pairingStartedAt, 0, 'locally expired pairing timestamp should be cleared');

now = 5000;
const newPairingState = await sandbox.pairBegin();
assert.equal(storage.pairingSessionId, 'fresh-session', 'pair begin should store the bridge session id');
assert.equal(storage.pairingStartedAt, 5000, 'pair begin should store the local start time');
assert.equal(newPairingState.pairingExpiresAt, 305000, 'pair begin state should include expiry time');

requests.length = 0;
storage.pairingSessionId = 'old-session';
storage.pairingStartedAt = 4000;
await sandbox.pairBegin();
assert.equal(requests[0].Method, 'pair.cancel', 'pair begin should cancel the previous local session before starting a new one');
assert.match(requests[0].Payload, /old-session/, 'pair begin should cancel the stored stale session id');
assert.equal(requests[1].Method, 'pair.begin', 'pair begin should request a fresh session after cancellation');

storage.pairingSessionId = 'expired-session';
storage.pairingStartedAt = 1000;
await assert.rejects(
  () => sandbox.pairComplete('123456'),
  /Pairing session has expired\./
);

assert.equal(storage.pairingSessionId, '', 'expired pairing failure should clear the stored pairing session');
assert.equal(storage.pairingStartedAt, 0, 'expired pairing failure should clear the stored pairing timestamp');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
storage.pairingSessionId = 'stale-session';
storage.pairingStartedAt = 1000;
const pairedState = await sandbox.getState();
assert.equal(pairedState.paired, true);
assert.equal(pairedState.pairingSessionId, '', 'paired state should not expose a stale pairing session');
assert.equal(storage.pairingStartedAt, 0, 'paired state should clear stale pairing timestamp');

delete storage.clientId;
delete storage.sharedSecret;
storage.pairingSessionId = 'cancel-session';
storage.pairingStartedAt = 1000;
requests.length = 0;
await sandbox.pairCancel();
assert.equal(storage.pairingSessionId, '', 'cancel should clear the stored pairing session');
assert.equal(storage.pairingStartedAt, 0, 'cancel should clear the stored pairing timestamp');
const cancelRequest = requests.find((request) => request.Method === 'pair.cancel');
assert.ok(cancelRequest, 'cancel should notify the bridge');
assert.match(cancelRequest.Payload, /cancel-session/);

now = 6000;
const rememberPendingResult = await sandbox.handleMessage({
  type: 'KBB_REMEMBER_PENDING_CREDENTIAL',
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-work',
    UserName: 'work@example.com',
    Password: 'work-secret'
  }
});
assert.equal(rememberPendingResult.remembered, true, 'background should remember a pending multi-step credential');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential.credential.EntryId, 'entry-work', 'pending credential should be stored in extension session storage');

const wrongOriginPendingResult = await sandbox.handleMessage({
  type: 'KBB_CONSUME_PENDING_CREDENTIAL',
  origin: 'https://other.example.com'
});
assert.equal(wrongOriginPendingResult.credential, null, 'pending multi-step credential should be scoped to its origin');
assert.ok(extensionSessionStorage.kbbPendingMultiStepCredential, 'wrong-origin consume should not remove the pending credential');

const consumedPendingResult = await sandbox.handleMessage({
  type: 'KBB_CONSUME_PENDING_CREDENTIAL',
  origin: 'https://example.com'
});
assert.equal(consumedPendingResult.credential.Password, 'work-secret', 'same-origin consume should return the remembered credential');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'pending credential should be removed after successful consume');

now = 7000;
await sandbox.handleMessage({
  type: 'KBB_REMEMBER_PENDING_CREDENTIAL',
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-expired',
    UserName: 'old@example.com',
    Password: 'old-secret'
  }
});
now += 10 * 60 * 1000 + 1;
const expiredPendingResult = await sandbox.handleMessage({
  type: 'KBB_CONSUME_PENDING_CREDENTIAL',
  origin: 'https://example.com'
});
assert.equal(expiredPendingResult.credential, null, 'expired pending multi-step credential should not be returned');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'expired pending credential should be removed');

now = 8000;
const rememberSubmittedResult = await sandbox.handleMessage({
  type: 'KBB_REMEMBER_SUBMITTED_CREDENTIAL',
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'new@example.com',
    password: 'new-secret'
  }
});
assert.equal(rememberSubmittedResult.remembered, true, 'background should remember a submitted credential for save-after-redirect');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential.credential.password, 'new-secret', 'submitted credential should be stored in extension session storage');

const submittedWrongOrigin = await sandbox.handleMessage({
  type: 'KBB_CONSUME_SUBMITTED_CREDENTIAL',
  origin: 'https://other.example.com'
});
assert.equal(submittedWrongOrigin.credential, null, 'submitted credential should be scoped to its origin');
assert.ok(extensionSessionStorage.kbbPendingSubmittedCredential, 'wrong-origin submitted consume should not remove pending credential');

const submittedConsume = await sandbox.handleMessage({
  type: 'KBB_CONSUME_SUBMITTED_CREDENTIAL',
  origin: 'https://example.com'
});
assert.equal(submittedConsume.credential.password, 'new-secret', 'same-origin submitted consume should return credential once');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'submitted credential should be removed after consume');

now = 9000;
await sandbox.handleMessage({
  type: 'KBB_REMEMBER_SUBMITTED_CREDENTIAL',
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'expired@example.com',
    password: 'expired-secret'
  }
});
now += 2 * 60 * 1000 + 1;
const expiredSubmitted = await sandbox.handleMessage({
  type: 'KBB_CONSUME_SUBMITTED_CREDENTIAL',
  origin: 'https://example.com'
});
assert.equal(expiredSubmitted.credential, null, 'expired submitted credential should not be returned');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'expired submitted credential should be removed');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
storage.strictUrlMatching = true;
storage.regexUrlMatching = false;
await sandbox.queryLoginsForUrl('https://example.com/login');
const queryRequest = requests.find((request) => request.Method === 'logins.query');
assert.equal(queryRequest.Origin, 'chrome-extension://abcdefghijklmnopabcdefghijklmnop', 'authenticated bridge requests should include extension origin');
assert.equal(queryRequest.ClientId, 'client-1', 'authenticated bridge requests should include stored client id');
assert.equal(typeof queryRequest.TimestampUtcMs, 'number', 'authenticated bridge requests should use TimestampUtcMs');
assert.ok(queryRequest.Authentication, 'authenticated bridge requests should include HMAC authentication');
assert.deepEqual(JSON.parse(queryRequest.Payload), {
  Url: 'https://example.com/login',
  StrictUrlMatching: true,
  RegexUrlMatching: false
}, 'logins.query should include URL matching settings');

badgeCalls.length = 0;
assert.ok(sandbox.tabsUpdatedHandler, 'background should register a tab update listener');
sandbox.tabsUpdatedHandler(44, { status: 'complete' }, { id: 44, url: 'chrome://extensions/' });
await Promise.resolve();
let badgeTextCall = badgeCalls.find((call) => call.method === 'setBadgeText' && call.details.tabId === 44);
assert.equal(badgeTextCall.details.text, '', 'navigating to a non-fillable URL should clear stale badge text');

requests.length = 0;
loginEntries = [{
  EntryId: 'entry-1',
  Title: 'Example',
  UserName: 'alice',
  Password: 'secret',
  Url: 'https://example.com/login'
}];
storage.autoFillEnabled = true;
storage.autoSubmitEnabled = true;
storage.siteOverrides = [{ host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: true }];
let autofillMessage = null;
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  autofillMessage = msg;
};
await sandbox.autoFillTab(99, 'https://example.com/login');
assert.equal(requests.some((request) => request.Method === 'logins.query'), false, 'site override should disable auto-fill before querying KeePass');
assert.equal(autofillMessage, null, 'disabled site override should not send a fill message');
badgeTextCall = badgeCalls.find((call) => call.method === 'setBadgeText' && call.details.tabId === 99);
assert.equal(badgeTextCall.details.text, '', 'disabled site override should clear the tab badge');

requests.length = 0;
badgeCalls.length = 0;
storage.siteOverrides = [{ host: 'example.com', autoFillEnabled: true, autoSubmitEnabled: true }];
storage.autoSubmitEnabled = false;
await sandbox.autoFillTab(100, 'https://example.com/login');
assert.ok(requests.some((request) => request.Method === 'logins.query'), 'enabled site override should allow KeePass query');
assert.equal(autofillMessage.type, 'KBB_FILL');
assert.equal(autofillMessage.autoSubmit, true, 'site override should control auto-submit for the matching host');
badgeTextCall = badgeCalls.find((call) => call.method === 'setBadgeText' && call.details.tabId === 100);
assert.equal(badgeTextCall.details.text, '1', 'single match should show a count badge on the tab');

requests.length = 0;
badgeCalls.length = 0;
loginEntries = [
  { EntryId: 'entry-1', Title: 'Example A', UserName: 'alice', Password: 'secret', Url: 'https://example.com/login' },
  { EntryId: 'entry-2', Title: 'Example B', UserName: 'bob', Password: 'secret', Url: 'https://example.com/login' }
];
let multipleMatchFillAttempts = 0;
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  multipleMatchFillAttempts += 1;
  autofillMessage = msg;
  return { filled: true };
};
await sandbox.autoFillTab(102, 'https://example.com/login');
assert.equal(requests.some((request) => request.Method === 'logins.query'), true, 'multiple matches should still query KeePass');
assert.equal(multipleMatchFillAttempts, 0, 'multiple matches should not auto-fill without user selection');
badgeTextCall = badgeCalls.find((call) => call.method === 'setBadgeText' && call.details.tabId === 102);
assert.equal(badgeTextCall.details.text, '2', 'multiple matches should show their count in the toolbar badge');

requests.length = 0;
badgeCalls.length = 0;
loginEntries = [{
  EntryId: 'entry-1',
  Title: 'Example',
  UserName: 'alice',
  Password: 'secret',
  Url: 'https://example.com/login'
}];
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  autofillMessage = msg;
  return { filled: false };
};
await sandbox.autoFillTab(101, 'https://example.com/login');
assert.ok(requests.some((request) => request.Method === 'logins.query'), 'failed auto-fill should still query KeePass');
assert.equal(requests.some((request) => request.Method === 'logins.fillAck'), false, 'failed auto-fill should not acknowledge usage');

requests.length = 0;
const httpAuthResult = await sandbox.handleMessage({
  type: 'KBB_QUERY_HTTP_AUTH',
  url: 'https://example.com/private'
});
assert.equal(httpAuthResult.username, 'alice', 'HTTP auth query should return the first matching username');
assert.equal(httpAuthResult.password, 'secret', 'HTTP auth query should return the first matching password');
const httpAuthFillAckRequest = requests.find((request) => request.Method === 'logins.fillAck' && JSON.parse(request.Payload).EntryId === 'entry-1');
assert.ok(httpAuthFillAckRequest, 'HTTP auth query should acknowledge the filled entry for usage ranking');
assert.ok(sandbox.httpAuthRequiredHandler, 'background should register an HTTP auth handler');
assert.equal(sandbox.httpAuthFilter.urls.join(','), 'http://*/*,https://*/*', 'HTTP auth listener should cover HTTP and HTTPS pages');
assert.equal(sandbox.httpAuthExtraInfoSpec.join(','), 'asyncBlocking', 'HTTP auth listener should use asyncBlocking');
const httpAuthChallengeResult = await new Promise((resolve) => {
  sandbox.httpAuthRequiredHandler({
    requestId: 'request-1',
    url: 'https://example.com/private',
    realm: 'private',
    challenger: { host: 'example.com' }
  }, resolve);
});
assert.equal(httpAuthChallengeResult.authCredentials.username, 'alice', 'HTTP auth listener should return username credentials');
assert.equal(httpAuthChallengeResult.authCredentials.password, 'secret', 'HTTP auth listener should return password credentials');

let sentMessage = null;
requests.length = 0;
sandbox.chrome.tabs.query = async () => [{ id: 77, url: 'https://example.com/login' }];
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  sentMessage = msg;
  return { filled: true };
};
const popupFillResult = await sandbox.handleMessage({
  type: 'KBB_FILL_LOGIN',
  credential: {
    EntryId: 'entry-1',
    Title: 'Example',
    UserName: 'alice',
    Password: 'secret'
  },
  fieldRole: 'password'
});
assert.equal(popupFillResult.filled, true, 'popup fill should return the content script result');
assert.equal(sentMessage.fieldRole, 'password', 'popup fill should pass manual field role to the content script');
const popupFillAckRequest = requests.find((request) => request.Method === 'logins.fillAck' && JSON.parse(request.Payload).EntryId === 'entry-1');
assert.ok(popupFillAckRequest, 'popup fill should acknowledge the filled entry for usage ranking');
assert.ok(notifications.some((notification) => notification.options.title === 'Filled from KeePass'),
  'successful popup fill should show a desktop notification');
const fillNotification = notifications.find((notification) => notification.options.title === 'Filled from KeePass');
const notificationIconPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'extension',
  fillNotification.options.iconUrl
);
assert.equal(fs.existsSync(notificationIconPath), true, 'notification iconUrl should point to a packaged extension asset');

notifications.length = 0;
storage.notificationsEnabled = false;
const createResult = await sandbox.handleMessage({
  type: 'KBB_CREATE_LOGIN',
  login: {
    Title: 'Saved Entry',
    Url: 'https://example.com/login',
    UserName: 'saved@example.com',
    Password: 'secret'
  }
});
assert.equal(createResult.Success, true, 'create login should return the bridge mutation result');
assert.equal(notifications.length, 0, 'disabled notifications should suppress create feedback');

notifications.length = 0;
storage.notificationsEnabled = true;
const updateResult = await sandbox.handleMessage({
  type: 'KBB_UPDATE_LOGIN',
  login: {
    EntryId: 'entry-saved',
    Title: 'Saved Entry',
    Url: 'https://example.com/login',
    UserName: 'saved@example.com',
    Password: 'new-secret'
  }
});
assert.equal(updateResult.Success, true, 'update login should return the bridge mutation result');
assert.ok(notifications.some((notification) => notification.options.title === 'Updated KeePass entry'),
  'successful update should show a desktop notification');

// Context menu tests
requests.length = 0;
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  sentMessage = msg;
  return { filled: true };
};
sandbox.contextMenuHandler({ menuItemId: 'kbb_fill_password' }, { id: 1, url: 'https://example.com/login' });
await new Promise(r => setTimeout(r, 100)); // wait for async handler
assert.equal(sentMessage.type, 'KBB_FILL', 'context menu fill should send a fill message');
assert.equal(sentMessage.credential.Password, 'secret', 'context menu password fill should use the matching entry password');
assert.equal(sentMessage.fieldRole, 'password', 'context menu fill should tell the content script to fill the focused editable field');
const contextMenuFillAckRequest = requests.find((request) => request.Method === 'logins.fillAck' && JSON.parse(request.Payload).EntryId === 'entry-1');
assert.ok(contextMenuFillAckRequest, 'successful context menu fill should acknowledge usage');

requests.length = 0;
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  sentMessage = msg;
  return { filled: false };
};
sandbox.contextMenuHandler({ menuItemId: 'kbb_fill_password' }, { id: 1, url: 'https://example.com/login' });
await new Promise(r => setTimeout(r, 100)); // wait for async handler
assert.equal(requests.some((request) => request.Method === 'logins.fillAck'), false, 'failed context menu fill should not acknowledge usage');

sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  sentMessage = msg;
  return { filled: true };
};
sandbox.contextMenuHandler({ menuItemId: 'kbb_generate_password' }, { id: 1, url: 'http://example.com' });
await new Promise(r => setTimeout(r, 100)); // wait for async handler
assert.ok(sentMessage, 'sendMessage should be called on context menu click');
assert.equal(sentMessage.type, 'KBB_FILL');
assert.ok(sentMessage.credential.Password.length === 16, 'should generate 16 char password');

console.log('Background tests passed.');
