import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'useBridge.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'composables', 'useBridge.js'), 'utf8');

describe('useBridge.js - exports', () => {
  it('should export useBridge function', () => {
    assert.ok(source.includes('export function useBridge'), 'Missing useBridge export');
  });

  it('should return all bridge methods', () => {
    assert.ok(source.includes('return {'), 'Missing return object');
  });
});

describe('useBridge.js - KBB message prefix', () => {
  it('should use KBB_ prefix for all messages', () => {
    assert.ok(source.includes('KBB_QUERY_LOGINS'), 'Missing KBB_QUERY_LOGINS');
    assert.ok(source.includes('KBB_QUERY_FOR_URL'), 'Missing KBB_QUERY_FOR_URL');
    assert.ok(source.includes('KBB_GET_STATE'), 'Missing KBB_GET_STATE');
    assert.ok(source.includes('KBB_GET_ABOUT'), 'Missing KBB_GET_ABOUT');
    assert.ok(source.includes('KBB_HELLO'), 'Missing KBB_HELLO');
    assert.ok(source.includes('KBB_SET_LOCKED'), 'Missing KBB_SET_LOCKED');
    assert.ok(source.includes('KBB_SET_AUTO_FILL'), 'Missing KBB_SET_AUTO_FILL');
    assert.ok(source.includes('KBB_SET_AUTO_SUBMIT'), 'Missing KBB_SET_AUTO_SUBMIT');
    assert.ok(source.includes('KBB_CREATE_LOGIN'), 'Missing KBB_CREATE_LOGIN');
    assert.ok(source.includes('KBB_UPDATE_LOGIN'), 'Missing KBB_UPDATE_LOGIN');
    assert.ok(source.includes('KBB_FILL_LOGIN'), 'Missing KBB_FILL_LOGIN');
    assert.ok(source.includes('KBB_PAIR_BEGIN'), 'Missing KBB_PAIR_BEGIN');
    assert.ok(source.includes('KBB_PAIR_COMPLETE'), 'Missing KBB_PAIR_COMPLETE');
    assert.ok(source.includes('KBB_PAIR_CANCEL'), 'Missing KBB_PAIR_CANCEL');
    assert.ok(source.includes('KBB_LIST_CLIENTS'), 'Missing KBB_LIST_CLIENTS');
    assert.ok(source.includes('KBB_REVOKE_CLIENT'), 'Missing KBB_REVOKE_CLIENT');
    assert.ok(source.includes('KBB_SET_PASSKEYS_ENABLED'), 'Missing KBB_SET_PASSKEYS_ENABLED');
    assert.ok(source.includes('KBB_LOCK_DATABASE'), 'Missing KBB_LOCK_DATABASE');
    assert.ok(source.includes('KBB_LIST_GROUPS'), 'Missing KBB_LIST_GROUPS');
    assert.ok(source.includes('KBB_GET_DATABASE_INFO'), 'Missing KBB_GET_DATABASE_INFO');
    assert.ok(source.includes('KBB_AUTOTYPE'), 'Missing KBB_AUTOTYPE');
  });
});

describe('useBridge.js - query methods', () => {
  it('should have queryLogins method', () => {
    assert.ok(source.includes('queryLogins'), 'Missing queryLogins');
  });

  it('should have queryForUrl method', () => {
    assert.ok(source.includes('queryForUrl'), 'Missing queryForUrl');
  });
});

describe('useBridge.js - credential methods', () => {
  it('should have fillLogin method', () => {
    assert.ok(source.includes('fillLogin'), 'Missing fillLogin');
  });

  it('should have createLogin method', () => {
    assert.ok(source.includes('createLogin'), 'Missing createLogin');
  });

  it('should have updateLogin method', () => {
    assert.ok(source.includes('updateLogin'), 'Missing updateLogin');
  });
});

describe('useBridge.js - pairing methods', () => {
  it('should have pairBegin method', () => {
    assert.ok(source.includes('pairBegin'), 'Missing pairBegin');
  });

  it('should have pairComplete method', () => {
    assert.ok(source.includes('pairComplete'), 'Missing pairComplete');
  });

  it('should have pairCancel method', () => {
    assert.ok(source.includes('pairCancel'), 'Missing pairCancel');
  });
});

describe('useBridge.js - client methods', () => {
  it('should have listClients method', () => {
    assert.ok(source.includes('listClients'), 'Missing listClients');
  });

  it('should have revokeClient method', () => {
    assert.ok(source.includes('revokeClient'), 'Missing revokeClient');
  });
});

describe('useBridge.js - settings methods', () => {
  it('should have setLocked method', () => {
    assert.ok(source.includes('setLocked'), 'Missing setLocked');
  });

  it('should have setAutoFill method', () => {
    assert.ok(source.includes('setAutoFill'), 'Missing setAutoFill');
  });

  it('should have setAutoSubmit method', () => {
    assert.ok(source.includes('setAutoSubmit'), 'Missing setAutoSubmit');
  });

  it('should have setPasskeysEnabled method', () => {
    assert.ok(source.includes('setPasskeysEnabled'), 'Missing setPasskeysEnabled');
  });
});

describe('useBridge.js - utility methods', () => {
  it('should have getState method', () => {
    assert.ok(source.includes('getState'), 'Missing getState');
  });

  it('should have getAbout method', () => {
    assert.ok(source.includes('getAbout'), 'Missing getAbout');
  });

  it('should have hello method', () => {
    assert.ok(source.includes('hello'), 'Missing hello');
  });

  it('should have lockDatabase method', () => {
    assert.ok(source.includes('lockDatabase'), 'Missing lockDatabase');
  });

  it('should have listGroups method', () => {
    assert.ok(source.includes('listGroups'), 'Missing listGroups');
  });

  it('should have getDatabaseInfo method', () => {
    assert.ok(source.includes('getDatabaseInfo'), 'Missing getDatabaseInfo');
  });

  it('should have performAutoType method', () => {
    assert.ok(source.includes('performAutoType'), 'Missing performAutoType');
  });
});

describe('useBridge.js - error handling', () => {
  it('should handle chrome.runtime.lastError', () => {
    assert.ok(source.includes('lastError'), 'Missing lastError handling');
  });

  it('should validate response with ok field', () => {
    assert.ok(source.includes('response.ok'), 'Missing response.ok check');
  });

  it('should guard against missing chrome.runtime', () => {
    assert.ok(source.includes("typeof chrome === 'undefined'"), 'Missing chrome undefined guard');
  });

  it('should reject with meaningful error message', () => {
    assert.ok(source.includes('.error ||'), 'Missing fallback error message');
  });
});

describe('useBridge.js - Promise wrapper', () => {
  it('should wrap sendMessage in Promise', () => {
    assert.ok(source.includes('new Promise'), 'Missing Promise wrapper');
    assert.ok(source.includes('resolve'), 'Missing resolve');
    assert.ok(source.includes('reject'), 'Missing reject');
  });

  it('should have async call function', () => {
    assert.ok(source.includes('async function call'), 'Missing async call helper');
  });
});

describe('useBridge.js - internal call helper', () => {
  it('should delegate through call helper', () => {
    assert.ok(source.includes('=> call('), 'Missing call helper delegation');
  });

  it('should pass payload along with type', () => {
    assert.ok(source.includes('...payload'), 'Missing payload spread');
  });
});
