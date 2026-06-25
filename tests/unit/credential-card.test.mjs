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
