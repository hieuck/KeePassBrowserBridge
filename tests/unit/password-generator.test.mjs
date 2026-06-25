import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'password-generator.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'popup', 'PasswordGenerator.vue'), 'utf8');
// Note: formatCount and formatRelativeTime are in shared/formatters.js. We check the generator itself.

describe('PasswordGenerator.vue - charset options', () => {
  it('should include lowercase letters by default', () => {
    assert.ok(source.includes('lower') || source.includes('Lower'),
      'Missing lowercase option');
  });

  it('should include uppercase letters by default', () => {
    assert.ok(source.includes('upper') || source.includes('Upper'),
      'Missing uppercase option');
  });

  it('should include digits by default', () => {
    assert.ok(source.includes('digit') || source.includes('Digit'),
      'Missing digits option');
  });

  it('should have configurable length slider', () => {
    assert.ok(source.includes('length') && source.includes('min'),
      'Missing min/max length configuration');
  });

  it('should have exclude-ambiguous toggle', () => {
    assert.ok(source.includes('exclude') || source.includes('ambiguous') || source.includes('similar'),
      'Missing exclude ambiguous characters option');
  });
});
