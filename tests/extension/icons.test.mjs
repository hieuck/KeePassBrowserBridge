import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const iconsPath = path.join(__dirname, '../../extension/icons.js');

const ICON_NAMES = [
  'key', 'lock', 'lock-open', 'unlock',
  'copy', 'check',
  'edit', 'pencil', 'plus', 'trash',
  'search', 'filter', 'close', 'chevron-down',
  'eye', 'eye-off',
  'shield', 'shield-check',
  'globe',
  'user', 'user-plus',
];

test('icons.js exports all 21 icon names', async () => {
  const mod = await import(iconsPath);
  for (const name of ICON_NAMES) {
    expect(mod.ICONS[name], `missing icon ${name}`).toBeDefined();
    expect(typeof mod.ICONS[name]).toBe('string');
    expect(mod.ICONS[name]).toContain('<svg');
  }
});

test('icons.js exports ICONS dict and registerIcons function', async () => {
  const mod = await import(iconsPath);
  expect(mod.ICONS).toBeDefined();
  expect(typeof mod.registerIcons).toBe('function');
});

test('registerIcons defines Web Components that render SVG content', async ({ page }) => {
  await page.goto('/tests/fixtures/empty.html');
  const result = await page.evaluate(async () => {
    const mod = await import('/extension/icons.js');
    mod.registerIcons('kbb');
    const ctor = customElements.get('kbb-icon-key');
    if (!ctor) return { registered: false, hasSvg: false };
    const el = document.createElement('kbb-icon-key');
    document.body.appendChild(el);
    const html = el.innerHTML;
    document.body.removeChild(el);
    return { registered: true, hasSvg: html.includes('<svg') };
  });
  expect(result.registered).toBe(true);
  expect(result.hasSvg).toBe(true);
});
