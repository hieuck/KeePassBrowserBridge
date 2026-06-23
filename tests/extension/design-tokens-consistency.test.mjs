import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION_PATH = path.join(__dirname, '..', '..', 'extension');
const TOKENS_PATH = path.join(EXTENSION_PATH, 'design-tokens.css');
const POPUP_CSS_PATH = path.join(EXTENSION_PATH, 'popup.css');
const OPTIONS_CSS_PATH = path.join(EXTENSION_PATH, 'options.css');

function getDefinedTokens(css) {
  const tokens = new Set();
  const defs = css.matchAll(/--[\w-]+(?=\s*:)/g);
  for (const m of defs) tokens.add(m[0]);
  return tokens;
}

function getVarReferences(css) {
  const refs = [];
  const vars = css.matchAll(/var\((--[\w-]+)/g);
  for (const m of vars) refs.push(m[1]);
  return refs;
}

test.describe('Design tokens consistency', () => {
  for (const [label, cssPath] of [['popup.css', POPUP_CSS_PATH], ['options.css', OPTIONS_CSS_PATH]]) {
    test(`all CSS var() references in ${label} exist in design-tokens.css`, () => {
      const tokensCSS = fs.readFileSync(TOKENS_PATH, 'utf8');
      const sourceCSS = fs.readFileSync(cssPath, 'utf8');

      const definedTokens = getDefinedTokens(tokensCSS);
      const undefinedRefs = getVarReferences(sourceCSS).filter(ref => !definedTokens.has(ref));

      expect(undefinedRefs).toEqual([]);
    });
  }

  test('design-tokens.css defines required tokens', () => {
    const tokensCSS = fs.readFileSync(TOKENS_PATH, 'utf8');
    const required = ['--color-bg', '--color-surface', '--color-text', '--color-accent', '--space-1', '--text-base', '--radius-md', '--shadow-sm', '--font-sans', '--transition-fast'];
    const definedTokens = getDefinedTokens(tokensCSS);
    const missing = required.filter(t => !definedTokens.has(t));
    expect(missing).toEqual([]);
  });

  test('Picker.web.js Shadow DOM uses design token values', () => {
    const pickerCSS = fs.readFileSync(path.join(EXTENSION_PATH, 'src', 'components', 'Picker.web.js'), 'utf8');
    const hasHostDefs = pickerCSS.includes('--color-accent');
    expect(hasHostDefs).toBe(true);
  });

  test('Prompt.web.js Shadow DOM uses design token values', () => {
    const promptCSS = fs.readFileSync(path.join(EXTENSION_PATH, 'src', 'components', 'Prompt.web.js'), 'utf8');
    const hasHostDefs = promptCSS.includes('--color-accent');
    expect(hasHostDefs).toBe(true);
  });

  test('manifest.json webAuthenticationProxy is in permissions, not optional_permissions', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(EXTENSION_PATH, 'manifest.json'), 'utf8'));
    expect(manifest.optional_permissions).not.toContain('webAuthenticationProxy');
    expect(manifest.permissions).toContain('webAuthenticationProxy');
  });
});
