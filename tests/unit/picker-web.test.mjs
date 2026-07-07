import { describe, it, expect, vi, beforeEach } from 'vitest';
import '../../extension/src/components/Picker.web.js';

vi.mock('../../extension/src/shared/favicon.js', () => ({
  getFaviconUrl: vi.fn(() => 'https://example.com/favicon.ico'),
}));

describe('KbbPicker', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should be defined as a custom element', () => {
    expect(customElements.get('kbb-picker')).toBeDefined();
  });

  it('should render empty state when no credentials', () => {
    const el = document.createElement('kbb-picker');
    document.body.appendChild(el);
    expect(el.shadowRoot.querySelector('.picker-empty').textContent).toContain('No credentials for this site');
    document.body.removeChild(el);
  });

  it('should render credentials', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [
      { name: 'Example', username: 'user@example.com', url: 'https://example.com' },
    ];
    document.body.appendChild(el);
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Example');
    expect(items[0].textContent).toContain('user@example.com');
    document.body.removeChild(el);
  });

  it('should hide search when show-search is false', () => {
    const el = document.createElement('kbb-picker');
    el.setAttribute('show-search', 'false');
    el.credentials = [
      { name: 'A', username: 'a@example.com' },
      { name: 'B', username: 'b@example.com' },
      { name: 'C', username: 'c@example.com' },
      { name: 'D', username: 'd@example.com' },
      { name: 'E', username: 'e@example.com' },
    ];
    document.body.appendChild(el);
    expect(el.shadowRoot.querySelector('.picker-search-input')).toBeNull();
    document.body.removeChild(el);
  });

  it('should show search by default when more than 4 credentials', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = Array.from({ length: 5 }, (_, i) => ({
      name: `Name ${i}`,
      username: `user${i}@example.com`,
    }));
    document.body.appendChild(el);
    expect(el.shadowRoot.querySelector('.picker-search-input')).not.toBeNull();
    document.body.removeChild(el);
  });

  it('should filter credentials by search', () => {
    const el = document.createElement('kbb-picker');
    el.setAttribute('show-search', '');
    el.credentials = [
      { name: 'Example', username: 'user@example.com' },
      { name: 'Bank', username: 'bank@example.com' },
    ];
    document.body.appendChild(el);
    const input = el.shadowRoot.querySelector('.picker-search-input');
    input.value = 'Bank';
    input.dispatchEvent(new Event('input'));
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Bank');
    document.body.removeChild(el);
  });

  it('should show no matches when search filters to nothing', () => {
    const el = document.createElement('kbb-picker');
    el.setAttribute('show-search', '');
    el.credentials = [{ name: 'Example', username: 'user@example.com' }];
    document.body.appendChild(el);
    const input = el.shadowRoot.querySelector('.picker-search-input');
    input.value = 'zzz';
    input.dispatchEvent(new Event('input'));
    expect(el.shadowRoot.querySelector('.picker-empty').textContent).toContain('No matches');
    document.body.removeChild(el);
  });

  it('should expand item on click', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [
      { name: 'Example', username: 'user@example.com', password: 'secret' },
    ];
    document.body.appendChild(el);
    const item = el.shadowRoot.querySelector('.picker-item');
    item.click();
    const actions = el.shadowRoot.querySelectorAll('.picker-action');
    expect(actions.length).toBeGreaterThan(0);
    expect(actions[0].textContent).toContain('Fill form');
    document.body.removeChild(el);
  });

  it('should collapse expanded item when clicked again', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [
      { name: 'Example', username: 'user@example.com', password: 'secret' },
    ];
    document.body.appendChild(el);
    const item = el.shadowRoot.querySelector('.picker-item');
    item.click();
    expect(el.shadowRoot.querySelectorAll('.picker-action').length).toBeGreaterThan(0);
    item.click();
    expect(el.shadowRoot.querySelectorAll('.picker-action').length).toBe(0);
    document.body.removeChild(el);
  });

  it('should dispatch kbb-fill on fill-form action', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [
      { name: 'Example', username: 'user@example.com', password: 'secret' },
    ];
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    el.shadowRoot.querySelector('.picker-item').click();
    const action = el.shadowRoot.querySelector('[data-action="fill-form"]');
    action.click();
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it('should dispatch kbb-copy on copy action', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [
      { name: 'Example', username: 'user@example.com', password: 'secret' },
    ];
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-copy', handler);
    el.shadowRoot.querySelector('.picker-item').click();
    const action = el.shadowRoot.querySelector('[data-action="copy-username"]');
    action.click();
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it('should dispatch kbb-close on close button', () => {
    const el = document.createElement('kbb-picker');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    el.shadowRoot.querySelector('.picker-header__close').click();
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it('should navigate with ArrowDown and select with Enter', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [
      { name: 'First', username: 'a@example.com' },
      { name: 'Second', username: 'b@example.com' },
    ];
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it('should not navigate below first item with ArrowUp', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [
      { name: 'First', username: 'a@example.com' },
      { name: 'Second', username: 'b@example.com' },
    ];
    document.body.appendChild(el);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    expect(el.shadowRoot.querySelector('.picker-item--active').textContent).toContain('First');
    document.body.removeChild(el);
  });

  it('should collapse expanded item on Escape instead of closing', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Example', username: 'user@example.com', password: 'secret' }];
    document.body.appendChild(el);
    el.shadowRoot.querySelector('.picker-item').click();
    const closeHandler = vi.fn();
    el.addEventListener('kbb-close', closeHandler);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(el.shadowRoot.querySelectorAll('.picker-action').length).toBe(0);
    expect(closeHandler).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('should close on Escape', () => {
    const el = document.createElement('kbb-picker');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it('should close on mousedown outside', () => {
    const el = document.createElement('kbb-picker');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it('should not close when clicking inside the picker', () => {
    const el = document.createElement('kbb-picker');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-close', handler);
    el.shadowRoot.querySelector('.picker-header').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, composed: true }));
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('should dispatch kbb-fill with fieldRole on fill-username', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Example', username: 'user@example.com', password: 'secret' }];
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    el.shadowRoot.querySelector('.picker-item').click();
    el.shadowRoot.querySelector('[data-action="fill-username"]').click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.fieldRole).toBe('username');
    document.body.removeChild(el);
  });

  it('should dispatch kbb-fill with fieldRole on fill-password', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Example', username: 'user@example.com', password: 'secret' }];
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-fill', handler);
    el.shadowRoot.querySelector('.picker-item').click();
    el.shadowRoot.querySelector('[data-action="fill-password"]').click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.fieldRole).toBe('password');
    document.body.removeChild(el);
  });

  it('should dispatch kbb-copy with field password on copy-password', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Example', username: 'user@example.com', password: 'secret' }];
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-copy', handler);
    el.shadowRoot.querySelector('.picker-item').click();
    el.shadowRoot.querySelector('[data-action="copy-password"]').click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.field).toBe('password');
    document.body.removeChild(el);
  });

  it('should render custom fields header when credential has custom fields', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{
      name: 'Example',
      username: 'user@example.com',
      password: 'secret',
      customFields: [{ name: 'Pin', value: '1234' }],
    }];
    document.body.appendChild(el);
    el.shadowRoot.querySelector('.picker-item').click();
    expect(el.shadowRoot.textContent).toContain('Custom fields');
    document.body.removeChild(el);
  });

  it('should upgrade a pre-existing credentials property value on connect', () => {
    const el = document.createElement('kbb-picker');
    const data = [{ name: 'Pre', username: 'pre@example.com' }];
    Object.defineProperty(el, 'credentials', { value: data, configurable: true, writable: true });
    document.body.appendChild(el);
    expect(el.credentials).toBe(data);
    document.body.removeChild(el);
  });

  it('should expose the credentials getter', () => {
    const el = document.createElement('kbb-picker');
    const data = [{ name: 'A', username: 'a@example.com' }];
    el.credentials = data;
    expect(el.credentials).toBe(data);
  });

  it('should ignore non-array values in credentials setter', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = 'not an array';
    expect(el.credentials).toEqual([]);
  });

  it('should parse credentials from attribute as JSON', () => {
    const el = document.createElement('kbb-picker');
    el.setAttribute('credentials', JSON.stringify([{ name: 'Attr', username: 'attr@example.com' }]));
    document.body.appendChild(el);
    expect(el.credentials[0].name).toBe('Attr');
    document.body.removeChild(el);
  });

  it('should ignore malformed credentials attribute JSON', () => {
    const el = document.createElement('kbb-picker');
    el.setAttribute('credentials', 'not-json');
    document.body.appendChild(el);
    expect(el.credentials).toEqual([]);
    document.body.removeChild(el);
  });

  it('should filter credentials by URL in search', () => {
    const el = document.createElement('kbb-picker');
    el.setAttribute('show-search', '');
    el.credentials = [
      { name: 'GitHub', username: 'gh@example.com', url: 'https://github.com/login' },
      { name: 'Bank', username: 'bank@example.com', url: 'https://bank.com' },
    ];
    document.body.appendChild(el);
    const input = el.shadowRoot.querySelector('.picker-search-input');
    input.value = 'github.com';
    input.dispatchEvent(new Event('input'));
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('GitHub');
    document.body.removeChild(el);
  });

  it('should handle invalid credential URLs when building header domain', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Bad', username: 'bad@example.com', url: 'not-a-url' }];
    document.body.appendChild(el);
    expect(el.shadowRoot.querySelector('.picker-header__title').textContent).toContain('1 login');
    document.body.removeChild(el);
  });

  it('should render avatar initial with username fallback when name is missing', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ username: 'fallback@example.com' }];
    document.body.appendChild(el);
    expect(el.shadowRoot.querySelector('.picker-avatar').textContent).toBe('F');
    document.body.removeChild(el);
  });

  it('should render avatar initial as ? when name and username are missing', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{}];
    document.body.appendChild(el);
    expect(el.shadowRoot.querySelector('.picker-avatar').textContent).toBe('?');
    document.body.removeChild(el);
  });

  it('should not render username actions when credential lacks username', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'NoUser', password: 'secret' }];
    document.body.appendChild(el);
    el.shadowRoot.querySelector('.picker-item').click();
    const actions = el.shadowRoot.querySelectorAll('.picker-action');
    expect(actions.length).toBe(3);
    expect([...actions].map(a => a.dataset.action)).toEqual(['fill-form', 'fill-password', 'copy-password']);
    document.body.removeChild(el);
  });

  it('should not render password actions when credential lacks password', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'NoPass', username: 'user@example.com' }];
    document.body.appendChild(el);
    el.shadowRoot.querySelector('.picker-item').click();
    const actions = el.shadowRoot.querySelectorAll('.picker-action');
    expect(actions.length).toBe(3);
    expect([...actions].map(a => a.dataset.action)).toEqual(['fill-form', 'fill-username', 'copy-username']);
    document.body.removeChild(el);
  });

  it('should not emit fill on Enter when no credential is active', () => {
    const el = document.createElement('kbb-picker');
    document.body.appendChild(el);
    const fillHandler = vi.fn();
    el.addEventListener('kbb-fill', fillHandler);
    el._activeIndex = -1;
    el._onKeyDown(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fillHandler).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('should scroll active item into view when scrollIntoView is available', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Only', username: 'only@example.com' }];
    document.body.appendChild(el);
    const item = el.shadowRoot.querySelector('.picker-item');
    const scrollIntoView = vi.fn();
    item.scrollIntoView = scrollIntoView;
    el._activeIndex = 0;
    el._highlightActive();
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' });
    document.body.removeChild(el);
  });

  it('should not scroll if active item lacks scrollIntoView', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Only', username: 'only@example.com' }];
    document.body.appendChild(el);
    const item = el.shadowRoot.querySelector('.picker-item');
    delete item.scrollIntoView;
    el._activeIndex = 0;
    expect(() => el._highlightActive()).not.toThrow();
    document.body.removeChild(el);
  });

  it('should ignore keydown when picker is disconnected', () => {
    const el = document.createElement('kbb-picker');
    el.credentials = [{ name: 'Only', username: 'only@example.com' }];
    const fillHandler = vi.fn();
    el.addEventListener('kbb-fill', fillHandler);
    el._onKeyDown(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(fillHandler).not.toHaveBeenCalled();
  });

  it('should skip custom element registration if already defined', async () => {
    expect(customElements.get('kbb-picker')).toBeDefined();
    vi.resetModules();
    await import('../../extension/src/components/Picker.web.js');
    expect(customElements.get('kbb-picker')).toBeDefined();
  });
});
