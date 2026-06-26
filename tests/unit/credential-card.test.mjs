import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'credential-card.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'popup', 'CredentialCard.vue'), 'utf8');

describe('CredentialCard.vue - quick copy actions', () => {
  it('should have copy-username button on collapsed card', () => {
    assert.ok(source.includes('Copy username') && source.includes("'username'"),
      'Missing copy-username quick action button');
  });

  it('should have copy-password button on collapsed card', () => {
    assert.ok(source.includes('Copy password') && source.includes("'password'"),
      'Missing copy-password quick action button');
  });

  it('should emit copy event when quick action clicked', () => {
    assert.ok(source.includes("$emit('copy'") || source.includes("$emit('copy"),
      'Quick actions must emit copy event with field name and value');
  });

  it('should import CopyOutlined and KeyOutlined icons', () => {
    assert.ok(source.includes('CopyOutlined'), 'Missing CopyOutlined import');
    assert.ok(source.includes('KeyOutlined'), 'Missing KeyOutlined import');
  });
});

describe('CredentialCard.vue - formatters integration', () => {
  it('should import formatRelativeTime from formatters', () => {
    assert.ok(source.includes("from '../../shared/formatters.js'"), 'Missing formatters import');
    assert.ok(source.includes('formatRelativeTime'), 'Missing formatRelativeTime import');
  });

  it('should call formatRelativeTime on entry.LastUsed', () => {
    assert.ok(source.includes('formatRelativeTime(entry.LastUsed)'),
      'Must call formatRelativeTime with LastUsed');
  });
});

describe('CredentialCard.vue - expandable card structure', () => {
  it('should have expanded prop with boolean type', () => {
    assert.ok(source.includes('expanded:'), 'Missing expanded prop');
    assert.ok(source.includes('Boolean'), 'Missing Boolean type for expanded');
  });

  it('should toggle --expanded class based on expanded state', () => {
    assert.ok(source.includes("'credential-card--expanded': expanded"),
      'Missing dynamic expanded class binding');
  });

  it('should emit toggle event on card click', () => {
    assert.ok(source.includes("$emit('toggle'") || source.includes('emit("toggle"'),
      'Missing toggle emit on card interaction');
  });
});

describe('CredentialCard.vue - favicon display', () => {
  it('should have faviconUrl computed property', () => {
    assert.ok(source.includes('faviconUrl'), 'Missing faviconUrl computed property');
  });

  it('should use Google favicons service', () => {
    assert.ok(source.includes('google.com/s2/favicons'), 'Missing Google favicons URL');
  });

  it('should encode hostname for favicon URL', () => {
    assert.ok(source.includes('encodeURIComponent'), 'Missing hostname encoding for favicon');
  });

  it('should bind faviconUrl to avatar src', () => {
    assert.ok(source.includes(':src="faviconUrl"') || source.includes('v-bind:src="faviconUrl"'),
      'Missing faviconUrl binding to avatar src');
  });
});

describe('CredentialCard.vue - empty credential handling', () => {
  it('should show (Untitled) when entry.Title is empty', () => {
    assert.ok(source.includes("'(Untitled)'"), 'Missing fallback title for empty entry');
  });

  it('should conditionally show username field', () => {
    assert.ok(source.includes('v-if="entry.UserName"'),
      'Missing v-if guard on UserName display');
  });

  it('should handle missing entry.Url gracefully in faviconUrl', () => {
    assert.ok(source.includes("!props.entry.Url"),
      'Missing empty Url guard in faviconUrl');
  });
});
