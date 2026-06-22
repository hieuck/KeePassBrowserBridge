import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseToast.vue'), 'utf-8');

test('BaseToast registers singleton on window.__kbbToast with show() method', () => {
  expect(source).toContain('__kbbToast');
  expect(source).toContain('show');
  expect(source).toMatch(/defineExpose/);
});

test('BaseToast uses role=status with aria-live polite (assertive for error)', () => {
  expect(source).toContain('role="status"');
  expect(source).toMatch(/aria-live/);
  expect(source).toMatch(/['"]polite['"]/);
  expect(source).toMatch(/['"]assertive['"]/);
  expect(source).toMatch(/['"]error['"]/);
});

test('BaseToast supports action button and auto-dismiss duration default 4000', () => {
  expect(source).toMatch(/action/);
  expect(source).toMatch(/onClick/);
  expect(source).toMatch(/duration/);
  expect(source).toMatch(/4000/);
});
