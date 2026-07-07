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

    it('should render folder options and select current folder', () => {
      const el = document.createElement('kbb-save-prompt');
      el.setAttribute('folder', 'Work');
      el.setAttribute('folders', JSON.stringify(['Personal', 'Work', 'Finance']));
      document.body.appendChild(el);
      const select = el.shadowRoot.querySelector('[data-field="folder"]');
      expect(select).not.toBeNull();
      expect(select.innerHTML).toContain('Work');
      expect(select.innerHTML).toContain('Personal');
      expect(select.querySelector('option[selected]').value).toBe('Work');
      safeRemove(el);
    });

    it('should dispatch kbb-save with edited title and url', () => {
      const el = document.createElement('kbb-save-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('username', 'user@example.com');
      el.setAttribute('password', 'secret');
      el.setAttribute('url', 'https://example.com');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-save', handler);
      const titleInput = el.shadowRoot.querySelector('[data-field="title"]');
      titleInput.value = 'Edited Title';
      titleInput.dispatchEvent(new Event('input'));
      const urlInput = el.shadowRoot.querySelector('[data-field="url"]');
      urlInput.value = 'https://edited.example.com';
      urlInput.dispatchEvent(new Event('input'));
      el.shadowRoot.querySelector('[data-action="save"]').click();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.name).toBe('Edited Title');
      expect(handler.mock.calls[0][0].detail.url).toBe('https://edited.example.com');
      safeRemove(el);
    });

    it('should fall back to name when title attribute is missing', () => {
      const el = document.createElement('kbb-save-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('username', 'user@example.com');
      document.body.appendChild(el);
      const input = el.shadowRoot.querySelector('[data-field="title"]');
      expect(input.value).toBe('Example');
      safeRemove(el);
    });

    it('should apply custom data-top and data-right when position is not bottom-right', () => {
      const el = document.createElement('kbb-save-prompt');
      el.setAttribute('data-position', 'custom');
      el.setAttribute('data-top', '10px');
      el.setAttribute('data-right', '20px');
      document.body.appendChild(el);
      expect(el.style.top).toBe('10px');
      expect(el.style.right).toBe('20px');
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

    it('should clear auto-dismiss timer on disconnectedCallback', () => {
      const el = document.createElement('kbb-save-prompt');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-dismiss', handler);
      document.body.removeChild(el);
      vi.advanceTimersByTime(30000);
      expect(handler).not.toHaveBeenCalled();
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

    it('should apply custom data-top and data-right when position is not bottom-right', () => {
      const el = document.createElement('kbb-update-prompt');
      el.setAttribute('data-position', 'custom');
      el.setAttribute('data-top', '12px');
      el.setAttribute('data-right', '24px');
      document.body.appendChild(el);
      expect(el.style.top).toBe('12px');
      expect(el.style.right).toBe('24px');
      safeRemove(el);
    });

    it('should dispatch kbb-update with edited username and url', () => {
      const el = document.createElement('kbb-update-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('username', 'new@example.com');
      el.setAttribute('url', 'https://example.com');
      document.body.appendChild(el);
      const handler = vi.fn();
      el.addEventListener('kbb-update', handler);
      const usernameInput = el.shadowRoot.querySelector('[data-field="username"]');
      usernameInput.value = 'edited@example.com';
      usernameInput.dispatchEvent(new Event('input'));
      const urlInput = el.shadowRoot.querySelector('[data-field="url"]');
      urlInput.value = 'https://edited.example.com';
      urlInput.dispatchEvent(new Event('input'));
      el.shadowRoot.querySelector('[data-action="update"]').click();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail.username).toBe('edited@example.com');
      expect(handler.mock.calls[0][0].detail.url).toBe('https://edited.example.com');
      safeRemove(el);
    });

    it('should render password field when password attribute is present', () => {
      const el = document.createElement('kbb-update-prompt');
      el.setAttribute('name', 'Example');
      el.setAttribute('password', 'secret123');
      document.body.appendChild(el);
      const fields = el.shadowRoot.querySelectorAll('.prompt-field');
      expect(Array.from(fields).some(f => f.textContent.includes('Pass'))).toBe(true);
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
