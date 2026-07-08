# i18n Expansion Design

> **Goal:** Expand KeePass Browser Bridge locale coverage from 8 to 20 languages in Phase 1, then to 45 in Phase 2, matching Kee and KeePassXC-Browser respectively.

## Context

Current state:
- 8 supported locales: `de`, `en`, `es`, `fr`, `ja`, `ko`, `vi`, `zh_CN`.
- i18n wrapper: `extension/src/composables/useI18n.js` wrapping `chrome.i18n.getMessage` / `browser.i18n.getMessage`.
- Keys defined in `extension/_locales/<lang>/messages.json`.
- Competitors: Kee supports ~20 locales; KeePassXC-Browser supports ~45 locales.

## Architecture

Keep the existing `chrome.i18n` + `_locales` architecture. Add new locale files only. Do not change the runtime i18n wrapper unless required for fallback or pluralization.

Changes:
1. Add `extension/_locales/<lang>/messages.json` for each new locale.
2. Ensure `extension/manifest.json` and `extension/manifest.firefox.json` have `default_locale: "en"` (already true). Chrome/Firefox automatically fall back to `default_locale` for missing keys.
3. Add `scripts/validate-locales.mjs` to validate all locale files against the English reference.
4. Add `tests/unit/locales.test.mjs` that runs the validator via Vitest.

## Components

### Locale files
- Source of truth: `extension/_locales/en/messages.json`.
- Target files: `extension/_locales/<lang>/messages.json`.
- Format identical to existing files: top-level object with `{ "message": "...", "description": "..." }` values.

### Validation script
`scripts/validate-locales.mjs` checks:
- All `messages.json` files are valid JSON.
- Each non-English locale has exactly the same keys as English.
- No extra keys exist in non-English locales.
- Optional: placeholder counts in `message` strings match English (future enhancement).

### Test file
`tests/unit/locales.test.mjs` invokes `scripts/validate-locales.mjs` and asserts exit code 0.

## Data Flow

1. English keys are defined/updated in `extension/_locales/en/messages.json`.
2. New locales are translated and added as `extension/_locales/<lang>/messages.json`.
3. `npm test` runs `tests/unit/locales.test.mjs` and fails if any locale is inconsistent.

## Error Handling

- Missing keys: validator fails the build. Runtime fallback to English via browser API.
- Invalid JSON: validator fails the build.
- Extra keys: validator fails the build to keep files minimal and consistent.

## Testing

- New unit test: `tests/unit/locales.test.mjs`.
- Existing tests: `npm test` and `npm run lint` must still pass.
- E2E: not required for this change; i18n is validated statically.

## Phase 1 Locales (12 new → 20 total)

New locales to add:
- `pt_BR` — Brazilian Portuguese
- `ru` — Russian
- `it` — Italian
- `pl` — Polish
- `nl` — Dutch
- `tr` — Turkish
- `ar` — Arabic
- `th` — Thai
- `id` — Indonesian
- `sv` — Swedish
- `cs` — Czech
- `uk` — Ukrainian

## Phase 2 (future)

Add remaining locales to reach ~45 total, matching KeePassXC-Browser coverage. Phase 2 will reuse the same validator and test infrastructure built in Phase 1.

## Risks & Mitigations

- **Translation quality:** Use established Chrome extension locale codes and well-known translations for common UI strings. Accept that initial translations may need community refinement.
- **Key drift:** Validator prevents merging inconsistent locales.
- **Manifest size:** Adding ~37 small JSON files has negligible impact on bundle size.

## Success Criteria

- `npm test` passes with the new locale validator.
- At least 20 locales exist under `extension/_locales/`.
- All locale files have identical keysets to English.
- No regression in existing tests or lint.
