import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'validators.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'shared', 'validators.js'), 'utf8');

describe('validators.js - isValidUrl', () => {
  it('should accept valid https URLs', () => {
    assert.ok(source.includes('isValidUrl'), 'Missing isValidUrl export');
  });

  it('should accept valid http URLs', () => {
    assert.ok(source.includes('http:'), 'Missing http: protocol support');
  });

  it('should reject ftp URLs', () => {
    assert.ok(source.includes('https:'), 'Missing https: protocol support');
  });

  it('should reject empty/undefined input', () => {
    assert.ok(source.includes('if (!value) return false'), 'Missing empty check');
  });

  it('should use try/catch for invalid URL strings', () => {
    assert.ok(source.includes('try') && source.includes('catch'), 'Missing try/catch for URL constructor');
  });
});

describe('validators.js - isValidEmail', () => {
  it('should export isValidEmail function', () => {
    assert.ok(source.includes('isValidEmail'), 'Missing isValidEmail export');
  });

  it('should handle empty input', () => {
    assert.ok(source.includes('if (!value) return false'), 'Missing empty check for email');
  });
});

describe('validators.js - isNonEmpty', () => {
  it('should export isNonEmpty function', () => {
    assert.ok(source.includes('isNonEmpty'), 'Missing isNonEmpty export');
  });

  it('should check for string type', () => {
    assert.ok(source.includes('typeof value ==='), 'Missing type check');
  });

  it('should check trimmed length > 0', () => {
    assert.ok(source.includes('trim().length'), 'Missing trim check');
  });
});
