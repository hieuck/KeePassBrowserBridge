# UI/UX Redesign — Component-Based Design System

**Date:** 2026-06-21
**Status:** Approved

## Goal

Rewrite all browser extension UI surfaces (popup, options page, inline picker, save/update prompts) using a shared component-based design system. Modern/Flat visual style with dark mode support.

## Architecture

```
shared-components.js ←─ popup.html + popup.js
                    ←─ options.html + options.js
                    ←─ inline picker (contentScript.js + styles)
                    ←─ save/update prompts (contentScript.js + styles)

design-tokens.css    ←─ imported by all surfaces
```

## Component Library

| Component | API | Used In |
|-----------|-----|---------|
| `createAvatar(initial, color)` | Returns `<div class="avatar">E</div>` | Popup, Inline |
| `createCredentialCard(entry, options)` | Full credential card with actions | Popup, Inline |
| `createSearchInput(placeholder, onInput)` | Search with clear button | Popup, Inline |
| `createToggle(checked, onChange)` | Switch toggle | Popup, Options |
| `createBadge(text, variant)` | Status badge (paired/locked/error) | Popup |
| `createToast(message, variant)` | Auto-dismiss notification | Popup, Options |
| `createModal(title, content)` | Overlay dialog | Popup (edit) |
| `createActionButton(text, variant)` | Primary/secondary/icon/danger | All |

## Implementation Phases

### Phase 1: Design tokens + shared components
- Create `extension/design-tokens.css` with CSS custom properties
- Extract existing CSS into design tokens
- Create `extension/shared-components.js` with factory functions
- Unit tests for each component

### Phase 2: Popup redesign
- Rebuild `extension/popup.html` layout with new components
- Rewrite `renderResults()` to use `createCredentialCard()`
- Add bottom toolbar with lock/sites/clients/about
- Improve search with filter chips

### Phase 3: Options page redesign
- Tabbed layout: General, Sites, Clients, About
- Use shared components (Toggle, Badge, Toast)
- Consistent spacing and typography

### Phase 4: Inline picker redesign
- Match popup card style
- Floating credential list with search
- Keyboard navigation

### Phase 5: Save/update prompts redesign
- Slide-in notification style
- Better form layout with shared components

## Testing

- Each component gets unit tests in `tests/extension/`
- E2E tests verify all surfaces render correctly with components
- Existing 120+ E2E tests must remain green
- Visual regression: dark mode parity for all new components
