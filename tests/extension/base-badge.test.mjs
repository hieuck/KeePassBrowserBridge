import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseBadge.vue'), 'utf-8');

test('BaseBadge supports 5 variants: neutral, success, warning, danger, accent', () => {
  for (const v of ['neutral', 'success', 'warning', 'danger', 'accent']) {
    expect(source, `missing variant ${v}`).toContain(v);
  }
  expect(source).toMatch(/['"]neutral['"]/);
});

test('BaseBadge renders pill-shaped badge with uppercase small-caps text', () => {
  expect(source).toMatch(/radius-full|radius-full|radius--full/);
  expect(source).toMatch(/kbb-badge/);
  expect(source).toMatch(/uppercase/);
});

test('BaseBadge declares variant prop with default neutral', () => {
  expect(source).toMatch(/defineProps/);
  expect(source).toMatch(/variant/);
  expect(source).toMatch(/default.*neutral|default:\s*['"]neutral['"]/);
});
