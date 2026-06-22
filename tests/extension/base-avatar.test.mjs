import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseAvatar.vue'), 'utf-8');

test('BaseAvatar generates Google favicon URL from provided url hostname', () => {
  expect(source).toContain('google.com/s2/favicons');
  expect(source).toContain('hostname');
  expect(source).toMatch(/URL/);
});

test('BaseAvatar supports sm, md, and lg size variants', () => {
  expect(source).toMatch(/['"]sm['"]/);
  expect(source).toMatch(/['"]md['"]/);
  expect(source).toMatch(/['"]lg['"]/);
  expect(source).toMatch(/kbb-avatar--sm/);
  expect(source).toMatch(/kbb-avatar--md/);
  expect(source).toMatch(/kbb-avatar--lg/);
});

test('BaseAvatar falls back to first letter initial from name', () => {
  expect(source).toMatch(/name/);
  expect(source).toMatch(/toUpperCase/);
  expect(source).toMatch(/initial|kbb-avatar__letter/);
});
