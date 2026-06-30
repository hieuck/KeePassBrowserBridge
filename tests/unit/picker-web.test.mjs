import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCredentials = [
  { name: 'Example', username: 'user@ex.com', password: 'p1', url: 'https://example.com' },
  { name: 'Test', username: 'admin', password: 'p2', url: 'https://test.com' },
];

describe('KbbPicker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    if (!Element.prototype.scrollIntoView) {
      Element.prototype.scrollIntoView = vi.fn();
    }
  });

  it('should define kbb-picker custom element', async () => {
    await import('../../extension/src/components/Picker.web.js');
    expect(customElements.get('kbb-picker')).toBeDefined();
  });

  it('should create shadow root on construction', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    expect(el.shadowRoot).toBeDefined();
  });

  it('should render credentials list', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    expect(items.length).toBe(2);
    expect(el.shadowRoot.textContent).toContain('Example');
    expect(el.shadowRoot.textContent).toContain('Test');
  });

  it('should show placeholder text when credentials empty', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = [];
    document.body.appendChild(el);
    expect(el.shadowRoot.textContent).toContain('No credentials');
  });

  it('should filter by search query', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    el._search = 'admin';
    el._render();
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    expect(items.length).toBe(1);
  });

  it('should emit kbb-fill on Enter key', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    el._onKeyDown(event);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.credential.name).toBe('Example');
  });

  it('should emit kbb-close on Escape when not expanded', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    el._onKeyDown(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should toggle expanded item on Enter when Escape was pressed while expanded', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._expandedIndex = 0;
    document.body.appendChild(el);
    const closeHandler = vi.fn();
    el.addEventListener('kbb-close', closeHandler);
    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    el._onKeyDown(event);
    expect(el._expandedIndex).toBe(-1);
    expect(closeHandler).not.toHaveBeenCalled();
  });

  it('should navigate down with ArrowDown', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._activeIndex = 0;
    document.body.appendChild(el);
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    el._onKeyDown(event);
    expect(el._activeIndex).toBe(1);
  });

  it('should navigate up with ArrowUp', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._activeIndex = 1;
    document.body.appendChild(el);
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    el._onKeyDown(event);
    expect(el._activeIndex).toBe(0);
  });

  it('should emit kbb-copy event', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-copy', handler);
    el._emitCopy(mockCredentials[0], 'username');
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.field).toBe('username');
  });

  it('should emit kbb-close on click outside', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    el._onClickOutside({ target: document.body });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not emit kbb-close on click inside', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    el._onClickOutside({ target: el });
    expect(handler).not.toHaveBeenCalled();
  });

  it('should expand credential on click and show action buttons', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    items[0].click();
    expect(el._expandedIndex).toBe(0);
  });

  it('should collapse expanded credential on second click', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._expandedIndex = 0;
    document.body.appendChild(el);
    el._render();
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    items[0].click();
    expect(el._expandedIndex).toBe(-1);
  });

  it('should emit kbb-fill on fill-form action button click', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._expandedIndex = 0;
    document.body.appendChild(el);
    el._render();
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    const fillBtn = el.shadowRoot.querySelector('[data-action="fill-form"]');
    if (fillBtn) fillBtn.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should emit kbb-fill on fill-username action', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._expandedIndex = 0;
    document.body.appendChild(el);
    el._render();
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    const btn = el.shadowRoot.querySelector('[data-action="fill-username"]');
    if (btn) btn.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should emit kbb-copy on copy-password action', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._expandedIndex = 0;
    document.body.appendChild(el);
    el._render();
    const handler = vi.fn();
    el.addEventListener('kbb-copy', handler);
    const btn = el.shadowRoot.querySelector('[data-action="copy-password"]');
    if (btn) btn.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should emit kbb-close on close button click', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    el.shadowRoot.querySelector('.picker-header__close').click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should show search input with 5+ credentials and handle typing', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    const manyCreds = Array.from({ length: 6 }, (_, i) => ({
      name: `Site ${i}`, username: `user${i}@x.com`, password: 'p', url: `https://site${i}.com`,
    }));
    el.credentials = manyCreds;
    document.body.appendChild(el);
    const searchInput = el.shadowRoot.querySelector('.picker-search-input');
    expect(searchInput).not.toBeNull();
    searchInput.value = 'Site 1';
    searchInput.dispatchEvent(new Event('input'));
    expect(el._search).toBe('Site 1');
  });

  it('should emit kbb-fill on fill-password action', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._expandedIndex = 0;
    document.body.appendChild(el);
    el._render();
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    const btn = el.shadowRoot.querySelector('[data-action="fill-password"]');
    if (btn) btn.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should emit kbb-copy on copy-username action', async () => {
    await import('../../extension/src/components/Picker.web.js');
    const el = document.createElement('kbb-picker');
    el.credentials = mockCredentials;
    el._expandedIndex = 0;
    document.body.appendChild(el);
    el._render();
    const handler = vi.fn();
    el.addEventListener('kbb-copy', handler);
    const btn = el.shadowRoot.querySelector('[data-action="copy-username"]');
    if (btn) btn.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
