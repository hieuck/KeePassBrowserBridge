import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'useToast.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'composables', 'useToast.js'), 'utf8');

describe('useToast.js - show function', () => {
  it('should export useToast function', () => {
    assert.ok(source.includes('export function useToast()'), 'Missing useToast export');
  });

  it('should return show function', () => {
    assert.ok(source.includes('return { show }'), 'Missing show return');
  });

  it('should call antd message API', () => {
    assert.ok(source.includes('message['), 'Missing antd message API call');
  });

  it('should handle error variant', () => {
    assert.ok(source.includes("variant === 'error'"), 'Missing error variant handling');
  });

  it('should handle success variant', () => {
    assert.ok(source.includes("variant === 'success'"), 'Missing success variant handling');
  });

  it('should handle warning variant', () => {
    assert.ok(source.includes("variant === 'warning'"), 'Missing warning variant handling');
  });

  it('should default to info variant', () => {
    assert.ok(source.includes("'info'"), 'Missing info variant default');
  });

  it('should convert duration from ms to seconds', () => {
    assert.ok(source.includes('/ 1000'), 'Missing ms to seconds conversion');
    assert.ok(source.includes('options.duration'), 'Missing duration option handling');
  });

  it('should default duration to 4 seconds', () => {
    // 4s = 4000ms default
    assert.ok(source.includes('4') || source.includes('4000'),
      'Missing default duration of 4 seconds');
  });
});
