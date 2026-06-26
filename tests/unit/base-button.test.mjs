import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'base-button.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'components', 'BaseButton.web.js'), 'utf8');

describe('BaseButton.web.js - KbbButton class', () => {
  it('should extend HTMLElement', () => {
    assert.ok(source.includes('extends HTMLElement'), 'Missing HTMLElement extension');
  });

  it('should define custom element as kbb-button', () => {
    assert.ok(source.includes("customElements.define('kbb-button'"),
      'Missing custom element registration');
  });

  it('should guard against duplicate registration', () => {
    assert.ok(source.includes('!customElements.get('), 'Missing duplicate registration guard');
  });
});

describe('BaseButton.web.js - observed attributes', () => {
  it('should observe variant', () => {
    assert.ok(source.includes("'variant'"), 'Missing variant observed attribute');
  });

  it('should observe size', () => {
    assert.ok(source.includes("'size'"), 'Missing size observed attribute');
  });

  it('should observe disabled', () => {
    assert.ok(source.includes("'disabled'"), 'Missing disabled observed attribute');
  });

  it('should observe loading', () => {
    assert.ok(source.includes("'loading'"), 'Missing loading observed attribute');
  });

  it('should observe block', () => {
    assert.ok(source.includes("'block'"), 'Missing block observed attribute');
  });
});

describe('BaseButton.web.js - event handling', () => {
  it('should dispatch kbb-click event on click', () => {
    assert.ok(source.includes("kbb-click'") || source.includes('kbb-click'),
      'Missing kbb-click event dispatch');
    assert.ok(source.includes('CustomEvent'), 'Missing CustomEvent constructor');
  });

  it('should prevent click when disabled', () => {
    assert.ok(source.includes('hasAttribute(\'disabled\')') || source.includes('hasAttribute("disabled")'),
      'Missing disabled attribute check on click');
    assert.ok(source.includes('event.preventDefault()'), 'Missing preventDefault on disabled click');
  });

  it('should prevent click when loading', () => {
    assert.ok(source.includes('hasAttribute(\'loading\')') || source.includes('hasAttribute("loading")'),
      'Missing loading attribute check on click');
  });
});

describe('BaseButton.web.js - render', () => {
  it('should set innerHTML with button markup', () => {
    assert.ok(source.includes('this.innerHTML'), 'Missing innerHTML set in render');
  });

  it('should include kbb-btn CSS classes', () => {
    assert.ok(source.includes('kbb-btn'), 'Missing kbb-btn CSS class');
    assert.ok(source.includes('kbb-btn--'), 'Missing kbb-btn-- variant/size class');
  });

  it('should set aria-busy on loading', () => {
    assert.ok(source.includes('aria-busy'), 'Missing aria-busy attribute');
  });

  it('should set aria-disabled on disabled', () => {
    assert.ok(source.includes('aria-disabled'), 'Missing aria-disabled attribute');
  });

  it('should escape label HTML (via shared escapeHtml import)', () => {
    assert.ok(source.includes('escapeHtml'), 'Missing escapeHtml call on label');
  });

  it('should import escapeHtml from shared module', () => {
    assert.ok(source.includes("from '../../shared/escape-html.js'"), 'Missing escape-html import');
  });
});

describe('BaseButton.web.js - lifecycle', () => {
  it('should call render on connectedCallback', () => {
    assert.ok(source.includes('connectedCallback'), 'Missing connectedCallback');
    assert.ok(source.includes('this.render()'), 'Missing render call in connectedCallback');
  });

  it('should call render on attributeChangedCallback', () => {
    assert.ok(source.includes('attributeChangedCallback'), 'Missing attributeChangedCallback');
  });

  it('should add/remove click listener on connect/disconnect', () => {
    assert.ok(source.includes('addEventListener'), 'Missing addEventListener in connectedCallback');
    assert.ok(source.includes('removeEventListener'), 'Missing removeEventListener in disconnectedCallback');
  });
});
