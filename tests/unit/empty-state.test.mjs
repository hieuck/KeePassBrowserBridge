import { describe, it, assert } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'empty-state.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'popup', 'EmptyState.vue'), 'utf8');

describe('EmptyState.vue - ant-design-vue integration', () => {
  it('should import Empty from ant-design-vue', () => {
    assert.ok(source.includes("import { Empty } from 'ant-design-vue'"),
      'Missing Empty import from ant-design-vue');
  });

  it('should use Empty.PRESENTED_IMAGE_SIMPLE', () => {
    assert.ok(source.includes('Empty.PRESENTED_IMAGE_SIMPLE'),
      'Missing Empty.PRESENTED_IMAGE_SIMPLE usage');
  });

  it('should wrap content in a-empty component', () => {
    assert.ok(source.includes('<a-empty'), 'Missing a-empty component');
  });
});

describe('EmptyState.vue - variant-based messaging', () => {
  it('should apply variant as CSS class', () => {
    assert.ok(source.includes('`empty-state--${variant}`'),
      'Missing variant-based CSS class');
  });

  it('should have variant prop with default empty', () => {
    assert.ok(source.includes("variant:"), 'Missing variant prop');
    assert.ok(source.includes("default: 'empty'"), 'Missing empty default variant');
  });

  it('should show search variant title with query', () => {
    assert.ok(source.includes("variant === 'search'"), 'Missing search variant handling');
    assert.ok(source.includes('props.query'), 'Using query for search title');
  });

  it('should show filter variant title', () => {
    assert.ok(source.includes("variant === 'filter'"), 'Missing filter variant handling');
    assert.ok(source.includes("No matches"), 'Missing filter variant message');
  });
});

describe('EmptyState.vue - state-specific messages', () => {
  it('should show unpaired state with connection message', () => {
    assert.ok(source.includes("variant === 'unpaired'"), 'Missing unpaired variant check');
    assert.ok(source.includes('KeePass is not connected'), 'Missing unpaired title');
    assert.ok(source.includes('start pairing'), 'Missing pairing instructions');
  });

  it('should show locked state with unlock message', () => {
    assert.ok(source.includes("variant === 'locked'"), 'Missing locked variant check');
    assert.ok(source.includes('KeePass is locked'), 'Missing locked title');
    assert.ok(source.includes('Unlock KeePass'), 'Missing unlock instructions');
  });

  it('should show empty vault title when no variant matches', () => {
    assert.ok(source.includes("No logins yet"), 'Missing empty vault default title');
  });

  it('should show action button only for empty variant', () => {
    assert.ok(source.includes("variant === 'empty'"), 'Missing empty variant for action');
    assert.ok(source.includes("a-button"), 'Missing action button');
  });
});
