import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test('design-tokens.css defines all required tokens', () => {
  const css = fs.readFileSync(
    path.join(process.cwd(), 'extension/design-tokens.css'),
    'utf-8'
  );
  const required = [
    '--color-bg', '--color-surface', '--color-text',
    '--color-text-secondary', '--color-text-muted', '--color-border',
    '--color-border-strong', '--color-accent', '--color-accent-hover',
    '--color-accent-subtle', '--color-success', '--color-warning',
    '--color-danger', '--color-info',
    '--space-1', '--space-2', '--space-3', '--space-4', '--space-6',
    '--radius-sm', '--radius-md', '--radius-lg', '--radius-xl', '--radius-full',
    '--shadow-sm', '--shadow-md', '--shadow-lg',
    '--font-sans', '--font-mono',
    '--text-xs', '--text-sm', '--text-base', '--text-md',
    '--text-lg', '--text-xl', '--text-2xl',
    '--transition-fast', '--transition-base', '--transition-slow',
  ];
  for (const token of required) {
    expect(css, `missing token ${token}`).toContain(token);
  }
  expect(css).toContain(':root[data-theme="dark"]');
});

test('design-tokens.css has both light and dark theme', () => {
  const css = fs.readFileSync(
    path.join(process.cwd(), 'extension/design-tokens.css'),
    'utf-8'
  );
  const lightMatch = css.match(/:root\s*\{([^}]+)\}/);
  const darkMatch = css.match(/:root\[data-theme="dark"\]\s*\{([^}]+)\}/);
  expect(lightMatch).not.toBeNull();
  expect(darkMatch).not.toBeNull();
});
