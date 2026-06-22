# KeePassBrowserBridge v2.0 — Complete UI/UX Redesign

**Date:** 2026-06-22
**Status:** Draft
**Target version:** v2.0.0 (breaking UI changes, no backend changes)

## Goal

Rewrite all five browser extension UI surfaces (popup with inline edit form, options page, inline picker, save prompt, update prompt) using a unified design system. Bring the extension visually in line with modern password managers (1Password 8, Bitwarden 2023+, Vercel, Linear) while improving usability, accessibility, and consistency.

## Summary of Design Decisions

| Aspect | Decision |
|---|---|
| Scope | All five surfaces (popup, options, inline picker, save/update prompts, edit form) |
| Visual style | Modern + Flat (Linear, Vercel, Stripe reference) |
| Color theme | Neutral grays + Blue accent (#2563eb) |
| Information architecture | Compact popup (400×600), list-first with inline expand |
| Action pattern | Click card to expand (no modals for primary actions) |
| Icon system | Custom inline SVG (16 icons, dual Vue + Web Component export) |
| Motion | Subtle (120-300ms ease) |
| Accessibility | Full WCAG AA (keyboard nav, ARIA, contrast, focus management) |
| Framework | Vue 3 + Web Components hybrid (Vue for popup/options, Web Components for in-page UI) |
| Tests | Update existing 143 E2E + add visual regression + accessibility audit |
| Version | v2.0.0 |

## Section 1: Design System Foundation

### Design Tokens (`extension/design-tokens.css`)

Single CSS custom properties file consumed by all surfaces. Four layers:

1. **Color palette** — neutral grays, semantic colors, accent blue
2. **Spacing** — 4px base scale (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16)
3. **Radius, shadow, typography, motion** — utility values
4. **Theme variants** — `:root[data-theme="dark"]` overrides

```css
:root {
  /* Surfaces */
  --color-bg: #fafbfc;
  --color-surface: #ffffff;
  --color-surface-raised: #ffffff;
  --color-text: #0f172a;
  --color-text-secondary: #475569;
  --color-text-muted: #94a3b8;
  --color-border: #e2e8f0;
  --color-border-strong: #cbd5e1;
  --color-accent: #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-accent-subtle: #dbeafe;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --color-info: #3b82f6;
  /* Spacing (4px base) */
  --space-0: 0;     --space-1: 4px;  --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;  --space-8: 32px;
  --space-10: 40px; --space-12: 48px; --space-16: 64px;
  /* Radius */
  --radius-sm: 4px; --radius-md: 6px; --radius-lg: 8px; --radius-xl: 12px; --radius-full: 9999px;
  /* Shadow (subtle) */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.08);
  --shadow-lg: 0 8px 24px rgba(0,0,0,0.12);
  /* Typography */
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", Menlo, Consolas, monospace;
  --text-xs: 11px; --text-sm: 12px; --text-base: 13px; --text-md: 14px;
  --text-lg: 15px; --text-xl: 17px; --text-2xl: 20px; --text-3xl: 24px;
  /* Motion */
  --transition-fast: 120ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
  /* Z-index */
  --z-base: 0; --z-overlay: 1000; --z-modal: 2000; --z-toast: 3000;
}
:root[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-surface: #1e293b;
  --color-text: #f1f5f9;
  --color-text-secondary: #cbd5e1;
  --color-border: #334155;
  --color-accent: #3b82f6;
  --color-accent-hover: #60a5fa;
  --color-accent-subtle: #1e3a8a;
}
```

### Icon Library (`extension/icons.js`)

16 custom inline SVG icons, exported as both Vue components and Web Components. All 16×16 viewBox, stroke-based or fill-based, `currentColor`, `aria-hidden="true"`.

| Icon name | Usage |
|---|---|
| `key` | Brand |
| `lock`, `lock-open`, `unlock` | Auth states |
| `copy`, `check` | Copy actions, success |
| `edit`, `pencil`, `plus`, `trash` | CRUD |
| `search`, `filter`, `close`, `chevron-down` | UI controls |
| `eye`, `eye-off` | Password visibility |
| `shield`, `shield-check` | Security |
| `globe` | URL |
| `user`, `user-plus` | Account |

### Component Library (`extension/src/components/`)

**Vue 3 SFCs** (for popup + options):
- `BaseButton` (variants: primary/secondary/ghost/danger, sizes: sm/md/lg, supports leading/trailing icon)
- `BaseInput` (types: text/password/email/url/search, supports leading/trailing icon, error state)
- `BaseToggle` (switch with label + description)
- `BaseSelect` (custom dropdown, no native styling)
- `BaseModal` (overlay with focus trap, ESC close, click-outside)
- `BaseToast` (auto-dismiss 4s, variants: success/error/info/warning, position: top-right)
- `BaseAvatar` (initial or favicon, sizes: sm/md/lg)
- `BaseBadge` (status indicators)
- `BaseTooltip` (hover/focus trigger, 200ms delay)
- Layout: `Stack`, `Inline`, `Spacer`, `Divider`, `Card`

**Web Components** (for in-page UI — content script can import and use them):
- Same primitives compiled to `extension/dist/components.es.js`
- Used in content script via dynamic ES module import
- Custom element names: `kbb-button`, `kbb-input`, `kbb-card`, etc.
- All accept props as attributes, emit custom events

## Section 2: Popup (Main Surface)

**Dimensions:** 400px wide, 500-600px tall (auto), 700px max-height scrollable

### Layout (top to bottom)

```
┌────────────────────────────────────────┐
│ [🔑 KeePass Bridge]              [🌙]  │  Header (48px, sticky)
├────────────────────────────────────────┤
│ [🔍 Search vault...]            [✕]    │  Search (56px, sticky)
├────────────────────────────────────────┤
│ [All] [Work▾] [Personal] [Social]      │  Filter chips (44px, sticky)
├────────────────────────────────────────┤
│ ┌──────────────────────────────────┐   │
│ │ [F] Facebook              [▸]   │   │  Credential card collapsed (64px)
│ │     user@example.com             │   │
│ │     ★ 12x · Yesterday            │   │
│ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────┐   │  Credential card expanded (220px+)
│ │ [F] Facebook               [▾]  │   │
│ │     user@example.com             │   │
│ │     ─────────────────            │   │
│ │     [Username] [👁] [📋]         │   │
│ │     [Password] [👁] [📋]         │   │
│ │     [    ✓ Fill form    ]        │   │
│ │     [Edit] [⋯ More]              │   │
│ └──────────────────────────────────┘   │
│ + New Login          [⚙] [👥]          │  Bottom toolbar (52px, sticky)
└────────────────────────────────────────┘
```

### Component Map

| Region | Components |
|---|---|
| Header | `PopupHeader` (brand + theme toggle) |
| Search | `SearchBar` (leading search icon, trailing clear button when value) |
| Filter | `FilterBar` (chips + overflow dropdown for >5 groups) |
| List | `CredentialList` (virtual scroll for >50 items) |
| Card | `CredentialCard` (collapse/expand, 2 states) |
| Toolbar | `BottomToolbar` (New Login, Settings, Clients) |

### Credential Card States

1. **Default collapsed** — avatar, title, username, last-used meta, chevron
2. **Hover** — surface color shifts to subtle, chevron darkens
3. **Selected/expanded** — inline detail (Username/Password rows with copy), Fill button, Edit, More
4. **Copying** — button shows checkmark for 1.5s, then reverts
5. **Error** — red border, error message inline

### Key Interactions

| Action | Trigger | Result |
|---|---|---|
| Expand card | Click on card body (not buttons) | Detail slides down inline |
| Collapse card | Click chevron / press Esc / click outside card | Detail slides up |
| Fill form | Click "✓ Fill form" / press Enter on selected | Fill form fields, close popup, show toast |
| Copy username | Click "📋" next to username | Copy to clipboard, button shows checkmark |
| Edit entry | Click "Edit" / Right-click → Edit | Inline edit form replaces detail |
| Search | Type in search bar (200ms debounce) | Filter list, fuzzy highlight match |
| Filter group | Click filter chip | Show only entries in group |
| Keyboard nav | ↑↓ between cards, Enter expand, Esc collapse, Tab buttons | Navigate without mouse |
| Context menu | Right-click on card | Dropdown: Fill, Edit, Copy username, Copy password, Delete |
| Add new | Click "+ New Login" | Inline create form (similar to edit) |
| Lock bridge | Click lock icon | Set locked state, show "Unlock KeePass" prompt |

### Empty States

| State | Display |
|---|---|
| No credentials | Friendly illustration (key icon) + "No logins yet" + "Add your first login" CTA |
| Search no match | "No results for '{query}'" + clear button |
| No match for URL | "No logins for {domain}" + "Create new" CTA |
| Locked | Lock icon + "KeePass is locked" + "Unlock" button (focuses) |
| Disconnected | Warning icon + "Can't reach KeePass" + retry button |

### Loading States

- Initial: skeleton list (3 ghost cards, 300ms fade-in)
- Search: subtle spinner inside search bar
- Save: toast bottom-center "Saved as {title}" + undo (5s window)

## Section 3: Options Page

**Dimensions:** 800px wide, max-height 700px (scrollable)

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [🔑 KeePass Bridge]                  v2.0.0    [🌙]          │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────┐                                                   │
│  │ General │  Active tab content                               │
│  │ Bridge  │                                                   │
│  │ Auto    │  [Sections with cards, toggles, inputs]           │
│  │ Sites   │                                                   │
│  │ Clients │                                                   │
│  │ Passkey │                                                   │
│  │ About   │                                                   │
│  └─────────┘                                                   │
│                                                              │
│  [Reset]                                       [Save changes]│
└──────────────────────────────────────────────────────────────┘
```

Sidebar: 200px fixed, scrollable. Active tab: accent background + bold text.

### Tabs

1. **General** — Theme selector, language, auto-lock timeout
2. **Bridge** — Endpoint URL, connection status, last checked, "Test connection" button, debug log
3. **Auto-fill** — Enable auto-fill toggle, auto-submit toggle, delay slider (200-2000ms), "Show inline button" toggle
4. **Sites** — Per-site rules (search, list, add/remove, edit delay), allow/block toggles
5. **Clients** — Trusted browsers table (name, permissions, last used, revoke)
6. **Passkeys** — Enable toggle, status badge, supported sites info
7. **About** — Version, GitHub link, changelog preview, "Export logs" button, acknowledgments

### Form Patterns

- **Toggle row:** `[Label]  [Description text...]  [Toggle]`
- **Input row:** `Label / Helper text [Input] / Error text (if invalid)`
- **Slider:** `Label [————●————] 1200ms`
- **Segmented control:** `Label ( Option A | Option B | Option C )`
- **Card section:** `┌─ Section title ─┐ [content] └─────────┘`
- **Table row:** hover state, action menu (⋮) on right

### Save Action

- Sticky bottom bar, `Save` (primary) + `Reset` (ghost)
- Save disabled until form dirty
- On save: toast "Settings saved" + smooth scroll to top
- On error: inline error under field, focus first invalid input

## Section 4: Inline Picker (In-page UI)

**Position:** Floating panel, attached to the "K" inline button, smart positioning to stay in viewport.

### "K" Inline Button

- **Position:** Right-aligned inside input field, vertical-center, absolute positioned within input's offset parent
- **Size:** 20×20px circular
- **Style:** Background `var(--color-accent)`, text "K" in white, font-weight 700
- **States:** default, hover (scale 1.1), success (background green, "OK" text 1.5s), error (background red, "!" text 1.5s)

### Picker Panel

- **Width:** 360px (smart: min 280, max 90vw)
- **Height:** max 420px, scrollable
- **Position:** Below input by default; flip above if no space below; shift horizontally to stay in viewport
- **Background:** `var(--color-surface)`, border `var(--color-border)`, shadow `var(--shadow-lg)`, radius `var(--radius-xl)`
- **z-index:** `var(--z-overlay)` (1000)
- **Animation:** fade-in + slide-down 200ms

### Picker Layout

```
┌──────────────────────────────────────┐
│ 2 logins for facebook.com     [✕]  │  Header (40px)
├──────────────────────────────────────┤
│ [🔍 Search...]                      │  Search (only if >4 entries, 40px)
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐│
│ │ [F] Facebook              [▸]   ││  Entry collapsed
│ │     user@example.com            ││
│ │     ★ 12x · Yesterday           ││
│ ├──────────────────────────────────┤│
│ │ [F] Facebook              [▾]   ││  Entry expanded
│ │     user@example.com            ││
│ │     ─────────────────           ││
│ │     [✓ Fill form]                ││  Primary
│ │     [Fill user] [Copy user]      ││  2-col
│ │     [Fill pass] [Copy pass]      ││  2-col
│ │     ──── Custom fields ────      ││  Group header
│ │     [Fill] [Copy] URL Messenger  ││  Field row
│ │     [Fill] [Copy] *something     ││  Field row
│ └──────────────────────────────────┘│
└──────────────────────────────────────┘
```

### Picker Interactions

| Action | Trigger | Result |
|---|---|---|
| Open picker | Click "K" button / focus input + show button | Panel appears below |
| Close picker | Click ✕ / click outside / press Esc | Panel slides up + fade out |
| Expand entry | Click on entry (not buttons) | Detail slides inline |
| Collapse entry | Click chevron / press Esc inside | Detail collapses |
| Fill form | Click "✓ Fill form" / Enter on selected | Fill form fields, close picker, K button shows "OK" |
| Fill specific field | Click "Fill user" / "Fill pass" / "Fill OTP" | Fill that field, close picker, K button shows "OK" |
| Copy field | Click "Copy user" / "Copy pass" / "Copy" on custom field | Copy to clipboard, button shows checkmark 1.5s |
| Search | Type in search bar (150ms debounce) | Filter visible entries, fuzzy match |
| Keyboard nav | ↑↓ entries, Tab buttons, Enter fill, Esc close | Full keyboard accessibility |
| Right-click entry | Context menu | Fill, Edit, Copy username, Copy password, Delete |

### Custom Fields Group (within expanded entry)

- Header: "Custom fields (N)" small caps, secondary color
- One row per field: `[Fill] [Copy] [field name]`
- Protected fields (IsProtected=true) are excluded from display
- Empty state: group hidden when no visible custom fields

## Section 5: Save / Update Prompts

### Save Prompt (after form submit, login not in vault)

- **Trigger:** Form submit detected, no matching entry found, user has write permission
- **Position:** Anchored to form's right edge, slide-in from right
- **Size:** 360px wide, auto-height
- **Auto-dismiss:** 30s with countdown
- **Background:** `var(--color-surface)`, shadow `var(--shadow-lg)`, radius `var(--radius-xl)`

```
┌──────────────────────────────────────┐
│ 🔑 Save login for facebook.com?    │  Header
│ ────────────────────────────         │
│ Username: user@example.com          │  Read-only display
│ Password: ●●●●●●●●●●●●              │
│ ────────────────────────────         │
│ Title                                │  Editable inputs
│ [Facebook                       ]   │
│ URL                                  │
│ [https://facebook.com/login      ]   │
│ Folder                               │
│ [Social                          ▾]  │
│ ────────────────────────────         │
│ [✓ Save]  [Never]  [✕ Close]         │  Actions
└──────────────────────────────────────┘
```

| Action | Result |
|---|---|
| Click "✓ Save" | Save to vault via bridge, close prompt, toast "Saved" |
| Click "Never" | Add site to "never save" list, close prompt, toast "Won't ask again for this site" |
| Click ✕ | Dismiss prompt, no action, no memory |
| Auto-dismiss (30s) | Dismiss, no action, no memory |
| Press Esc | Same as ✕ |

### Update Prompt (existing entry detected, fields differ)

Similar to save prompt, but:
- Title: "Update login for facebook.com?"
- Show diff: "New password (12 chars)" highlighted
- Buttons: `[Update]  [Skip]  [✕]`
- Update triggers bridge mutation, closes prompt, toast "Updated"

## Section 6: Edit Form (in popup, inline)

Replaces card detail when user clicks Edit.

```
┌──────────────────────────────────────┐
│ [F] Editing Facebook          [✕]   │  Header with close
│ ────────────────────────────         │
│ Title                                │
│ [Facebook                       ]   │
│ URL                                  │
│ [https://facebook.com/login      ]   │
│ Username                             │
│ [user@example.com                ]   │
│ Password                      [👁]  │  Toggle visibility
│ [●●●●●●●●●●●●●                ]   │
│ [🎲 Generate strong password]       │  Generator button
│ Folder                               │
│ [Social                          ▾]  │
│ ──── Custom fields ────              │
│ URL Messenger                        │
│ [https://m.me/login              ]   │
│ [🗑]                                  │  Per-field delete
│ [Recovery Email                      │
│ [recovery@example.com           ]]   │
│ [🗑]                                  │
│ [+ Add field]                        │
│ ────────────────────────────         │
│ [Cancel]              [Save changes] │  Footer actions
└──────────────────────────────────────┘
```

### Edit Form Behaviors

- **Dirty state tracking** — Save disabled until any field changed
- **Real-time validation** — invalid fields show error message below input
- **Password generator** — opens `PasswordGenerator` inline, replaces password field
- **Custom field add** — appends new row to custom fields list, defaults to empty name + value
- **Custom field delete** — removes field, prompts confirm if field has value
- **Press Esc** — if dirty, show confirm "Discard changes?"; if not dirty, close
- **Press Cmd/Ctrl+S** — save if valid
- **Save** — sends to bridge, closes edit, shows toast

## Section 7: Architecture

### File Structure

```
extension/
├── design-tokens.css              # Single source of truth for tokens
├── icons.js                       # 16 SVG icons (Vue + Web Component dual export)
├── shared/                        # Framework-agnostic utilities
│   ├── validators.js              # Form validation (URL, email, etc.)
│   ├── formatters.js              # Date, time, count formatters
│   └── storage.js                 # Chrome storage wrapper
├── src/                           # Vue 3 source
│   ├── components/                # Base* components (BaseButton, BaseInput, ...)
│   ├── composables/               # useBridge, useTheme, useToast, useFocusTrap
│   ├── popup/                     # Popup App.vue + feature components
│   │   ├── App.vue
│   │   ├── main.js
│   │   ├── CredentialCard.vue
│   │   ├── DetailView.vue
│   │   ├── EditForm.vue
│   │   ├── NewLoginForm.vue
│   │   ├── FilterBar.vue
│   │   ├── SearchBar.vue
│   │   ├── EmptyState.vue
│   │   ├── PasswordGenerator.vue
│   │   └── StatusBar.vue
│   └── options/                   # Options App.vue + tab components
│       ├── App.vue
│       ├── main.js
│       └── tabs/
│           ├── GeneralTab.vue
│           ├── BridgeTab.vue
│           ├── AutoFillTab.vue
│           ├── SitesTab.vue
│           ├── ClientsTab.vue
│           ├── PasskeyTab.vue
│           └── AboutTab.vue
├── dist/                          # Built artifacts (in release package)
│   ├── popup.js                   # Vue popup bundle
│   ├── options.js                 # Vue options bundle
│   ├── popup.css                  # Extracted from Vue SFCs
│   ├── options.css                # Extracted from Vue SFCs
│   ├── components.es.js           # Web Components bundle
│   ├── runtime-dom.esm-bundler.js
│   └── icons.es.js                # Web Component icons
├── contentScript.js               # In-page logic, imports Web Components
├── background.js                  # Service worker
├── popup.html                     # Mount point
├── options.html                   # Mount point
└── manifest.json                  # MV3 manifest
```

### Build Pipeline

```bash
# Build all bundles
npm run build:all

# Individual builds
npm run build:popup        # Vue popup bundle
npm run build:options      # Vue options bundle
npm run build:components   # Web Components bundle
```

Vite config defines three entries:
- `src/popup/main.js` → `dist/popup.js` + extracts `dist/popup.css`
- `src/options/main.js` → `dist/options.js` + extracts `dist/options.css`
- `src/components/index.js` → `dist/components.es.js` (Web Components)

### Runtime Loading

- **Popup:** Chrome opens `popup.html` → loads `dist/popup.js` (ES module) + `dist/popup.css`
- **Options:** Chrome opens `options.html` → loads `dist/options.js` (ES module) + `dist/options.css`
- **Content script:** Loaded by Chrome via manifest, dynamically imports `dist/components.es.js` for Web Components (using `chrome.runtime.getURL()` + dynamic `import()`)
- **Background:** Plain service worker, no UI

## Section 8: Testing Strategy

### Unit Tests (per component)

- Render with different props/states
- User interactions (click, type, keyboard)
- Accessibility (ARIA attributes, focus management)
- Located in `tests/extension/`
- Target: 200+ unit tests

### Visual Regression (per surface × 2 themes)

- **Surfaces:** popup (default, search active, expanded, edit, new, empty, locked), options (each tab), inline picker (collapsed, expanded, search, custom fields), save prompt, update prompt
- **Themes:** light + dark
- **Count:** ~50 screenshots
- **Location:** `tests/__screenshots__/v2/`
- **Auto-generated:** Playwright + extension load + page.evaluate to set state

### E2E Tests (extend existing 143)

- Update existing tests for new selectors (`data-testid` attributes)
- Add: keyboard nav, theme switching, edit flow, save flow, multi-entry picker, custom field display, copy actions
- Target: 250+ E2E tests passing

### Accessibility Tests

- axe-core integration in Playwright
- Keyboard navigation E2E (Tab, Shift+Tab, Enter, Space, Esc, Arrow keys)
- Color contrast verification (manual + automated where possible)
- Screen reader smoke test (manual checklist for v2.0)

## Section 9: Migration from v1.0 to v2.0

### Backend Compatibility

- **No bridge protocol changes** — `BridgeRequestHandler` and `ProtocolModels` unchanged
- **No storage schema changes** — existing settings remain valid
- New optional setting: `themePreference` (defaults to "system")

### User-Facing Breaking Changes

1. Popup visual redesign — existing users see new UI immediately on update
2. Some popup actions moved (e.g., "Edit" was top-right icon, now in expanded card)
3. Settings reorganized into tabs (Bridge endpoint moved to dedicated "Bridge" tab)
4. Save/update prompts redesign (different visual, similar behavior)
5. Inline picker redesigned (different visual, same behavior)

### Migration Path

- No automatic migration needed
- Default values for new settings: `themePreference: "system"`
- All existing settings preserved
- On first launch of v2.0, users see redesigned UI with their existing data

### Rollback

- v1.0 remains available for download
- Users can downgrade via Chrome Web Store (Chrome keeps previous version for 30 days)
- Settings preserved across versions

## Section 10: Implementation Phases

### Phase 1: Design System (3 working days)

**Day 1-2:**
- `extension/design-tokens.css` — full token set
- `extension/icons.js` — 16 SVG icons with dual Vue + Web Component export
- `extension/src/components/Base*.vue` — BaseButton, BaseInput, BaseToggle, BaseSelect, BaseModal, BaseToast, BaseAvatar, BaseBadge, BaseTooltip
- `extension/shared/validators.js`, `formatters.js`, `storage.js`

**Day 3:**
- Vite config updates (3 entries, CSS extraction)
- Web Components build pipeline
- Component unit tests (200+ tests)

**Deliverable:** All base components functional, design tokens, icons, build pipeline working.

### Phase 2: Popup (4 working days)

**Day 4-5:**
- Rewrite `popup.html` with new structure
- Rewrite `App.vue` using Base* components
- `CredentialCard.vue` with collapse/expand state
- `SearchBar.vue` with debounce + clear button
- `FilterBar.vue` with overflow dropdown

**Day 6:**
- `DetailView.vue` with Username/Password rows + copy buttons
- `EditForm.vue` with custom fields editor
- `NewLoginForm.vue` similar to edit, without existing data
- `PasswordGenerator.vue` inline panel
- `EmptyState.vue` with 3 variants

**Day 7:**
- `BottomToolbar.vue` (New Login, Settings, Clients)
- `StatusBar.vue` (lock, paired status)
- Update existing popup tests for new selectors
- Add new popup tests (keyboard nav, expand/collapse, edit flow)

**Deliverable:** Fully redesigned popup with all CRUD flows, all 143 existing popup tests pass + new tests.

### Phase 3: Options (3 working days)

**Day 8-9:**
- Tab navigation sidebar
- `GeneralTab.vue` — theme, language, auto-lock
- `BridgeTab.vue` — endpoint, status, test connection
- `AutoFillTab.vue` — toggles, delay slider

**Day 10:**
- `SitesTab.vue` — per-site rules with search
- `ClientsTab.vue` — trusted browsers table
- `PasskeyTab.vue` — enable toggle, status
- `AboutTab.vue` — version, links, log export
- Update existing options tests

**Deliverable:** Fully redesigned options page with all 7 tabs.

### Phase 4: Inline Picker (3 working days)

**Day 11-12:**
- Web Components bundle (BaseButton, BaseInput, BaseCard as Web Components)
- `contentScript.js` import Web Components
- `showInlinePicker` rebuild using Web Components
- `createPickerCustomFieldGroup` rebuild

**Day 13:**
- Smart positioning algorithm (flip above, shift horizontally)
- Keyboard navigation (↑↓ entries, Tab buttons, Enter fill, Esc close)
- Search input + fuzzy match
- Update existing 30+ inline picker tests

**Deliverable:** Fully redesigned inline picker with Web Components, keyboard accessible, 30+ tests pass.

### Phase 5: Save / Update Prompts (2 working days)

**Day 14:**
- `showSaveLoginPrompt` rebuild using Web Components
- Slide-in animation
- Auto-dismiss with countdown
- "Never for this site" persistence

**Day 15:**
- `showUpdatePrompt` rebuild with diff display
- Form validation in prompts
- Update existing 20+ prompt tests

**Deliverable:** Redesigned save/update prompts, 20+ tests pass.

### Phase 6: Test + Polish (3 working days)

**Day 16:**
- Visual regression setup: Playwright + extension, capture 50 screenshots
- Update all 143 existing tests for new selectors
- Add 100+ new tests (keyboard nav, theme switching, edit flow)

**Day 17:**
- Accessibility audit: axe-core integration, contrast checks
- Manual testing on 5 sites: Facebook, GitHub, AWS console, forum.aigato.vn, Gmail
- Bug fixes from manual testing

**Day 18:**
- Final polish: subtle motion, hover states, focus rings
- Documentation: update README, screenshots in README
- Release notes for v2.0
- Package signed release

**Total: 18 working days (~3.5 weeks)**

## Open Questions

None — all design decisions resolved.

## Out of Scope

- Bridge protocol changes (still v1.0 protocol)
- Backend (KeePass plugin C#) changes
- New passkey features beyond current
- Mobile browser support
- Sync between devices (KeePass Sync is separate)
- Cloud backup
- Two-factor authentication for the extension itself

## Success Criteria

- All 250+ E2E tests pass
- All 200+ unit tests pass
- All 50+ visual regression screenshots match design
- axe-core reports 0 critical violations on all 5 surfaces
- Manual testing on 5 real sites shows no visual glitches
- Popup opens in <100ms
- Inline picker appears in <50ms
- All user flows keyboard-accessible
- Dark mode parity verified on all surfaces
- Bundle size stays <200KB total
