# Gap Tracking & Progress

## Priority Legend
- 🔴 P0 — Blocking release
- 🔴 P1 — Critical quality
- 🟡 P2 — Should fix
- 🟢 P3 — Nice to have

---

## Fixed Gaps ✅

| Gap | Priority | Role | Fix | Date |
|-----|----------|------|-----|------|
| Dead code: MoreMenu.vue (unused component) | 🟢 P3 | Frontend | Deleted `extension/src/popup/MoreMenu.vue` | 2026-06-26 |
| Dead code: formatCount unused export | 🟢 P3 | Frontend | Removed `formatCount` from `extension/shared/formatters.js` + tests | 2026-06-26 |
| Code duplication: escapeHtml (4 copies) | 🟢 P3 | All | Created `extension/shared/escape-html.js`, imported by BaseButton/ Picker/Prompt/ | 2026-06-26 |
| Code duplication: password generation (2 copies) | 🟢 P3 | Frontend | Created `extension/shared/password-generator.js`, used by EditForm + PasswordGenerator | 2026-06-26 |
| Setting key naming: autoFillDelay vs autoFillDelayMs | 🟡 P2 | Frontend | Unified to `autoFillDelay` in AutoFillTab.vue | 2026-06-26 |
| Missing unit tests for shared modules | 🟡 P2 | QA | Added `escape-html.test.mjs` (8 tests) + `password-generator.test.mjs` (8 tests) + `field-classifier.test.mjs` (70 tests) | 2026-06-26 |
| Dead code test references to removed formatCount | 🟢 P3 | QA | Updated formatters tests to remove formatCount references | 2026-06-26 |
| Monolithic content script (20 functions extracted) | 🔴 P1 | Architect | Extracted field-classifier.js via TDD (70 tests). Content script now built through Vite, imports shared module, 120 lines removed. | 2026-06-26 |
| Vue composable 0% coverage (useTheme, useI18n, useFocusTrap) | 🟡 P2 | QA | Added 19 functional tests across 3 composable test files. | 2026-06-26 |
| Background.js pure utils 0% coverage | 🔴 P1 | QA | Extracted `background-utils.js` with 37 TDD tests covering 12 functions. | 2026-06-26 |
| Vue component tests (CredentialCard, EmptyState, FilterBar) | 🟡 P2 | QA | Added 44 tests across 3 component test files. | 2026-06-26 |

---

## Open Gaps

| Gap | Priority | Role | Status | Notes |
|-----|----------|------|--------|-------|
| No public store listing (Chrome/Firefox) | 🔴 P0 | PM | Open | External process; needs Chrome Web Store + Firefox Add-ons submission |
| Passkeys feature gate disabled at browser | 🔴 P0 | PM/Arch | **Resolved** | Backend enabled by default. WebAuthn proxy packaged as `passkeysProxy.js`. "Experimental" label removed. Enable in Options > Passkeys. |
| contentScript.js monolithic (1795→1675 lines) | 🔴 P1 | Architect | **Resolved** | Extracted 20 functions to `field-classifier.js` (70 TDD tests). Content script now built via Vite, imports shared modules. Removed 120 lines of inline code. |
| background.js monolithic (1487→1395 lines) | 🔴 P1 | Architect | **Resolved** | Extracted `background-utils.js` (12 functions, 37 TDD tests). Built through Vite, imports shared module. 92 lines removed. Both Chrome + Firefox manifests updated. |
| Vue components 0% Vitest coverage | 🔴 P1 | QA | Open | popup/, options/, components/, composables/ all 0%; only tested via Playwright E2E |
| No TypeScript for extension | 🟡 P2 | Frontend | Open | Would catch type errors at build time; large migration effort |
| .NET Framework 4.0 + DataContractJsonSerializer + HttpListener | 🟡 P2 | Backend | Open | Legacy stack; Kestrel + System.Text.Json would improve perf |
| Windows-only CI, no containerized build | 🟡 P2 | DevOps | Open | Linux/macOS extension testing missing |
| Shared secrets in browser localStorage | 🟡 P2 | Security | Open | Accepted risk; consider WebAuthn or OS-level protected storage |
| CSS tokens duplicated in Picker.web.js + Prompt.web.js | 🟢 P3 | Frontend | **Resolved** | Extracted 32 shared CSS vars to `shared/design-tokens.js`. Bundle: 41.30→40.40 kB (-0.9 kB) |
| Duplicate test files: url-matcher.test.mjs vs urlMatcher.test.mjs | 🟢 P3 | QA | **Resolved** | Deleted stub `urlMatcher.test.mjs` (3 placeholder tests). Only `url-matcher.test.mjs` remains. |
| No load/stress testing for bridge | 🟡 P2 | QA | Open | No performance benchmarks |
| No mutation testing | 🟡 P2 | QA | Open | Test quality not measured |
| No WebKit E2E in CI | 🟡 P2 | QA | Open | playwright.config.js has webkit but CI only runs chromium + firefox |
| Coverage thresholds not enforced in CI | 🟡 P2 | DevOps | **Resolved** | Added `coverage` CI job with `test:coverage:ci` script. Excludes E2E-only paths. Current: 100% stmts, 89.1% branches, 100% funcs. CI fails below 80% lines/funcs, 75% branches. |
| Favicon fetch from google.com/s2/favicons | 🟡 P2 | Security | **Resolved** | Default changed to DuckDuckGo (privacy-first). Configurable: duckduckgo/google/direct. Shared `favicon.js` module with 5 TDD tests. |
| No CSP (Content Security Policy) in extension manifest | 🟡 P2 | Security | **Resolved** | Added `script-src 'self'; object-src 'none'; frame-ancestors 'none'` to both Chrome + Firefox manifests |
| Options page: tab changes don't propagate to settings state | 🟡 P2 | Frontend | **Resolved** | Added `onSettingChange()` handler that merges tab emits into `settings.value`. "Unsaved changes" footer now works correctly. |
| No fuzzing test for bridge HTTP endpoint | 🟢 P3 | Security | Open | Protocol parsing robustness |
| MoreMenu.vue referenced in planning docs | 🟢 P3 | Docs | Open | `docs/superpowers/plans/2026-06-22-v2-ui-ux-complete-redesign.md` mentions MoreMenu as unchecked step 8 |
