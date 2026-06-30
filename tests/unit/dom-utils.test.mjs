import { describe, it, expect } from 'vitest';

describe('dom-utils — querySelectorAllDeep', () => {
  it('should find elements in regular DOM', async () => {
    document.body.innerHTML = '<div><span class="target">A</span><span class="target">B</span></div>';
    const { querySelectorAllDeep } = await import('../../extension/shared/dom-utils.js');
    const results = querySelectorAllDeep(document, '.target');
    expect(results.length).toBe(2);
    expect(results[0].textContent).toBe('A');
  });

  it('should recurse into shadow roots', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host');
    const shadow = host.attachShadow({ mode: 'open' });
    shadow.innerHTML = '<span class="target">Shadow</span>';
    const { querySelectorAllDeep } = await import('../../extension/shared/dom-utils.js');
    const results = querySelectorAllDeep(document, '.target');
    expect(results.length).toBe(1);
    expect(results[0].textContent).toBe('Shadow');
  });

  it('should return empty array for no matches', async () => {
    document.body.innerHTML = '<div><span>No match</span></div>';
    const { querySelectorAllDeep } = await import('../../extension/shared/dom-utils.js');
    const results = querySelectorAllDeep(document, '.nonexistent');
    expect(results.length).toBe(0);
  });

  it('should handle null root gracefully', async () => {
    const { querySelectorAllDeep } = await import('../../extension/shared/dom-utils.js');
    const results = querySelectorAllDeep(null, '.target');
    expect(results).toEqual([]);
  });

  it('should not visit the same scope twice', async () => {
    document.body.innerHTML = '<div id="h1"><span class="t">A</span></div><div id="h2"><span class="t">B</span></div>';
    const { querySelectorAllDeep } = await import('../../extension/shared/dom-utils.js');
    const results = querySelectorAllDeep(document, '.t');
    expect(results.length).toBe(2);
  });
});

describe('dom-utils — visibleInputs', () => {
  it('should filter hidden type elements', async () => {
    document.body.innerHTML = '<input class="f" type="text" /><input class="f" type="hidden" />';
    document.querySelectorAll('input').forEach(el => {
      el.getBoundingClientRect = () => ({ width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20, x: 0, y: 0, toJSON: () => {} });
    });
    const { visibleInputs } = await import('../../extension/shared/dom-utils.js');
    const results = visibleInputs('.f', document);
    const types = results.map(el => el.type);
    expect(types).toEqual(['text']);
    expect(types).not.toContain('hidden');
  });

  it('should use document as default scope when root is null', async () => {
    document.body.innerHTML = '<input class="f" type="text" />';
    const input = document.querySelector('.f');
    input.getBoundingClientRect = () => ({ width: 100, height: 20, top: 0, left: 0, right: 100, bottom: 20, x: 0, y: 0, toJSON: () => {} });
    const { visibleInputs } = await import('../../extension/shared/dom-utils.js');
    const results = visibleInputs('.f', null);
    expect(results.length).toBe(1);
  });
});
