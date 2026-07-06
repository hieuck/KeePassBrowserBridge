import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '../../extension/src/components/Prompt.web.js';

function safeRemove(el) {
  if (el && el.parentNode) {
    el.parentNode.removeChild(el);
  }
}

describe('Prompt web components', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.useRealTimers();
  });

  describe('KbbSavePrompt', () => {
    it('should be defined as a custom element', () => {
      expect(customElements.get('kbb-save-prompt')).toBeDefined();
    });

    it('should render provided attributes', () => {
      const el = document.createElement('kbb-save-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('username', 'user@example.com');
      el.setAttribute('password', 'secret');
      document.body.appendChild(el);
      expect(el.shadowRoot.textContent).toContain('Example');
      expect(el.shadowRoot.textContent).toContain('user@example.com');
      expect(el.shadowRoot.textContent).toContain('Save this login?');
      safeRemove(el);
    });

    it('should dispatch kbb-save on save button click', () => {
      const el = document.createElement('kbb-save-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('username', 'user@example.com');
      el.setAttribute('password', 'secret');
      el.setAttribute('url', 'https://example.com');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-save', handler);
      el.shadowRoot.querySelector('[data-action="save"]').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should dispatch kbb-never on never button click', () => {
      const el = document.createElement('kbb-save-prompt');
      el.setAttribute('url', 'https://example.com');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-never', handler);
      el.shadowRoot.querySelector('[data-action="never"]').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should dispatch kbb-dismiss on close button click', () => {
      const el = document.createElement('kbb-save-prompt');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-dismiss', handler);
      el.shadowRoot.querySelector('.prompt-header__close').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after 30 seconds', () => {
      const el = document.createElement('kbb-save-prompt');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-dismiss', handler);
      vi.advanceTimersByTime(30000);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('KbbUpdatePrompt', () => {
    it('should be defined as a custom element', () => {
      expect(customElements.get('kbb-update-prompt')).toBeDefined();
    });

    it('should render provided attributes', () => {
      const el = document.createElement('kbb-update-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('old-username', 'old@example.com');
      el.setAttribute('username', 'new@example.com');
      document.body.appendChild(el);
      expect(el.shadowRoot.textContent).toContain('Example');
      expect(el.shadowRoot.textContent).toContain('old@example.com');
      expect(el.shadowRoot.textContent).toContain('new@example.com');
      expect(el.shadowRoot.textContent).toContain('Update existing login?');
      safeRemove(el);
    });

    it('should dispatch kbb-update on update button click', () => {
      const el = document.createElement('kbb-update-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('username', 'new@example.com');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-update', handler);
      el.shadowRoot.querySelector('[data-action="update"]').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should dispatch kbb-skip on skip button click', () => {
      const el = document.createElement('kbb-update-prompt');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-skip', handler);
      el.shadowRoot.querySelector('[data-action="skip"]').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should dispatch kbb-dismiss on close button click', () => {
      const el = document.createElement('kbb-update-prompt');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-dismiss', handler);
      el.shadowRoot.querySelector('.prompt-header__close').click();
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should auto-dismiss after 30 seconds', () => {
      const el = document.createElement('kbb-update-prompt');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-dismiss', handler);
      vi.advanceTimersByTime(30000);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
