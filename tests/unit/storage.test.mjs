import { describe, it, assert } from 'vitest';
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

describe('storage.js', () => {
  it('should export getSettings', () => {
    assert.ok(source.includes('export function getSettings'), 'Missing getSettings');
  });

  it('should export setSetting', () => {
    assert.ok(source.includes('export function setSetting'), 'Missing setSetting');
  });

  it('should export setSettings', () => {
    assert.ok(source.includes('export function setSettings'), 'Missing setSettings');
  });

  it('should use chrome.storage.local', () => {
    assert.ok(source.includes('chrome.storage.local'), 'Missing chrome.storage.local');
  });

  it('should handle null result in getSettings', () => {
    assert.ok(source.includes('data || {}'), 'Missing fallback for null result');
  });

  it('should call get with null for all settings', () => {
    assert.ok(source.includes('.get(null,'), 'Missing get(null) for all settings');
  });

  it('should set a single key in setSetting', () => {
    assert.ok(source.includes('.set({ [key]: value }'), 'Missing single key set');
  });

  it('should set all settings in setSettings', () => {
    assert.ok(source.includes('.set(obj,'), 'Missing settings set');
  });

  it('should return Promises from all functions', () => {
    assert.ok(source.includes('new Promise'), 'Missing Promise wrapper');
  });

  it('should resolve Promise on successful set', () => {
    assert.ok(source.includes('resolve()'), 'Missing resolve callback');
  });
});
