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
const scriptCalls = [];
const clipboardWrites = [];
const timerCalls = [];
const contextMenuItems = [];
const passkeyCleanupCalls = [];
let now = 10000;
let loginEntries = [];
let passkeysFeatureEnabled = false;
let fillAckBridgeFailure = null;

const sandbox = {
  console,
  URL,
  TextEncoder,
  setTimeout(handler, delay) {
    const timer = { handler, delay, cleared: false };
    timerCalls.push(timer);
    return timer;
  },
  clearTimeout(timer) {
    if (timer) timer.cleared = true;
  },
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
  navigator: {
    clipboard: {
      writeText: async (text) => {
        clipboardWrites.push(String(text));
      }
    }
  },
  importScripts: () => {
    // passkeys proxy experiment is not loaded by default in tests
  },
  KeePassBrowserBridgePasskeysProxyLifecycle: {
    cancelPending: async (reason) => {
      passkeyCleanupCalls.push(String(reason || ''));
      return { canceled: 1, reason };
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
          Payload: JSON.stringify({
            ProductName: 'KeePass Browser Bridge',
            ProtocolVersion: 1,
            PluginVersion: '0.9.0',
            PluginUpdateUrl: 'https://raw.githubusercontent.com/hieuck/KeePassBrowserBridge/main/update/versioninfo.txt',
            SupportedMethods: ['hello', 'logins.query', 'passkeys.cancel'],
            Features: [
              { Name: 'passwords', Enabled: true, Status: 'available' },
              { Name: 'saveUpdate', Enabled: true, Status: 'available' },
              {
                Name: 'passkeys',
                Enabled: passkeysFeatureEnabled,
                Status: passkeysFeatureEnabled ? 'enabled' : 'prototype_disabled',
                Reason: passkeysFeatureEnabled ? '' : 'Backend prototype only.'
              }
            ]
          })
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

    if (request.Method === 'pair.complete') {
      const payload = JSON.parse(request.Payload || '{}');
      if (payload.PairingSessionId === 'success-session' && payload.PairingCode === '654321') {
        return {
          ok: true,
          json: async () => ({
            ProtocolVersion: 1,
            RequestId: request.RequestId,
            Success: true,
            Payload: '{"ClientId":"client-new","SharedSecret":"secret-new"}'
          })
        };
      }
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

    if (request.Method === 'client.status') {
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: JSON.stringify({
            Trusted: true,
            Permissions: ['read', 'write']
          })
        })
      };
    }

    if (request.Method === 'logins.fillAck') {
      if (fillAckBridgeFailure) {
        return {
          ok: true,
          json: async () => ({
            ProtocolVersion: 1,
            RequestId: request.RequestId,
            Success: false,
            ErrorCode: fillAckBridgeFailure.ErrorCode,
            Error: fillAckBridgeFailure.Error
          })
        };
      }

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

    if (request.Method === 'clients.revoke') {
      const payload = JSON.parse(request.Payload || '{}');
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: JSON.stringify({
            Revoked: payload.ClientId === 'client-1',
            ClientId: payload.ClientId
          })
        })
      };
    }

    if (request.Method === 'clients.updatePermissions') {
      const payload = JSON.parse(request.Payload || '{}');
      return {
        ok: true,
        json: async () => ({
          ProtocolVersion: 1,
          RequestId: request.RequestId,
          Success: true,
          Payload: JSON.stringify({
            Updated: payload.ClientId === 'client-2',
            ClientId: payload.ClientId,
            Permissions: payload.Permissions
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
      onInstalled: { addListener(fn) { sandbox.runtimeInstalledHandler = fn; } }
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
      executeScript: async (details) => {
        scriptCalls.push(details);
      }
    },
    storage: {
      local: {
        get: (keys, callback) => {
          let values;
          if (Array.isArray(keys)) {
            values = Object.fromEntries(keys.map((key) => [key, storage[key]]));
          } else {
            values = { ...storage };
          }

          if (callback) {
            callback(values);
            return undefined;
          }

          return Promise.resolve(values);
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
      create: (details) => { contextMenuItems.push(details); },
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

assert.ok(sandbox.runtimeInstalledHandler, 'background should register an install listener for context menu setup');
sandbox.runtimeInstalledHandler();
assert.deepEqual(
  contextMenuItems.map((item) => item.id),
  ['kbb_fill_username', 'kbb_fill_password', 'kbb_fill_totp', 'kbb_generate_password'],
  'background should create context menu entries for username, password, TOTP, and generated password actions'
);
assert.equal(
  contextMenuItems.every((item) => Array.isArray(item.contexts) && item.contexts.includes('editable')),
  true,
  'context menu entries should target editable fields'
);
assert.ok(sandbox.contextMenuHandler, 'background should register a context menu click handler');

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
assert.equal(about.pluginVersion, '0.9.0', 'about should include bridge plugin version when KeePass is reachable');
assert.equal(about.pluginUpdateUrl, 'https://raw.githubusercontent.com/hieuck/KeePassBrowserBridge/main/update/versioninfo.txt', 'about should include bridge plugin update URL');
assert.equal(about.bridgeAvailable, true, 'about should report when bridge metadata is reachable');
assert.deepEqual(Array.from(about.pluginSupportedMethods), ['hello', 'logins.query', 'passkeys.cancel'], 'about should expose bridge-supported method discovery');
assert.deepEqual(JSON.parse(JSON.stringify(about.pluginFeatures)), { passwords: true, saveUpdate: true, passkeys: false }, 'about should expose bridge feature discovery');
assert.deepEqual(JSON.parse(JSON.stringify(about.pluginFeatureDetails)), {
  passwords: { enabled: true, status: 'available', reason: '' },
  saveUpdate: { enabled: true, status: 'available', reason: '' },
  passkeys: { enabled: false, status: 'prototype_disabled', reason: 'Backend prototype only.' }
}, 'about should preserve bridge feature status metadata');
assert.equal(about.pluginPasskeysEnabled, false, 'about should expose disabled browser-facing passkeys');
assert.equal(about.pluginPasskeysStatus, 'prototype_disabled', 'about should expose disabled passkey status metadata');

const updateCheck = await sandbox.handleMessage({ type: 'KBB_CHECK_UPDATES' });
assert.equal(updateCheck.currentVersion, '0.9.0', 'update check should include current version');
assert.equal(updateCheck.latestVersion, '0.10.0', 'update check should normalize latest tag version');
assert.equal(updateCheck.updateAvailable, true, 'newer GitHub release should be reported');
assert.equal(updateCheck.releaseUrl, 'https://github.com/hieuck/KeePassBrowserBridge/releases/tag/v0.10.0', 'update check should include latest release URL');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
const clientStatus = await sandbox.handleMessage({ type: 'KBB_STATUS' });
assert.equal(clientStatus.Trusted, true, 'status should expose trusted status');
assert.deepEqual(Array.from(clientStatus.Permissions), ['read', 'write'], 'status should expose client permissions');
delete storage.clientId;
delete storage.sharedSecret;

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
storage.endpoint = 'http://evil.example@127.0.0.1:19455/bridge';
await assert.rejects(
  () => sandbox.handleMessage({ type: 'KBB_HELLO' }),
  /credentials/i,
  'background should reject credentialed loopback endpoints loaded from storage before network access'
);
assert.equal(requests.length, 0, 'background should not send bridge requests to credentialed loopback endpoints');
storage.endpoint = 'http://127.0.0.1:19455/bridge';

for (const endpoint of [
  'http://127.0.0.1:19455/not-bridge',
  'http://127.0.0.1:19455/bridge?debug=1',
  'http://127.0.0.1:19455/bridge#fragment'
]) {
  requests.length = 0;
  storage.endpoint = endpoint;
  await assert.rejects(
    () => sandbox.handleMessage({ type: 'KBB_HELLO' }),
    /\/bridge/i,
    'background should reject non-canonical bridge endpoints loaded from storage before network access'
  );
  assert.equal(requests.length, 0, 'background should not send bridge requests to non-canonical bridge endpoints');
}
storage.endpoint = 'http://127.0.0.1:19455/bridge';

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
storage.pairingSessionId = 'endpoint-stale-session';
storage.pairingStartedAt = now;
extensionSessionStorage.kbbPendingMultiStepCredential = {
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-endpoint-change',
    UserName: 'endpoint@example.com',
    Password: 'endpoint-secret'
  },
  savedAt: now
};
const endpointChangeState = await sandbox.handleMessage({
  type: 'KBB_SAVE_ENDPOINT',
  endpoint: 'http://127.0.0.1:19456/bridge'
});
assert.equal(endpointChangeState.endpoint, 'http://127.0.0.1:19456/bridge', 'endpoint change should return the new bridge endpoint');
assert.equal(endpointChangeState.paired, false, 'endpoint change should unpair the browser');
assert.equal(endpointChangeState.clientId, '', 'endpoint change should not expose stale client id');
assert.equal(storage.clientId, undefined, 'endpoint change should remove stale client id');
assert.equal(storage.sharedSecret, undefined, 'endpoint change should remove stale shared secret');
assert.equal(storage.pairingSessionId, '', 'endpoint change should clear stale pairing session state');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'endpoint change should clear pending credentials');
assert.equal(passkeyCleanupCalls.at(-1), 'endpoint-change', 'endpoint change should cancel pending passkey proxy requests');
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

storage.pairingSessionId = 'future-session';
storage.pairingStartedAt = 999000;
now = 2000;
const futurePairingState = await sandbox.getState();
assert.equal(futurePairingState.pairingSessionId, '', 'future-dated pairing session should be cleared');
assert.equal(storage.pairingStartedAt, 0, 'future-dated pairing timestamp should be cleared');

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

storage.pairingSessionId = 'success-session';
storage.pairingStartedAt = now;
extensionSessionStorage.kbbPendingMultiStepCredential = {
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-pair-complete',
    UserName: 'pair-complete@example.com',
    Password: 'pair-complete-secret'
  },
  savedAt: now
};
extensionSessionStorage.kbbPendingSubmittedCredential = {
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'pair-complete-submitted@example.com',
    password: 'submitted-secret'
  },
  savedAt: now
};
const completedPairingState = await sandbox.pairComplete('654321');
assert.equal(completedPairingState.paired, true, 'successful pairing should return paired state');
assert.equal(storage.clientId, 'client-new', 'successful pairing should store the new client id');
assert.equal(storage.sharedSecret, 'secret-new', 'successful pairing should store the new shared secret');
assert.equal(storage.pairingSessionId, '', 'successful pairing should clear the stored pairing session');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'successful pairing should clear pending multi-step credentials');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'successful pairing should clear pending submitted credentials');
assert.equal(passkeyCleanupCalls.at(-1), 'pair-complete', 'successful pairing should cancel pending passkey proxy requests');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
storage.pairingSessionId = 'stale-session';
storage.pairingStartedAt = 1000;
const pairedState = await sandbox.getState();
assert.equal(pairedState.paired, true);
assert.equal(pairedState.pairingSessionId, '', 'paired state should not expose a stale pairing session');
assert.equal(storage.pairingStartedAt, 0, 'paired state should clear stale pairing timestamp');

storage.clientId = 'client-without-secret';
delete storage.sharedSecret;
storage.pairingSessionId = '';
extensionSessionStorage.kbbPendingMultiStepCredential = {
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-partial-pairing',
    UserName: 'partial@example.com',
    Password: 'partial-secret'
  },
  savedAt: now
};
storage.pairingStartedAt = 0;
const partialPairingState = await sandbox.getState();
assert.equal(partialPairingState.paired, false, 'state should not report paired when the shared secret is missing');
assert.equal(partialPairingState.clientId, '', 'partial pairing state should not expose a stale client id');
assert.equal(storage.clientId, undefined, 'partial pairing state should remove the stale client id');
assert.equal(storage.sharedSecret, undefined, 'partial pairing state should leave no shared secret');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'partial pairing state should clear pending credentials');
assert.equal(passkeyCleanupCalls.at(-1), 'partial-pairing', 'partial pairing state should cancel pending passkey proxy requests');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
storage.pairingSessionId = 'stale-session';
storage.pairingStartedAt = 1000;
extensionSessionStorage.kbbPendingMultiStepCredential = {
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-stale',
    UserName: 'stale@example.com',
    Password: 'stale-secret'
  },
  savedAt: now
};
extensionSessionStorage.kbbPendingSubmittedCredential = {
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'submitted@example.com',
    password: 'submitted-secret'
  },
  savedAt: now
};
const revokeCurrentResult = await sandbox.handleMessage({ type: 'KBB_REVOKE_CLIENT', clientId: 'client-1' });
assert.equal(revokeCurrentResult.Revoked, true, 'current client revoke should report success');
assert.equal(storage.clientId, undefined, 'current client revoke should remove the stored client id');
assert.equal(storage.sharedSecret, undefined, 'current client revoke should remove the stored shared secret');
assert.equal(storage.pairingSessionId, '', 'current client revoke should clear stale pairing session state');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'current client revoke should clear pending multi-step credentials');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'current client revoke should clear pending submitted credentials');
assert.equal(passkeyCleanupCalls.at(-1), 'client-revoke', 'current client revoke should cancel pending passkey proxy requests');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
requests.length = 0;
const permissionsResult = await sandbox.handleMessage({
  type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
  clientId: 'client-2',
  permissions: ['read', 'write', 'write', 'passkeyRead', 'unknown']
});
assert.equal(permissionsResult.Updated, true, 'permission update should report success for known clients');
const permissionsRequest = requests.find((request) => request.Method === 'clients.updatePermissions');
assert.ok(permissionsRequest, 'permission update should call the bridge');
assert.deepEqual(
  JSON.parse(permissionsRequest.Payload).Permissions,
  ['read', 'write'],
  'permission update should send normalized permissions and strip disabled passkey permissions'
);

passkeysFeatureEnabled = true;
requests.length = 0;
await sandbox.handleMessage({
  type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
  clientId: 'client-2',
  permissions: ['write', 'passkeyRead', 'passkeyWrite', 'unknown']
});
const passkeyPermissionsRequest = requests.find((request) => request.Method === 'clients.updatePermissions');
assert.deepEqual(
  JSON.parse(passkeyPermissionsRequest.Payload).Permissions,
  ['read', 'write', 'passkeyRead', 'passkeyWrite'],
  'permission update should keep passkey permissions when bridge feature discovery enables them'
);
passkeysFeatureEnabled = false;

requests.length = 0;
await sandbox.handleMessage({
  type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
  clientId: 'client-2',
  permissions: ['write']
});
const writeOnlyPermissionsRequest = requests.find((request) => request.Method === 'clients.updatePermissions');
assert.deepEqual(
  JSON.parse(writeOnlyPermissionsRequest.Payload).Permissions,
  ['read', 'write'],
  'permission update should keep read when elevated permissions are requested'
);

storage.locked = true;
storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
const lockedState = await sandbox.getState();
assert.equal(lockedState.locked, true, 'state should report extension lock status');
requests.length = 0;
await assert.rejects(
  () => sandbox.queryLoginsForUrl('https://example.com/login'),
  /locked/i,
  'locked extension should reject login queries'
);
assert.equal(requests.length, 0, 'locked extension should not query KeePass');
await sandbox.autoFillTab(45, 'https://example.com/login');
assert.equal(requests.length, 0, 'locked extension should not auto-fill or query KeePass');
await assert.rejects(
  () => sandbox.handleMessage({ type: 'KBB_FILL_ACK', entryId: 'entry-locked', url: 'https://example.com/login' }),
  /locked/i,
  'locked extension should reject direct fill acknowledgements'
);
assert.equal(requests.some((request) => request.Method === 'logins.fillAck'), false, 'locked fill acknowledgement should not call KeePass');
clipboardWrites.length = 0;
await assert.rejects(
  () => sandbox.handleMessage({ type: 'KBB_COPY_TO_CLIPBOARD', text: 'locked-copy-secret', clearAfterMs: 30000 }),
  /locked/i,
  'locked extension should reject direct clipboard copy requests'
);
assert.equal(clipboardWrites.includes('locked-copy-secret'), false, 'locked extension should not write copied secrets to the clipboard');
assert.equal(clipboardWrites.at(-1), '', 'locked extension should clear clipboard state before rejecting credential access');
let lockState = await sandbox.handleMessage({ type: 'KBB_SET_LOCKED', locked: false });
assert.equal(lockState.locked, false, 'unlock message should clear lock state');
assert.equal(storage.locked, false, 'unlock message should persist lock state');
const malformedAutoFillState = await sandbox.handleMessage({ type: 'KBB_SET_AUTO_FILL', enabled: 'false' });
assert.equal(malformedAutoFillState.autoFillEnabled, false, 'string false should not enable auto-fill');
assert.equal(storage.autoFillEnabled, false, 'string false should persist auto-fill as disabled');
const malformedAutoSubmitState = await sandbox.handleMessage({ type: 'KBB_SET_AUTO_SUBMIT', enabled: 'false' });
assert.equal(malformedAutoSubmitState.autoSubmitEnabled, false, 'string false should not enable auto-submit');
assert.equal(storage.autoSubmitEnabled, false, 'string false should persist auto-submit as disabled');
lockState = await sandbox.handleMessage({ type: 'KBB_SET_LOCKED', locked: 'false' });
assert.equal(lockState.locked, false, 'string false should not lock the bridge');
assert.equal(storage.locked, false, 'string false should persist lock state as unlocked');
storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
clipboardWrites.length = 0;
timerCalls.length = 0;
await sandbox.handleMessage({ type: 'KBB_COPY_TO_CLIPBOARD', text: 'clipboard-secret', clearAfterMs: 30000 });
assert.equal(clipboardWrites.at(-1), 'clipboard-secret', 'copy should write the requested secret to the clipboard');
assert.equal(timerCalls.length, 1, 'copy should schedule delayed clipboard clearing');
await sandbox.handleMessage({ type: 'KBB_COPY_TO_CLIPBOARD', text: 'newer-clipboard-secret', clearAfterMs: 45000 });
assert.equal(clipboardWrites.at(-1), 'newer-clipboard-secret', 'second copy should replace the clipboard content');
assert.equal(timerCalls.length, 2, 'second copy should schedule a fresh delayed clipboard clearing');
assert.equal(timerCalls[0].cleared, true, 'second copy should cancel older delayed clipboard clearing');
await sandbox.handleMessage({ type: 'KBB_COPY_TO_CLIPBOARD', text: 'oversized-clear-secret', clearAfterMs: 999000 });
assert.equal(clipboardWrites.at(-1), 'oversized-clear-secret', 'copy with an oversized clear delay should still write the requested secret');
assert.equal(timerCalls.length, 3, 'copy with an oversized clear delay should schedule delayed clipboard clearing');
assert.equal(timerCalls[1].cleared, true, 'copy with an oversized clear delay should cancel the previous delayed clipboard clearing');
assert.equal(timerCalls[2].delay, 30000, 'out-of-range clipboard clear delay should fall back to the default clear timeout');
extensionSessionStorage.kbbPendingMultiStepCredential = {
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-lock',
    UserName: 'lock@example.com',
    Password: 'lock-secret'
  },
  savedAt: now
};
extensionSessionStorage.kbbPendingSubmittedCredential = {
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'lock-submitted@example.com',
    password: 'lock-submitted-secret'
  },
  savedAt: now
};
lockState = await sandbox.handleMessage({ type: 'KBB_SET_LOCKED', locked: true });
assert.equal(lockState.locked, true, 'lock message should set lock state');
assert.equal(storage.locked, true, 'lock message should persist lock state');
assert.equal(clipboardWrites.at(-1), '', 'lock message should clear copied clipboard secrets immediately');
assert.equal(timerCalls[2].cleared, true, 'lock message should cancel the active delayed clipboard clear timer');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'lock message should clear pending multi-step credentials');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'lock message should clear pending submitted credentials');
assert.equal(passkeyCleanupCalls.at(-1), 'lock', 'lock message should cancel pending passkey proxy requests');
storage.locked = false;

now = 10 * 60 * 1000;
storage.autoLockTimeoutMinutes = 5;
storage.lastCredentialActivityAt = now - (6 * 60 * 1000);
extensionSessionStorage.kbbPendingMultiStepCredential = {
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-auto-lock',
    UserName: 'auto-lock@example.com',
    Password: 'auto-lock-secret'
  },
  savedAt: now
};
extensionSessionStorage.kbbPendingSubmittedCredential = {
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'auto-lock-submitted@example.com',
    password: 'auto-lock-submitted-secret'
  },
  savedAt: now
};
const autoLockedState = await sandbox.getState();
assert.equal(autoLockedState.locked, true, 'state should lock after the configured inactivity timeout');
assert.equal(storage.locked, true, 'auto-lock should persist the locked state');
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'auto-lock should clear pending multi-step credentials');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'auto-lock should clear pending submitted credentials');
assert.equal(passkeyCleanupCalls.at(-1), 'auto-lock', 'auto-lock should cancel pending passkey proxy requests');
storage.locked = false;
storage.lastCredentialActivityAt = now - (2 * 60 * 1000);
const activeLockState = await sandbox.getState();
assert.equal(activeLockState.locked, false, 'state should remain unlocked before the inactivity timeout');
storage.autoLockTimeoutMinutes = 1441;
storage.lastCredentialActivityAt = now - (60 * 1000);
const outOfRangeAutoLockState = await sandbox.getState();
assert.equal(outOfRangeAutoLockState.locked, false, 'out-of-range auto-lock timeout should not lock using a corrupt stored value');
assert.equal(outOfRangeAutoLockState.autoLockTimeoutMinutes, 0, 'out-of-range auto-lock timeout should fall back to the default setting');
storage.autoLockTimeoutMinutes = 0;
storage.lastCredentialActivityAt = 0;

delete storage.clientId;
delete storage.sharedSecret;
storage.lastCredentialActivityAt = 0;
requests.length = 0;
await assert.rejects(
  () => sandbox.queryLoginsForUrl('https://example.com/login'),
  /Pair this browser with KeePass first\./,
  'unpaired extension should reject login queries before contacting KeePass'
);
assert.equal(requests.length, 0, 'unpaired login query should not call the bridge');
assert.equal(storage.lastCredentialActivityAt, 0, 'unpaired login query should not refresh credential activity');

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
storage.locked = true;
delete extensionSessionStorage.kbbPendingMultiStepCredential;
await assert.rejects(
  () => sandbox.handleMessage({
    type: 'KBB_REMEMBER_PENDING_CREDENTIAL',
    origin: 'https://example.com',
    credential: {
      EntryId: 'entry-locked',
      UserName: 'locked@example.com',
      Password: 'locked-secret'
    }
  }),
  /locked/i,
  'locked extension should reject pending credential storage'
);
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'locked extension should not store pending credentials');
extensionSessionStorage.kbbPendingMultiStepCredential = {
  origin: 'https://example.com',
  credential: {
    EntryId: 'entry-locked-consume',
    UserName: 'locked-consume@example.com',
    Password: 'locked-consume-secret'
  },
  savedAt: now
};
extensionSessionStorage.kbbPendingSubmittedCredential = {
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'locked-submitted-consume@example.com',
    password: 'locked-submitted-consume-secret'
  },
  savedAt: now
};
await assert.rejects(
  () => sandbox.handleMessage({
    type: 'KBB_CONSUME_PENDING_CREDENTIAL',
    origin: 'https://example.com'
  }),
  /locked/i,
  'locked extension should reject pending credential consume'
);
assert.equal(extensionSessionStorage.kbbPendingMultiStepCredential, undefined, 'locked pending consume should clear stale multi-step credentials');
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'locked pending consume should clear stale submitted credentials');

storage.locked = false;
delete storage.clientId;
delete storage.sharedSecret;
await assert.rejects(
  () => sandbox.handleMessage({
    type: 'KBB_REMEMBER_SUBMITTED_CREDENTIAL',
    origin: 'https://example.com',
    credential: {
      url: 'https://example.com/login',
      userName: 'unpaired@example.com',
      password: 'unpaired-secret'
    }
  }),
  /Pair this browser with KeePass first\./,
  'unpaired extension should reject submitted credential storage'
);
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'unpaired extension should not store submitted credentials');
extensionSessionStorage.kbbPendingSubmittedCredential = {
  origin: 'https://example.com',
  credential: {
    url: 'https://example.com/login',
    userName: 'unpaired-consume@example.com',
    password: 'unpaired-consume-secret'
  },
  savedAt: now
};
await assert.rejects(
  () => sandbox.handleMessage({
    type: 'KBB_CONSUME_SUBMITTED_CREDENTIAL',
    origin: 'https://example.com'
  }),
  /Pair this browser with KeePass first\./,
  'unpaired extension should reject submitted credential consume'
);
assert.equal(extensionSessionStorage.kbbPendingSubmittedCredential, undefined, 'unpaired submitted consume should clear stale submitted credentials');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
now = 6500;
storage.lastCredentialActivityAt = 0;
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
assert.equal(storage.lastCredentialActivityAt, now, 'remembering pending credentials should refresh credential activity for auto-lock');

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
storage.lastCredentialActivityAt = 0;
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
assert.equal(storage.lastCredentialActivityAt, now, 'remembering submitted credentials should refresh credential activity for auto-lock');

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

requests.length = 0;
storage.strictUrlMatching = 'false';
storage.regexUrlMatching = 'true';
await sandbox.queryLoginsForUrl('https://example.com/login');
const corruptedQueryRequest = requests.find((request) => request.Method === 'logins.query');
assert.deepEqual(JSON.parse(corruptedQueryRequest.Payload), {
  Url: 'https://example.com/login',
  StrictUrlMatching: false,
  RegexUrlMatching: false
}, 'logins.query should ignore corrupt URL matching settings');

badgeCalls.length = 0;
assert.ok(sandbox.tabsUpdatedHandler, 'background should register a tab update listener');
sandbox.tabsUpdatedHandler(44, { status: 'complete' }, { id: 44, url: 'chrome://extensions/' });
await Promise.resolve();
let badgeTextCall = badgeCalls.find((call) => call.method === 'setBadgeText' && call.details.tabId === 44);
assert.equal(badgeTextCall.details.text, '', 'navigating to a non-fillable URL should clear stale badge text');

timerCalls.length = 0;
storage.autoFillDelay = 0;
sandbox.tabsUpdatedHandler(45, { status: 'complete' }, { id: 45, url: 'https://example.com/login' });
await Promise.resolve();
assert.equal(timerCalls.length, 1, 'fillable navigation should schedule auto-fill after reading settings');
assert.equal(timerCalls[0].delay, 0, 'zero auto-fill delay should be honored instead of falling back to the default debounce');
delete storage.autoFillDelay;

timerCalls.length = 0;
storage.autoFillDelay = 6000;
sandbox.tabsUpdatedHandler(46, { status: 'complete' }, { id: 46, url: 'https://example.com/login' });
await Promise.resolve();
assert.equal(timerCalls.length, 1, 'fillable navigation should still schedule auto-fill when stored delay is invalid');
assert.equal(timerCalls[0].delay, 1200, 'out-of-range auto-fill delay should fall back to the default debounce');
delete storage.autoFillDelay;

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
autofillMessage = null;
await sandbox.autoFillTab(103, 'https://login.example.com/login');
assert.equal(requests.some((request) => request.Method === 'logins.query'), false, 'parent-domain site override should disable auto-fill for subdomains before querying KeePass');
assert.equal(autofillMessage, null, 'parent-domain site override should not send a fill message for subdomains');

requests.length = 0;
badgeCalls.length = 0;
autofillMessage = null;
storage.siteOverrides = [{ host: 'https://Example.com/login', autoFillEnabled: false, autoSubmitEnabled: true }];
await sandbox.autoFillTab(106, 'https://example.com/login');
assert.equal(requests.some((request) => request.Method === 'logins.query'), false, 'URL-shaped site override should disable auto-fill after normalizing host');
assert.equal(autofillMessage, null, 'URL-shaped site override should not send a fill message');

requests.length = 0;
badgeCalls.length = 0;
await sandbox.autoFillTab(104, 'https://evil-example.com/login');
assert.equal(requests.some((request) => request.Method === 'logins.query'), true, 'parent-domain site override should not match unrelated hosts with the same suffix');

requests.length = 0;
badgeCalls.length = 0;
autofillMessage = null;
storage.siteOverrides = [
  { host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: false },
  { host: 'login.example.com', autoFillEnabled: true, autoSubmitEnabled: true }
];
storage.autoSubmitEnabled = false;
await sandbox.autoFillTab(105, 'https://login.example.com/login');
assert.equal(requests.some((request) => request.Method === 'logins.query'), true, 'exact site override should win over parent-domain override before querying KeePass');
assert.equal(autofillMessage.type, 'KBB_FILL', 'exact enabled site override should allow fill when parent override disables auto-fill');
assert.equal(autofillMessage.autoSubmit, true, 'exact site override should control auto-submit when it wins over a parent override');

requests.length = 0;
badgeCalls.length = 0;
storage.siteOverrides = [{ host: 'example.com', autoFillEnabled: true, autoSubmitEnabled: true }];
storage.autoSubmitEnabled = false;
storage.autoLockTimeoutMinutes = 5;
storage.lastCredentialActivityAt = now - (60 * 1000);
await sandbox.autoFillTab(100, 'https://example.com/login');
assert.ok(requests.some((request) => request.Method === 'logins.query'), 'enabled site override should allow KeePass query');
assert.equal(autofillMessage.type, 'KBB_FILL');
assert.equal(autofillMessage.autoSubmit, true, 'site override should control auto-submit for the matching host');
assert.equal(storage.lastCredentialActivityAt, now, 'auto-fill should refresh credential activity for auto-lock');
badgeTextCall = badgeCalls.find((call) => call.method === 'setBadgeText' && call.details.tabId === 100);
assert.equal(badgeTextCall.details.text, '1', 'single match should show a count badge on the tab');
storage.autoLockTimeoutMinutes = 0;
storage.lastCredentialActivityAt = 0;

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

requests.length = 0;
storage.siteOverrides = [{ host: 'example.com', autoFillEnabled: false, autoSubmitEnabled: true }];
const disabledHttpAuthResult = await sandbox.handleMessage({
  type: 'KBB_QUERY_HTTP_AUTH',
  url: 'https://login.example.com/private'
});
assert.equal(disabledHttpAuthResult, null, 'HTTP auth query should respect disabled parent-domain site overrides');
assert.equal(requests.some((request) => request.Method === 'logins.query'), false, 'disabled HTTP auth site override should skip KeePass queries');
storage.siteOverrides = [];

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

loginEntries = [];
requests.length = 0;
for (let attempt = 0; attempt < 3; attempt += 1) {
  const noCredentialChallengeResult = await new Promise((resolve) => {
    sandbox.httpAuthRequiredHandler({
      requestId: 'request-no-credential',
      url: 'https://example.com/missing',
      realm: 'private',
      challenger: { host: 'example.com' }
    }, resolve);
  });
  assert.equal(Object.keys(noCredentialChallengeResult).length, 0, 'HTTP auth listener should return no credentials when KeePass has no matching entry');
}
const noCredentialQueries = requests.filter((request) => request.Method === 'logins.query');
assert.equal(noCredentialQueries.length, 2, 'HTTP auth listener should cap repeated no-credential KeePass queries for the same challenge');
loginEntries = [{
  EntryId: 'entry-1',
  Title: 'Example',
  UserName: 'alice',
  Password: 'secret',
  Url: 'https://example.com/login'
}];

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

sentMessage = null;
requests.length = 0;
notifications.length = 0;
fillAckBridgeFailure = {
  ErrorCode: 'permission_denied',
  Error: 'Trusted browser is not allowed to perform this action.'
};
const readOnlyFillResult = await sandbox.handleMessage({
  type: 'KBB_FILL_LOGIN',
  credential: {
    EntryId: 'entry-readonly',
    Title: 'Read Only Example',
    UserName: 'readonly',
    Password: 'readonly-secret'
  }
});
assert.equal(readOnlyFillResult.filled, true, 'read-only popup fill should return the content script result when usage acknowledgement is denied');
assert.ok(requests.some((request) => request.Method === 'logins.fillAck'), 'read-only popup fill should still attempt best-effort usage acknowledgement');
assert.ok(notifications.some((notification) => notification.options.title === 'Filled from KeePass'),
  'read-only popup fill should still show fill feedback when acknowledgement is denied');
fillAckBridgeFailure = null;

sentMessage = null;
await sandbox.handleMessage({
  type: 'KBB_FILL_LOGIN',
  credential: {
    EntryId: 'entry-1',
    Title: 'Example',
    CustomFields: [{ Name: 'Tenant', Value: 'production', IsProtected: false }]
  },
  fieldRole: 'custom',
  customFieldName: 'Tenant'
});
assert.equal(sentMessage.fieldRole, 'custom', 'popup custom field fill should pass custom field role to the content script');
assert.equal(sentMessage.customFieldName, 'Tenant', 'popup custom field fill should pass the selected custom field name');
const fillNotification = notifications.find((notification) => notification.options.title === 'Filled from KeePass');
const notificationIconPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'extension',
  fillNotification.options.iconUrl
);
assert.equal(fs.existsSync(notificationIconPath), true, 'notification iconUrl should point to a packaged extension asset');

sentMessage = null;
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  sentMessage = msg;
  return {
    collected: true,
    credential: {
      userName: 'typed@example.com',
      password: 'typed-secret'
    }
  };
};
scriptCalls.length = 0;
storage.locked = true;
await assert.rejects(
  () => sandbox.handleMessage({ type: 'KBB_COLLECT_PAGE_CREDENTIAL' }),
  /locked/i,
  'locked extension should reject page credential collection'
);
assert.equal(sentMessage, null, 'locked collection should not message the content script');
assert.equal(scriptCalls.length, 0, 'locked collection should not inject the content script');

storage.locked = false;
delete storage.clientId;
delete storage.sharedSecret;
await assert.rejects(
  () => sandbox.handleMessage({ type: 'KBB_COLLECT_PAGE_CREDENTIAL' }),
  /Pair this browser with KeePass first\./,
  'unpaired extension should reject page credential collection'
);
assert.equal(sentMessage, null, 'unpaired collection should not message the content script');
assert.equal(scriptCalls.length, 0, 'unpaired collection should not inject the content script');

storage.clientId = 'client-1';
storage.sharedSecret = 'secret';
const collectedPageCredential = await sandbox.handleMessage({ type: 'KBB_COLLECT_PAGE_CREDENTIAL' });
assert.equal(sentMessage.type, 'KBB_COLLECT_PAGE_CREDENTIAL', 'background should ask the content script to collect page credentials');
assert.equal(collectedPageCredential.credential.userName, 'typed@example.com', 'background should return collected page username');
assert.equal(collectedPageCredential.credential.password, 'typed-secret', 'background should return collected page password');

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
loginEntries = [{
  EntryId: 'entry-1',
  Title: 'Example',
  UserName: 'alice',
  Password: 'secret',
  OneTimePassword: '123456',
  Url: 'https://example.com/login'
}];
storage.locked = true;
requests.length = 0;
sentMessage = null;
sandbox.chrome.tabs.sendMessage = async (tabId, msg) => {
  sentMessage = msg;
  return { filled: true };
};
sandbox.contextMenuHandler({ menuItemId: 'kbb_fill_password' }, { id: 1, url: 'https://example.com/login' });
await new Promise(r => setTimeout(r, 100)); // wait for async handler
assert.equal(sentMessage, null, 'locked extension should not fill from context menu');
assert.equal(requests.some((request) => request.Method === 'logins.query'), false, 'locked context menu fill should not query KeePass');

sentMessage = null;
sandbox.contextMenuHandler({ menuItemId: 'kbb_generate_password' }, { id: 1, url: 'http://example.com' });
await new Promise(r => setTimeout(r, 100)); // wait for async handler
assert.equal(sentMessage, null, 'locked extension should not generate and fill a password from context menu');
storage.locked = false;

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
sentMessage = null;
sandbox.contextMenuHandler({ menuItemId: 'kbb_fill_username' }, { id: 1, url: 'https://example.com/login' });
await new Promise(r => setTimeout(r, 100)); // wait for async handler
assert.equal(sentMessage.credential.UserName, 'alice', 'context menu username fill should use the matching entry username');
assert.equal(sentMessage.credential.Password, undefined, 'context menu username fill should not expose the matching entry password');
assert.equal(sentMessage.fieldRole, 'username', 'context menu username fill should target the focused username field');

requests.length = 0;
sentMessage = null;
sandbox.contextMenuHandler({ menuItemId: 'kbb_fill_totp' }, { id: 1, url: 'https://example.com/login' });
await new Promise(r => setTimeout(r, 100)); // wait for async handler
assert.equal(sentMessage.credential.OneTimePassword, '123456', 'context menu TOTP fill should use the matching entry OTP');
assert.equal(sentMessage.credential.Password, undefined, 'context menu TOTP fill should not expose the matching entry password');
assert.equal(sentMessage.fieldRole, 'otp', 'context menu TOTP fill should target the focused OTP field');

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
assert.equal(sentMessage.fieldRole, 'password', 'generated passwords should fill the focused editable field');

// --- Passkey Proxy Integration ---

{
  const result = await sandbox.setupPasskeyProxy();
  assert.equal(result.attached, false, 'setupPasskeyProxy should return attached: false when experiment is not loaded');
}

{
  sandbox.KeePassBrowserBridgePasskeysProxyExperiment = {
    isAvailable: () => false
  };
  const result = await sandbox.setupPasskeyProxy();
  assert.equal(result.attached, false, 'setupPasskeyProxy should return { attached: false } when webAuthenticationProxy API is not available');
  delete sandbox.KeePassBrowserBridgePasskeysProxyExperiment;
}

{
  let lifecycleCreated = false;
  const mockLifecycle = {
    attach: async () => ({ attached: true }),
    detach: async () => {}
  };
  sandbox.KeePassBrowserBridgePasskeysProxyExperiment = {
    isAvailable: () => true,
    createBridgeRequestHandlers: (options) => {
      assert.equal(typeof options.bridgeCall, 'function', 'createBridgeRequestHandlers should receive a bridgeCall function');
      return { onCreateRequest: async () => {}, onGetRequest: async () => {}, onRequestCanceled: async () => {} };
    },
    createLifecycle: (options) => {
      assert.equal(typeof options.onCreateRequest, 'function', 'createLifecycle should receive onCreateRequest handler');
      assert.equal(typeof options.onGetRequest, 'function', 'createLifecycle should receive onGetRequest handler');
      assert.equal(typeof options.onRequestCanceled, 'function', 'createLifecycle should receive onRequestCanceled handler');
      lifecycleCreated = true;
      return mockLifecycle;
    }
  };
  const result = await sandbox.setupPasskeyProxy();
  assert.equal(result.attached, true, 'setupPasskeyProxy should return attached result from lifecycle');
  assert.equal(lifecycleCreated, true, 'createLifecycle should be called during setup');
  assert.equal(sandbox.KeePassBrowserBridgePasskeysProxyLifecycle, mockLifecycle, 'lifecycle should be stored on globalThis for cleanup');
  delete sandbox.KeePassBrowserBridgePasskeysProxyExperiment;
  sandbox.KeePassBrowserBridgePasskeysProxyLifecycle = null;
}

{
  let detachCalled = false;
  sandbox.KeePassBrowserBridgePasskeysProxyExperiment = {
    isAvailable: () => true,
    createBridgeRequestHandlers: () => ({
      onCreateRequest: async () => {}, onGetRequest: async () => {}, onRequestCanceled: async () => {}
    }),
    createLifecycle: () => ({
      attach: async () => ({ attached: true }),
      detach: async () => { detachCalled = true; }
    })
  };
  await sandbox.setupPasskeyProxy();
  assert.ok(sandbox.KeePassBrowserBridgePasskeysProxyLifecycle, 'lifecycle should be stored after setup');
  await sandbox.teardownPasskeyProxy();
  assert.equal(sandbox.KeePassBrowserBridgePasskeysProxyLifecycle, null, 'lifecycle should be cleared after teardown');
  assert.equal(detachCalled, true, 'detach should be called during teardown');
  delete sandbox.KeePassBrowserBridgePasskeysProxyExperiment;
}

{
  sandbox.KeePassBrowserBridgePasskeysProxyLifecycle = null;
  await sandbox.teardownPasskeyProxy();
  assert.equal(sandbox.KeePassBrowserBridgePasskeysProxyLifecycle, null, 'teardown with no lifecycle should not throw');
}

{
  passkeyCleanupCalls.length = 0;
  sandbox.KeePassBrowserBridgePasskeysProxyLifecycle = {
    cancelPending: async (reason) => {
      passkeyCleanupCalls.push(String(reason || ''));
      return { canceled: 1, reason };
    }
  };
  await sandbox.clearPendingPasskeyState('custom-reason');
  assert.equal(passkeyCleanupCalls.at(-1), 'custom-reason', 'clearPendingPasskeyState should forward the reason to the stored lifecycle');
}

// --- Passkey Proxy E2E Integration ---

function createWebAuthnEvent() {
  const listeners = [];
  return {
    addListener(fn) { listeners.push(fn); },
    removeListener(fn) {
      const idx = listeners.indexOf(fn);
      if (idx >= 0) listeners.splice(idx, 1);
    },
    emit(...args) { listeners.slice().forEach(fn => fn(...args)); },
    hasListeners() { return listeners.length > 0; }
  };
}

{
  // Save existing lifecycle for cleanup
  const savedLifecycle = sandbox.KeePassBrowserBridgePasskeysProxyLifecycle;

  // Load the real passkeys proxy experiment into the sandbox
  const expSource = fs.readFileSync(
    new URL('../../extension/passkeysProxyExperiment.js', import.meta.url), 'utf8'
  );
  vm.runInContext(expSource, sandbox, { filename: 'passkeysProxyExperiment.js' });

  const experiment = sandbox.KeePassBrowserBridgePasskeysProxyExperiment;
  assert.ok(experiment, 'experiment module should be loaded into sandbox');
  assert.equal(typeof experiment.createLifecycle, 'function', 'experiment should export createLifecycle');
  assert.equal(typeof experiment.createBridgeRequestHandlers, 'function', 'experiment should export createBridgeRequestHandlers');
  assert.equal(typeof experiment.createTrustedOriginResolver, 'function', 'experiment should export createTrustedOriginResolver');

  // Add mock webAuthenticationProxy with event emitters
  const onCreateEvent = createWebAuthnEvent();
  const onGetEvent = createWebAuthnEvent();
  const onIsUvpaaEvent = createWebAuthnEvent();
  const onCancelEvent = createWebAuthnEvent();

  sandbox.chrome.webAuthenticationProxy = {
    attach: async () => ({ attached: true }),
    detach: async () => {},
    completeCreateRequest: async () => {},
    completeGetRequest: async () => {},
    completeIsUvpaaRequest: async () => {},
    onCreateRequest: onCreateEvent,
    onGetRequest: onGetEvent,
    onIsUvpaaRequest: onIsUvpaaEvent,
    onRequestCanceled: onCancelEvent
  };

  // Add webNavigation for origin resolution used by createTrustedOriginResolver
  sandbox.chrome.webNavigation = {
    getFrame: async () => ({ url: 'https://example.com/login' })
  };

  // Add permissions for setPasskeysEnabled
  sandbox.chrome.permissions = {
    request: async () => true,
    remove: async () => true
  };

  // E2E: create request flow fires passkeys.create.begin bridge call
  {
    requests.length = 0;
    const setupResult = await sandbox.setupPasskeyProxy();
    assert.ok(setupResult.attached, 'setupPasskeyProxy should attach the proxy');
    assert.ok(sandbox.KeePassBrowserBridgePasskeysProxyLifecycle, 'lifecycle should be stored');
    assert.ok(onCreateEvent.hasListeners(), 'create listener should be registered on webAuthenticationProxy');
    assert.ok(onGetEvent.hasListeners(), 'get listener should be registered on webAuthenticationProxy');

    // Fire a WebAuthn create request event
    onCreateEvent.emit({
      requestId: 42,
      requestDetailsJson: JSON.stringify({
        rp: { id: 'example.com', name: 'Example' },
        user: { id: 'YWxpY2U', name: 'alice@example.com', displayName: 'Alice' },
        challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        attestation: 'none'
      }),
      origin: 'https://example.com',
      tabId: 1
    });

    await new Promise(r => setTimeout(r, 100));

    const createCall = requests.find(r => r.Method === 'passkeys.create.begin');
    assert.ok(createCall, 'onCreateRequest should trigger passkeys.create.begin bridge call');

    if (createCall) {
      const payload = JSON.parse(createCall.Payload);
      assert.equal(payload.WebAuthnRequestId, '42', 'bridge payload should include request ID as string');
      assert.equal(payload.RpId, 'example.com', 'bridge payload should include the relying party ID');
      assert.equal(payload.Origin, 'https://example.com', 'bridge payload should include the trusted origin');
      assert.equal(payload.Challenge, 'MDEyMzQ1Njc4OWFiY2RlZg', 'bridge payload should include the challenge');
    }
  }

  // E2E: get request flow fires passkeys.get.begin bridge call
  {
    requests.length = 0;

    onGetEvent.emit({
      requestId: 43,
      requestDetailsJson: JSON.stringify({
        rpId: 'example.com',
        challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
      }),
      origin: 'https://example.com',
      tabId: 1
    });

    await new Promise(r => setTimeout(r, 100));

    const getCall = requests.find(r => r.Method === 'passkeys.get.begin');
    assert.ok(getCall, 'onGetRequest should trigger passkeys.get.begin bridge call');

    if (getCall) {
      const payload = JSON.parse(getCall.Payload);
      assert.equal(payload.WebAuthnRequestId, '43', 'get bridge payload should include request ID');
      assert.equal(payload.RpId, 'example.com', 'get bridge payload should include RP ID');
    }
  }

  // E2E: lifecycle cleanup on teardown
  {
    await sandbox.teardownPasskeyProxy();
    assert.equal(sandbox.KeePassBrowserBridgePasskeysProxyLifecycle, null, 'lifecycle should be null after teardown');
    assert.equal(onCreateEvent.hasListeners(), false, 'teardown should remove create request listener');
    assert.equal(onGetEvent.hasListeners(), false, 'teardown should remove get request listener');
    assert.equal(onIsUvpaaEvent.hasListeners(), false, 'teardown should remove isUvpaa request listener');
    assert.equal(onCancelEvent.hasListeners(), false, 'teardown should remove cancel request listener');
  }

  // Clean up injected chrome APIs
  delete sandbox.chrome.webAuthenticationProxy;
  delete sandbox.chrome.webNavigation;
  delete sandbox.chrome.permissions;
  delete sandbox.KeePassBrowserBridgePasskeysProxyExperiment;
  sandbox.KeePassBrowserBridgePasskeysProxyLifecycle = savedLifecycle;
}

// --- KBB_SET_PASSKEYS_ENABLED message handling ---

{
  const bgSource = fs.readFileSync(new URL('../../extension/background.js', import.meta.url), 'utf8');
  assert.ok(bgSource.includes("case 'KBB_SET_PASSKEYS_ENABLED':"), 'background handleMessage should have a KBB_SET_PASSKEYS_ENABLED case');
  assert.ok(bgSource.includes('function setPasskeysEnabled'), 'background should define setPasskeysEnabled function');
}

console.log('Background tests passed.');
