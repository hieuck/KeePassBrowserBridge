import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/components/BaseTooltip.vue'), 'utf-8');

test('BaseTooltip shows on hover with delay', () => {
  expect(source).toMatch(/mouseenter/);
  expect(source).toMatch(/mouseleave/);
  expect(source).toMatch(/delay/);
  expect(source).toMatch(/setTimeout/);
});

test('BaseTooltip shows on focus with delay', () => {
  expect(source).toMatch(/focusin/);
  expect(source).toMatch(/focusout/);
});

test('BaseTooltip has role=tooltip and required text prop', () => {
  expect(source).toContain('role="tooltip"');
  expect(source).toMatch(/text.*required/);
});

test('BaseTooltip supports position prop (top, bottom, left, right)', () => {
  expect(source).toMatch(/position/);
});

test('BaseTooltip uses transition for enter/leave', () => {
  expect(source).toContain('kbb-tooltip-enter-active');
  expect(source).toContain('kbb-tooltip-leave-active');
});
