import { describe, it, assert } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'filter-bar.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'components', 'FilterBar.vue'), 'utf8');

describe('FilterBar.vue - imports and setup', () => {
  it('should import ref and computed from vue', () => {
    assert.ok(source.includes("import { ref, computed } from 'vue'"),
      'Missing ref/computed import from vue');
  });

  it('should import BaseBadge component', () => {
    assert.ok(source.includes("import BaseBadge from './BaseBadge.vue'"),
      'Missing BaseBadge import');
  });

  it('should have modelValue prop with all default', () => {
    assert.ok(source.includes('modelValue'), 'Missing modelValue prop');
    assert.ok(source.includes("default: 'all'"), 'Missing all default for modelValue');
  });

  it('should have groups prop as Array', () => {
    assert.ok(source.includes('groups:'), 'Missing groups prop');
    assert.ok(source.includes('Array'), 'Missing Array type for groups');
  });
});

describe('FilterBar.vue - overflow handling', () => {
  it('should limit visible groups to first 5', () => {
    assert.ok(source.includes('.slice(0, 5)'), 'Must slice groups to first 5 visible');
  });

  it('should compute overflow groups beyond 5', () => {
    assert.ok(source.includes('.slice(5)'), 'Must slice overflow groups from index 5');
  });

  it('should show +N overflow button', () => {
    assert.ok(source.includes('+{{ overflowGroups.length }}'),
      'Missing +N overflow groups button');
  });

  it('should toggle showOverflow on click', () => {
    assert.ok(source.includes('showOverflow = !showOverflow'),
      'Missing showOverflow toggle on click');
  });

  it('should have showOverflow ref initialized to false', () => {
    assert.ok(source.includes('showOverflow = ref(false)') || source.includes('showOverflow = ref(false'),
      'Missing showOverflow ref initialized to false');
  });

  it('should close overflow after selecting a group', () => {
    assert.ok(source.includes('showOverflow.value = false'),
      'Must close overflow after selection');
  });
});

describe('FilterBar.vue - ARIA roles', () => {
  it('should have tablist role on container', () => {
    assert.ok(source.includes('role="tablist"'), 'Missing tablist role');
  });

  it('should have tablist aria-label', () => {
    assert.ok(source.includes('aria-label="Filter by group"'),
      'Missing tablist aria-label');
  });

  it('should have tab role on each chip', () => {
    assert.ok(source.includes('role="tab"'), 'Missing tab role on chips');
  });

  it('should have aria-selected on chips', () => {
    assert.ok(source.includes('aria-selected'), 'Missing aria-selected on chips');
  });

  it('should have aria-expanded on overflow button', () => {
    assert.ok(source.includes('aria-expanded'), 'Missing aria-expanded on overflow button');
  });
});

describe('FilterBar.vue - emit behavior', () => {
  it('should emit update:modelValue on chip click', () => {
    assert.ok(source.includes("$emit('update:modelValue', group.id)") ||
      source.includes('emit("update:modelValue", group.id)'),
      'Missing update:modelValue emit on chip click');
  });

  it('should call selectOverflow function for overflow chips', () => {
    assert.ok(source.includes('selectOverflow(group.id)'),
      'Missing selectOverflow call for overflow chips');
  });
});
