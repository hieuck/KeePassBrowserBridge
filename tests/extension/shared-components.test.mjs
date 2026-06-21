import { describe, it, assert } from 'vitest';
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
});
