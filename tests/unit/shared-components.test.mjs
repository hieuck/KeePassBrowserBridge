import { describe, it, assert, vi } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const modPath = path.join(dir, '../../extension/shared-components.js');

async function loadSC() {
  return (await import(modPath)).default;
}

describe('SharedComponents', () => {
  it('createAvatar returns element with avatar class and initial', async () => {
    const SC = await loadSC();
    const avatar = SC.createAvatar('E', '#4a90e2');
    assert.equal(avatar.className, 'avatar');
    assert.equal(avatar.textContent, 'E');
  });

  it('createBadge returns element with badge class and text', async () => {
    const SC = await loadSC();
    const badge = SC.createBadge('Paired', 'success');
    assert.ok(badge.className.includes('badge'));
    assert.equal(badge.textContent, 'Paired');
  });

  it('createToggle returns label with checkbox', async () => {
    const SC = await loadSC();
    const toggle = SC.createToggle(true, () => {});
    const input = toggle.querySelector('input[type="checkbox"]');
    assert.ok(input, 'toggle should contain a checkbox input');
    assert.equal(input.checked, true);
  });

  it('createToast returns element with message', async () => {
    const SC = await loadSC();
    const toast = SC.createToast('Saved!', 'success');
    assert.equal(toast.textContent, 'Saved!');
    assert.ok(toast.className.includes('toast'));
  });

  it('createModal creates overlay dialog', async () => {
    const SC = await loadSC();
    const modal = SC.createModal('Edit Entry', '<p>form</p>');
    assert.ok(modal.className.includes('modal-overlay'), 'modal should have overlay class');
    assert.ok(modal.querySelector('.modal-content'), 'modal should contain content div');
  });

  it('createActionButton returns button with btn class', async () => {
    const SC = await loadSC();
    const btn = SC.createActionButton('Save', 'primary');
    assert.equal(btn.className, 'btn btn-primary');
    assert.equal(btn.textContent, 'Save');
  });

  it('getAvatarColor returns consistent color for same input', async () => {
    const SC = await loadSC();
    const color1 = SC.getAvatarColor('Example');
    const color2 = SC.getAvatarColor('Example');
    assert.equal(color1, color2);
  });

  it('createAvatar without color uses getAvatarColor', async () => {
    const SC = await loadSC();
    const avatar = SC.createAvatar('X');
    assert.equal(avatar.className, 'avatar');
    assert.ok(avatar.style.backgroundColor);
    assert.equal(avatar.textContent, 'X');
  });

  it('createAvatar with empty initial falls back to ?', async () => {
    const SC = await loadSC();
    const avatar = SC.createAvatar('', '#4a90e2');
    assert.equal(avatar.textContent, '?');
  });

  it('createBadge without variant uses base badge class', async () => {
    const SC = await loadSC();
    const badge = SC.createBadge('Test');
    assert.equal(badge.className, 'badge');
    assert.equal(badge.textContent, 'Test');
  });

  it('createToast without variant uses base toast class', async () => {
    const SC = await loadSC();
    const toast = SC.createToast('Hello');
    assert.ok(toast.className.includes('toast'));
    assert.equal(toast.textContent, 'Hello');
  });

  it('createActionButton without variant uses base btn class', async () => {
    const SC = await loadSC();
    const btn = SC.createActionButton('Go');
    assert.equal(btn.className, 'btn');
    assert.equal(btn.textContent, 'Go');
  });

  it('getAvatarColor returns a color for empty title', async () => {
    const SC = await loadSC();
    const color = SC.getAvatarColor('');
    assert.ok(typeof color === 'string');
    assert.ok(color.startsWith('#'));
  });

  it('createToggle calls onChange when checkbox changes', async () => {
    const SC = await loadSC();
    const onChange = vi.fn();
    const toggle = SC.createToggle(false, onChange);
    const input = toggle.querySelector('input[type="checkbox"]');
    input.checked = true;
    input.dispatchEvent(new Event('change'));
    assert.equal(onChange.mock.calls.length, 1);
  });

  it('createToggle without onChange does not throw on change', async () => {
    const SC = await loadSC();
    const toggle = SC.createToggle(false);
    const input = toggle.querySelector('input[type="checkbox"]');
    input.dispatchEvent(new Event('change'));
    assert.ok(toggle);
  });

  it('createToast removes element after timeout', async () => {
    vi.useFakeTimers();
    try {
      const SC = await loadSC();
      const toast = SC.createToast('Saved!');
      const removeSpy = vi.spyOn(toast, 'remove');
      vi.advanceTimersByTime(3000);
      assert.equal(removeSpy.mock.calls.length, 1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('createModal closes when overlay is clicked', async () => {
    const SC = await loadSC();
    const modal = SC.createModal('Edit Entry', '<p>form</p>');
    document.body.appendChild(modal);
    assert.equal(modal.parentNode, document.body);
    const event = new Event('click', { bubbles: true });
    modal.dispatchEvent(event);
    assert.equal(modal.parentNode, null);
  });

  it('createModal closes when close button is clicked', async () => {
    const SC = await loadSC();
    const modal = SC.createModal('Edit Entry', '<p>form</p>');
    document.body.appendChild(modal);
    assert.equal(modal.parentNode, document.body);
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.dispatchEvent(new Event('click'));
    assert.equal(modal.parentNode, null);
  });

  it('createModal does not close when clicking inside content', async () => {
    const SC = await loadSC();
    const modal = SC.createModal('Edit Entry', '<p>form</p>');
    document.body.appendChild(modal);
    const content = modal.querySelector('.modal-content');
    const event = new Event('click', { bubbles: true });
    content.dispatchEvent(event);
    assert.equal(modal.parentNode, document.body);
    document.body.removeChild(modal);
  });
});
