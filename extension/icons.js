// KeePassBrowserBridge v2.0 icon library
// All icons are 16x16 inline SVG, stroke/fill currentColor, aria-hidden
// Compatible with Vue (template v-html) and Web Components (customElements)

const SIZE = 16;

// SVG path data for each icon. Paths are designed for 16x16 viewBox.
const PATHS = {
  'key': 'M10.5 0a4.5 4.5 0 1 1-3.18 7.68L2 13l-1.5 1.5L2 16l1.5-1.5L5 13l5.32-5.32A4.5 4.5 0 0 1 10.5 0zm-2 4a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  'lock': 'M3 7V5a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm2 0h6V5a3 3 0 0 0-6 0v2z',
  'lock-open': 'M3 7V5a5 5 0 0 1 9.9-1H11a3 3 0 0 0-5 1v2h7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm0 2v6h10V9H3z',
  'unlock': 'M3 7V5a5 5 0 0 1 9.9-1H11a3 3 0 0 0-5 1v2h7a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1z',
  'copy': 'M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25zM5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25z',
  'check': 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z',
  'edit': 'M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.236L2.677 14.17l-.93.93.93-.93 8.51-8.51-1.998-1.997Z',
  'pencil': 'M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.236L2.677 14.17l-.93.93.93-.93 8.51-8.51-1.998-1.997Z',
  'plus': 'M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z',
  'trash': 'M11 1.75V3h5.25a.75.75 0 0 1 0 1.5H14.5v1.75a.75.75 0 0 1-1.5 0V4.5h-5v1.75a.75.75 0 0 1-1.5 0V4.5h-2v11a.25.25 0 0 0 .25.25h9.5a.25.25 0 0 0 .25-.25v-11h-2v1.75a.75.75 0 0 1-1.5 0V4.5h-5v-.75a.75.75 0 0 1 0-1.5h5v-.75a.75.75 0 0 1 1.5 0v.75h.5Z',
  'search': 'M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.75.75 0 0 1-1.061 1.06l-3.04-3.04zM11.5 7a4.5 4.5 0 1 0-9 0 4.5 4.5 0 0 0 9 0z',
  'filter': 'M.75 3h14.5a.75.75 0 0 1 0 1.5H.75a.75.75 0 0 1 0-1.5zM3 7.75h10a.75.75 0 0 1 0 1.5H3a.75.75 0 0 1 0-1.5zM5.5 12.5h5a.75.75 0 0 1 0 1.5h-5a.75.75 0 0 1 0-1.5z',
  'close': 'M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 0 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 0 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z',
  'chevron-down': 'M12.78 6.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L8 8.94l3.72-3.72a.75.75 0 0 1 1.06 0Z',
  'eye': 'M1.679 7.932c.412-.621 1.242-1.75 2.366-2.717C5.175 4.242 6.527 3.5 8 3.5c1.473 0 2.824.742 3.955 1.715 1.124.967 1.954 2.096 2.366 2.717a.75.75 0 0 1 0 .766c-.412.621-1.242 1.75-2.366 2.717C10.825 11.758 9.473 12.5 8 12.5c-1.473 0-2.824-.742-3.955-1.715C2.92 9.818 2.09 8.69 1.679 8.068a.75.75 0 0 1 0-.766zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'eye-off': 'M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 0 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 0 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06zM8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  'shield': 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-.918-.57l-.55-3.18a.75.75 0 0 1 .165-.673L1.5 6.124a.75.75 0 0 1 .418-1.28l4.21-.611L7.99.668A.75.75 0 0 1 8 .25Z',
  'shield-check': 'M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-.918-.57l-.55-3.18a.75.75 0 0 1 .165-.673L1.5 6.124a.75.75 0 0 1 .418-1.28l4.21-.611L7.99.668A.75.75 0 0 1 8 .25Zm2.486 6.97a.75.75 0 0 0-1.06-1.06L6.5 9.44 5.03 7.97a.75.75 0 0 0-1.06 1.06l2 2a.75.75 0 0 0 1.06 0z',
  'globe': 'M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM2.5 8a5.5 5.5 0 0 1 9.591-3.886.531.531 0 0 0 .072.745.536.536 0 0 0-.116.084c-.17.166-.36.348-.484.538a.53.53 0 0 0-.066.36.532.532 0 0 1-.494.628.532.532 0 0 0-.36.066c-.19.124-.372.314-.538.484a.536.536 0 0 0-.084.116.531.531 0 0 0-.745.072A5.5 5.5 0 0 1 2.5 8Zm5.5 5.5a5.5 5.5 0 0 0 5.5-5.5.532.532 0 0 0-.36-.066.532.532 0 0 1-.628-.494.532.532 0 0 0-.066-.36c-.124-.19-.314-.372-.484-.538a.536.536 0 0 0-.116-.084.531.531 0 0 0-.745-.072A5.5 5.5 0 0 0 8 13.5Z',
  'user': 'M10.561 8.073a6.005 6.005 0 0 1 3.432 5.142.75.75 0 1 1-1.498.07 4.5 4.5 0 0 0-8.99 0 .75.75 0 0 1-1.498-.07 6.004 6.004 0 0 1 3.431-5.142 3.999 3.999 0 1 0 5.123 0zM10.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  'user-plus': 'M5.5 4a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 6.5a2.5 2.5 0 1 1 5 0 2.5 2.5 0 0 1-5 0zM7.5 9a4.5 4.5 0 0 0-3.83 2.146.75.75 0 1 0 1.276.79A3 3 0 0 1 7.5 11h.75a.75.75 0 0 0 0-1.5H7.5zM10 4.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75zM13 8.75a.75.75 0 0 0-1.5 0v2.5a.75.75 0 0 0 1.5 0v-2.5z',
  'sun': 'M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM8 0a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0V.75A.75.75 0 0 1 8 0zm0 13a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 13zM2.343 2.343a.75.75 0 0 1 1.061 0l1.06 1.061a.75.75 0 0 1-1.06 1.06l-1.06-1.06a.75.75 0 0 1 0-1.06zm9.193 9.193a.75.75 0 0 1 1.06 0l1.061 1.06a.75.75 0 0 1-1.06 1.061l-1.061-1.06a.75.75 0 0 1 0-1.061zM16 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 16 8zM1.5 8.75a.75.75 0 0 1 0-1.5h1.5a.75.75 0 0 1 0 1.5h-1.5zm12.728-5.03a.75.75 0 0 1 0 1.06l-1.061 1.061a.75.75 0 1 1-1.06-1.06l1.06-1.061a.75.75 0 0 1 1.06 0zm-9.193 9.193a.75.75 0 0 1 0 1.06l-1.061 1.061a.75.75 0 1 1-1.06-1.061l1.06-1.061a.75.75 0 0 1 1.06 0z',
  'moon': 'M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm0 14.5a6.5 6.5 0 0 1 0-13 6.5 6.5 0 0 1 0 13z',
  'monitor': 'M2 3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2zm1 2h10v7H3V5zm4 10a1 1 0 0 0 1-1h2a1 1 0 0 0 1 1H7z',
};

function makeIcon(name, pathData) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 ${SIZE}" width="${SIZE}" height="${SIZE}" fill="currentColor" aria-hidden="true" focusable="false"><path d="${pathData}"/></svg>`;
}

export const ICONS = Object.fromEntries(
  Object.entries(PATHS).map(([name, pathData]) => [name, makeIcon(name, pathData)])
);

// Named exports for direct import
export const key = ICONS.key;
export const lock = ICONS.lock;
export const lockOpen = ICONS['lock-open'];
export const unlock = ICONS.unlock;
export const copy = ICONS.copy;
export const check = ICONS.check;
export const edit = ICONS.edit;
export const pencil = ICONS.pencil;
export const plus = ICONS.plus;
export const trash = ICONS.trash;
export const search = ICONS.search;
export const filter = ICONS.filter;
export const close = ICONS.close;
export const chevronDown = ICONS['chevron-down'];
export const eye = ICONS.eye;
export const eyeOff = ICONS['eye-off'];
export const shield = ICONS.shield;
export const shieldCheck = ICONS['shield-check'];
export const globe = ICONS.globe;
export const user = ICONS.user;
export const userPlus = ICONS['user-plus'];
export const sun = ICONS.sun;
export const moon = ICONS.moon;
export const monitor = ICONS.monitor;

/**
 * Register all icons as Web Components.
 * @param {string} customElementPrefix - Tag prefix (default: 'kbb')
 * @example
 *   registerIcons('kbb') // creates <kbb-icon-key>, <kbb-icon-lock>, etc.
 */
export function registerIcons(customElementPrefix = 'kbb') {
  if (typeof customElements === 'undefined') return;
  for (const [name, svg] of Object.entries(ICONS)) {
    const tagName = `${customElementPrefix}-icon-${name}`;
    if (customElements.get(tagName)) continue;
    class IconElement extends HTMLElement {
      connectedCallback() {
        const size = this.getAttribute('size') || SIZE;
        this.innerHTML = svg
          .replace(`width="${SIZE}"`, `width="${size}"`)
          .replace(`height="${SIZE}"`, `height="${size}"`);
      }
    }
    customElements.define(tagName, IconElement);
  }
}
