# Changelog

## 2.0.0 (2026-06-23)

### Breaking Changes
- Popup visual redesign — existing users see new UI immediately on update
- Some popup actions moved ("Edit" was top-right icon, now in expanded card)
- Settings reorganized into 7-tab sidebar layout (Bridge endpoint moved to dedicated Bridge tab)
- Save/update prompts redesigned (different visual, similar behavior)
- Inline picker redesigned with expandable entries and per-field actions

### Added
- Design token system (`design-tokens.css`) — 30+ CSS custom properties for colors, spacing, typography, shadows, motion
- 21-icon SVG library with dual Vue + Web Component export (`icons.js`)
- 14 base components: BaseButton (4 variants × 3 sizes), BaseInput (6 types), BaseToggle, BaseSelect, BaseTooltip, BaseModal, BaseToast, BaseAvatar, BaseBadge, Stack, Inline, Divider, Card
- Layout primitives: Stack, Inline, Divider, Card
- FilterBar with group filter chips and overflow dropdown for 5+ groups
- DetailView with Username/Password/OTP rows, copy buttons, show/hide password toggle
- Skeleton loading animation during vault load
- Editable save prompt (Title/URL/Folder fields before saving)
- Update prompt with from/to diff display
- Inline picker header, expandable entries, per-field actions
- "K" inline button (20×20 circular, hover scale animation)
- `data-testid` attributes on all interactive elements
- `webAuthenticationProxy` moved to `permissions` (fixes Chrome MV3 warning)

### Fixed
- CSS token name mismatch — `popup.css` and `options.css` now use correct `--color-accent`, `--font-sans`, `--text-base`, `--space-*` tokens from design-tokens.css
- Shadow DOM token isolation — `Picker.web.js` and `Prompt.web.js` define `:host` token variables
- Color contrast — `--color-text-muted`, `--color-accent` on active tab, prompt danger button in dark mode
- FilterBar `TypeError: toLowerCase` — guarded `group.label` with `|| ''`
- URL wildcard matching — `matchUrl` correctly rejects `*.example.com` matching `example.com`
- `TypeError: toLowerCase` in computed properties — added `String()` coercion guards

### Tests
- 259 E2E + component + visual regression + a11y tests (Chromium + Firefox)
- 50 visual regression screenshots (5 surfaces × 2 themes × extended states)
- 14 WCAG 2.1 AA a11y tests (axe-core, 0 violations)
- 90 Vitest unit tests
- Test infrastructure: vitest files moved to `tests/unit/` to prevent Playwright/vitest conflict

## 2.1.0 (2026-06-26)

### Features
- Extract shared modules: `field-classifier.js` (20 form-detection functions), `background-utils.js` (12 data-utility functions), `password-generator.js`, `escape-html.js`, `design-tokens.js`, `favicon.js`
- Bundle content script through Vite build pipeline — enables ES imports, reduces contentScript.js from 1795 to 1675 lines
- Bundle background service worker through Vite — enables ES imports, reduces background.js from 1498 to 1395 lines
- Enable passkeys/WebAuthn support: backend gate open, Chrome proxy packaged, "Experimental" label removed
- Configurable favicon source (DuckDuckGo privacy-first, Google, direct)
- Content Security Policy added to both Chrome and Firefox manifests

### Bug Fixes
- Options page: tab setting changes now properly propagate to parent state — "Unsaved changes" footer now works
- Auto-fill delay setting key naming unified (`autoFillDelayMs` → `autoFillDelay`)
- Dead code elimination: 29 lint warnings → 0 across entire codebase

### Security
- Replace Google favicon service with DuckDuckGo by default (privacy-first)
- Add CSP: `script-src 'self'; object-src 'none'; frame-ancestors 'none'`
- Remove `PORTABLE_SETTING_DEFAULTS` exposure

### Code Quality
- Extract and deduplicate `escapeHtml` (4 copies → 1 shared module)
- Extract and deduplicate password generation (2 copies → 1 shared utility)
- Extract shared design tokens (32 CSS vars, deduplicated between Picker + Prompt)
- Remove dead code: `MoreMenu.vue`, `formatCount()`, `getEndpoint()`, `createInlineButton()`, `PORTABLE_SETTING_DEFAULTS`, `registerIcons` import, `showInlinePickerForInput()`, 4 unused E2E test helpers
- Remove duplicate stub test file: `urlMatcher.test.mjs`

### Tests
- **Total: 620 tests** (was 421, +47%)
- Add `field-classifier.test.mjs` — 70 TDD tests for form detection logic
- Add `background-utils.test.mjs` — 37 TDD tests for data utilities
- Add `password-generator.test.mjs` — 8 tests
- Add `escape-html.test.mjs` — 8 tests
- Add `favicon.test.mjs` — 5 tests
- Add Vue composable tests: `useTheme` (9), `useI18n` (6), `useFocusTrap` (4), `useBridge` (32)
- Add Vue component tests: `CredentialCard` (16), `EmptyState` (11), `FilterBar` (17)
- CI now enforces coverage thresholds: 80% lines/functions, 75% branches

### CI/CD
- Add `coverage` CI job — fails build below thresholds
- Add `test:coverage:ci` script
- Update `.gitignore` for coverage reports and test screenshots

### v2.1.0 Post-Release Updates

#### Features
- i18n: Add 6 major languages (DE, FR, ES, JA, KO, ZH_CN) - 8 total locales, 35 keys each
- Keyboard shortcuts: Add 4 new commands (Fill TOTP, Lock DB, Generate Password, Show Popup) - 6 total
- Passkeys: Graduate from experimental to production-ready (proxy packaged, docs updated)
- Enterprise GPO: Add `managed_storage.json` schema for Chrome enterprise policy
- Related origins: Cross-TLD credential matching (.com ↔ .co.uk, .de, .fr, .jp, etc.)
- Related origin C# backend: `CredentialQueryService` accepts `RelatedUrls[]`, dedup by EntryId

#### Bug Fixes
- Pairing dialog now auto-closes after successful pair (C# callback `ClosePairingDialog`)
- Edit form checks bridge response `result.Success === false` before showing success toast
- `saveEdit` maps `Uuid` → `EntryId` for backward compatibility with older entry formats
- Release workflow: separate Chrome/Firefox extension zips with correct manifests
- Release workflow: plugin DLL built in CI with correct KeePassReferencePath

#### Store Preparation
- Privacy policy URL ready: `https://github.com/hieuck/KeePassBrowserBridge/blob/main/docs/privacy-policy.md`
- Store submission docs finalized with checklist
- README comparison table updated: passkeys production, 8 locales, 6 shortcuts, 658 tests
- Release workflow auto-triggers on git tag push (v*)

#### Tests
- **Total: 658 tests** (was 644, +14)
- Add `background-utils.test.mjs`: 7 tests for `getRelatedOrigins`
- Add `i18n.test.mjs`: dynamic test for all 8 locales
- Add edge case tests: URL matching (+13), field classifier (+6), background utils (+5)
