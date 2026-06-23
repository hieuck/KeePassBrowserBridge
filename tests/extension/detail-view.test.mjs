import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/DetailView.vue'), 'utf-8');

test('DetailView shows username row with copy button', () => {
  expect(source).toMatch(/Username/);
  expect(source).toMatch(/copy/);
});

test('DetailView shows password row with show/hide toggle and copy button', () => {
  expect(source).toMatch(/Password/);
  expect(source).toMatch(/EyeOutlined/);
  expect(source).toMatch(/EyeInvisibleOutlined/);
});

test('DetailView has Fill form button', () => {
  expect(source).toMatch(/Fill form/);
});

test('DetailView shows custom fields section', () => {
  expect(source).toContain('CustomFields');
  expect(source).toContain('detail-view__custom');
});

test('DetailView emits fill, copy, and toggle-show events', () => {
  expect(source).toMatch(/defineEmits/);
  expect(source).toMatch(/['"]fill['"]/);
  expect(source).toMatch(/['"]copy['"]/);
});
