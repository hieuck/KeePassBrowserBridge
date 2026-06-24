import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'useTheme.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'composables', 'useTheme.js'), 'utf8');

describe('useTheme.js - theme ref', () => {
  it('should initialize from localStorage', () => {
    assert.ok(source.includes("localStorage.getItem('kbb-theme')") || source.includes('localStorage.getItem(STORAGE_KEY)'),
      'Missing localStorage read for initial theme');
  });

  it('should have default theme of system', () => {
    assert.ok(source.includes("return 'system'"), 'Missing default system theme fallback');
  });

  it('should validate stored theme value against allowed values', () => {
    assert.ok(source.includes('includes(stored)'), 'Missing stored value validation via includes');
  });
});

describe('useTheme.js - resolved ref', () => {
  it('should init resolved to light', () => {
    assert.ok(source.includes("resolved = ref('light')"), 'Missing resolved default of light');
  });

  it('should detect dark mode from prefers-color-scheme media query', () => {
    assert.ok(source.includes("matchMedia('(prefers-color-scheme: dark)')"),
      'Missing prefers-color-scheme dark media query');
    assert.ok(source.includes('.matches'), 'Missing .matches check on media query');
  });
});

describe('useTheme.js - applyTheme', () => {
  it('should set data-theme attribute on documentElement', () => {
    assert.ok(source.includes("document.documentElement.setAttribute('data-theme'"),
      'Missing data-theme attribute set');
  });

  it('should guard against missing document', () => {
    assert.ok(source.includes("typeof document === 'undefined'"),
      'Missing document undefined guard for SSR');
  });
});

describe('useTheme.js - setTheme', () => {
  it('should validate theme value before setting', () => {
    assert.ok(source.includes('includes(value)'), 'Missing theme value validation');
    assert.ok(source.includes("'light', 'dark', 'system'"), 'Missing allowed theme values');
  });

  it('should persist theme to localStorage', () => {
    assert.ok(source.includes('localStorage.setItem(STORAGE_KEY'),
      'Missing localStorage persistence on theme change');
  });
});

describe('useTheme.js - system theme media query listener', () => {
  it('should listen for prefers-color-scheme changes', () => {
    assert.ok(source.includes("matchMedia('(prefers-color-scheme: dark)')"),
      'Missing prefers-color-scheme media query');
    assert.ok(source.includes('addEventListener'), 'Missing addEventListener on media query');
    assert.ok(source.includes('change'), 'Missing change event listener on media query');
  });

  it('should only re-apply theme when system preference changes and theme is system', () => {
    assert.ok(source.includes("theme.value === 'system'"),
      'Missing system-theme-only guard on media query change');
  });
});

describe('useTheme.js - exports', () => {
  it('should export useTheme function', () => {
    assert.ok(source.includes('export function useTheme()'), 'Missing useTheme export');
  });

  it('should return theme, resolved, and setTheme', () => {
    assert.ok(source.includes('return { theme, resolved, setTheme }'),
      'Missing theme, resolved, setTheme return object');
  });
});

describe('useTheme.js - storage key', () => {
  it('should use consistent storage key', () => {
    assert.ok(source.includes("STORAGE_KEY = 'kbb-theme'"), 'Missing or changed STORAGE_KEY constant');
  });
});
