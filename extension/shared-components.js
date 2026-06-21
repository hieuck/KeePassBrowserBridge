'use strict';

const SharedComponents = (() => {
  const AVATAR_COLORS = ['#4a90e2', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#34495e', '#e91e63', '#00bcd4'];

  function getAvatarColor(title) {
    return AVATAR_COLORS[(title || '').length % AVATAR_COLORS.length];
  }

  function createAvatar(initial, color) {
    const el = document.createElement('div');
    el.className = 'avatar';
    el.style.backgroundColor = color || getAvatarColor(initial);
    el.textContent = (initial || '?')[0].toUpperCase();
    return el;
  }

  function createBadge(text, variant) {
    const el = document.createElement('span');
    el.className = 'badge' + (variant ? ' badge-' + variant : '');
    el.textContent = text;
    return el;
  }

  function createToggle(checked, onChange) {
    const label = document.createElement('label');
    label.className = 'toggle-switch';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked === true;
    if (onChange) input.addEventListener('change', onChange);
    const slider = document.createElement('span');
    slider.className = 'toggle-slider';
    label.append(input, slider);
    return label;
  }

  function createToast(message, variant) {
    const el = document.createElement('div');
    el.className = 'toast' + (variant ? ' toast-' + variant : '');
    el.role = 'alert';
    el.textContent = message;
    setTimeout(() => { el.remove(); }, 3000);
    return el;
  }

  function createModal(title, bodyHtml) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const content = document.createElement('div');
    content.className = 'modal-content';
    const escTitle = escapeHtml(title);
    content.innerHTML = '<div class="modal-header"><h3>' + escTitle + '</h3><button class="modal-close" type="button">&times;</button></div><div class="modal-body">' + bodyHtml + '</div>';
    overlay.append(content);
    content.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    return overlay;
  }

  function createActionButton(text, variant) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn' + (variant ? ' btn-' + variant : '');
    btn.textContent = text;
    return btn;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  return { createAvatar, createBadge, createToggle, createToast, createModal, createActionButton, getAvatarColor, AVATAR_COLORS };
})();

if (typeof module !== 'undefined') module.exports = SharedComponents;
