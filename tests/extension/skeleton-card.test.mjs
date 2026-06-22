import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = fs.readFileSync(path.join(__dirname, '../../extension/src/popup/SkeletonCard.vue'), 'utf-8');

test('SkeletonCard has pulse animation', () => {
  expect(source).toContain('skeleton-pulse');
  expect(source).toContain('skeletonPulse');
  expect(source).toContain('@keyframes');
});

test('SkeletonCard has avatar and title/subtitle placeholders', () => {
  expect(source).toContain('skeleton-card__avatar');
  expect(source).toContain('skeleton-card__line--title');
  expect(source).toContain('skeleton-card__line--subtitle');
});

test('SkeletonCard is hidden from accessibility tree', () => {
  expect(source).toContain('aria-hidden="true"');
});
