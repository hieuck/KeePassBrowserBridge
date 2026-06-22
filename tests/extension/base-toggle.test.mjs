import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseToggle.vue'), 'utf-8');

test('BaseToggle renders as a switch with role=switch and aria-checked', () => {
  expect(source).toContain('role="switch"');
  expect(source).toContain('aria-checked');
  expect(source).toContain('role="switch"');
});

test('BaseToggle supports disabled state with visual modifier class', () => {
  expect(source).toMatch(/disabled/);
  expect(source).toMatch(/kbb-toggle--disabled/);
  expect(source).toMatch(/kbb-toggle__switch--on/);
});

test('BaseToggle declares modelValue prop, label, description, and v-model emit', () => {
  expect(source).toMatch(/defineProps/);
  expect(source).toMatch(/modelValue/);
  expect(source).toMatch(/['"]label['"]/);
  expect(source).toMatch(/['"]description['"]/);
  expect(source).toMatch(/ariaLabel/);
  expect(source).toMatch(/update:modelValue/);
});
