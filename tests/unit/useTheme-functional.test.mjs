import { describe, it, assert, beforeEach, vi } from 'vitest';
import { nextTick } from 'vue';
import { useTheme } from '../../extension/src/composables/useTheme.js';

vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('useTheme', () => {
  beforeEach(async () => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    useTheme().setTheme('system');
    await nextTick();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('should expose theme, resolved, and setTheme', () => {
    const { theme, resolved, setTheme } = useTheme();
    assert.ok(theme !== undefined);
    assert.ok(resolved !== undefined);
    assert.equal(typeof setTheme, 'function');
  });

  it('should default theme to system', () => {
    const { theme } = useTheme();
    assert.equal(theme.value, 'system');
  });

  it('setTheme("dark") should set theme ref to dark', () => {
    const { theme, setTheme } = useTheme();
    setTheme('dark');
    assert.equal(theme.value, 'dark');
  });

  it('setTheme("light") should set theme ref to light', () => {
    const { theme, setTheme } = useTheme();
    setTheme('light');
    assert.equal(theme.value, 'light');
  });

  it('setTheme("system") should set theme ref to system', () => {
    const { theme, setTheme } = useTheme();
    setTheme('system');
    assert.equal(theme.value, 'system');
  });

  it('invalid theme values should be silently ignored', () => {
    const { theme, setTheme } = useTheme();
    setTheme('system');
    assert.equal(theme.value, 'system');
    setTheme('invalid');
    assert.equal(theme.value, 'system');
  });

  it('resolved should reflect non-system theme immediately after flush', async () => {
    const { resolved, setTheme } = useTheme();
    setTheme('dark');
    await nextTick();
    assert.equal(resolved.value, 'dark');
  });

  it('should set data-theme attribute on documentElement', async () => {
    const { setTheme } = useTheme();
    setTheme('dark');
    await nextTick();
    assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
  });

  it('should persist theme to localStorage', async () => {
    const { setTheme } = useTheme();
    setTheme('dark');
    await nextTick();
    assert.equal(localStorage.getItem('kbb-theme'), 'dark');
  });

  it('should detect dark system preference', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
      writable: true,
      configurable: true,
    });
    const saved = localStorage.getItem('kbb-theme');
    localStorage.removeItem('kbb-theme');
    vi.resetModules();
    const mod = await import('../../extension/src/composables/useTheme.js');
    const { resolved } = mod.useTheme();
    assert.equal(resolved.value, 'dark');
    if (saved !== null) localStorage.setItem('kbb-theme', saved);
  });

  it('should handle missing localStorage gracefully', () => {
    const saved = globalThis.localStorage;
    delete globalThis.localStorage;
    const { theme } = useTheme();
    assert.ok(['light', 'dark', 'system'].includes(theme.value));
    globalThis.localStorage = saved;
  });
});
