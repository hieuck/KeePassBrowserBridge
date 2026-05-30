import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sessionValues = new Map();
const sentMessages = [];
let reloadCount = 0;
const listeners = new Map();

class MockXmlHttpRequest {
  addEventListener() {}
  open() {}
  send() {}
}

const sandbox = {
  console,
  Date,
  JSON,
  sessionStorage: {
    getItem: (key) => sessionValues.has(key) ? sessionValues.get(key) : null,
    setItem: (key, value) => sessionValues.set(key, String(value)),
    removeItem: (key) => sessionValues.delete(key)
  },
  location: {
    reload: () => {
      reloadCount += 1;
    }
  },
  chrome: {
    runtime: {
      sendMessage(message, callback) {
        sentMessages.push(message);
        callback({
          ok: true,
          response: {
            username: 'alice',
            password: 'secret'
          }
        });
      }
    }
  },
  XMLHttpRequest: MockXmlHttpRequest
};

sandbox.window = {
  location: {
    href: 'https://example.com/private'
  },
  addEventListener(name, callback) {
    listeners.set(name, callback);
  },
  fetch: async () => ({
    status: 401,
    headers: {
      get: (name) => name.toLowerCase() === 'www-authenticate' ? 'Basic realm="private"' : ''
    }
  })
};
sandbox.globalThis = sandbox;

const source = fs.readFileSync(new URL('../../extension/httpAuth.js', import.meta.url), 'utf8');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'httpAuth.js' });

await sandbox.window.fetch('https://example.com/private');
listeners.get('beforeunload')?.({});

assert.equal(sentMessages[0].type, 'KBB_QUERY_HTTP_AUTH', 'HTTP auth module should ask background for credentials');
assert.equal(sentMessages[0].url, 'https://example.com/private', 'HTTP auth module should query credentials for the challenged URL');

const stored = sessionValues.get('kbb_http_auth_credentials') || null;
assert.equal(stored, null, 'HTTP auth credentials should not be stored in page sessionStorage');
assert.equal(sessionValues.get('kbb_last_url') || null, null, 'HTTP auth module should not store page URLs in page sessionStorage');
assert.equal(sandbox.window.__kbbHttpAuth.getStoredCredentials(), null, 'HTTP auth helper should not expose credentials to the page');
assert.equal(reloadCount, 1, 'HTTP auth module should reload after storing credentials');

console.log('HTTP auth tests passed.');
