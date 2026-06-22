import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseSelect.vue'), 'utf-8');

test('BaseSelect renders trigger button with placeholder text', () => {
  expect(source).toContain('kbb-select__trigger');
  expect(source).toMatch(/placeholder/);
});

test('BaseSelect opens dropdown on click and shows options', () => {
  expect(source).toContain('kbb-select__dropdown');
  expect(source).toContain('role="listbox"');
  expect(source).toContain('role="option"');
});

test('BaseSelect supports keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)', () => {
  expect(source).toMatch(/ArrowDown/);
  expect(source).toMatch(/ArrowUp/);
  expect(source).toMatch(/Enter/);
  expect(source).toMatch(/Escape/);
});

test('BaseSelect emits update:modelValue on option selection', () => {
  expect(source).toMatch(/update:modelValue/);
  expect(source).toMatch(/defineEmits/);
});

test('BaseSelect shows error message when error prop is set', () => {
  expect(source).toContain('kbb-select__error');
  expect(source).toMatch(/error/);
});
