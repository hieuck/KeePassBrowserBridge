import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useTheme', () => {
  let originalLocalStorage;
  let originalMatchMedia;
  let originalDocument;

  beforeEach(() => {
    vi.resetModules();
    originalLocalStorage = global.localStorage;
    originalMatchMedia = global.window?.matchMedia;
    originalDocument = global.document;
    global.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    };
    global.document = {
      documentElement: {
        setAttribute: vi.fn(),
      },
      createElement: vi.fn(() => ({ appendChild: vi.fn(), removeChild: vi.fn() })),
    };
    global.window = {
      matchMedia: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    };
  });

  afterEach(() => {
    global.localStorage = originalLocalStorage;
    global.window.matchMedia = originalMatchMedia;
    global.document = originalDocument;
  });

  it('should default to system when localStorage is empty', async () => {
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { theme, resolved } = useTheme();
    expect(theme.value).toBe('system');
    expect(['light', 'dark']).toContain(resolved.value);
  });

  it('should use stored theme from localStorage', async () => {
    global.localStorage.getItem = vi.fn(() => 'dark');
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { theme } = useTheme();
    expect(theme.value).toBe('dark');
  });

  it('should fall back to system for invalid stored theme', async () => {
    global.localStorage.getItem = vi.fn(() => 'invalid');
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { theme } = useTheme();
    expect(theme.value).toBe('system');
  });

  it('should set theme to a valid value', async () => {
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { theme, setTheme } = useTheme();
    setTheme('light');
    await new Promise(r => setTimeout(r, 0));
    expect(theme.value).toBe('light');
    expect(global.localStorage.setItem).toHaveBeenCalledWith('kbb-theme', 'light');
  });

  it('should ignore invalid theme values', async () => {
    global.localStorage.getItem = vi.fn(() => 'dark');
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { theme, setTheme } = useTheme();
    setTheme('purple');
    expect(theme.value).toBe('dark');
  });

  it('should resolve dark when system prefers dark', async () => {
    global.window.matchMedia = vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { resolved, setTheme } = useTheme();
    setTheme('system');
    expect(resolved.value).toBe('dark');
  });

  it('should resolve light when system is selected but matchMedia is unavailable', async () => {
    global.window.matchMedia = undefined;
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { resolved, setTheme } = useTheme();
    setTheme('system');
    await new Promise(r => setTimeout(r, 0));
    expect(resolved.value).toBe('light');
  });

  it('should apply theme when matchMedia changes while system is selected', async () => {
    const listeners = [];
    const mq = {
      matches: false,
      addEventListener: vi.fn((event, handler) => listeners.push(handler)),
      removeEventListener: vi.fn((event, handler) => {
        const idx = listeners.indexOf(handler);
        if (idx !== -1) listeners.splice(idx, 1);
      }),
    };
    global.window.matchMedia = vi.fn(() => mq);
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { setTheme } = useTheme();
    setTheme('system');
    await new Promise(r => setTimeout(r, 0));
    mq.matches = true;
    listeners.forEach(h => h());
    expect(global.document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark');
  });

  it('should not apply theme when matchMedia changes while non-system is selected', async () => {
    const listeners = [];
    const mq = {
      matches: false,
      addEventListener: vi.fn((event, handler) => listeners.push(handler)),
      removeEventListener: vi.fn(),
    };
    global.window.matchMedia = vi.fn(() => mq);
    const { useTheme } = await import('../../extension/src/composables/useTheme.js');
    const { setTheme } = useTheme();
    setTheme('light');
    await new Promise(r => setTimeout(r, 0));
    listeners.forEach(h => h());
    expect(global.document.documentElement.setAttribute).not.toHaveBeenCalledWith('data-theme', 'dark');
  });
});
