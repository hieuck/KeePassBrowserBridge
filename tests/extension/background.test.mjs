import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const storage = {
  endpoint: 'http://127.0.0.1:19455/bridge',
  pairingSessionId: 'expired-session'
};

const sandbox = {
  console,
  URL,
  TextEncoder,
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
  fetch: async () => ({
    ok: true,
    json: async () => ({
      ProtocolVersion: 1,
      RequestId: 'request-1',
      Success: false,
      ErrorCode: 'pairing_session_expired',
      Error: 'Pairing session has expired.'
    })
  }),
  chrome: {
    runtime: {
      id: 'abcdefghijklmnop',
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

await assert.rejects(
  () => sandbox.pairComplete('123456'),
  /Pairing session has expired\./
);

assert.equal(storage.pairingSessionId, '', 'expired pairing failure should clear the stored pairing session');

console.log('Background tests passed.');
