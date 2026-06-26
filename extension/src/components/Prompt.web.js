import { ICONS } from '../../icons.js';
import { escapeHtml } from '../../shared/escape-html.js';

const PROMPT_STYLES = `
:host {
  --color-bg: #fafbfc;
  --color-surface: #ffffff;
  --color-text: #1a1a1a;
  --color-text-secondary: #586069;
  --color-text-muted: #8b949e;
  --color-border: #e1e4e8;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-subtle: #dbeafe;
  --color-success: #10b981;
  --color-danger: #d73a49;
  --color-danger-subtle: #fee2e2;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --font-sans: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'SF Mono', Menlo, Consolas, monospace;
  --text-xs: 11px;
  --text-sm: 12px;
  --text-base: 13px;
  --text-md: 14px;
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  position: fixed;
  z-index: 2147483647;
  width: 360px;
  max-width: calc(100vw - 32px);
  font-family: var(--font-sans);
  font-size: var(--text-md);
  line-height: 1.4;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  animation: slideIn 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

:host([data-position="bottom-right"]) {
  bottom: 16px;
  right: 16px;
}

@media (prefers-color-scheme: dark) {
  :host {
    --color-bg: #0f172a;
    --color-surface: #1e293b;
    --color-text: #f0f0f0;
    --color-text-secondary: #8b949e;
    --color-text-muted: #cbd5e1;
    --color-border: #334155;
    --color-danger: #f97583;
    --color-danger-subtle: #7f1d1d;
  }
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
  gap: var(--space-2);
  padding: var(--space-3) 14px;
  border-bottom: 1px solid var(--color-border);
  font-weight: 600;
}

.prompt-header__icon {
  width: 18px;
  height: 18px;
  fill: var(--color-accent);
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
  border-radius: var(--radius-sm);
  color: inherit;
  opacity: 0.6;
}

.prompt-header__close:hover { opacity: 1; background: var(--color-bg); }
.prompt-header__close svg { width: 14px; height: 14px; fill: currentColor; }

.prompt-body {
  padding: var(--space-3) 14px;
}

.prompt-field {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 6px 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 6px;
  font-size: var(--text-base);
}

.prompt-field__label {
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-secondary);
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
  gap: var(--space-2);
  padding: 0 14px 14px;
  justify-content: flex-end;
}

.prompt-action {
  padding: var(--space-1) var(--space-3);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  color: inherit;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.prompt-action--primary {
  background: var(--color-accent);
  color: #ffffff;
}

.prompt-action--primary:hover { background: var(--color-accent-hover); }

.prompt-action--secondary {
  border-color: var(--color-border);
  color: var(--color-text);
}

.prompt-action--secondary:hover { background: var(--color-bg); }

.prompt-action--danger {
  color: var(--color-danger);
}

.prompt-action--danger:hover { background: var(--color-danger-subtle); }

.prompt-action:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.prompt-progress {
  height: 2px;
  background: linear-gradient(to right, var(--color-accent) var(--progress, 100%), transparent var(--progress, 100%));
  transition: --progress 30s linear;
}

.prompt-editable-input {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font: inherit;
  font-size: var(--text-base);
  background: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
  margin-top: 2px;
}

.prompt-editable-input:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}

.prompt-editable-select {
  display: block;
  width: 100%;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font: inherit;
  font-size: var(--text-base);
  background: var(--color-surface);
  color: var(--color-text);
  box-sizing: border-box;
  margin-top: 2px;
  cursor: pointer;
  appearance: auto;
}

.prompt-editable-select:focus {
  outline: 2px solid var(--color-accent);
  outline-offset: -1px;
}

.prompt-editable-label {
  display: block;
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-1);
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
  .prompt-header { border-color: var(--color-border); }
  .prompt-field { background: var(--color-surface); border-color: var(--color-border); }
  .prompt-field__label { color: var(--color-text-muted); }
  .prompt-action--secondary { border-color: var(--color-border); color: var(--color-text); }
  .prompt-action--secondary:hover { background: var(--color-bg); }
  .prompt-action--danger { color: var(--color-danger); }
  .prompt-editable-input { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text); }
  .prompt-editable-select { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text); }
  .prompt-editable-label { color: var(--color-text-muted); }
}
`;

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
          <select class="prompt-editable-select" data-field="folder" aria-label="Folder">
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
