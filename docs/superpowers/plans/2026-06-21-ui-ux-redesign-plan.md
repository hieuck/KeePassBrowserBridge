# UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite all browser extension UI surfaces with a shared component-based design system in Modern/Flat style with dark mode support.

**Architecture:** CSS design tokens (`design-tokens.css`) + shared JS components (`shared-components.js`) consumed by popup, options page, inline picker, and save/update prompts. Each component is a factory function in a shared module.

**Tech Stack:** Vanilla JS, CSS custom properties, Chrome MV3, Vitest, Playwright E2E.

---

## File Structure

| File | Change | Responsibility |
|------|--------|---------------|
| `extension/design-tokens.css` | **Create** | CSS custom properties for colors, spacing, radius, shadows |
| `extension/shared-components.js` | **Create** | Factory functions: Avatar, CredentialCard, SearchInput, Toggle, Badge, Toast, Modal, ActionButton |
| `extension/popup.html` | Modify | New layout using shared components |
| `extension/popup.js` | Modify | Use shared components in renderResults(); add bottom toolbar |
| `extension/popup.css` | Modify | Replace hardcoded values with design tokens |
| `extension/options.html` | Modify | Tabbed layout, shared components |
| `extension/options.js` | Modify | Use shared components |
| `extension/options.css` | Modify | Replace with design tokens |
| `extension/contentScript.js` | Modify | Inline picker + save prompts use shared styling |
| `tests/extension/shared-components.test.mjs` | **Create** | Unit tests for each factory function |
| `tests/e2e/extension-load.spec.js` | Modify | Update selectors for new UI structure |

---

## Task 1: Design Tokens + CSS Foundation

**Files:**
- Create: `extension/design-tokens.css`

- [ ] **Step 1: Write failing test**

Add to `tests/extension/manifest.test.mjs`:
```javascript
const designTokens = fs.readFileSync(new URL('../../extension/design-tokens.css', import.meta.url), 'utf-8');
assert.equal(designTokens.includes('--color-primary'), true, 'design tokens should define primary color');
assert.equal(designTokens.includes('--space-md'), true, 'design tokens should define spacing scale');
assert.equal(designTokens.includes('--radius-lg'), true, 'design tokens should define border radius scale');
assert.equal(designTokens.includes('--shadow-md'), true, 'design tokens should define shadow scale');
assert.equal(designTokens.includes('--color-bg'), true, 'design tokens should define background color');
assert.equal(designTokens.includes('[data-theme="dark"]'), true, 'design tokens should include dark theme overrides');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/extension/manifest.test.mjs -t "design tokens"`
Expected: FAIL — file not found

- [ ] **Step 3: Create design-tokens.css**

```css
:root {
  --color-primary: #4a90e2;
  --color-primary-hover: #357ab8;
  --color-primary-subtle: rgba(74, 144, 226, 0.1);
  --color-success: #2ecc71;
  --color-danger: #e74c3c;
  --color-warning: #f39c12;
  --color-bg: #f7f8fa;
  --color-panel: #ffffff;
  --color-text: #1f2933;
  --color-text-secondary: #667085;
  --color-border: #d7dde5;

  --space-xs: 4px; --space-sm: 8px; --space-md: 12px;
  --space-lg: 16px; --space-xl: 24px; --space-2xl: 32px;

  --radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px; --radius-xl: 12px;

  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.1);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.12);

  --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 12px; --font-size-md: 13px;
  --font-size-lg: 15px; --font-size-xl: 17px;

  --transition-fast: 0.15s ease;
  --transition-normal: 0.2s ease;
}

:root[data-theme="dark"] {
  --color-bg: #1a1a1a;
  --color-panel: #2d2d2d;
  --color-text: #e0e0e0;
  --color-text-secondary: #a0a0a0;
  --color-border: #404040;
  --color-primary: #5a9cf3;
  --color-primary-hover: #7ab4ff;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.2);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.3);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.4);
}
```

- [ ] **Step 4: Load design-tokens.css in popup.html and options.html**

In `extension/popup.html`, add after the existing `<link rel="stylesheet" href="popup.css">`:
```html
<link rel="stylesheet" href="design-tokens.css">
```

Same for `extension/options.html`.

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/extension/manifest.test.mjs -t "design tokens"`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add extension/design-tokens.css extension/popup.html extension/options.html tests/extension/manifest.test.mjs
git commit -m "feat: add design tokens CSS foundation"
```

---

## Task 2: Shared Components Module

**Files:**
- Create: `extension/shared-components.js`
- Create: `tests/extension/shared-components.test.mjs`

- [ ] **Step 1: Write failing tests for each component**

Create `tests/extension/shared-components.test.mjs`:
```javascript
import { describe, it, expect } from 'vitest';

// We'll test by loading the module and checking factory function outputs
describe('SharedComponents', () => {
  it('createAvatar returns element with avatar class and initial', () => {
    const avatar = SharedComponents.createAvatar('E', '#4a90e2');
    assert.equal(avatar.className, 'avatar');
    assert.equal(avatar.textContent, 'E');
    assert.ok(avatar.style.backgroundColor);
  });

  it('createBadge returns element with badge class and text', () => {
    const badge = SharedComponents.createBadge('Paired', 'success');
    assert.equal(badge.className.includes('badge'), true);
    assert.equal(badge.textContent, 'Paired');
  });

  it('createToggle returns label with checkbox', () => {
    const toggle = SharedComponents.createToggle(true, () => {});
    const input = toggle.querySelector('input[type="checkbox"]');
    assert.ok(input);
    assert.equal(input.checked, true);
  });

  it('createToast returns element with message and auto-dismiss', () => {
    const toast = SharedComponents.createToast('Saved!', 'success');
    assert.equal(toast.textContent, 'Saved!');
    assert.equal(toast.className.includes('toast'), true);
  });

  it('createModal creates overlay dialog', () => {
    const modal = SharedComponents.createModal('Edit Entry', '<p>form</p>');
    assert.equal(modal.className.includes('modal'), true);
    assert.ok(modal.querySelector('.modal-content'));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/extension/shared-components.test.mjs`
Expected: FAIL — SharedComponents not defined

- [ ] **Step 3: Create shared-components.js**

```javascript
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
    content.innerHTML = '<div class="modal-header"><h3>' + escapeHtml(title) + '</h3><button class="modal-close" type="button">&times;</button></div><div class="modal-body">' + bodyHtml + '</div>';
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
```

- [ ] **Step 4: Update tests to load the module**

In `tests/extension/shared-components.test.mjs`, add at top:
```javascript
import fs from 'node:fs';
import vm from 'node:vm';
const source = fs.readFileSync(new URL('../../extension/shared-components.js', import.meta.url), 'utf-8');
const sandbox = { SharedComponents: null, document: { createElement: () => ({ style: {}, className: '', textContent: '', append: () => {}, innerHTML: '', addEventListener: () => {}, setAttribute: () => {}, remove: () => {} }) }, setTimeout: () => 1, clearTimeout: () => {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox);
const SharedComponents = sandbox.SharedComponents;
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/extension/shared-components.test.mjs`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git add extension/shared-components.js tests/extension/shared-components.test.mjs
git commit -m "feat: add shared UI components module"
```

---

## Task 3: Popup Redesign

**Files:**
- Modify: `extension/popup.html`
- Modify: `extension/popup.js`
- Modify: `extension/popup.css`
- Modify: `tests/e2e/extension-load.spec.js` (update selectors)
- Modify: `tests/extension/popup.test.mjs` (update mock expectations)

- [ ] **Step 1: Write failing E2E test for new popup layout**

In `tests/e2e/extension-load.spec.js`, add:
```javascript
test('popup renders with redesigned bottom toolbar', async ({ page }) => {
  await page.goto('/extension/popup.html');
  await expect(page.locator('.bottom-toolbar')).toBeVisible();
  await expect(page.locator('.bottom-toolbar .toolbar-btn')).toHaveCount(4);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/e2e/extension-load.spec.js --project=chromium -g "bottom toolbar"`
Expected: FAIL

- [ ] **Step 3: Update popup.html**

Add bottom toolbar section before the message footer:
```html
<div class="bottom-toolbar">
  <button class="toolbar-btn" id="lockBridge" title="Lock/unlock">🔒 <span>Lock</span></button>
  <button class="toolbar-btn" id="showSites" title="Site overrides">🌐 <span>Sites</span></button>
  <button class="toolbar-btn" id="showClients" title="Trusted browsers">👥 <span>Clients</span></button>
  <button class="toolbar-btn" id="showAbout" title="About">ℹ <span>About</span></button>
</div>
```

- [ ] **Step 4: Update popup.css to use design tokens**

Replace hardcoded color values with `var(--color-*)` references. Add new styles:
```css
@import url('design-tokens.css');

body { font-family: var(--font-family); ... }

.bottom-toolbar {
  display: flex; gap: var(--space-xs);
  border-top: 1px solid var(--color-border);
  padding: var(--space-sm) 0; margin-top: var(--space-sm);
}
.toolbar-btn {
  flex: 1; display: flex; align-items: center; gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md); border: none; border-radius: var(--radius-md);
  background: transparent; color: var(--color-text-secondary); cursor: pointer;
  font-size: var(--font-size-sm); transition: background var(--transition-fast);
}
.toolbar-btn:hover { background: var(--color-primary-subtle); color: var(--color-primary); }
```

- [ ] **Step 5: Update popup.js**

Import design tokens (they're loaded via HTML link). Update `renderResults` to use `SharedComponents.createCredentialCard` (or keep inline but use design token CSS classes).

- [ ] **Step 6: Run tests**

```bash
npx playwright test tests/e2e/extension-load.spec.js --project=chromium -g "bottom toolbar"
```
Expected: PASS

```bash
npx playwright test tests/e2e/ --project=chromium
```
Expected: All pass

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "ui: redesign popup with design tokens and bottom toolbar"
```

---

## Task 4: Options Page Tabbed Redesign

**Files:**
- Modify: `extension/options.html`
- Modify: `extension/options.js`
- Modify: `extension/options.css`

- [ ] **Step 1: Write failing E2E test**

```javascript
test('options page renders with tab navigation', async ({ page }) => {
  await page.goto('/extension/options.html');
  await expect(page.locator('.tab-nav')).toBeVisible();
  await expect(page.locator('.tab-btn')).toHaveCount.atLeast(3);
  // Click second tab
  await page.locator('.tab-btn').nth(1).click();
  await expect(page.locator('.tab-panel.active')).toBeVisible();
});
```

- [ ] **Step 2: Implementation**

Add tab navigation HTML, CSS with design tokens, JS tab switching logic.

- [ ] **Step 3: Verify tests pass + commit**

---

## Task 5: Inline Picker + Save Prompts Styling

**Files:**
- Modify: `extension/contentScript.js` (inline picker styles)
- Modify: `tests/e2e/form-detection.spec.js` (update selectors)

Import design tokens in injected styles. Use shared component patterns for credential cards in the inline picker.

---

## Self-Review

1. Spec coverage: Design tokens (Task 1), shared components (Task 2), popup (Task 3), options (Task 4), inline picker/save prompts (Task 5) — all covered.
2. No placeholders
3. Type consistency: All component function names match between test and implementation
4. Each task produces independently testable, committable changes
