import { ICONS } from '../../icons.js';

const PROMPT_STYLES = `
:host {
  position: fixed;
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

:host([data-position="bottom-right"]) {
  bottom: 16px;
  right: 16px;
}

@media (prefers-reduced-motion: reduce) {
  :host { animation: none; }
}

@keyframes slideIn {
  from { transform: translateX(120%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
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

.prompt-action:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

.prompt-progress {
  height: 2px;
  background: linear-gradient(to right, #2563eb var(--progress, 100%), transparent var(--progress, 100%));
  transition: --progress 30s linear;
}

.prompt-editable-input {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  background: #ffffff;
  color: #1a1a1a;
  box-sizing: border-box;
  margin-top: 2px;
}

.prompt-editable-input:focus {
  outline: 2px solid #2563eb;
  outline-offset: -1px;
}

.prompt-editable-select {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  background: #ffffff;
  color: #1a1a1a;
  box-sizing: border-box;
  margin-top: 2px;
  cursor: pointer;
  appearance: auto;
}

.prompt-editable-select:focus {
  outline: 2px solid #2563eb;
  outline-offset: -1px;
}

.prompt-editable-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  color: #586069;
  margin-bottom: 4px;
}

.prompt-editable-group {
  margin-bottom: 10px;
}

.prompt-field-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
}

.prompt-field-row:last-child {
  margin-bottom: 0;
}

@media (prefers-color-scheme: dark) {
  :host { color: #f0f0f0; background: #24292e; border-color: #444d56; }
  .prompt-header { border-color: #444d56; }
  .prompt-field { background: #1a1a1a; border-color: #444d56; }
  .prompt-field__label { color: #cbd5e1; }
  .prompt-action--secondary { border-color: #444d56; color: #f0f0f0; }
  .prompt-action--secondary:hover { background: #2f363d; }
  .prompt-action--danger { color: #f97583; }
  .prompt-editable-input { background: #1a1a1a; border-color: #444d56; color: #f0f0f0; }
  .prompt-editable-select { background: #1a1a1a; border-color: #444d56; color: #f0f0f0; }
  .prompt-editable-label { color: #cbd5e1; }
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
    return ['name', 'username', 'password', 'url', 'title', 'folder', 'folders'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._autoDismissTimer = null;
    this._editingTitle = '';
    this._editingUrl = '';
    this._editingFolder = '';
  }

  connectedCallback() {
    this._render();
    this._startAutoDismiss();
    this._bindEvents();
    this._applyPosition();
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

  _applyPosition() {
    if (!this.isConnected) return;
    const pos = this.getAttribute('data-position');
    if (!pos || pos === 'bottom-right') return;
    const top = this.getAttribute('data-top');
    const right = this.getAttribute('data-right');
    if (top) this.style.top = top;
    if (right) this.style.right = right;
  }

  _bindEvents() {
    this.shadowRoot.querySelector('.prompt-header__close')?.addEventListener('click', () => this._dismiss());
    this.shadowRoot.querySelector('[data-action="save"]')?.addEventListener('click', () => this._save());
    this.shadowRoot.querySelector('[data-action="never"]')?.addEventListener('click', () => this._never());
  }

  _render() {
    const name = this.getAttribute('name') || '';
    const username = this.getAttribute('username') || '';
    const password = this.getAttribute('password') || '';
    const url = this.getAttribute('url') || '';
    const title = this.getAttribute('title') || name || '';
    const folder = this.getAttribute('folder') || '';
    let folders = [];
    try {
      const raw = this.getAttribute('folders');
      if (raw) folders = JSON.parse(raw);
    } catch {}
    if (!Array.isArray(folders)) folders = [];

    const folderOptions = folders.map(f => {
      const val = typeof f === 'string' ? f : (f.value || f.name || '');
      const label = typeof f === 'string' ? f : (f.label || f.name || val);
      const sel = val === folder ? ' selected' : '';
      return `<option value="${escapeHtml(val)}"${sel}>${escapeHtml(label)}</option>`;
    }).join('');

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
        ${username ? `<div class="prompt-field"><span class="prompt-field__label">User</span><span class="prompt-field__value">${escapeHtml(username)}</span></div>` : ''}
        ${password ? `<div class="prompt-field"><span class="prompt-field__label">Pass</span><span class="prompt-field__value">${'•'.repeat(Math.min(password.length, 12))}</span></div>` : ''}
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">Title</label>
          <input type="text" class="prompt-editable-input" data-field="title" value="${escapeHtml(title)}" placeholder="Login title" />
        </div>
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">URL</label>
          <input type="text" class="prompt-editable-input" data-field="url" value="${escapeHtml(url)}" placeholder="https://" />
        </div>
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">Folder</label>
          <select class="prompt-editable-select" data-field="folder">
            ${folderOptions}
          </select>
        </div>
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

  _getFieldValue(selector) {
    const el = this.shadowRoot.querySelector(selector);
    return el ? el.value : '';
  }

  _save() {
    const title = this._getFieldValue('[data-field="title"]') || this.getAttribute('name') || '';
    const url = this._getFieldValue('[data-field="url"]') || this.getAttribute('url') || '';
    const folder = this._getFieldValue('[data-field="folder"]') || '';
    this.dispatchEvent(new CustomEvent('kbb-save', {
      bubbles: true, composed: true,
      detail: {
        name: title,
        title,
        username: this.getAttribute('username'),
        password: this.getAttribute('password'),
        url,
        folder,
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
    return ['name', 'username', 'password', 'old-username', 'title', 'folder', 'folders'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._autoDismissTimer = null;
  }

  connectedCallback() {
    this._render();
    this._startAutoDismiss();
    this._bindEvents();
    this._applyPosition();
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

  _applyPosition() {
    if (!this.isConnected) return;
    const pos = this.getAttribute('data-position');
    if (!pos || pos === 'bottom-right') return;
    const top = this.getAttribute('data-top');
    const right = this.getAttribute('data-right');
    if (top) this.style.top = top;
    if (right) this.style.right = right;
  }

  _bindEvents() {
    this.shadowRoot.querySelector('.prompt-header__close')?.addEventListener('click', () => this._dismiss());
    this.shadowRoot.querySelector('[data-action="update"]')?.addEventListener('click', () => this._update());
    this.shadowRoot.querySelector('[data-action="skip"]')?.addEventListener('click', () => this._skip());
  }

  _render() {
    const name = this.getAttribute('name') || '';
    const oldUsername = this.getAttribute('old-username') || '';
    const newUsername = this.getAttribute('username') || '';
    const password = this.getAttribute('password') || '';
    const url = this.getAttribute('url') || '';
    const title = this.getAttribute('title') || name || '';
    let folders = [];
    try {
      const raw = this.getAttribute('folders');
      if (raw) folders = JSON.parse(raw);
    } catch {}
    if (!Array.isArray(folders)) folders = [];

    const folderOptions = folders.map(f => {
      const val = typeof f === 'string' ? f : (f.value || f.name || '');
      const label = typeof f === 'string' ? f : (f.label || f.name || val);
      return `<option value="${escapeHtml(val)}">${escapeHtml(label)}</option>`;
    }).join('');

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
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">New Password</label>
          <input type="text" class="prompt-editable-input" data-field="username" value="${escapeHtml(newUsername)}" placeholder="Username" />
        </div>
        ${password ? `<div class="prompt-field"><span class="prompt-field__label">Pass</span><span class="prompt-field__value">${'•'.repeat(Math.min(password.length, 12))}</span></div>` : ''}
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">URL</label>
          <input type="text" class="prompt-editable-input" data-field="url" value="${escapeHtml(url)}" placeholder="https://" />
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

  _getFieldValue(selector) {
    const el = this.shadowRoot.querySelector(selector);
    return el ? el.value : '';
  }

  _update() {
    const username = this._getFieldValue('[data-field="username"]') || this.getAttribute('username') || '';
    const url = this._getFieldValue('[data-field="url"]') || this.getAttribute('url') || '';
    this.dispatchEvent(new CustomEvent('kbb-update', {
      bubbles: true, composed: true,
      detail: {
        name: this.getAttribute('name'),
        username,
        password: this.getAttribute('password'),
        url,
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
