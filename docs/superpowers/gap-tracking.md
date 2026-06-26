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
| Missing unit tests for shared modules | 🟡 P2 | QA | Added `escape-html.test.mjs` (8 tests) + `password-generator.test.mjs` (8 tests) | 2026-06-26 |
| Dead code test references to removed formatCount | 🟢 P3 | QA | Updated formatters tests to remove formatCount references | 2026-06-26 |

---

## Open Gaps

| Gap | Priority | Role | Status | Notes |
|-----|----------|------|--------|-------|
| No public store listing (Chrome/Firefox) | 🔴 P0 | PM | Open | External process; needs Chrome Web Store + Firefox Add-ons submission |
| Passkeys feature gate disabled at browser | 🔴 P0 | PM/Arch | In progress | Backend prototype done (`PasskeyService.cs`, 1984 lines); browser proxy experiment in progress; needs completion per `docs/passkeys-webauthn-design.md` |
| contentScript.js monolithic (1866 lines) | 🔴 P1 | Architect | Open | Needs splitting into modules: formDetector.js, fillEngine.js, inlineUI.js, shadowDomObserver.js |
| background.js monolithic (1487 lines) | 🔴 P1 | Architect | Open | Needs splitting into modules |
| Vue components 0% Vitest coverage | 🔴 P1 | QA | Open | popup/, options/, components/, composables/ all 0%; only tested via Playwright E2E |
| No TypeScript for extension | 🟡 P2 | Frontend | Open | Would catch type errors at build time; large migration effort |
| .NET Framework 4.0 + DataContractJsonSerializer + HttpListener | 🟡 P2 | Backend | Open | Legacy stack; Kestrel + System.Text.Json would improve perf |
| Windows-only CI, no containerized build | 🟡 P2 | DevOps | Open | Linux/macOS extension testing missing |
| Shared secrets in browser localStorage | 🟡 P2 | Security | Open | Accepted risk; consider WebAuthn or OS-level protected storage |
| CSS tokens duplicated in Picker.web.js + Prompt.web.js (~270 lines each) | 🟢 P3 | Frontend | Open | Shared CSS module would reduce duplication |
| Duplicate test files: url-matcher.test.mjs vs urlMatcher.test.mjs | 🟢 P3 | QA | Open | Different content; should be consolidated or renamed |
| No load/stress testing for bridge | 🟡 P2 | QA | Open | No performance benchmarks |
| No mutation testing | 🟡 P2 | QA | Open | Test quality not measured |
| No WebKit E2E in CI | 🟡 P2 | QA | Open | playwright.config.js has webkit but CI only runs chromium + firefox |
| Coverage thresholds not enforced in CI | 🟡 P2 | DevOps | Open | vitest.config.js has thresholds but CI doesn't enforce |
| Favicon fetch from google.com/s2/favicons | 🟡 P2 | Security | Open | Privacy concern; add configurable favicon source or disable |
| No CSP (Content Security Policy) in extension manifest | 🟡 P2 | Security | Open | Should restrict script/style sources |
| Options page: tab changes don't propagate to settings state | 🟡 P2 | Frontend | Open | Individual tab @save emits don't update parent settings.value; batch save likely broken for individual changes |
| No fuzzing test for bridge HTTP endpoint | 🟢 P3 | Security | Open | Protocol parsing robustness |
| MoreMenu.vue referenced in planning docs | 🟢 P3 | Docs | Open | `docs/superpowers/plans/2026-06-22-v2-ui-ux-complete-redesign.md` mentions MoreMenu as unchecked step 8 |
