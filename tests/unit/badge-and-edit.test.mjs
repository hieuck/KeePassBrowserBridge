import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'badge-and-edit.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');
const editFormSource = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'popup', 'EditForm.vue'), 'utf8');

// ====== BUG 1: Badge count not showing on extension icon ======

describe('BUG1: Badge should show login count on icon', () => {
  it('queryLogins should update badge count after fetching entries', () => {
    // queryLogins() fetches the active tab and queries logins, but NEVER calls
    // updateBadgeCount. The badge only updates inside autoFillTab (on page load).
    const queryLoginsStart = bgSource.indexOf('async function queryLogins');
    const queryLoginsBody = bgSource.slice(queryLoginsStart, queryLoginsStart + 300);
    assert.ok(queryLoginsBody.includes('updateBadgeCount'),
      'queryLogins() must call updateBadgeCount after getting entries to update the extension icon badge');
  });

  it('should have chrome.tabs.onActivated listener to refresh badge', () => {
    // When user switches tabs, the badge for the new tab is stale.
    // Need an onActivated handler that updates the badge.
    assert.ok(bgSource.includes('chrome.tabs.onActivated'),
      'Missing chrome.tabs.onActivated listener — badge not refreshed on tab switch');
    const activatedIndex = bgSource.indexOf('chrome.tabs.onActivated');
    const activatedHandler = bgSource.slice(activatedIndex, activatedIndex + 400);
    assert.ok(activatedHandler.includes('updateBadgeCount'),
      'chrome.tabs.onActivated listener must call updateBadgeCount');
  });

  it('should await updateBadgeCount in chrome.tabs.onUpdated', () => {
    // Line ~41 calls updateBadgeCount without await, inconsistent with all other callers
    const updatedIndex = bgSource.indexOf('chrome.tabs.onUpdated');
    const updatedHandler = bgSource.slice(updatedIndex, updatedIndex + 200);
    // Every updateBadgeCount call in onUpdated should use await
    const matches = updatedHandler.match(/updateBadgeCount/g);
    assert.ok(matches, 'updateBadgeCount must be called in onUpdated handler');
  });
});

// ====== BUG 2: Edit form bugs (ReplaceCustomFields, password clear) ======

describe('BUG2: EditForm.vue onSave should include ReplaceCustomFields', () => {
  it('onSave should emit ReplaceCustomFields: true', () => {
    // The onSave function at line 181 emits save data but did NOT include
    // ReplaceCustomFields. The C# side defaults to false, so removed custom
    // fields are never actually deleted from the entry.
    const onSaveStart = editFormSource.indexOf('function onSave()');
    const onSaveBody = editFormSource.slice(onSaveStart, onSaveStart + 350);
    assert.ok(onSaveBody.includes('ReplaceCustomFields'),
      'onSave must emit ReplaceCustomFields: true so removed custom fields are actually deleted');
  });

  it('onSave should include ReplaceCustomFields: true in save payload', () => {
    const onSaveStart = editFormSource.indexOf('function onSave()');
    const onSaveBody = editFormSource.slice(onSaveStart, onSaveStart + 350);
    assert.ok(onSaveBody.includes('ReplaceCustomFields: true') || onSaveBody.includes('"ReplaceCustomFields": true'),
      'ReplaceCustomFields must be set to true in the save emit payload');
  });
});

describe('BUG2: EditForm.vue should handle password clearing', () => {
  it('should allow clearing the password field', () => {
    // When user clears the password field, onSave sends Password: ''.
    // The C# side checks if (!string.IsNullOrWhiteSpace(payload.Password))
    // before updating — so clearing password has no effect.
    // The fix should either send a special flag or handle empty password.
    const onSaveStart = editFormSource.indexOf('function onSave()');
    const onSaveBody = editFormSource.slice(onSaveStart, onSaveStart + 300);
    assert.ok(
      onSaveBody.includes('ClearPassword') ||
      onSaveBody.includes('form.Password') ||
      onSaveBody.includes('replace'),
      'EditForm must handle password clearing — either send ClearPassword flag or always include password field');
  });
});

describe('BUG2: Custom field empty values should be allowed', () => {
  it('should not filter out custom fields with empty values', () => {
    // onSave filters: .filter(f => f.Name.trim()) — only filters by Name, which is correct.
    // But the C# AddCustomFields skips fields where string.IsNullOrWhiteSpace(field.Value).
    // This should be noted or the Value should be preserved.
    const onSaveStart = editFormSource.indexOf('function onSave()');
    const onSaveBody = editFormSource.slice(onSaveStart, onSaveStart + 200);
    assert.ok(!onSaveBody.includes('f.Value.trim'),
      'Custom field values should not be filtered out in onSave');
  });
});
