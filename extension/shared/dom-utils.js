import { isVisible } from './field-classifier.js';

export function visibleInputs(selector, root) {
  const scope = root && root.querySelectorAll ? root : document;
  return querySelectorAllDeep(scope, selector).filter(isVisible);
}

export function querySelectorAllDeep(root, selector) {
  const results = [];
  const visited = new Set();

  const visit = (scope) => {
    if (!scope || visited.has(scope) || !scope.querySelectorAll) return;
    visited.add(scope);
    for (const element of scope.querySelectorAll(selector)) {
      results.push(element);
    }
    for (const element of scope.querySelectorAll("*")) {
      if (element.shadowRoot) {
        visit(element.shadowRoot);
      }
    }
  };

  visit(root);
  return results;
}
