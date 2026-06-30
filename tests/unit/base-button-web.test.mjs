import { describe, it, expect, vi } from 'vitest';
import '../../extension/src/components/BaseButton.web.js';

describe('BaseButton', () => {
  it('should be defined as a custom element', () => {
    expect(customElements.get('kbb-button')).toBeDefined();
  });

  it('should create button element with default attributes', () => {
    const el = document.createElement('kbb-button');
    el.textContent = 'Click me';
    document.body.appendChild(el);
    const btn = el.querySelector('button');
    expect(btn).toBeDefined();
    expect(btn?.classList.contains('kbb-btn--secondary')).toBe(true);
    expect(btn?.classList.contains('kbb-btn--md')).toBe(true);
    expect(btn?.textContent).toContain('Click me');
    document.body.removeChild(el);
  });

  it('should reflect variant attribute', () => {
    const el = document.createElement('kbb-button');
    el.setAttribute('variant', 'primary');
    el.textContent = 'Save';
    document.body.appendChild(el);
    const btn = el.querySelector('button');
    expect(btn?.classList.contains('kbb-btn--primary')).toBe(true);
    document.body.removeChild(el);
  });

  it('should reflect size attribute', () => {
    const el = document.createElement('kbb-button');
    el.setAttribute('size', 'lg');
    el.textContent = 'Large';
    document.body.appendChild(el);
    const btn = el.querySelector('button');
    expect(btn?.classList.contains('kbb-btn--lg')).toBe(true);
    document.body.removeChild(el);
  });

  it('should add block class when block attribute present', () => {
    const el = document.createElement('kbb-button');
    el.setAttribute('block', '');
    el.textContent = 'Block';
    document.body.appendChild(el);
    const btn = el.querySelector('button');
    expect(btn?.classList.contains('kbb-btn--block')).toBe(true);
    document.body.removeChild(el);
  });

  it('should disable button when disabled attribute present', () => {
    const el = document.createElement('kbb-button');
    el.setAttribute('disabled', '');
    el.textContent = 'Disabled';
    document.body.appendChild(el);
    const btn = el.querySelector('button');
    expect(btn?.hasAttribute('disabled')).toBe(true);
    expect(btn?.getAttribute('aria-disabled')).toBe('true');
    document.body.removeChild(el);
  });

  it('should dispatch kbb-click event on click when not disabled', () => {
    const el = document.createElement('kbb-button');
    el.textContent = 'Click';
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-click', handler);
    const btn = el.querySelector('button');
    btn?.click();
    expect(handler).toHaveBeenCalledTimes(1);
    document.body.removeChild(el);
  });

  it('should not dispatch kbb-click when disabled', () => {
    const el = document.createElement('kbb-button');
    el.setAttribute('disabled', '');
    el.textContent = 'Disabled';
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-click', handler);
    const btn = el.querySelector('button');
    btn?.click();
    expect(handler).not.toHaveBeenCalled();
    document.body.removeChild(el);
  });

  it('should escape HTML in label', () => {
    const el = document.createElement('kbb-button');
    el.textContent = '<script>alert("xss")</script>';
    document.body.appendChild(el);
    const btn = el.querySelector('.kbb-btn__label');
    expect(btn?.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
    document.body.removeChild(el);
  });
});
