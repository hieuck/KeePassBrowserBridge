const l = {
  key: "M10.5 0a4.5 4.5 0 1 1-3.18 7.68L2 13l-1.5 1.5L2 16l1.5-1.5L5 13l5.32-5.32A4.5 4.5 0 0 1 10.5 0zm-2 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  lock: "M3 7V5a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm2 0h6V5a3 3 0 0 0-6 0v2z",
  "lock-open": "M3 7V5a5 5 0 0 1 9.9-1H11a3 3 0 0 0-5 1v2h7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm0 2v6h10V9H3z",
  unlock: "M3 7V5a5 5 0 0 1 9.9-1H11a3 3 0 0 0-5 1v2h7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1z",
  copy: "M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25zM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25z",
  check: "M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z",
  edit: "M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.236L2.677 14.17l-.93.93.93-.93 8.51-8.51-1.998-1.997Z",
  pencil: "M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.236L2.677 14.17l-.93.93.93-.93 8.51-8.51-1.998-1.997Z",
  plus: "M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z",
  trash: "M11 1.75V3h5.25a.75.75 0 0 1 0 1.5H14.5v1.75a.75.75 0 0 1-1.5 0V4.5h-5v1.75a.75.75 0 0 1-1.5 0V4.5h-2v11a.25.25 0 0 0 .25.25h9.5a.25.25 0 0 0 .25-.25v-11h-2v1.75a.75.75 0 0 1-1.5 0V4.5h-5v-.75a.75.75 0 0 1 0-1.5h5v-.75a.75.75 0 0 1 1.5 0v.75h.5Z",
  search: "M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.75.75 0 0 1-1.061 1.06l-3.04-3.04zM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0z",
  filter: "M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5zM3 7.75h10a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5zM5.5 12.5h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1 0-1.5z",
  close: "M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 0 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 0 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z",
  "chevron-down": "M12.78 6.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L8 8.94l3.72-3.72a.75.75 0 0 1 1.06 0Z",
  eye: "M1.679 7.932c.412-.621 1.242-1.75 2.366-2.717C5.175 4.242 6.527 3.5 8 3.5c1.473 0 2.824.742 3.955 1.715 1.124.967 1.954 2.096 2.366 2.717a.75.75 0 0 1 0 .766c-.412.621-1.242 1.75-2.366 2.717C10.825 11.758 9.473 12.5 8 12.5c-1.473 0-2.824-.742-3.955-1.715C2.92 9.818 2.09 8.69 1.679 8.068a.75.75 0 0 1 0-.766zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  "eye-off": "M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 0 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 0 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  shield: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-.918-.57l-.55-3.18a.75.75 0 0 1 .165-.673L1.5 6.124a.75.75 0 0 1 .418-1.28l4.21-.611L7.99.668A.75.75 0 0 1 8 .25Z",
  "shield-check": "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-.918-.57l-.55-3.18a.75.75 0 0 1 .165-.673L1.5 6.124a.75.75 0 0 1 .418-1.28l4.21-.611L7.99.668A.75.75 0 0 1 8 .25Zm2.486 6.97a.75.75 0 0 0-1.06-1.06L6.5 9.44 5.03 7.97a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0z",
  globe: "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM2.5 8a5.5 5.5 0 0 1 9.591-3.886.531.531 0 0 0 .072.745.536.536 0 0 0-.116.084c-.17.166-.36.348-.484.538a.53.53 0 0 0-.066.36.532.532 0 0 1-.494.628.532.532 0 0 0-.36.066c-.19.124-.372.314-.538.484a.536.536 0 0 0-.084.116.531.531 0 0 0-.745.072A5.5 5.5 0 0 1 2.5 8Zm5.5 5.5a5.5 5.5 0 0 0 5.5-5.5.532.532 0 0 0-.36-.066.532.532 0 0 1-.628-.494.532.532 0 0 0-.066-.36c-.124-.19-.314-.372-.484-.538a.536.536 0 0 0-.116-.084.531.531 0 0 0-.745-.072A5.5 5.5 0 0 0 8 13.5Z",
  user: "M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 0 5.123 0zM10.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z",
  "user-plus": "M5.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 6.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zM7.5 9a4.5 4.5 0 0 0-3.83 2.146.75.75 0 1 0 1.276.79A3 3 0 0 1 7.5 11h.75a.75.75 0 0 0 0-1.5H7.5zM10 4.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75zM13 8.75a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5z"
};
function h(c, e) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="${e}"/></svg>`;
}
const i = Object.fromEntries(
  Object.entries(l).map(([c, e]) => [c, h(c, e)])
);
i.key;
i.lock;
i["lock-open"];
i.unlock;
i.copy;
i.check;
i.edit;
i.pencil;
i.plus;
i.trash;
i.search;
i.filter;
i.close;
i["chevron-down"];
i.eye;
i["eye-off"];
i.shield;
i["shield-check"];
i.globe;
i.user;
i["user-plus"];
function d(c = "kbb") {
  if (!(typeof customElements > "u"))
    for (const [e, t] of Object.entries(i)) {
      const a = `${c}-icon-${e}`;
      if (customElements.get(a)) continue;
      class s extends HTMLElement {
        connectedCallback() {
          const r = this.getAttribute("size") || 16;
          this.innerHTML = t.replace('width="16"', `width="${r}"`).replace('height="16"', `height="${r}"`);
        }
      }
      customElements.define(a, s);
    }
}
class p extends HTMLElement {
  static get observedAttributes() {
    return ["variant", "size", "type", "disabled", "loading", "block", "leading-icon", "trailing-icon"];
  }
  connectedCallback() {
    this.render(), this.addEventListener("click", this.onClick);
  }
  disconnectedCallback() {
    this.removeEventListener("click", this.onClick);
  }
  attributeChangedCallback() {
    this.render();
  }
  onClick(e) {
    if (this.hasAttribute("disabled") || this.hasAttribute("loading")) {
      e.preventDefault(), e.stopPropagation();
      return;
    }
    this.dispatchEvent(new CustomEvent("kbb-click", { bubbles: !0, detail: { original: e } }));
  }
  render() {
    const e = this.getAttribute("variant") || "secondary", t = this.getAttribute("size") || "md", a = this.getAttribute("type") || "button", s = this.hasAttribute("block"), n = this.hasAttribute("loading"), r = this.hasAttribute("disabled") || n, o = this.textContent.trim();
    this.innerHTML = `<button type="${a}" class="kbb-btn kbb-btn--${e} kbb-btn--${t}${s ? " kbb-btn--block" : ""}${n ? " kbb-btn--loading" : ""}" ${r ? "disabled" : ""} aria-busy="${n}" aria-disabled="${r}"><span class="kbb-btn__label">${u(o)}</span></button>`;
  }
}
function u(c) {
  return String(c || "").replace(/[&<>"']/g, (e) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[e]);
}
typeof customElements < "u" && !customElements.get("kbb-button") && customElements.define("kbb-button", p);
const b = `
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

@media (prefers-color-scheme: dark) {
  :host {
    color: #f0f0f0;
    background: #24292e;
    border-color: #444d56;
  }
  .picker-search { background: #1a1a1a; border-color: #444d56; }
  .picker-item:hover, .picker-item--active { background: #2f363d; }
  .picker-item--selected { background: rgba(56, 139, 253, 0.2); }
  .picker-empty { color: #8b949e; }
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

@media (prefers-color-scheme: dark) {
  .picker-username { color: #8b949e; }
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
`;
class f extends HTMLElement {
  static get observedAttributes() {
    return ["credentials", "placeholder", "show-search", "position"];
  }
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this._activeIndex = -1, this._credentials = [], this._search = "", this._boundOnKeyDown = this._onKeyDown.bind(this), this._boundOnClickOutside = this._onClickOutside.bind(this);
  }
  connectedCallback() {
    this._render(), this._upgradeProperty("credentials"), document.addEventListener("keydown", this._boundOnKeyDown, !0), document.addEventListener("mousedown", this._boundOnClickOutside, !0);
  }
  disconnectedCallback() {
    document.removeEventListener("keydown", this._boundOnKeyDown, !0), document.removeEventListener("mousedown", this._boundOnClickOutside, !0);
  }
  attributeChangedCallback(e, t, a) {
    if (t !== a) {
      if (e === "credentials")
        try {
          this._credentials = JSON.parse(a || "[]");
        } catch {
          this._credentials = [];
        }
      this.isConnected && this._render();
    }
  }
  _upgradeProperty(e) {
    if (Object.prototype.hasOwnProperty.call(this, e)) {
      const t = this[e];
      delete this[e], this[e] = t;
    }
  }
  set credentials(e) {
    this._credentials = Array.isArray(e) ? e : [], this.isConnected && this._render();
  }
  get credentials() {
    return this._credentials;
  }
  get _filtered() {
    if (!this._search) return this._credentials;
    const e = this._search.toLowerCase();
    return this._credentials.filter(
      (t) => (t.name || "").toLowerCase().includes(e) || (t.username || "").toLowerCase().includes(e) || (t.url || "").toLowerCase().includes(e)
    );
  }
  _render() {
    var s;
    const e = this.getAttribute("placeholder") || "Search credentials…", t = this.getAttribute("show-search") !== "false", a = this._filtered;
    this._activeIndex = a.length > 0 ? 0 : -1, this.shadowRoot.innerHTML = `
      <style>${b}</style>
      ${t ? `
        <div class="picker-search">
          <span class="picker-icon" aria-hidden="true">${i.search || ""}</span>
          <input
            type="text"
            class="picker-search-input"
            placeholder="${this._escapeHtml(e)}"
            aria-label="Search credentials"
            value="${this._escapeHtml(this._search)}"
          />
        </div>
      ` : ""}
      <ul class="picker-list" role="listbox" aria-label="Credentials">
        ${a.length === 0 ? `<li class="picker-empty">${this._search ? "No matches" : "No credentials for this site"}</li>` : ""}
        ${a.map((n, r) => this._renderItem(n, r)).join("")}
      </ul>
    `, (s = this.shadowRoot.querySelector(".picker-search-input")) == null || s.addEventListener("input", (n) => {
      var r;
      this._search = n.target.value, this._activeIndex = 0, this._render(), (r = this.shadowRoot.querySelector(".picker-search-input")) == null || r.focus();
    }), this.shadowRoot.querySelectorAll(".picker-item").forEach((n) => {
      n.addEventListener("click", () => {
        const r = Number(n.dataset.index), o = a[r];
        o && this._emitFill(o);
      });
    }), this._activeIndex >= 0 && this._highlightActive();
  }
  _renderItem(e, t) {
    const a = (e.name || e.username || "?").charAt(0).toUpperCase(), s = e.url ? this._faviconUrl(e.url) : null, n = s ? `<img class="picker-avatar picker-avatar--favicon" src="${s}" alt="" onerror="this.outerHTML='<div class=\\'picker-avatar\\'>${a}</div>'" />` : `<div class="picker-avatar">${a}</div>`;
    return `
      <li
        class="picker-item${t === this._activeIndex ? " picker-item--active" : ""}${e.selected ? " picker-item--selected" : ""}"
        role="option"
        aria-selected="${t === this._activeIndex}"
        data-index="${t}"
        tabindex="${t === this._activeIndex ? "0" : "-1"}"
      >
        ${n}
        <div class="picker-info">
          <div class="picker-name">${this._escapeHtml(e.name || "(no name)")}</div>
          ${e.username ? `<div class="picker-username">${this._escapeHtml(e.username)}</div>` : ""}
        </div>
      </li>
    `;
  }
  _faviconUrl(e) {
    try {
      return `https://www.google.com/s2/favicons?domain=${new URL(e).hostname}&sz=32`;
    } catch {
      return null;
    }
  }
  _escapeHtml(e) {
    return String(e).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  _highlightActive() {
    const e = this.shadowRoot.querySelectorAll(".picker-item");
    e.forEach((a, s) => {
      a.classList.toggle("picker-item--active", s === this._activeIndex), a.setAttribute("aria-selected", s === this._activeIndex), a.setAttribute("tabindex", s === this._activeIndex ? "0" : "-1");
    });
    const t = e[this._activeIndex];
    t && t.scrollIntoView({ block: "nearest" });
  }
  _onKeyDown(e) {
    if (!this.isConnected) return;
    const t = this._filtered;
    if (e.key === "ArrowDown")
      e.preventDefault(), e.stopPropagation(), this._activeIndex = Math.min(this._activeIndex + 1, t.length - 1), this._highlightActive();
    else if (e.key === "ArrowUp")
      e.preventDefault(), e.stopPropagation(), this._activeIndex = Math.max(this._activeIndex - 1, 0), this._highlightActive();
    else if (e.key === "Enter") {
      e.preventDefault(), e.stopPropagation();
      const a = t[this._activeIndex];
      a && this._emitFill(a);
    } else e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), this._emitClose());
  }
  _onClickOutside(e) {
    this.contains(e.target) || this._emitClose();
  }
  _emitFill(e) {
    this.dispatchEvent(new CustomEvent("kbb-fill", {
      bubbles: !0,
      composed: !0,
      detail: { credential: e }
    }));
  }
  _emitClose() {
    this.dispatchEvent(new CustomEvent("kbb-close", {
      bubbles: !0,
      composed: !0
    }));
  }
}
customElements.get("kbb-picker") || customElements.define("kbb-picker", f);
d("kbb");
