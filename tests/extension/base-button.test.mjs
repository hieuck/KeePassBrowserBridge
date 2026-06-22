import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const componentPath = path.join(__dirname, '../../extension/src/components/BaseButton.vue');
const source = fs.readFileSync(componentPath, 'utf-8');

test('BaseButton supports 4 variants', () => {
  expect(source).toMatch(/['"]primary['"]/);
  expect(source).toMatch(/['"]secondary['"]/);
  expect(source).toMatch(/['"]ghost['"]/);
  expect(source).toMatch(/['"]danger['"]/);
});

test('BaseButton supports 3 sizes', () => {
  expect(source).toMatch(/['"]sm['"]/);
  expect(source).toMatch(/['"]md['"]/);
  expect(source).toMatch(/['"]lg['"]/);
});

test('BaseButton emits click event via defineEmits', () => {
  expect(source).toMatch(/defineEmits/);
  expect(source).toMatch(/['"]click['"]|click['"]/);
});

test('BaseButton supports disabled and loading states', () => {
  expect(source).toMatch(/disabled/);
  expect(source).toMatch(/aria-disabled/);
  expect(source).toMatch(/loading/);
  expect(source).toMatch(/aria-busy/);
});

test('BaseButton supports leading and trailing icons', () => {
  expect(source).toMatch(/leadingIcon/);
  expect(source).toMatch(/trailingIcon/);
});

test('BaseButton block variant makes button full width', () => {
  expect(source).toMatch(/block/);
});
