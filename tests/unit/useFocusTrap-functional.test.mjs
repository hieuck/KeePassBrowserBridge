import { describe, it, assert, beforeEach, afterEach } from 'vitest';
import { createApp, defineComponent, h } from 'vue';
import { useFocusTrap } from '../../extension/src/composables/useFocusTrap.js';

function mountTrap() {
  const state = {};
  const Comp = defineComponent({
    setup() {
      Object.assign(state, useFocusTrap());
      return () => h('div', { ref: state.container }, [
        h('button', { id: 'first' }, 'First'),
        h('button', { id: 'second' }, 'Second'),
        h('button', { id: 'third' }, 'Third')
      ]);
    }
  });
  const app = createApp(Comp);
  const root = document.createElement('div');
  document.body.appendChild(root);
  app.mount(root);
  return { state, app, root, unmount: () => { app.unmount(); document.body.removeChild(root); } };
}

describe('useFocusTrap', () => {
  it('should return a container ref', () => {
    const { container } = useFocusTrap();
    assert.ok(container !== undefined);
  });

  describe('focus trapping behavior', () => {
    let trap;

    beforeEach(() => {
      trap = mountTrap();
    });

    afterEach(() => {
      trap.unmount();
    });

    it('should focus first element when Tab is pressed on last element', async () => {
      const buttons = trap.root.querySelectorAll('button');
      const last = buttons[buttons.length - 1];
      last.focus();
      assert.equal(document.activeElement, last);
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      document.dispatchEvent(event);
      assert.equal(document.activeElement, buttons[0]);
    });

    it('should focus last element when Shift+Tab is pressed on first element', async () => {
      const buttons = trap.root.querySelectorAll('button');
      const first = buttons[0];
      first.focus();
      assert.equal(document.activeElement, first);
      const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true });
      document.dispatchEvent(event);
      assert.equal(document.activeElement, buttons[buttons.length - 1]);
    });

    it('should not trap Tab when there is only one focusable element', async () => {
      const state = {};
      const Comp = defineComponent({
        setup() {
          Object.assign(state, useFocusTrap());
          return () => h('div', { ref: state.container }, [
            h('button', { id: 'single' }, 'Only')
          ]);
        }
      });
      const app = createApp(Comp);
      const root = document.createElement('div');
      document.body.appendChild(root);
      app.mount(root);
      const button = root.querySelector('button');
      button.focus();
      const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
      event.preventDefault();
      document.dispatchEvent(event);
      assert.equal(document.activeElement, button);
      app.unmount();
      document.body.removeChild(root);
    });
  });
});
