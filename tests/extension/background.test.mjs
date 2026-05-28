import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage = {
  endpoint: 'http://127.0.0.1:19455/bridge',
  pairingSessionId: 'expired-session',
  pairingStartedAt: 1000
};
const requests = [];
let now = 10000;

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
    const request = JSON.parse(options.body);
    requests.push(request);
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
      onMessage: { addListener() {} }
    },
    tabs: {
      onUpdated: { addListener() {} },
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
      }
    }
  }
};
sandbox.globalThis = sandbox;

const source = fs.readFileSync(new URL('../../extension/background.js', import.meta.url), 'utf8');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'background.js' });

storage.pairingSessionId = 'active-session';
storage.pairingStartedAt = 1000;
now = 2000;
const activePairingState = await sandbox.getState();
assert.equal(activePairingState.pairingSessionId, 'active-session', 'active pairing session should remain visible before expiry');
assert.equal(activePairingState.pairingExpiresAt, 301000, 'state should expose pairing expiry time for popup feedback');

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
await sandbox.pairCancel();
assert.equal(storage.pairingSessionId, '', 'cancel should clear the stored pairing session');
assert.equal(storage.pairingStartedAt, 0, 'cancel should clear the stored pairing timestamp');
const cancelRequest = requests.find((request) => request.Method === 'pair.cancel');
assert.ok(cancelRequest, 'cancel should notify the bridge');
assert.match(cancelRequest.Payload, /cancel-session/);

console.log('Background tests passed.');
