import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'bridge-error.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');

describe('Bridge error handling — "Failed to fetch" fix', () => {
  it('should catch fetch errors and show helpful message', () => {
    assert.ok(bgSource.includes('try') && bgSource.includes('fetch(endpoint'),
      'bridgeCall must wrap fetch in try-catch');
  });

  it('should convert "Failed to fetch" to KeePass connection message', () => {
    assert.ok(bgSource.includes('Failed to fetch'),
      'bridgeCall must check for Failed to fetch error');
    assert.ok(bgSource.includes('Cannot connect to KeePass'),
      'bridgeCall must convert Failed to fetch to user-friendly message');
    assert.ok(bgSource.includes('ensure KeePass is running'),
      'Error message must mention starting KeePass');
  });
});
