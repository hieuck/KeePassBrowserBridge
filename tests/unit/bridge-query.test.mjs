import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'bridge-query.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const useBridgeSource = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'composables', 'useBridge.js'), 'utf8');
const clientsTabSource = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'options', 'tabs', 'ClientsTab.vue'), 'utf8');
const passkeyTabSource = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'options', 'tabs', 'PasskeyTab.vue'), 'utf8');

describe('useBridge - missing query methods (BUG6, BUG7)', () => {
  it('should export listClients method', () => {
    assert.ok(
      useBridgeSource.includes('listClients'),
      'useBridge.js missing listClients() — needed by ClientsTab for KBB_LIST_CLIENTS'
    );
  });

  it('should export revokeClient method', () => {
    assert.ok(
      useBridgeSource.includes('revokeClient'),
      'useBridge.js missing revokeClient() — needed by ClientsTab for KBB_REVOKE_CLIENT'
    );
  });

  it('should export setPasskeysEnabled method', () => {
    assert.ok(
      useBridgeSource.includes('setPasskeysEnabled'),
      'useBridge.js missing setPasskeysEnabled() — needed by PasskeyTab for KBB_SET_PASSKEYS_ENABLED'
    );
  });
});

describe('ClientsTab - bridge integration (BUG6)', () => {
  it('should import useBridge composable', () => {
    assert.ok(
      clientsTabSource.includes('useBridge'),
      'ClientsTab.vue missing import of useBridge'
    );
  });

  it('should call listClients on mount', () => {
    assert.ok(
      clientsTabSource.includes('listClients') || clientsTabSource.includes('clients.list'),
      'ClientsTab.vue does not call listClients() on mount'
    );
  });

  it('should call revokeClient through bridge on revoke', () => {
    assert.ok(
      clientsTabSource.includes('revokeClient') && useBridgeSource.includes('revokeClient'),
      'ClientsTab.vue does not call revokeClient() through bridge'
    );
  });
});

describe('PasskeyTab - bridge integration (BUG7)', () => {
  it('should import useBridge composable', () => {
    assert.ok(
      passkeyTabSource.includes('useBridge'),
      'PasskeyTab.vue missing import of useBridge'
    );
  });

  it('should query passkey status via getAbout on mount', () => {
    assert.ok(
      passkeyTabSource.includes('getAbout') || passkeyTabSource.includes('pluginPasskeys'),
      'PasskeyTab.vue does not query pluginPasskeysEnabled from bridge getAbout()'
    );
  });
});
