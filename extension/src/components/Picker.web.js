import { ICONS } from '../../icons.js';

const PICKER_STYLES = `
:host {
  position: absolute;
  z-index: 2147483647;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.4;
  color: #1a1a1a;
  background: #ffffff;
  border: 1px solid #e1e4e8;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  min-width: 280px;
  max-width: 400px;
  max-height: 320px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.picker-search {
  padding: 8px 10px;
  border-bottom: 1px solid #e1e4e8;
  background: #f6f8fa;
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
  padding: 4px 0;
}

.picker-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
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
  background: #f6f8fa;
}

.picker-item--selected {
  background: rgba(56, 139, 253, 0.1);
}

.picker-item:focus-visible {
  outline: 2px solid #2563eb;
  outline-offset: -2px;
}

.picker-avatar {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: #e1e4e8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 12px;
  color: #586069;
  flex-shrink: 0;
}

@media (prefers-color-scheme: dark) {
  .picker-avatar { background: #444d56; color: #adbac7; }
}

.picker-avatar--favicon {
  object-fit: contain;
  background: #ffffff;
  padding: 4px;
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
  font-size: 12px;
  color: #586069;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-empty {
  padding: 20px;
  text-align: center;
  color: #586069;
  font-size: 13px;
}

.picker-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  fill: currentColor;
}

@media (prefers-color-scheme: dark) {
  :host {
    color: #f0f0f0;
    background: #24292e;
    border-color: #444d56;
  }
  .picker-search { background: #1a1a1a; border-color: #444d56; }
  .picker-item:hover, .picker-item--active { background: #2f363d; }
  .picker-item--selected { background: rgba(56, 139, 253, 0.2); }
  .picker-empty { color: #cbd5e1; }
  .picker-username { color: #cbd5e1; }
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
    const showSearch = this.getAttribute('show-search') !== 'false';
    const filtered = this._filtered;
    this._activeIndex = filtered.length > 0 ? 0 : -1;

    this.shadowRoot.innerHTML = `
      <style>${PICKER_STYLES}</style>
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

    this.shadowRoot.querySelector('.picker-search-input')?.addEventListener('input', (e) => {
      this._search = e.target.value;
      this._activeIndex = 0;
      this._render();
      this.shadowRoot.querySelector('.picker-search-input')?.focus();
    });

    this.shadowRoot.querySelectorAll('.picker-item').forEach((el) => {
      el.addEventListener('click', () => {
        const idx = Number(el.dataset.index);
        const cred = filtered[idx];
        if (cred) this._emitFill(cred);
      });
    });

    if (this._activeIndex >= 0) {
      this._highlightActive();
    }
  }

  _renderItem(cred, index) {
    const initial = (cred.name || cred.username || '?').charAt(0).toUpperCase();
    const favicon = cred.url ? this._faviconUrl(cred.url) : null;
    const avatar = favicon
      ? `<img class="picker-avatar picker-avatar--favicon" src="${favicon}" alt="" onerror="this.outerHTML='<div class=\\'picker-avatar\\'>${initial}</div>'" />`
      : `<div class="picker-avatar">${initial}</div>`;
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
      this._highlightActive();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      e.stopPropagation();
      this._activeIndex = Math.max(this._activeIndex - 1, 0);
      this._highlightActive();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const cred = filtered[this._activeIndex];
      if (cred) this._emitFill(cred);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this._emitClose();
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
