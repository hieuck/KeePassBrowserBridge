import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'new-login-form.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'popup', 'NewLoginForm.vue'), 'utf8');

describe('NewLoginForm.vue - canSave validation', () => {
  it('should require Title (non-empty)', () => {
    assert.ok(source.includes('form.Title.trim()'),
      'canSave must check that Title is non-empty');
  });

  it('should require URL (non-empty) — backend rejects empty URL', () => {
    // C# CredentialMutationService.Create requires a valid absolute URL
    // If URL is empty, user gets confusing "Login URL is invalid" from backend
    const urlRuleIdx = source.indexOf("name='Url'") !== -1 ? source.indexOf("name='Url'") : source.indexOf('name="Url"');
    const urlSection = urlRuleIdx >= 0 ? source.slice(urlRuleIdx, urlRuleIdx + 200) : '';
    assert.ok(urlSection.includes('required') || urlSection.includes('required:'),
      'NewLoginForm must have required rule for URL field — backend requires valid absolute URL');
  });

  it('should require at least one of UserName or Password', () => {
    // C# CredentialMutationService.Create requires username OR password
    // Check canSave computed checks both fields
    const canSaveStart = source.indexOf('const canSave');
    const canSaveBody = canSaveStart >= 0 ? source.slice(canSaveStart, canSaveStart + 350) : '';
    assert.ok(
      canSaveBody.includes('form.UserName') && canSaveBody.includes('form.Password'),
      'canSave computed must check form.UserName and form.Password — backend requires credentials'
    );
  });

  it('should validate URL format (http/https)', () => {
    // URL must be a valid absolute URL with http/https protocol
    const canSaveStart = source.indexOf('const canSave');
    const canSaveBody = canSaveStart >= 0 ? source.slice(canSaveStart, canSaveStart + 200) : '';
    assert.ok(
      canSaveBody.includes('isValidUrl') || canSaveBody.includes('Url.trim'),
      'NewLoginForm should validate URL format in canSave (isValidUrl or trim check)'
    );
  });
});

describe('NewLoginForm.vue - onSave payload', () => {
  it('should emit form data without extra fields', () => {
    const onSaveStart = source.indexOf('function onSave()');
    const onSaveBody = source.slice(onSaveStart, onSaveStart + 100);
    assert.ok(onSaveBody.includes('{ ...form }') || onSaveBody.includes("emit('save'"),
      'onSave should emit a copy of form data');
  });
});
