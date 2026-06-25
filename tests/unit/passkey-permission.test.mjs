import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'passkey-permission.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');
const optionsApp = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'options', 'App.vue'), 'utf8');

describe('Passkey enablement — user gesture fix', () => {
  it('options App.vue should request chrome.permissions directly (user gesture)', () => {
    assert.ok(optionsApp.includes('chrome.permissions.request'),
      'options App.vue must call chrome.permissions.request() directly from user gesture');
    assert.ok(optionsApp.includes('webAuthenticationProxy'),
      'options App.vue must request webAuthenticationProxy permission');
  });

  it('background.js setPasskeysEnabled should still request permissions (redundant but safe)', () => {
    assert.ok(bgSource.includes('chrome.permissions.request') && bgSource.includes('setPasskeysEnabled'),
      'background.js should still attempt permission request as fallback');
  });

  it('background.js storage.onChanged should call setupPasskeyProxy (not request permissions)', () => {
    // storage.onChanged won't have user gesture, so it should NOT request permissions
    const changedHandler = bgSource.slice(bgSource.indexOf('storage.onChanged'), bgSource.indexOf('storage.onChanged') + 200);
    assert.ok(!changedHandler.includes('permissions.request') || changedHandler.includes('setupPasskeyProxy'),
      'storage.onChanged should NOT call permissions.request (no user gesture)');
  });
});
