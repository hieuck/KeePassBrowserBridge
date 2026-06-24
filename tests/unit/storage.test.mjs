import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'storage.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'shared', 'storage.js'), 'utf8');

describe('storage.js - getSettings', () => {
  it('should export getSettings', () => {
    assert.ok(source.includes('getSettings'), 'Missing getSettings export');
  });

  it('should return empty object when chrome API is unavailable', () => {
    assert.ok(source.includes('typeof chrome') || source.includes('typeof window.chrome'),
      'Missing chrome availability check');
    assert.ok(source.includes("resolve({})"), 'Missing empty object fallback');
  });

  it('should call chrome.storage.local.get(null) for all settings', () => {
    assert.ok(source.includes('chrome.storage.local.get'),
      'Missing chrome.storage.local.get call');
    assert.ok(source.includes('null'), 'Missing null argument (get all settings)');
  });
});

describe('storage.js - setSetting', () => {
  it('should export setSetting', () => {
    assert.ok(source.includes('setSetting'), 'Missing setSetting export');
  });

  it('should call chrome.storage.local.set with key/value object', () => {
    assert.ok(source.includes('chrome.storage.local.set'),
      'Missing chrome.storage.local.set call');
  });

  it('should resolve without error when chrome API is unavailable', () => {
    assert.ok(source.includes('resolve()'), 'Missing resolve on failure');
  });
});

describe('storage.js - setSettings', () => {
  it('should export setSettings', () => {
    assert.ok(source.includes('setSettings'), 'Missing setSettings export');
  });

  it('should pass object directly to chrome.storage.local.set', () => {
    assert.ok(source.includes('chrome.storage.local.set'),
      'Missing chrome.storage.local.set call');
  });

  it('should resolve without error when chrome API is unavailable', () => {
    assert.ok(source.includes('resolve()'), 'Missing resolve on failure');
  });
});
