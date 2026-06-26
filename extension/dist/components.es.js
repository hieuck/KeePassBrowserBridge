const x = {
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
  "user-plus": "M5.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 6.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zM7.5 9a4.5 4.5 0 0 0-3.83 2.146.75.75 0 1 0 1.276.79A3 3 0 0 1 7.5 11h.75a.75.75 0 0 0 0-1.5H7.5zM10 4.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75zM13 8.75a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5z",
  sun: "M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13zM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061zM16 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8zM1.5 8.75a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5h-1.5zm12.728-5.03a.75.75 0 0 1 0 1.06l-1.061 1.061a.75.75 0 1 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.06 0zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.061 1.061a.75.75 0 1 1-1.06-1.061l1.06-1.061a.75.75 0 0 1 1.06 0z",
  moon: "M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 0 1 0-13 6.5 6.5 0 0 1 0 13z",
  monitor: "M2 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2zm1 2h10v7H3V5zm4 10a1 1 0 0 0 1-1h2a1 1 0 0 0 1 1H7z",
  download: "M7.47 10.78a.75.75 0 0 0 1.06 0l3.25-3.25a.75.75 0 0 0-1.06-1.06L8.75 8.44V1.75a.75.75 0 0 0-1.5 0v6.69L5.28 6.47a.75.75 0 0 0-1.06 1.06l3.25 3.25zM3.75 13.25a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5z",
  upload: "M8.53 1.22a.75.75 0 0 0-1.06 0L4.22 4.47a.75.75 0 0 0 1.06 1.06l2.47-2.47v6.69a.75.75 0 0 0 1.5 0V3.06l2.47 2.47a.75.75 0 1 0 1.06-1.06L8.53 1.22zM3.75 11.75a.75.75 0 0 0 0 1.5h8.5a.75.75 0 0 0 0-1.5h-8.5z"
};
function _(l, e) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true" focusable="false"><path d="${e}"/></svg>`;
}
const a = Object.fromEntries(
  Object.entries(x).map(([l, e]) => [l, _(l, e)])
);
a.key;
a.lock;
a["lock-open"];
a.unlock;
a.copy;
a.check;
a.edit;
a.pencil;
a.plus;
a.trash;
a.search;
a.filter;
a.close;
a["chevron-down"];
a.eye;
a["eye-off"];
a.shield;
a["shield-check"];
a.globe;
a.user;
a["user-plus"];
a.sun;
a.moon;
a.monitor;
a.download;
a.upload;
function k(l = "kbb") {
  if (!(typeof customElements > "u"))
    for (const [e, t] of Object.entries(a)) {
      const r = `${l}-icon-${e}`;
      if (customElements.get(r)) continue;
      class o extends HTMLElement {
        connectedCallback() {
          const s = this.getAttribute("size") || 16;
          this.innerHTML = t.replace('width="16"', `width="${s}"`).replace('height="16"', `height="${s}"`);
        }
      }
      customElements.define(r, o);
    }
}
function n(l) {
  return String(l).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
class y extends HTMLElement {
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
    const e = this.getAttribute("variant") || "secondary", t = this.getAttribute("size") || "md", r = this.getAttribute("type") || "button", o = this.hasAttribute("block"), d = this.hasAttribute("loading"), s = this.hasAttribute("disabled") || d, p = this.textContent.trim();
    this.innerHTML = `<button type="${r}" class="kbb-btn kbb-btn--${e} kbb-btn--${t}${o ? " kbb-btn--block" : ""}${d ? " kbb-btn--loading" : ""}" ${s ? "disabled" : ""} aria-busy="${d}" aria-disabled="${s}"><span class="kbb-btn__label">${n(p)}</span></button>`;
  }
}
typeof customElements < "u" && !customElements.get("kbb-button") && customElements.define("kbb-button", y);
const f = `
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
`;
let m = "duckduckgo";
function w(l) {
  if (!l) return null;
  try {
    const t = new URL(l).hostname;
    return m === "duckduckgo" ? `https://icons.duckduckgo.com/ip3/${t}.ico` : `https://icons.duckduckgo.com/ip3/${t}.ico`;
  } catch {
    return null;
  }
}
const $ = `
:host {${f}
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
class A extends HTMLElement {
  static get observedAttributes() {
    return ["credentials", "placeholder", "show-search", "position"];
  }
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this._activeIndex = -1, this._credentials = [], this._search = "", this._expandedIndex = -1, this._boundOnKeyDown = this._onKeyDown.bind(this), this._boundOnClickOutside = this._onClickOutside.bind(this);
  }
  connectedCallback() {
    this._render(), this._upgradeProperty("credentials"), document.addEventListener("keydown", this._boundOnKeyDown, !0), document.addEventListener("mousedown", this._boundOnClickOutside, !0);
  }
  disconnectedCallback() {
    document.removeEventListener("keydown", this._boundOnKeyDown, !0), document.removeEventListener("mousedown", this._boundOnClickOutside, !0);
  }
  attributeChangedCallback(e, t, r) {
    if (t !== r) {
      if (e === "credentials")
        try {
          this._credentials = JSON.parse(r || "[]");
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
    var s, p;
    const e = this.getAttribute("placeholder") || "Search credentials…", t = this.getAttribute("show-search"), r = t !== null ? t !== "false" : this._credentials.length > 4, o = this._filtered;
    this._activeIndex = o.length > 0 ? 0 : -1;
    const d = this._getHeaderDomain();
    this.shadowRoot.innerHTML = `
      <style>${$}</style>
      <div class="picker-header">
        <span class="picker-header__title">${o.length} login${o.length !== 1 ? "s" : ""}${d ? ` for ${n(d)}` : ""}</span>
        <button type="button" class="picker-header__close" aria-label="Close picker">
          <span aria-hidden="true">${a.close || "✕"}</span>
        </button>
      </div>
      ${r ? `
        <div class="picker-search">
          <span class="picker-icon" aria-hidden="true">${a.search || ""}</span>
          <input
            type="text"
            class="picker-search-input"
            placeholder="${n(e)}"
            aria-label="Search credentials"
            value="${n(this._search)}"
          />
        </div>
      ` : ""}
      <ul class="picker-list" role="listbox" aria-label="Credentials">
        ${o.length === 0 ? `<li class="picker-empty">${this._search ? "No matches" : "No credentials for this site"}</li>` : ""}
        ${o.map((c, i) => this._renderItem(c, i)).join("")}
      </ul>
    `, (s = this.shadowRoot.querySelector(".picker-header__close")) == null || s.addEventListener("click", (c) => {
      c.stopPropagation(), this._emitClose();
    }), (p = this.shadowRoot.querySelector(".picker-search-input")) == null || p.addEventListener("input", (c) => {
      var i;
      this._search = c.target.value, this._expandedIndex = -1, this._activeIndex = 0, this._render(), (i = this.shadowRoot.querySelector(".picker-search-input")) == null || i.focus();
    }), this.shadowRoot.querySelectorAll(".picker-item").forEach((c) => {
      c.addEventListener("click", (i) => {
        i.stopPropagation();
        const u = Number(c.dataset.index);
        if (u === this._expandedIndex) {
          this._expandedIndex = -1, this._render();
          return;
        }
        this._expandedIndex = u, this._render();
      });
    }), this.shadowRoot.querySelectorAll(".picker-action").forEach((c) => {
      c.addEventListener("click", (i) => {
        i.stopPropagation();
        const u = Number(c.dataset.index), b = c.dataset.action, h = o[u];
        if (h)
          if (b === "fill-form") {
            const v = { ...h };
            v._fillRole = "form", this._emitFill(v);
          } else b === "fill-username" ? this._emitFillForTarget(h, "username") : b === "copy-username" ? this._emitCopy(h, "username") : b === "fill-password" ? this._emitFillForTarget(h, "password") : b === "copy-password" && this._emitCopy(h, "password");
      });
    }), this._activeIndex >= 0 && this._highlightActive();
  }
  _getHeaderDomain() {
    const e = this._credentials.map((t) => t.url).filter(Boolean);
    if (e.length === 0) return "";
    try {
      const t = e.map((o) => {
        try {
          return new URL(o).hostname;
        } catch {
          return null;
        }
      }).filter(Boolean);
      return [...new Set(t)][0] || "";
    } catch {
      return "";
    }
  }
  _renderItem(e, t) {
    const r = (e.name || e.username || "?").charAt(0).toUpperCase(), o = e.url ? this._faviconUrl(e.url) : null, d = o ? `<img class="picker-avatar picker-avatar--favicon" src="${o}" alt="" onerror="this.outerHTML='<div class=\\'picker-avatar\\'>${r}</div>'" />` : `<div class="picker-avatar">${r}</div>`, s = t === this._expandedIndex;
    return `
      <li
        class="picker-item${t === this._activeIndex ? " picker-item--active" : ""}${e.selected ? " picker-item--selected" : ""}"
        role="option"
        aria-selected="${t === this._activeIndex}"
        data-index="${t}"
        tabindex="${t === this._activeIndex ? "0" : "-1"}"
      >
        ${d}
        <div class="picker-info">
          <div class="picker-name">${n(e.name || "(no name)")}</div>
          ${e.username ? `<div class="picker-username">${n(e.username)}</div>` : ""}
        </div>
        <span class="picker-icon" style="transition: transform 120ms;${s ? " transform: rotate(180deg);" : ""}" aria-hidden="true">${a["chevron-down"] || ""}</span>
      </li>
      ${s ? this._renderExpanded(e, t) : ""}
    `;
  }
  _renderExpanded(e, t) {
    const r = e.customFields && Array.isArray(e.customFields) && e.customFields.length > 0;
    return `
      <li class="picker-expanded" role="presentation">
        <div class="picker-action-row">
          <button type="button" class="picker-action" data-index="${t}" data-action="fill-form">Fill form</button>
          ${e.username ? `<button type="button" class="picker-action" data-index="${t}" data-action="fill-username">Fill user</button>` : ""}
          ${e.username ? `<button type="button" class="picker-action" data-index="${t}" data-action="copy-username">Copy user</button>` : ""}
          ${e.password ? `<button type="button" class="picker-action" data-index="${t}" data-action="fill-password">Fill pass</button>` : ""}
          ${e.password ? `<button type="button" class="picker-action" data-index="${t}" data-action="copy-password">Copy pass</button>` : ""}
        </div>
        ${r ? `<div class="picker-custom-header">Custom fields (${e.customFields.length})</div>` : ""}
      </li>
    `;
  }
  _faviconUrl(e) {
    return w(e);
  }
  _highlightActive() {
    const e = this.shadowRoot.querySelectorAll(".picker-item");
    e.forEach((r, o) => {
      r.classList.toggle("picker-item--active", o === this._activeIndex), r.setAttribute("aria-selected", o === this._activeIndex), r.setAttribute("tabindex", o === this._activeIndex ? "0" : "-1");
    });
    const t = e[this._activeIndex];
    t && t.scrollIntoView({ block: "nearest" });
  }
  _onKeyDown(e) {
    if (!this.isConnected) return;
    const t = this._filtered;
    if (e.key === "ArrowDown")
      e.preventDefault(), e.stopPropagation(), this._activeIndex = Math.min(this._activeIndex + 1, t.length - 1), this._expandedIndex = -1, this._highlightActive();
    else if (e.key === "ArrowUp")
      e.preventDefault(), e.stopPropagation(), this._activeIndex = Math.max(this._activeIndex - 1, 0), this._expandedIndex = -1, this._highlightActive();
    else if (e.key === "Enter") {
      e.preventDefault(), e.stopPropagation();
      const r = t[this._activeIndex];
      r && this._emitFill(r);
    } else e.key === "Escape" && (e.preventDefault(), e.stopPropagation(), this._expandedIndex >= 0 ? (this._expandedIndex = -1, this._render()) : this._emitClose());
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
  _emitFillForTarget(e, t) {
    this.dispatchEvent(new CustomEvent("kbb-fill", {
      bubbles: !0,
      composed: !0,
      detail: { credential: e, fieldRole: t }
    }));
  }
  _emitCopy(e, t) {
    this.dispatchEvent(new CustomEvent("kbb-copy", {
      bubbles: !0,
      composed: !0,
      detail: { credential: e, field: t }
    }));
  }
  _emitClose() {
    this.dispatchEvent(new CustomEvent("kbb-close", {
      bubbles: !0,
      composed: !0
    }));
  }
}
customElements.get("kbb-picker") || customElements.define("kbb-picker", A);
const g = `
:host {${f}
  --color-danger-subtle: #fee2e2;
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
class E extends HTMLElement {
  static get observedAttributes() {
    return ["name", "username", "password", "url", "title", "folder", "folders"];
  }
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this._autoDismissTimer = null, this._editingTitle = "", this._editingUrl = "", this._editingFolder = "";
  }
  connectedCallback() {
    this._render(), this._startAutoDismiss(), this._bindEvents(), this._applyPosition();
  }
  disconnectedCallback() {
    this._autoDismissTimer && (clearTimeout(this._autoDismissTimer), this._autoDismissTimer = null);
  }
  attributeChangedCallback() {
    this.isConnected && this._render();
  }
  _applyPosition() {
    if (!this.isConnected) return;
    const e = this.getAttribute("data-position");
    if (!e || e === "bottom-right") return;
    const t = this.getAttribute("data-top"), r = this.getAttribute("data-right");
    t && (this.style.top = t), r && (this.style.right = r);
  }
  _bindEvents() {
    var e, t, r;
    (e = this.shadowRoot.querySelector(".prompt-header__close")) == null || e.addEventListener("click", () => this._dismiss()), (t = this.shadowRoot.querySelector('[data-action="save"]')) == null || t.addEventListener("click", () => this._save()), (r = this.shadowRoot.querySelector('[data-action="never"]')) == null || r.addEventListener("click", () => this._never());
  }
  _render() {
    const e = this.getAttribute("name") || "", t = this.getAttribute("username") || "", r = this.getAttribute("password") || "", o = this.getAttribute("url") || "", d = this.getAttribute("title") || e || "", s = this.getAttribute("folder") || "";
    let p = [];
    try {
      const i = this.getAttribute("folders");
      i && (p = JSON.parse(i));
    } catch {
    }
    Array.isArray(p) || (p = []);
    const c = p.map((i) => {
      const u = typeof i == "string" ? i : i.value || i.name || "", b = typeof i == "string" ? i : i.label || i.name || u, h = u === s ? " selected" : "";
      return `<option value="${n(u)}"${h}>${n(b)}</option>`;
    }).join("");
    this.shadowRoot.innerHTML = `
      <style>${g}</style>
      <div class="prompt-header" role="region" aria-label="Save login">
        <span class="prompt-header__icon" aria-hidden="true">${a.key || ""}</span>
        <span class="prompt-header__title">Save this login?</span>
        <button type="button" class="prompt-header__close" aria-label="Close">
          <span aria-hidden="true">${a.close || ""}</span>
        </button>
      </div>
      <div class="prompt-body">
        ${e ? `<div class="prompt-field"><span class="prompt-field__label">Site</span><span class="prompt-field__value">${n(e)}</span></div>` : ""}
        ${t ? `<div class="prompt-field"><span class="prompt-field__label">User</span><span class="prompt-field__value">${n(t)}</span></div>` : ""}
        ${r ? `<div class="prompt-field"><span class="prompt-field__label">Pass</span><span class="prompt-field__value">${"•".repeat(Math.min(r.length, 12))}</span></div>` : ""}
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">Title</label>
          <input type="text" class="prompt-editable-input" data-field="title" value="${n(d)}" placeholder="Login title" />
        </div>
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">URL</label>
          <input type="text" class="prompt-editable-input" data-field="url" value="${n(o)}" placeholder="https://" />
        </div>
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">Folder</label>
          <select class="prompt-editable-select" data-field="folder" aria-label="Folder">
            ${c}
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
    this._autoDismissTimer && clearTimeout(this._autoDismissTimer), this._autoDismissTimer = setTimeout(() => this._dismiss(), 3e4);
  }
  _getFieldValue(e) {
    const t = this.shadowRoot.querySelector(e);
    return t ? t.value : "";
  }
  _save() {
    const e = this._getFieldValue('[data-field="title"]') || this.getAttribute("name") || "", t = this._getFieldValue('[data-field="url"]') || this.getAttribute("url") || "", r = this._getFieldValue('[data-field="folder"]') || "";
    this.dispatchEvent(new CustomEvent("kbb-save", {
      bubbles: !0,
      composed: !0,
      detail: {
        name: e,
        title: e,
        username: this.getAttribute("username"),
        password: this.getAttribute("password"),
        url: t,
        folder: r
      }
    })), this.remove();
  }
  _never() {
    this.dispatchEvent(new CustomEvent("kbb-never", {
      bubbles: !0,
      composed: !0,
      detail: { url: this.getAttribute("url") }
    })), this.remove();
  }
  _dismiss() {
    this.dispatchEvent(new CustomEvent("kbb-dismiss", { bubbles: !0, composed: !0 })), this.remove();
  }
}
class C extends HTMLElement {
  static get observedAttributes() {
    return ["name", "username", "password", "old-username", "title", "folder", "folders"];
  }
  constructor() {
    super(), this.attachShadow({ mode: "open" }), this._autoDismissTimer = null;
  }
  connectedCallback() {
    this._render(), this._startAutoDismiss(), this._bindEvents(), this._applyPosition();
  }
  disconnectedCallback() {
    this._autoDismissTimer && (clearTimeout(this._autoDismissTimer), this._autoDismissTimer = null);
  }
  attributeChangedCallback() {
    this.isConnected && this._render();
  }
  _applyPosition() {
    if (!this.isConnected) return;
    const e = this.getAttribute("data-position");
    if (!e || e === "bottom-right") return;
    const t = this.getAttribute("data-top"), r = this.getAttribute("data-right");
    t && (this.style.top = t), r && (this.style.right = r);
  }
  _bindEvents() {
    var e, t, r;
    (e = this.shadowRoot.querySelector(".prompt-header__close")) == null || e.addEventListener("click", () => this._dismiss()), (t = this.shadowRoot.querySelector('[data-action="update"]')) == null || t.addEventListener("click", () => this._update()), (r = this.shadowRoot.querySelector('[data-action="skip"]')) == null || r.addEventListener("click", () => this._skip());
  }
  _render() {
    const e = this.getAttribute("name") || "", t = this.getAttribute("old-username") || "", r = this.getAttribute("username") || "", o = this.getAttribute("password") || "", d = this.getAttribute("url") || "";
    let s = [];
    try {
      const p = this.getAttribute("folders");
      p && (s = JSON.parse(p));
    } catch {
    }
    Array.isArray(s) || (s = []), this.shadowRoot.innerHTML = `
      <style>${g}</style>
      <div class="prompt-header" role="region" aria-label="Update login">
        <span class="prompt-header__icon" aria-hidden="true">${a.shield || ""}</span>
        <span class="prompt-header__title">Update existing login?</span>
        <button type="button" class="prompt-header__close" aria-label="Close">
          <span aria-hidden="true">${a.close || ""}</span>
        </button>
      </div>
      <div class="prompt-body">
        ${e ? `<div class="prompt-field"><span class="prompt-field__label">Site</span><span class="prompt-field__value">${n(e)}</span></div>` : ""}
        <div class="prompt-field">
          <span class="prompt-field__label">From</span>
          <span class="prompt-field__value">${n(t)}</span>
        </div>
        <div class="prompt-field">
          <span class="prompt-field__label">To</span>
          <span class="prompt-field__value">${n(r)}</span>
        </div>
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">New Password</label>
          <input type="text" class="prompt-editable-input" data-field="username" value="${n(r)}" placeholder="Username" />
        </div>
        ${o ? `<div class="prompt-field"><span class="prompt-field__label">Pass</span><span class="prompt-field__value">${"•".repeat(Math.min(o.length, 12))}</span></div>` : ""}
        <div class="prompt-editable-group">
          <label class="prompt-editable-label">URL</label>
          <input type="text" class="prompt-editable-input" data-field="url" value="${n(d)}" placeholder="https://" />
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
    this._autoDismissTimer && clearTimeout(this._autoDismissTimer), this._autoDismissTimer = setTimeout(() => this._dismiss(), 3e4);
  }
  _getFieldValue(e) {
    const t = this.shadowRoot.querySelector(e);
    return t ? t.value : "";
  }
  _update() {
    const e = this._getFieldValue('[data-field="username"]') || this.getAttribute("username") || "", t = this._getFieldValue('[data-field="url"]') || this.getAttribute("url") || "";
    this.dispatchEvent(new CustomEvent("kbb-update", {
      bubbles: !0,
      composed: !0,
      detail: {
        name: this.getAttribute("name"),
        username: e,
        password: this.getAttribute("password"),
        url: t
      }
    })), this.remove();
  }
  _skip() {
    this.dispatchEvent(new CustomEvent("kbb-skip", { bubbles: !0, composed: !0 })), this.remove();
  }
  _dismiss() {
    this.dispatchEvent(new CustomEvent("kbb-dismiss", { bubbles: !0, composed: !0 })), this.remove();
  }
}
customElements.get("kbb-save-prompt") || customElements.define("kbb-save-prompt", E);
customElements.get("kbb-update-prompt") || customElements.define("kbb-update-prompt", C);
k("kbb");
