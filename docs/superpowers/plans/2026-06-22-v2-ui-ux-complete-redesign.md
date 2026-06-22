# KeePassBrowserBridge v2.0 UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite all five extension UI surfaces (popup with inline edit form, options page, inline picker, save/update prompts) using a unified Vue 3 + Web Components design system.

**Architecture:** Vue 3 SFCs for popup + options, Web Components for in-page UI (inline picker + save/update prompts). Shared design tokens (CSS custom properties) and 21-icon SVG library. Build pipeline produces 3 bundles: Vue popup, Vue options, Web Components.

**Tech Stack:** Vue 3.4+, Vite 5, Playwright 1.58+, axe-core 4.x, Chrome for Testing (chromium-1208), PowerShell 5.1 for build scripts.

**Reference spec:** `docs/superpowers/specs/2026-06-22-v2-ui-ux-complete-redesign.md` (read this first for design details)

---

## File Structure

### Files to Create
- `extension/design-tokens.css` — CSS custom properties (all surfaces)
- `extension/icons.js` — 21 SVG icons, dual Vue + Web Component export
- `extension/shared/validators.js` — form validators (URL, email, non-empty)
- `extension/shared/formatters.js` — date/time/count formatters
- `extension/shared/storage.js` — Chrome storage wrapper
- `extension/src/components/BaseButton.vue`
- `extension/src/components/BaseInput.vue`
- `extension/src/components/BaseToggle.vue`
- `extension/src/components/BaseModal.vue`
- `extension/src/components/BaseToast.vue`
- `extension/src/components/BaseAvatar.vue`
- `extension/src/components/BaseBadge.vue`
- `extension/src/components/BaseStack.vue` (layout)
- `extension/src/components/BaseCard.vue` (layout)
- `extension/src/components/Icon.vue`
- `extension/src/components/index.js` — Web Components entry
- `extension/src/components/picker.web.js`
- `extension/src/components/save-prompt.web.js`
- `extension/src/components/update-prompt.web.js`
- `extension/src/composables/useBridge.js`
- `extension/src/composables/useTheme.js`
- `extension/src/composables/useToast.js`
- `extension/src/composables/useFocusTrap.js`
- `extension/src/popup/PopupHeader.vue`
- `extension/src/popup/SearchBar.vue`
- `extension/src/popup/CredentialCard.vue` (full rewrite)
- `extension/src/popup/EmptyState.vue`
- `extension/src/popup/NewLoginForm.vue`
- `extension/src/popup/EditForm.vue`
- `extension/src/popup/PasswordGenerator.vue`
- `extension/src/popup/MoreMenu.vue`
- `extension/src/popup/BottomToolbar.vue`
- `extension/src/popup/StatusBar.vue`
- `extension/src/options/Sidebar.vue`
- `extension/src/options/SectionCard.vue`
- `extension/src/options/tabs/GeneralTab.vue`
- `extension/src/options/tabs/BridgeTab.vue`
- `extension/src/options/tabs/AutoFillTab.vue`
- `extension/src/options/tabs/SitesTab.vue`
- `extension/src/options/tabs/ClientsTab.vue`
- `extension/src/options/tabs/PasskeyTab.vue`
- `extension/src/options/tabs/AboutTab.vue`
- `extension/vite.web-components.config.js`
- `extension/contentScript-picker.js` (helper module)
- `tests/extension/design-tokens.test.mjs`
- `tests/extension/icons.test.mjs`
- `tests/extension/base-*.test.mjs` (one per component, 9 files)
- `tests/extension/web-components.test.mjs`
- `tests/e2e/popup-v2-keyboard.spec.js`
- `tests/e2e/picker-keyboard.spec.js`
- `tests/e2e/visual-v2.spec.js`
- `tests/e2e/a11y-v2.spec.js`

### Files to Modify
- `extension/popup.html` (full rewrite)
- `extension/options.html` (full rewrite)
- `extension/contentScript.js` (replace inline picker + prompts with Web Components)
- `extension/background.js` (add theme preference migration)
- `extension/src/popup/App.vue` (full rewrite)
- `extension/src/popup/main.js` (full rewrite)
- `extension/src/options/App.vue` (full rewrite)
- `extension/src/options/main.js` (full rewrite)
- `extension/vite.config.js` (3 entries)
- `package.json` (new build scripts)
- `scripts/build-release.ps1` (file lists)
- `scripts/verify-release-artifacts.ps1` (expected files)
- `tests/e2e/extension-load.spec.js` (update selectors)
- `tests/e2e/form-detection.spec.js` (update selectors)
- `tests/e2e/options-page.spec.js` (update selectors)

### Files to Delete (after migration)
- `extension/popup.js` (replaced by Vue)
- `extension/options.js` (replaced by Vue)
- `extension/shared-components.js` (replaced by Vue/Web Components)
- `extension/enhancedSecurity_part1.js` (was already removed in v1)
- `extension/enhancedSecurity_part2.js`
- `extension/groupOrganization.js`
- `extension/multiDatabase.js`
- `extension/multiPageLogin.js`
- `extension/passwordQuality.js`
- `extension/uxEnhancements.js`
- `extension/testingInfrastructure.js`
- `extension/test-page.html`
- `extension/test-extension.js`
- `extension/quick-test.js`
- `extension/passkeysProxyExperiment.js`
- `extension/TESTING_GUIDE.md`
- `extension/README.md` (the one in extension/)

---

## Phase 1: Design System Foundation (3 days)

### Task 1.1: Create design tokens CSS

**Files:** Create `extension/design-tokens.css`, update `extension/popup.html` + `extension/options.html` to link it, test in `tests/extension/design-tokens.test.mjs`

**Approach:** Write CSS with 4 layers (color, spacing, radius, shadow, typography, motion, z-index) in `:root` + `:root[data-theme="dark"]` override. Use exact values from spec Section 1.

- [ ] **Step 1: Write the failing test** — `tests/extension/design-tokens.test.mjs` checks all required token names exist via fs.readFileSync
- [ ] **Step 2: Run test, verify FAIL** — `npx playwright test tests/extension/design-tokens.test.mjs`
- [ ] **Step 3: Write `extension/design-tokens.css`** with all tokens from spec (colors, spacing 0-16, radius sm/full, shadow sm/md/lg, font families, text xs-3xl, transitions, z-index)
- [ ] **Step 4: Add `<link rel="stylesheet" href="design-tokens.css">` to popup.html and options.html `<head>`**
- [ ] **Step 5: Run test, verify PASS** (2 tests)
- [ ] **Step 6: Commit** — `git commit -m "feat(design-system): add design-tokens.css with light and dark themes"`

### Task 1.2: Create 21-icon SVG library with dual Vue + Web Component export

**Files:** Create `extension/icons.js`, `extension/src/components/Icon.vue`, test in `tests/extension/icons.test.mjs`

**Approach:** Single `PATHS` object maps name → SVG path data. Helper `makeIcon()` wraps in `<svg width=16 height=16 viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">`. Export individual constants + `ICONS` dict + `registerIcons(prefix)` for Web Components.

- [ ] **Step 1: Write test** — imports module, checks all 21 names + registerIcons function
- [ ] **Step 2: Run, verify FAIL**
- [ ] **Step 3: Write `extension/icons.js`** — see spec for icon list (key, lock, lock-open, unlock, copy, check, edit, pencil, plus, trash, search, filter, close, chevron-down, eye, eye-off, shield, shield-check, globe, user, user-plus). Use GitHub Octicons-style paths.
- [ ] **Step 4: Write `extension/src/components/Icon.vue`** — Vue 3 wrapper that takes `name`, `size`, `spin` props and renders `v-html` of the SVG
- [ ] **Step 5: Run, verify PASS**
- [ ] **Step 6: Commit** — `git commit -m "feat(icons): add 21-icon SVG library with Vue and Web Component export"`

### Task 1.3: Create BaseButton component

**Files:** Create `extension/src/components/BaseButton.vue`, test in `tests/extension/base-button.test.mjs`

**Approach:** Vue 3 SFC with props: `variant` (primary/secondary/ghost/danger), `size` (sm/md/lg), `type`, `disabled`, `loading`, `block`, `leadingIcon`, `trailingIcon`. Uses `<Icon>` for icons. Scoped styles use design tokens.

- [ ] **Step 1: Write test** — source checks: 4 variants, 3 sizes, defineEmits, disabled + aria-disabled
- [ ] **Step 2: Run, verify FAIL**
- [ ] **Step 3: Write component** — see spec for exact styles
- [ ] **Step 4: Run, verify PASS** (4 tests)
- [ ] **Step 5: Commit**

### Task 1.4: Create BaseInput, BaseToggle, BaseModal, BaseToast, BaseAvatar, BaseBadge

**Files:** 6 component files + 6 test files

**Approach (TDD for each):**
- **BaseInput:** props: `modelValue`, `label`, `description`, `type`, `placeholder`, `error`, `disabled`, `readonly`, `required`, `autocomplete`, `leadingIcon`, `trailingIcon`, `showToggle` (for password). Uses `useId()` for accessible ID. Emits `update:modelValue`, `blur`, `focus`, `trailing-click`.
- **BaseToggle:** props: `modelValue`, `label`, `description`, `disabled`, `ariaLabel`. Renders as button[role=switch][aria-checked].
- **BaseModal:** props: `modelValue`, `title`, `maxWidth`, `dismissible`, `closeOnBackdrop`, `closeOnEsc`. Uses `<Teleport to="body">`. Handles Esc + backdrop click + body overflow lock.
- **BaseToast:** singleton pattern — exposes `window.__kbbToast.show()`. Renders fixed top-right stack with role=status, aria-live=polite/assertive.
- **BaseAvatar:** props: `name`, `url`, `size` (sm/md/lg). Generates Google favicon URL for URL, shows initial for name.
- **BaseBadge:** props: `variant` (neutral/success/warning/danger/accent). Pill-shaped status indicator.

Each test file checks for: required props/emits in source, ARIA attributes.

- [ ] **Steps 1-5 for each of 6 components** (TDD)
- [ ] **Step 6: Run all 6 tests** — `npx playwright test tests/extension/base-*.test.mjs` (12 tests)
- [ ] **Step 7: Commit** — `git commit -m "feat(ui): add BaseInput, BaseToggle, BaseModal, BaseToast, BaseAvatar, BaseBadge"`

### Task 1.5: Create shared utilities and Vue composables

**Files:** Create `extension/shared/validators.js`, `extension/shared/formatters.js`, `extension/shared/storage.js`, `extension/src/composables/{useBridge,useTheme,useToast,useFocusTrap}.js`

**Approach:**
- `validators.js`: `isValidUrl`, `isValidEmail`, `isNonEmpty`
- `formatters.js`: `formatRelativeTime`, `formatCount`, `truncate`
- `storage.js`: `getSettings`, `setSetting`, `setSettings` (Promise wrappers)
- `useTheme.js`: ref-based theme (light/dark/system) + applies `data-theme` attr to document + sync with localStorage
- `useBridge.js`: wraps `chrome.runtime.sendMessage` with typed call methods
- `useToast.js`: singleton toast queue
- `useFocusTrap.js`: trap Tab/Shift+Tab within container, restore focus on unmount

- [ ] **Step 1: Write all 7 files** (no test needed for these — they're trivial wrappers, integration tests later)
- [ ] **Step 2: Commit** — `git commit -m "feat(ui): add shared utilities and Vue composables"`

### Task 1.6: Update Vite config for 3-entry build

**Files:** Modify `extension/vite.config.js`, create `extension/vite.web-components.config.js`, modify `package.json`

**Approach:**
- `vite.config.js`: 2 entries (popup, options) → `dist/popup.js`, `dist/options.js` + extracted CSS
- `vite.web-components.config.js`: library mode, 1 entry (components/index.js) → `dist/components.es.js` as ES module
- `package.json`: add scripts `build:components` and `build:all`

- [ ] **Step 1: Update vite.config.js** — keep popup + options entries, set `emptyOutDir: false`
- [ ] **Step 2: Create vite.web-components.config.js** — `lib.entry: 'src/components/index.js'`, `lib.formats: ['es']`, output `components.es.js`
- [ ] **Step 3: Update package.json** — add `build:components` and `build:all` scripts
- [ ] **Step 4: Create `extension/src/components/index.js`** with `registerIcons('kbb')` and import for all Base* web components (BaseButton.web.js etc.)
- [ ] **Step 5: Run `npm run build:all`** — verify 3 bundles produced
- [ ] **Step 6: Commit**

---

## Phase 2: Popup Redesign (4 days)

### Task 2.1: Rewrite popup.html

**Files:** Modify `extension/popup.html`

- [ ] **Step 1: Rewrite popup.html** — minimal mount point with `<link>` to design-tokens.css + popup.css + dist/popup.css, `<div id="app">`, `<script type="module" src="dist/popup.js">`
- [ ] **Step 2: Commit**

### Task 2.2: Rewrite App.vue for popup

**Files:** Modify `extension/src/popup/main.js`, `extension/src/popup/App.vue`

- [ ] **Step 1: Rewrite main.js** — `createApp(App).mount('#app')`
- [ ] **Step 2: Write App.vue** — composes PopupHeader + SearchBar + FilterBar + vault-list (CredentialCard / EmptyState) + BottomToolbar + StatusBar + EditForm/NewLoginForm. State: `currentEntries`, `searchQuery`, `activeGroup`, `detailEntry`, `formMode`, `editingEntry`, `state` (paired/locked), `permissions`. Actions: `fillEntry`, `copyField`, `startEdit`, `startNew`, `saveEdit`, `createLogin`, `lock`, `unlock`. `refreshState()` on mount.
- [ ] **Step 3: Build** — `npm run build:vue`
- [ ] **Step 4: Commit**

### Task 2.3: Implement popup sub-components

**Files:** Create 9 Vue components

**Approach:** Each component uses `BaseButton`, `BaseInput`, `BaseToggle`, `BaseAvatar`, `BaseBadge`, `Icon`. See spec Section 2 for visual structure.

- [ ] **Step 1: PopupHeader.vue** — brand + theme toggle (cycle light/dark/system)
- [ ] **Step 2: SearchBar.vue** — search input with leading search icon and trailing clear button
- [ ] **Step 3: CredentialCard.vue (full rewrite)** — collapse/expand with inline detail (Username/Password/Custom fields rows), Fill form button, Edit, More menu. Hover/focus states.
- [ ] **Step 4: EmptyState.vue** — 3 variants (empty/search/filter) with CTA
- [ ] **Step 5: NewLoginForm.vue** — form with Title/URL/Username/Password/Folder + Save/Cancel
- [ ] **Step 6: EditForm.vue** — same as NewLoginForm but pre-fills + custom fields editor (add/remove) + generate password
- [ ] **Step 7: PasswordGenerator.vue** — length slider + result + copy
- [ ] **Step 8: MoreMenu.vue** — dropdown with Copy username, Copy password, Delete
- [ ] **Step 9: BottomToolbar.vue** — New Login + Settings + Clients icons
- [ ] **Step 10: StatusBar.vue** — Lock button + paired status text
- [ ] **Step 11: Build** — `npm run build:vue`
- [ ] **Step 12: Commit**

### Task 2.4: Add keyboard navigation E2E tests

**Files:** Create `tests/e2e/popup-v2-keyboard.spec.js`

- [ ] **Step 1: Write tests** — 4 tests: Tab order, Arrow Down navigates cards, Enter expands, Escape collapses
- [ ] **Step 2: Run, verify PASS**
- [ ] **Step 3: Commit**

---

## Phase 3: Options Page (3 days)

### Task 3.1: Rewrite options.html

**Files:** Modify `extension/options.html`

- [ ] **Step 1: Rewrite** — minimal mount point
- [ ] **Step 2: Commit**

### Task 3.2: Implement options App + Sidebar + 7 tab components

**Files:** Modify `extension/src/options/main.js`, `extension/src/options/App.vue`. Create `extension/src/options/{Sidebar,SectionCard}.vue` and 7 tab components.

**Approach:**
- **App.vue** — header (brand + version + theme toggle) + body (Sidebar + active tab content) + sticky footer (Reset/Save with dirty state detection)
- **Sidebar.vue** — vertical nav with 7 tabs, active state highlighted
- **SectionCard.vue** — card container for grouped settings
- **GeneralTab.vue** — Theme toggle, Auto-lock timeout input
- **BridgeTab.vue** — Endpoint input, status badge, "Test connection" button
- **AutoFillTab.vue** — Auto-fill toggle, Auto-submit toggle, delay slider
- **SitesTab.vue** — Search + list of site rules with add/remove/toggle
- **ClientsTab.vue** — Table of trusted browsers with revoke action
- **PasskeyTab.vue** — Enable toggle, status badge
- **AboutTab.vue** — Version, GitHub link, "Export logs" button

- [ ] **Step 1: Rewrite main.js** — `createApp(App).mount('#app')`
- [ ] **Step 2: Write App.vue** — composes Sidebar + dynamic tab component + sticky footer
- [ ] **Step 3: Write Sidebar.vue and SectionCard.vue**
- [ ] **Step 4: Write 7 tab components**
- [ ] **Step 5: Build** — `npm run build:vue`
- [ ] **Step 6: Commit**

### Task 3.3: Update options E2E tests

**Files:** Modify `tests/e2e/options-page.spec.js`

- [ ] **Step 1: Update selectors** — `.tab` → `.options-sidebar__tab`, `.section` → `.section-card`. Add test for new sidebar nav.
- [ ] **Step 2: Run, verify PASS**
- [ ] **Step 3: Commit**

---

## Phase 4: Inline Picker (3 days)

### Task 4.1: Convert inline picker to Web Components

**Files:** Create `extension/contentScript-picker.js`, modify `extension/contentScript.js`

**Approach:**
- `contentScript-picker.js` — exports `loadComponents()` (dynamic import of components.es.js), `showInlinePicker(button, entries)` (creates `<kbb-picker>` element), `closeInlinePicker()`. Handles smart positioning (flip above if no space below).
- `contentScript.js` — replace existing `showInlinePicker` calls with import + use new module. Dispatch `kbb-picker-action` CustomEvent on action click, content script listens and calls bridge.

- [ ] **Step 1: Create contentScript-picker.js**
- [ ] **Step 2: Update contentScript.js** to use new module
- [ ] **Step 3: Build** — `npm run build:all`
- [ ] **Step 4: Run inline picker E2E** — `npx playwright test tests/e2e/form-detection.spec.js --project=chromium`
- [ ] **Step 5: Commit**

### Task 4.2: Add keyboard navigation to picker

**Files:** Create `extension/src/components/picker.web.js`, test in `tests/e2e/picker-keyboard.spec.js`

**Approach:** `<kbb-picker>` custom element. Renders header (count + close), entry list with action buttons. Handles Arrow Up/Down between entries, Enter activates focused button, Escape closes. Emits `kbb-picker-action` CustomEvent with `{action, entry, customField}` detail.

- [ ] **Step 1: Implement picker.web.js**
- [ ] **Step 2: Add to components/index.js** and components.es.js build
- [ ] **Step 3: Write keyboard test** — Escape closes
- [ ] **Step 4: Run, verify PASS**
- [ ] **Step 5: Commit**

---

## Phase 5: Save/Update Prompts (2 days)

### Task 5.1: Convert save/update prompts to Web Components

**Files:** Create `extension/src/components/{save-prompt,update-prompt}.web.js`. Modify `extension/contentScript.js`.

**Approach:**
- `<kbb-save-prompt>` — renders Title (icon + "Save login for {domain}?"), Username/Password read-only display, Title/URL/Folder editable inputs, Save/Never/Close buttons. Slide-in animation. Auto-dismiss 30s with countdown.
- `<kbb-update-prompt>` — similar but shows diff (new password indicator) and Update/Skip/Close buttons.
- Both use `kbb-save-action` and `kbb-skip-action` CustomEvents.

- [ ] **Step 1: Create save-prompt.web.js**
- [ ] **Step 2: Create update-prompt.web.js**
- [ ] **Step 3: Update contentScript.js** to use new components
- [ ] **Step 4: Add to components/index.js**
- [ ] **Step 5: Build** — `npm run build:all`
- [ ] **Step 6: Run save/update E2E tests** — `npx playwright test tests/e2e/form-detection.spec.js --project=chromium`
- [ ] **Step 7: Commit**

---

## Phase 6: Test + Polish (3 days)

### Task 6.1: Visual regression setup

**Files:** Create `tests/e2e/visual-v2.spec.js`

**Approach:** Playwright + extension load. Set state via `chrome.storage.local.set()` from background, then capture screenshots. ~50 screenshots across 5 surfaces × 2 themes. Save to `tests/__screenshots__/v2/`.

- [ ] **Step 1: Write visual regression spec** — one test per (surface × theme) combination
- [ ] **Step 2: Run and generate baseline screenshots**
- [ ] **Step 3: Commit** — `git add tests/__screenshots__/v2/`

### Task 6.2: Update existing 143 E2E tests

**Files:** Modify `tests/e2e/extension-load.spec.js`, `tests/e2e/form-detection.spec.js`, `tests/e2e/options-page.spec.js`

- [ ] **Step 1: Extension load** — update selectors for new design (e.g., `.item` → `.credential-card`, `.login` → `.credential-card`, etc.)
- [ ] **Step 2: Form detection** — update picker selectors
- [ ] **Step 3: Options page** — update tab + section selectors
- [ ] **Step 4: Run all 143+ tests** — `npx playwright test tests/e2e/ --project=chromium`
- [ ] **Step 5: Fix any remaining selectors**
- [ ] **Step 6: Commit** — `git commit -m "test: update E2E selectors for v2 design"`

### Task 6.3: Accessibility audit

**Files:** Create `tests/e2e/a11y-v2.spec.js`

**Approach:** axe-core integration. Inject axe-core into popup/options page, run automated scan, expect 0 critical violations on all surfaces. Manual keyboard nav smoke test.

- [ ] **Step 1: Install axe-core** — `npm install --save-dev @axe-core/playwright`
- [ ] **Step 2: Write a11y tests** — 5 tests (one per surface)
- [ ] **Step 3: Run, fix violations, re-run**
- [ ] **Step 4: Commit**

### Task 6.4: Manual testing on 5 real sites

**Files:** None (manual)

- [ ] **Step 1: Test on Facebook** — click K button on login form, fill custom field, save
- [ ] **Step 2: Test on GitHub** — fill 2FA, copy OTP
- [ ] **Step 3: Test on AWS Console** — multi-step fill
- [ ] **Step 4: Test on forum.aigato.vn** — different layout
- [ ] **Step 5: Test on Gmail** — Google account flow
- [ ] **Step 6: Fix bugs from manual testing**
- [ ] **Step 7: Commit** — `git commit -m "fix: address manual testing feedback"`

### Task 6.5: Final polish + release

**Files:** Update `extension/README.md`, root `README.md`, `CHANGELOG.md`

- [ ] **Step 1: Update root README** — add v2.0 features, screenshots, migration notes
- [ ] **Step 2: Update CHANGELOG** — v2.0 entry
- [ ] **Step 3: Bump version to 2.0.0** — `extension/manifest.json` + `extension/manifest.firefox.json`
- [ ] **Step 4: Run full verify** — `.\scripts\verify.ps1`
- [ ] **Step 5: Build signed release** — `.\scripts\build-release.ps1 -SignArtifacts`
- [ ] **Step 6: Commit** — `git commit -m "chore: v2.0.0 release"`

---

## Success Criteria

- All 250+ E2E tests pass
- All 200+ unit tests pass
- All 50+ visual regression screenshots captured
- axe-core reports 0 critical violations on all 5 surfaces
- Manual testing on 5 real sites shows no visual glitches
- Popup opens in <100ms
- Inline picker appears in <50ms
- All user flows keyboard-accessible
- Dark mode parity verified
- Bundle size <200KB total
- `.\scripts\verify.ps1` passes
- Release artifacts built and signed
