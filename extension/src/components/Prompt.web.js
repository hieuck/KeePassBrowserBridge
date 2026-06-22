import { ICONS } from '../../icons.js';

const PROMPT_STYLES = `
:host {
  position: fixed;
  bottom: 16px;
  right: 16px;
  z-index: 2147483647;
  width: 360px;
  max-width: calc(100vw - 32px);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #1a1a1a;
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  animation: slideIn 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  :host { animation: none; }
}

@keyframes slideIn {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@media (prefers-color-scheme: dark) {
  :host { color: #f0f0f0; background: #24292e; border-color: #444d56; }
  .prompt-header { border-color: #444d56; }
  .prompt-field { background: #1a1a1a; border-color: #444d56; }
  .prompt-action--secondary { color: #adbac7; }
}

.prompt-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid #e1e4e8;
  font-weight: 600;
}

.prompt-header__icon {
  width: 18px;
  height: 18px;
  fill: var(--accent, #2563eb);
  flex-shrink: 0;
}

.prompt-header__title { flex: 1; }

.prompt-header__close {
  background: transparent;
  border: none;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 4px;
  color: inherit;
  opacity: 0.6;
}

.prompt-header__close:hover { opacity: 1; background: rgba(0,0,0,0.05); }
.prompt-header__close svg { width: 14px; height: 14px; fill: currentColor; }

.prompt-body {
  padding: 12px 14px;
}

.prompt-field {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: #f6f8fa;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.prompt-field__label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #586069;
  min-width: 56px;
}

@media (prefers-color-scheme: dark) {
  .prompt-field__label { color: #8b949e; }
}

.prompt-field__value {
  flex: 1;
  font-family: ui-monospace, SFMono-Regular, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.prompt-actions {
  display: flex;
  gap: 8px;
  padding: 0 14px 14px;
  justify-content: flex-end;
}

.prompt-action {
  padding: 6px 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: inherit;
  transition: background 120ms, border-color 120ms;
}

.prompt-action--primary {
  background: #2563eb;
  color: #ffffff;
}

.prompt-action--primary:hover { background: #1d4ed8; }

.prompt-action--secondary {
  border-color: #e1e4e8;
  color: #1a1a1a;
}

.prompt-action--secondary:hover { background: #f6f8fa; }

.prompt-action--danger {
  color: #d73a49;
}

.prompt-action--danger:hover { background: rgba(215, 58, 73, 0.1); }

@media (prefers-color-scheme: dark) {
  .prompt-action--secondary { border-color: #444d56; color: #f0f0f0; }
  .prompt-action--secondary:hover { background: #2f363d; }
}

.prompt-action:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.prompt-progress {
  height: 2px;
  background: linear-gradient(to right, #2563eb var(--progress, 100%), transparent var(--progress, 100%));
  transition: --progress 30s linear;
}
`;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

class KbbSavePrompt extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'username', 'password', 'url'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._autoDismissTimer = null;
  }

  connectedCallback() {
    this._render();
    this._startAutoDismiss();
    this.shadowRoot.querySelector('.prompt-header__close')?.addEventListener('click', () => this._dismiss());
    this.shadowRoot.querySelector('[data-action="save"]')?.addEventListener('click', () => this._save());
    this.shadowRoot.querySelector('[data-action="never"]')?.addEventListener('click', () => this._never());
  }

  disconnectedCallback() {
    if (this._autoDismissTimer) {
      clearTimeout(this._autoDismissTimer);
      this._autoDismissTimer = null;
    }
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const name = this.getAttribute('name') || '';
    const username = this.getAttribute('username') || '';
    const password = this.getAttribute('password') || '';
    const url = this.getAttribute('url') || '';

    this.shadowRoot.innerHTML = `
      <style>${PROMPT_STYLES}</style>
      <div class="prompt-header" role="region" aria-label="Save login">
        <span class="prompt-header__icon" aria-hidden="true">${ICONS.key || ''}</span>
        <span class="prompt-header__title">Save this login?</span>
        <button type="button" class="prompt-header__close" aria-label="Close">
          <span aria-hidden="true">${ICONS.close || ''}</span>
        </button>
      </div>
      <div class="prompt-body">
        ${name ? `<div class="prompt-field"><span class="prompt-field__label">Site</span><span class="prompt-field__value">${escapeHtml(name)}</span></div>` : ''}
        ${url ? `<div class="prompt-field"><span class="prompt-field__label">URL</span><span class="prompt-field__value">${escapeHtml(url)}</span></div>` : ''}
        ${username ? `<div class="prompt-field"><span class="prompt-field__label">User</span><span class="prompt-field__value">${escapeHtml(username)}</span></div>` : ''}
        ${password ? `<div class="prompt-field"><span class="prompt-field__label">Pass</span><span class="prompt-field__value">${'•'.repeat(Math.min(password.length, 12))}</span></div>` : ''}
      </div>
      <div class="prompt-actions">
        <button type="button" class="prompt-action prompt-action--danger" data-action="never">Never for this site</button>
        <button type="button" class="prompt-action prompt-action--primary" data-action="save">Save</button>
      </div>
      <div class="prompt-progress" style="--progress: 100%"></div>
    `;
  }

  _startAutoDismiss() {
    if (this._autoDismissTimer) clearTimeout(this._autoDismissTimer);
    this._autoDismissTimer = setTimeout(() => this._dismiss(), 30000);
  }

  _save() {
    this.dispatchEvent(new CustomEvent('kbb-save', {
      bubbles: true, composed: true,
      detail: {
        name: this.getAttribute('name'),
        username: this.getAttribute('username'),
        password: this.getAttribute('password'),
        url: this.getAttribute('url'),
      },
    }));
    this.remove();
  }

  _never() {
    this.dispatchEvent(new CustomEvent('kbb-never', {
      bubbles: true, composed: true,
      detail: { url: this.getAttribute('url') },
    }));
    this.remove();
  }

  _dismiss() {
    this.dispatchEvent(new CustomEvent('kbb-dismiss', { bubbles: true, composed: true }));
    this.remove();
  }
}

class KbbUpdatePrompt extends HTMLElement {
  static get observedAttributes() {
    return ['name', 'username', 'password', 'old-username'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._autoDismissTimer = null;
  }

  connectedCallback() {
    this._render();
    this._startAutoDismiss();
    this.shadowRoot.querySelector('.prompt-header__close')?.addEventListener('click', () => this._dismiss());
    this.shadowRoot.querySelector('[data-action="update"]')?.addEventListener('click', () => this._update());
    this.shadowRoot.querySelector('[data-action="skip"]')?.addEventListener('click', () => this._skip());
  }

  disconnectedCallback() {
    if (this._autoDismissTimer) {
      clearTimeout(this._autoDismissTimer);
      this._autoDismissTimer = null;
    }
  }

  attributeChangedCallback() {
    if (this.isConnected) this._render();
  }

  _render() {
    const name = this.getAttribute('name') || '';
    const oldUsername = this.getAttribute('old-username') || '';
    const newUsername = this.getAttribute('username') || '';

    this.shadowRoot.innerHTML = `
      <style>${PROMPT_STYLES}</style>
      <div class="prompt-header" role="region" aria-label="Update login">
        <span class="prompt-header__icon" aria-hidden="true">${ICONS.shield || ''}</span>
        <span class="prompt-header__title">Update existing login?</span>
        <button type="button" class="prompt-header__close" aria-label="Close">
          <span aria-hidden="true">${ICONS.close || ''}</span>
        </button>
      </div>
      <div class="prompt-body">
        ${name ? `<div class="prompt-field"><span class="prompt-field__label">Site</span><span class="prompt-field__value">${escapeHtml(name)}</span></div>` : ''}
        <div class="prompt-field">
          <span class="prompt-field__label">From</span>
          <span class="prompt-field__value">${escapeHtml(oldUsername)}</span>
        </div>
        <div class="prompt-field">
          <span class="prompt-field__label">To</span>
          <span class="prompt-field__value">${escapeHtml(newUsername)}</span>
        </div>
      </div>
      <div class="prompt-actions">
        <button type="button" class="prompt-action prompt-action--secondary" data-action="skip">Not now</button>
        <button type="button" class="prompt-action prompt-action--primary" data-action="update">Update</button>
      </div>
      <div class="prompt-progress" style="--progress: 100%"></div>
    `;
  }

  _startAutoDismiss() {
    if (this._autoDismissTimer) clearTimeout(this._autoDismissTimer);
    this._autoDismissTimer = setTimeout(() => this._dismiss(), 30000);
  }

  _update() {
    this.dispatchEvent(new CustomEvent('kbb-update', {
      bubbles: true, composed: true,
      detail: {
        name: this.getAttribute('name'),
        username: this.getAttribute('username'),
        password: this.getAttribute('password'),
      },
    }));
    this.remove();
  }

  _skip() {
    this.dispatchEvent(new CustomEvent('kbb-skip', { bubbles: true, composed: true }));
    this.remove();
  }

  _dismiss() {
    this.dispatchEvent(new CustomEvent('kbb-dismiss', { bubbles: true, composed: true }));
    this.remove();
  }
}

if (!customElements.get('kbb-save-prompt')) {
  customElements.define('kbb-save-prompt', KbbSavePrompt);
}
if (!customElements.get('kbb-update-prompt')) {
  customElements.define('kbb-update-prompt', KbbUpdatePrompt);
}

export { KbbSavePrompt, KbbUpdatePrompt };
