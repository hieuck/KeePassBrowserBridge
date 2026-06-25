import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'passkey-enable.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const optionsApp = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'options', 'App.vue'), 'utf8');
const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');

describe('Passkey enablement flow', () => {
  it('options App.vue should import useBridge for passkey toggle', () => {
    assert.ok(optionsApp.includes('useBridge'),
      'options App.vue must import useBridge composable to call setPasskeysEnabled');
  });

  it('options App.vue should call bridge.setPasskeysEnabled when passkeys setting changes', () => {
    assert.ok(
      optionsApp.includes('setPasskeysEnabled'),
      'options App.vue must call bridge.setPasskeysEnabled() when passkeysEnabled changes'
    );
  });

  it('background.js should handle both storage change AND direct message for passkey toggle', () => {
    // storage.onChanged is called when user saves option page
    // KBB_SET_PASSKEYS_ENABLED is called directly
    assert.ok(bgSource.includes('KBB_SET_PASSKEYS_ENABLED'),
      'background.js must handle KBB_SET_PASSKEYS_ENABLED message');
    assert.ok(bgSource.includes('storage.onChanged') && bgSource.includes('passkeysEnabled'),
      'background.js must also react to storage changes for passkeysEnabled');
  });

  it('should request webAuthenticationProxy permission before calling setupPasskeyProxy', () => {
    assert.ok(bgSource.includes('chrome.permissions.request'),
      'background.js must request permission before proxy setup');
    assert.ok(bgSource.includes('webAuthenticationProxy'),
      'must request webAuthenticationProxy permission');
  });

  it('PasskeyTab should emit save event with passkeysEnabled', () => {
    const passkeyTab = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'options', 'tabs', 'PasskeyTab.vue'), 'utf8');
    assert.ok(passkeyTab.includes("'save'") || passkeyTab.includes('emit('),
      'PasskeyTab should emit save when toggle changes');
    assert.ok(passkeyTab.includes('passkeysEnabled'),
      'PasskeyTab must include passkeysEnabled in save payload');
  });
});
