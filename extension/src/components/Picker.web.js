import { ICONS } from '../../icons.js';

const PICKER_STYLES = `
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
  position: absolute;
  z-index: 2147483647;
  font-family: var(--font-sans);
  font-size: var(--text-md);
  line-height: 1.4;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  min-width: 280px;
  max-width: 400px;
  max-height: 420px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

@media (prefers-color-scheme: dark) {
  :host {
    --color-bg: #0f172a;
    --color-surface: #1e293b;
    --color-text: #f0f0f0;
    --color-text-secondary: #8b949e;
    --color-text-muted: #cbd5e1;
    --color-border: #334155;
  }
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  font-weight: 600;
  font-size: var(--text-base);
}

.picker-header__title {
  flex: 1;
}

.picker-header__close {
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
  padding: 0;
}

.picker-header__close:hover { opacity: 1; background: var(--color-bg); }

.picker-header__close svg { width: 14px; height: 14px; fill: currentColor; }

.picker-search {
  padding: var(--space-2) 10px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);
  display: flex;
  align-items: center;
  gap: 6px;
}

.picker-search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  color: inherit;
}

.picker-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: var(--space-1) 0;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  cursor: pointer;
  user-select: none;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font: inherit;
  color: inherit;
}

.picker-item:hover,
.picker-item--active {
  background: var(--color-bg);
}

.picker-item--selected {
  background: var(--color-accent-subtle);
}

.picker-item:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: -2px;
}

.picker-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-md);
  background: var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .picker-avatar { background: var(--color-border); color: var(--color-text-secondary); }
}

.picker-avatar--favicon {
  object-fit: contain;
  background: var(--color-surface);
  padding: var(--space-1);
}

.picker-info {
  flex: 1;
  min-width: 0;
}

.picker-name {
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-username {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-expanded {
  padding: var(--space-1) var(--space-3) var(--space-2) 50px;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  border-bottom: 1px solid var(--color-border);
}

.picker-action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.picker-action {
  padding: 3px var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  font-size: var(--text-xs);
  font-weight: 500;
  cursor: pointer;
  color: var(--color-text);
  white-space: nowrap;
  font-family: inherit;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.picker-action:hover {
  background: var(--color-bg);
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.picker-custom-header {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  letter-spacing: 0.04em;
  margin: 2px 0;
}

.picker-empty {
  padding: var(--space-5);
  text-align: center;
  color: var(--color-text-secondary);
  font-size: var(--text-base);
}

.picker-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  fill: currentColor;
}

@media (prefers-color-scheme: dark) {
  .picker-header { background: var(--color-surface); border-color: var(--color-border); }
  .picker-search { background: var(--color-surface); border-color: var(--color-border); }
  .picker-item:hover, .picker-item--active { background: var(--color-surface); }
  .picker-item--selected { background: var(--color-accent-subtle); }
  .picker-empty { color: var(--color-text-muted); }
  .picker-username { color: var(--color-text-muted); }
  .picker-action { background: var(--color-surface); border-color: var(--color-border); color: var(--color-text); }
  .picker-action:hover { background: var(--color-bg); border-color: var(--color-accent); color: var(--color-accent); }
  .picker-custom-header { color: var(--color-text-muted); }
  .picker-expanded { border-color: var(--color-border); }
}
`;

class KbbPicker extends HTMLElement {
  static get observedAttributes() {
    return ['credentials', 'placeholder', 'show-search', 'position'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._activeIndex = -1;
    this._credentials = [];
    this._search = '';
    this._expandedIndex = -1;
    this._boundOnKeyDown = this._onKeyDown.bind(this);
    this._boundOnClickOutside = this._onClickOutside.bind(this);
  }

  connectedCallback() {
    this._render();
    this._upgradeProperty('credentials');
    document.addEventListener('keydown', this._boundOnKeyDown, true);
    document.addEventListener('mousedown', this._boundOnClickOutside, true);
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._boundOnKeyDown, true);
    document.removeEventListener('mousedown', this._boundOnClickOutside, true);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'credentials') {
      try {
        this._credentials = JSON.parse(newValue || '[]');
      } catch (e) {
        this._credentials = [];
      }
    }
    if (this.isConnected) this._render();
  }

  _upgradeProperty(prop) {
    if (Object.prototype.hasOwnProperty.call(this, prop)) {
      const value = this[prop];
      delete this[prop];
      this[prop] = value;
    }
  }

  set credentials(value) {
    this._credentials = Array.isArray(value) ? value : [];
    if (this.isConnected) this._render();
  }

  get credentials() {
    return this._credentials;
  }

  get _filtered() {
    if (!this._search) return this._credentials;
    const q = this._search.toLowerCase();
    return this._credentials.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.username || '').toLowerCase().includes(q) ||
      (c.url || '').toLowerCase().includes(q)
    );
  }

  _render() {
    const placeholder = this.getAttribute('placeholder') || 'Search credentials…';
    const rawShowSearch = this.getAttribute('show-search');
    const showSearch = rawShowSearch !== null ? rawShowSearch !== 'false' : this._credentials.length > 4;
    const filtered = this._filtered;
    this._activeIndex = filtered.length > 0 ? 0 : -1;

    const headerDomain = this._getHeaderDomain();

    this.shadowRoot.innerHTML = `
      <style>${PICKER_STYLES}</style>
      <div class="picker-header">
        <span class="picker-header__title">${filtered.length} login${filtered.length !== 1 ? 's' : ''}${headerDomain ? ` for ${this._escapeHtml(headerDomain)}` : ''}</span>
        <button type="button" class="picker-header__close" aria-label="Close picker">
          <span aria-hidden="true">${ICONS.close || '✕'}</span>
        </button>
      </div>
      ${showSearch ? `
        <div class="picker-search">
          <span class="picker-icon" aria-hidden="true">${ICONS.search || ''}</span>
          <input
            type="text"
            class="picker-search-input"
            placeholder="${this._escapeHtml(placeholder)}"
            aria-label="Search credentials"
            value="${this._escapeHtml(this._search)}"
          />
        </div>
      ` : ''}
      <ul class="picker-list" role="listbox" aria-label="Credentials">
        ${filtered.length === 0 ? `<li class="picker-empty">${this._search ? 'No matches' : 'No credentials for this site'}</li>` : ''}
        ${filtered.map((cred, i) => this._renderItem(cred, i)).join('')}
      </ul>
    `;

    this.shadowRoot.querySelector('.picker-header__close')?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._emitClose();
    });

    this.shadowRoot.querySelector('.picker-search-input')?.addEventListener('input', (e) => {
      this._search = e.target.value;
      this._expandedIndex = -1;
      this._activeIndex = 0;
      this._render();
      this.shadowRoot.querySelector('.picker-search-input')?.focus();
    });

    this.shadowRoot.querySelectorAll('.picker-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(el.dataset.index);
        if (idx === this._expandedIndex) {
          this._expandedIndex = -1;
          this._render();
          return;
        }
        this._expandedIndex = idx;
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll('.picker-action').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = Number(el.dataset.index);
        const action = el.dataset.action;
        const cred = filtered[idx];
        if (!cred) return;
        if (action === 'fill-form') {
          const payload = { ...cred };
          payload._fillRole = 'form';
          this._emitFill(payload);
        } else if (action === 'fill-username') {
          this._emitFillForTarget(cred, 'username');
        } else if (action === 'copy-username') {
          this._emitCopy(cred, 'username');
        } else if (action === 'fill-password') {
          this._emitFillForTarget(cred, 'password');
        } else if (action === 'copy-password') {
          this._emitCopy(cred, 'password');
        }
      });
    });

    if (this._activeIndex >= 0) {
      this._highlightActive();
    }
  }

  _getHeaderDomain() {
    const urls = this._credentials.map(c => c.url).filter(Boolean);
    if (urls.length === 0) return '';
    try {
      const hostnames = urls.map(u => { try { return new URL(u).hostname; } catch { return null; } }).filter(Boolean);
      const unique = [...new Set(hostnames)];
      return unique[0] || '';
    } catch { return ''; }
  }

  _renderItem(cred, index) {
    const initial = (cred.name || cred.username || '?').charAt(0).toUpperCase();
    const favicon = cred.url ? this._faviconUrl(cred.url) : null;
    const avatar = favicon
      ? `<img class="picker-avatar picker-avatar--favicon" src="${favicon}" alt="" onerror="this.outerHTML='<div class=\\'picker-avatar\\'>${initial}</div>'" />`
      : `<div class="picker-avatar">${initial}</div>`;
    const isExpanded = index === this._expandedIndex;
    return `
      <li
        class="picker-item${index === this._activeIndex ? ' picker-item--active' : ''}${cred.selected ? ' picker-item--selected' : ''}"
        role="option"
        aria-selected="${index === this._activeIndex}"
        data-index="${index}"
        tabindex="${index === this._activeIndex ? '0' : '-1'}"
      >
        ${avatar}
        <div class="picker-info">
          <div class="picker-name">${this._escapeHtml(cred.name || '(no name)')}</div>
          ${cred.username ? `<div class="picker-username">${this._escapeHtml(cred.username)}</div>` : ''}
        </div>
        <span class="picker-icon" style="transition: transform 120ms;${isExpanded ? ' transform: rotate(180deg);' : ''}" aria-hidden="true">${ICONS['chevron-down'] || ''}</span>
      </li>
      ${isExpanded ? this._renderExpanded(cred, index) : ''}
    `;
  }

  _renderExpanded(cred, index) {
    const hasCustomFields = cred.customFields && Array.isArray(cred.customFields) && cred.customFields.length > 0;
    return `
      <li class="picker-expanded" role="presentation">
        <div class="picker-action-row">
          <button type="button" class="picker-action" data-index="${index}" data-action="fill-form">Fill form</button>
          ${cred.username ? `<button type="button" class="picker-action" data-index="${index}" data-action="fill-username">Fill user</button>` : ''}
          ${cred.username ? `<button type="button" class="picker-action" data-index="${index}" data-action="copy-username">Copy user</button>` : ''}
          ${cred.password ? `<button type="button" class="picker-action" data-index="${index}" data-action="fill-password">Fill pass</button>` : ''}
          ${cred.password ? `<button type="button" class="picker-action" data-index="${index}" data-action="copy-password">Copy pass</button>` : ''}
        </div>
        ${hasCustomFields ? `<div class="picker-custom-header">Custom fields (${cred.customFields.length})</div>` : ''}
      </li>
    `;
  }

  _faviconUrl(url) {
    try {
      const u = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
    } catch {
      return null;
    }
  }

  _escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  _highlightActive() {
    const items = this.shadowRoot.querySelectorAll('.picker-item');
    items.forEach((el, i) => {
      el.classList.toggle('picker-item--active', i === this._activeIndex);
      el.setAttribute('aria-selected', i === this._activeIndex);
      el.setAttribute('tabindex', i === this._activeIndex ? '0' : '-1');
    });
    const active = items[this._activeIndex];
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  _onKeyDown(e) {
    if (!this.isConnected) return;
    const filtered = this._filtered;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      e.stopPropagation();
      this._activeIndex = Math.min(this._activeIndex + 1, filtered.length - 1);
      this._expandedIndex = -1;
      this._highlightActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      this._activeIndex = Math.max(this._activeIndex - 1, 0);
      this._expandedIndex = -1;
      this._highlightActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const cred = filtered[this._activeIndex];
      if (cred) {
        this._emitFill(cred);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      if (this._expandedIndex >= 0) {
        this._expandedIndex = -1;
        this._render();
      } else {
        this._emitClose();
      }
    }
  }

  _onClickOutside(e) {
    if (!this.contains(e.target)) {
      this._emitClose();
    }
  }

  _emitFill(cred) {
    this.dispatchEvent(new CustomEvent('kbb-fill', {
      bubbles: true,
      composed: true,
      detail: { credential: cred },
    }));
  }

  _emitFillForTarget(cred, role) {
    this.dispatchEvent(new CustomEvent('kbb-fill', {
      bubbles: true,
      composed: true,
      detail: { credential: cred, fieldRole: role },
    }));
  }

  _emitCopy(cred, field) {
    this.dispatchEvent(new CustomEvent('kbb-copy', {
      bubbles: true,
      composed: true,
      detail: { credential: cred, field },
    }));
  }

  _emitClose() {
    this.dispatchEvent(new CustomEvent('kbb-close', {
      bubbles: true,
      composed: true,
    }));
  }
}

if (!customElements.get('kbb-picker')) {
  customElements.define('kbb-picker', KbbPicker);
}

export { KbbPicker };
