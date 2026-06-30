# KeePass Browser Bridge

Version 2.1.0

Bridge between KeePass 2.x and your browser. Chrome MV3 + Firefox.

## Features

- **Popup & inline credential picker** — search, keyboard nav, dark mode, favicons
- **Save new logins** — auto-detect form submission, save prompt with group picker
- **Update changed passwords** — detect password changes, update prompt
- **Group browser** — tree-based group hierarchy from KeePass
- **Keyboard shortcuts** — `Ctrl+Shift+F` fill credentials, `Ctrl+Shift+K` open popup
- **Lock database from browser** — lock KeePass workspace directly
- **Auto-type** — trigger KeePass global auto-type from browser
- **TOTP/OTP** — display and copy one-time passwords
- **HTTP Basic Auth** — auto-fill HTTP auth dialogs
- **Custom fields** — display and copy custom string fields
- **Password generator** — configurable length, symbols, exclude-ambiguous
- **Inline copy** — one-click copy username/password from collapsed card
- **Inline credential picker** — `kbb-picker` web component for in-page selection
- **Save/update prompts** — `kbb-save-prompt` and `kbb-update-prompt` web components
- **Site overrides** — per-site auto-fill enable/disable
- **Multi-database info** — current database name and path display
- **i18n** — English + Vietnamese locale, `chrome.i18n` based
- **Passkeys/WebAuthn** — supported with strict RP ID validation
- **Settings import/export** — portable settings with validation

## Comparison

| Feature | Kee | KeePassXC-Browser | KBB |
|---------|:---:|:-----------------:|:---:|
| KeePass plugin | ✅ | ✅ (native) | ✅ |
| Auto-fill forms | ✅ | ✅ | ✅ |
| Save new login | ✅ | ✅ | ✅ |
| Update password | ✅ | ✅ | ✅ |
| TOTP display | ✅ | ✅ | ✅ |
| Custom fields | ✅ | ✅ | ✅ |
| Inline picker | ✅ | ✅ | ✅ |
| HTTP Basic Auth | ❌ | ❌ | **✅** |
| Keyboard shortcuts | ❌ | ✅ | **✅** |
| Lock DB from browser | ❌ | ✅ | **✅** |
| Auto-type | ❌ | ✅ | **✅** |
| Group tree browser | ❌ | ✅ | **✅** |
| Password generator | ✅ | ✅ | **✅ Exclude-ambiguous** |
| Inline copy from card | ✅ | ✅ | **✅** |
| Dark mode | ❌ | ✅ | **✅ Auto system** |
| Site overrides | ❌ | ✅ | ✅ |
| i18n / translations | ✅ (20) | ✅ (45) | **✅ 8 locales** |
| Passkeys/WebAuthn | ❌ | ✅ | **✅ Production** |
| Multi-database info | ✅ | ❌ | **✅** |
| Keyboard shortcuts count | 4 | 10+ | **✅ 6** |
| Accessibility WCAG AA | ❌ | ❌ | **✅** |
| C# test suite | N/A | N/A | **✅ 200+ tests** |
| Total automated tests | Partial | Partial | **✅ 902 tests** |
| Code coverage | Partial | Partial | **✅ 95.8%** |
| Mutation testing | Partial | ✅ | **✅ Stryker** |
| CI pipeline | ✅ | ✅ | **✅ 7+ jobs, 4 browsers** |
| Release automation | Partial | ✅ | **✅** |

## Test Status

| Runner | Count | Status |
|--------|-------|--------|
| vitest unit tests | 902 | ✅ 0 failures |
| Code coverage | 95.8% | ✅ stmts / 84.89% branches |
| Playwright Chromium | 220 | ✅ 0 failures |
| Playwright Firefox | 162 | ✅ 0 failures |
| Playwright Edge | — | ✅ CI matrix |
| Playwright WebKit | — | ✅ CI matrix |
| Accessibility WCAG AA | 10 | ✅ 0 violations |
| C# bridge tests | 200+ | ✅ exit 0 |
| .NET build | — | ✅ 0 errors |
| ESLint | — | ✅ 0 errors, 0 warnings |

## Install

1. Download `KeePassBrowserBridge.plgx` or `.dll` from [Releases](https://github.com/hieuck/KeePassBrowserBridge/releases)
2. Place in KeePass `Plugins` directory
3. Restart KeePass, enable browser integration in `Tools > KeePass Browser Bridge`
4. **Chrome:** Install from [Chrome Web Store](#) (pending) or load unpacked from `extension/` directory
5. **Firefox:** Install from [Firefox Add-ons](#) (pending) or load temporary add-on from `extension/` directory
6. Pair with KeePass from extension popup

> **Store listing is in progress.** For now, install via developer mode:
> - **Chrome:** `chrome://extensions` → Enable Developer mode → Load unpacked → Select `extension/` folder
> - **Firefox:** `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → Select `extension/manifest.firefox.json`

See `docs/migration-guide.md` for migrating from Kee/KeePassRPC or KeePassXC-Browser.

## Build from Source

```powershell
git clone https://github.com/hieuck/KeePassBrowserBridge.git
cd KeePassBrowserBridge
npm install
npm run build:all
.\scripts\verify.ps1
```

## Test

```powershell
npm test                  # vitest unit tests (698)
npm run test:e2e:chromium # Playwright E2E (Chromium)
.\scripts\verify.ps1      # Full verification
npm run test:e2e:headed   # Watch tests in browser
```

## Release

```powershell
.\scripts\build-release.ps1 -RequireCleanSource
.\scripts\verify-release-artifacts.ps1
```

Creates `KeePassBrowserBridge-chrome-extension-<version>.zip` and `KeePassBrowserBridge-firefox-extension-<version>.zip`.

For local install: `.\scripts\install-plugin.ps1`. Store screenshots: `.\scripts\capture-store-screenshots.ps1`.

## Repository Layout

- `src/` — KeePass plugin C# backend (20 files, 0 build errors)
- `extension/` — Browser extension source (Vue 3 + Web Components)
- `tests/` — Bridge C#, extension (vitest/Playwright), E2E, visual regression, accessibility
- `scripts/` — Build, verify, release automation
- `docs/` — Architecture, security, store submission, privacy, migration

See `docs/store-submission.md`, `docs/passkeys-webauthn-design.md`, `docs/privacy-policy.md`, `docs/release-integrity.md`, `docs/release-notes-template.md`, and `docs/replacement-roadmap.md`.
