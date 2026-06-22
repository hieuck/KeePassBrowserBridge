import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseInput.vue'), 'utf-8');

test('BaseInput supports password type with show/hide toggle', () => {
  expect(source).toContain("'password'");
  expect(source).toContain('showToggle');
  expect(source).toContain('aria-label');
});

test('BaseInput exposes accessibility ARIA attributes and IDs', () => {
  expect(source).toContain('aria-invalid');
  expect(source).toContain('aria-describedby');
  expect(source).toContain('useId');
});

test('BaseInput supports leading and trailing icons plus trailing-click emit', () => {
  expect(source).toContain('leadingIcon');
  expect(source).toContain('trailingIcon');
  expect(source).toContain('trailing-click');
  expect(source).toContain('update:modelValue');
});

test('BaseInput declares all required props and required emits', () => {
  expect(source).toMatch(/defineProps/);
  expect(source).toMatch(/defineEmits/);
  expect(source).toMatch(/['"]blur['"]/);
  expect(source).toMatch(/['"]focus['"]/);
});
