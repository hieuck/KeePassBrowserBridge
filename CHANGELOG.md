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
