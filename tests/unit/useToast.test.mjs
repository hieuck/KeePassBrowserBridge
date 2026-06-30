import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('useToast', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should export useToast function', async () => {
    const mod = await import('../../extension/src/composables/useToast.js');
    expect(typeof mod.useToast).toBe('function');
  });

  it('should return show function', async () => {
    const { useToast } = await import('../../extension/src/composables/useToast.js');
    const toast = useToast();
    expect(typeof toast.show).toBe('function');
  });

  it('should create toast element in DOM', async () => {
    const { useToast } = await import('../../extension/src/composables/useToast.js');
    const toast = useToast();
    toast.show('Test message');
    const el = document.body.querySelector('div');
    expect(el).toBeDefined();
    expect(el.textContent).toBe('Test message');
  });

  it('should apply error variant styling', async () => {
    const { useToast } = await import('../../extension/src/composables/useToast.js');
    const toast = useToast();
    toast.show('Error!', { variant: 'error' });
    const el = document.body.querySelector('div');
    expect(el.style.background).toBe('rgb(239, 68, 68)');
  });

  it('should apply success variant styling', async () => {
    const { useToast } = await import('../../extension/src/composables/useToast.js');
    const toast = useToast();
    toast.show('Saved!', { variant: 'success' });
    const el = document.body.querySelector('div');
    expect(el.style.background).toBe('rgb(16, 185, 129)');
  });

  it('should apply warning variant styling', async () => {
    const { useToast } = await import('../../extension/src/composables/useToast.js');
    const toast = useToast();
    toast.show('Warning!', { variant: 'warning' });
    const el = document.body.querySelector('div');
    expect(el.style.background).toBe('rgb(245, 158, 11)');
  });

  it('should default to info variant', async () => {
    const { useToast } = await import('../../extension/src/composables/useToast.js');
    const toast = useToast();
    toast.show('Info');
    const el = document.body.querySelector('div');
    expect(el.style.background).toBe('rgb(59, 130, 246)');
  });

  it('should remove toast after duration', async () => {
    const { useToast } = await import('../../extension/src/composables/useToast.js');
    const toast = useToast();
    toast.show('Brief', { duration: 100 });
    expect(document.body.querySelector('div')).toBeDefined();
    vi.advanceTimersByTime(300);
    expect(document.body.querySelector('div')).toBeNull();
  });
});
