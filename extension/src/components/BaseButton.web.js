import { registerIcons } from '../../icons.js';

class KbbButton extends HTMLElement {
  static get observedAttributes() {
    return ['variant', 'size', 'type', 'disabled', 'loading', 'block', 'leading-icon', 'trailing-icon'];
  }

  connectedCallback() {
    this.render();
    this.addEventListener('click', this.onClick);
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.onClick);
  }

  attributeChangedCallback() {
    this.render();
  }

  onClick(event) {
    if (this.hasAttribute('disabled') || this.hasAttribute('loading')) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.dispatchEvent(new CustomEvent('kbb-click', { bubbles: true, detail: { original: event } }));
  }

  render() {
    const variant = this.getAttribute('variant') || 'secondary';
    const size = this.getAttribute('size') || 'md';
    const type = this.getAttribute('type') || 'button';
    const block = this.hasAttribute('block');
    const loading = this.hasAttribute('loading');
    const disabled = this.hasAttribute('disabled') || loading;
    const label = this.textContent.trim();

    this.innerHTML = `<button type="${type}" class="kbb-btn kbb-btn--${variant} kbb-btn--${size}${block ? ' kbb-btn--block' : ''}${loading ? ' kbb-btn--loading' : ''}" ${disabled ? 'disabled' : ''} aria-busy="${loading}" aria-disabled="${disabled}"><span class="kbb-btn__label">${escapeHtml(label)}</span></button>`;
  }
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

if (typeof customElements !== 'undefined' && !customElements.get('kbb-button')) {
  customElements.define('kbb-button', KbbButton);
}
