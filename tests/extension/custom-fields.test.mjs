import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

class MockInput {
  constructor(attrs = {}) {
    this.attrs = { ...attrs };
    this.value = '';
    this.disabled = false;
    this.readOnly = false;
    this.events = [];
  }

  getAttribute(name) {
    return this.attrs[name] || '';
  }

  dispatchEvent(event) {
    this.events.push(event.type);
  }
}

const tenantInput = new MockInput({
  id: 'tenant-field',
  name: 'tenant-field',
  placeholder: 'Tenant "] Code'
});
const inputs = [tenantInput];

const sandbox = {
  console,
  Event: class {
    constructor(type) {
      this.type = type;
    }
  },
  KeyboardEvent: class {
    constructor(type) {
      this.type = type;
    }
  },
  window: {
    getComputedStyle: () => ({ display: 'block', visibility: 'visible', opacity: '1' })
  },
  document: {
    querySelector(selector) {
      if (selector.includes('"]')) {
        throw new Error('invalid selector');
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'input') return inputs;
      if (selector === 'label') return [];
      return [];
    },
    getElementById() {
      return null;
    }
  }
};
sandbox.globalThis = sandbox;

const source = fs.readFileSync(new URL('../../extension/customFields.js', import.meta.url), 'utf8');
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'customFields.js' });

const result = sandbox.window.__kbbCustomFields.fillCustomFields([
  { Name: 'Tenant "] Code', Value: 'production', IsProtected: false }
]);

assert.equal(result.filled, 1, 'custom field names with selector metacharacters should still fill matching inputs');
assert.equal(tenantInput.value, 'production', 'custom field value should be set without selector construction');
assert.ok(tenantInput.events.includes('input'), 'custom field fill should dispatch input event');

console.log('Custom fields tests passed.');
