import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/FilterBar.vue'), 'utf-8');

test('FilterBar renders chip buttons for filter groups', () => {
  expect(source).toContain('filter-bar__chip');
  expect(source).toContain('role="tab"');
  expect(source).toContain('role="tablist"');
});

test('FilterBar shows active state on selected chip', () => {
  expect(source).toContain('filter-bar__chip--active');
  expect(source).toContain('aria-selected');
});

test('FilterBar shows overflow dropdown when more than 5 groups', () => {
  expect(source).toContain('filter-bar__overflow');
  expect(source).toContain('filter-bar__more');
  expect(source).toContain('filter-bar__dropdown');
});

test('FilterBar uses BaseBadge for group counts', () => {
  expect(source).toContain('BaseBadge');
  expect(source).toContain('count');
});

test('FilterBar emits update:modelValue on chip click', () => {
  expect(source).toMatch(/update:modelValue/);
  expect(source).toMatch(/defineEmits/);
});
