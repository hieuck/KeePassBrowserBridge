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

  it('should filter credentials by search', async () => {
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
    await new Promise(r => setTimeout(r, 10));
    const items = el.shadowRoot.querySelectorAll('.picker-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Bank');
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
});
