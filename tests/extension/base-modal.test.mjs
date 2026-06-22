import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseModal.vue'), 'utf-8');

test('BaseModal uses Teleport, role=dialog, and aria-modal', () => {
  expect(source).toContain('<Teleport to="body">');
  expect(source).toContain('role="dialog"');
  expect(source).toContain('aria-modal="true"');
});

test('BaseModal supports dismissible, closeOnBackdrop, and closeOnEsc props', () => {
  expect(source).toMatch(/dismissible/);
  expect(source).toMatch(/closeOnBackdrop/);
  expect(source).toMatch(/closeOnEsc/);
  expect(source).toMatch(/Escape/);
});

test('BaseModal declares required modelValue prop, title, maxWidth, and emits close + update:modelValue', () => {
  expect(source).toMatch(/defineProps/);
  expect(source).toMatch(/modelValue/);
  expect(source).toMatch(/title:/);
  expect(source).toMatch(/maxWidth:/);
  expect(source).toMatch(/['"]update:modelValue['"]/);
  expect(source).toMatch(/['"]close['"]/);
});
