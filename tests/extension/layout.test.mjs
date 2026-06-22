import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const componentsDir = path.join(__dirname, '../../extension/src/components');

test('Stack provides vertical layout with gap prop', () => {
  const source = fs.readFileSync(path.join(componentsDir, 'Stack.vue'), 'utf-8');
  expect(source).toContain('flex-direction: column');
  expect(source).toMatch(/gap/);
});

test('Inline provides horizontal layout with gap and align props', () => {
  const source = fs.readFileSync(path.join(componentsDir, 'Inline.vue'), 'utf-8');
  expect(source).toContain('flex-direction: row');
  expect(source).toMatch(/gap/);
  expect(source).toMatch(/align/);
});

test('Divider renders horizontal line with optional label', () => {
  const source = fs.readFileSync(path.join(componentsDir, 'Divider.vue'), 'utf-8');
  expect(source).toContain('kbb-divider');
  expect(source).toMatch(/label/);
});

test('Card renders bordered container with padding', () => {
  const source = fs.readFileSync(path.join(componentsDir, 'Card.vue'), 'utf-8');
  expect(source).toContain('kbb-card');
  expect(source).toMatch(/padding/);
});
