import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'pair-dialog.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'popup', 'PairDialog.vue'), 'utf8');

describe('PairDialog.vue - native HTML', () => {
  it('should NOT import ant-design-vue components', () => {
    assert.ok(!source.includes("from 'ant-design-vue'"),
      'PairDialog must NOT import ant-design-vue — use native HTML');
  });

  it('should use native <input> for pairing code', () => {
    assert.ok(source.includes('<input') && !source.includes('a-input'),
      'Must use native <input> instead of a-input');
  });

  it('should use native <button> for actions', () => {
    assert.ok(source.includes('<button') && !source.includes('a-button'),
      'Must use native <button> instead of a-button');
  });
});

describe('PairDialog.vue - pairing logic', () => {
  it('should emit pair-begin on start', () => {
    assert.ok(source.includes("emit('pair-begin'") || source.includes('emit("pair-begin"'),
      'Must emit pair-begin when starting pairing');
  });

  it('should emit pair-complete with code on submit', () => {
    assert.ok(source.includes("emit('pair-complete'") || source.includes('emit("pair-complete"'),
      'Must emit pair-complete with code');
  });

  it('should validate code length >= 6', () => {
    assert.ok(source.includes('.length < 6') || source.includes('.length >= 6'),
      'Must validate pairing code length');
  });

  it('should show expiry countdown', () => {
    assert.ok(source.includes('expiresAt') || source.includes('timeLeft'),
      'Must track pairing code expiration');
  });

  it('should clean up timer on unmount', () => {
    assert.ok(source.includes('onUnmounted'),
      'Must clean up interval on unmount');
  });
});
