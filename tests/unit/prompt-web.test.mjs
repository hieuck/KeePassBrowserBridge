import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('KbbSavePrompt', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('should define kbb-save-prompt custom element', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    expect(customElements.get('kbb-save-prompt')).toBeDefined();
  });

  it('should create shadow root on construction', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    expect(el.shadowRoot).toBeDefined();
  });

  it('should render site name and username from attributes', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('name', 'Example');
    el.setAttribute('username', 'user@ex.com');
    el.setAttribute('password', 'secret123');
    document.body.appendChild(el);
    expect(el.shadowRoot.textContent).toContain('Example');
    expect(el.shadowRoot.textContent).toContain('user@ex.com');
  });

  it('should render editable title and URL fields', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('name', 'Test');
    el.setAttribute('url', 'https://test.com');
    document.body.appendChild(el);
    expect(el.shadowRoot.querySelector('[data-field="title"]')).toBeDefined();
    expect(el.shadowRoot.querySelector('[data-field="url"]')).toBeDefined();
    expect(el.shadowRoot.querySelector('[data-field="folder"]')).toBeDefined();
  });

  it('should emit kbb-save on Save button click', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('name', 'Site');
    el.setAttribute('username', 'user');
    el.setAttribute('password', 'pass');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-save', handler);
    el.shadowRoot.querySelector('[data-action="save"]').click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.username).toBe('user');
    expect(handler.mock.calls[0][0].detail.password).toBe('pass');
  });

  it('should emit kbb-never on Never button click', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('url', 'https://example.com');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-never', handler);
    el.shadowRoot.querySelector('[data-action="never"]').click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.url).toBe('https://example.com');
  });

  it('should emit kbb-dismiss on close button click', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-dismiss', handler);
    el.shadowRoot.querySelector('.prompt-header__close').click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after 30 seconds', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-dismiss', handler);
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(30000);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should remove element after save', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('name', 'X');
    document.body.appendChild(el);
    expect(document.body.contains(el)).toBe(true);
    el.shadowRoot.querySelector('[data-action="save"]').click();
    expect(document.body.contains(el)).toBe(false);
  });
});

describe('KbbUpdatePrompt', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('should define kbb-update-prompt custom element', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    expect(customElements.get('kbb-update-prompt')).toBeDefined();
  });

  it('should render old and new usernames', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-update-prompt');
    el.setAttribute('name', 'Site');
    el.setAttribute('old-username', 'old@user.com');
    el.setAttribute('username', 'new@user.com');
    document.body.appendChild(el);
    expect(el.shadowRoot.textContent).toContain('old@user.com');
    expect(el.shadowRoot.textContent).toContain('new@user.com');
  });

  it('should emit kbb-update on Update button click', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-update-prompt');
    el.setAttribute('password', 'newpass');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-update', handler);
    el.shadowRoot.querySelector('[data-action="update"]').click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail.password).toBe('newpass');
  });

  it('should emit kbb-skip on Not now button click', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-update-prompt');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-skip', handler);
    el.shadowRoot.querySelector('[data-action="skip"]').click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should emit kbb-dismiss on close button click', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-update-prompt');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-dismiss', handler);
    el.shadowRoot.querySelector('.prompt-header__close').click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should auto-dismiss after 30 seconds', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-update-prompt');
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener('kbb-dismiss', handler);
    vi.advanceTimersByTime(30000);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should apply custom position when data-position, data-top, data-right are set', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-update-prompt');
    el.setAttribute('data-position', 'custom');
    el.setAttribute('data-top', '100px');
    el.setAttribute('data-right', '50px');
    document.body.appendChild(el);
    expect(el.style.top).toBe('100px');
    expect(el.style.right).toBe('50px');
  });

  it('should render folder options when folders attribute provided', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('folders', JSON.stringify(['Root', 'Social', 'Work']));
    el.setAttribute('name', 'Site');
    document.body.appendChild(el);
    const select = el.shadowRoot.querySelector('[data-field="folder"]');
    expect(select).toBeDefined();
    expect(select.options.length).toBe(3);
    expect(select.options[0].value).toBe('Root');
  });

  it('should render folder options with object items', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('folders', JSON.stringify([
      { name: 'Root', value: '/' },
      { name: 'Social', value: '/social' },
    ]));
    el.setAttribute('name', 'Site');
    document.body.appendChild(el);
    const select = el.shadowRoot.querySelector('[data-field="folder"]');
    expect(select).toBeDefined();
    expect(select.options[0].value).toBe('/');
    expect(select.options[0].textContent).toBe('Root');
  });

  it('should set save prompt custom position via data-* attributes', async () => {
    await import('../../extension/src/components/Prompt.web.js');
    const el = document.createElement('kbb-save-prompt');
    el.setAttribute('data-position', 'custom');
    el.setAttribute('data-top', '50px');
    document.body.appendChild(el);
    expect(el.style.top).toBe('50px');
  });
});
