# KeePass Browser Bridge

Version 2.0.0

Bridge between KeePass 2.x and your browser. Chrome MV3 + Firefox.

## Features

- Popup and inline credential picker with search, keyboard nav, dark mode
- Save new logins, update changed passwords
- TOTP/OTP generation, HTTP Basic Auth, custom fields
- Passkeys/WebAuthn (enabled) with strict RP ID validation
- Loopback-only bridge with HMAC-SHA256 pairing
- 250+ E2E + unit + visual regression + a11y tests

## Comparison

| Feature | Kee | KeePassXC-Browser | KBB |
|---------|:---:|:-----------------:|:---:|
| KeePass plugin | ✅ | ✅ (native) | ✅ |
| HTTP Basic Auth | ❌ | ❌ | **✅** |
| TOTP + split inputs | ✅ | ✅ | ✅ |
| Inline picker | ✅ | ✅ | **✅ Card + favicon** |
| Site overrides | ❌ | ✅ | ✅ |
| Custom fields | ✅ | ✅ | ✅ |
| Dark mode | ❌ | ✅ | **✅ Auto system** |
| Password generator | ✅ | ✅ | **✅ Popup panel** |
| Passkeys/WebAuthn | ❌ | ✅ | **✅ (enabled)** |
| E2E test coverage | Partial | Partial | **250+ tests** |

## Install

1. Download `KeePassBrowserBridge.plgx` or `.dll` from [Releases](https://github.com/hieuck/KeePassBrowserBridge/releases)
2. Place in KeePass `Plugins` directory
3. Restart KeePass, enable browser integration
4. Install Chrome/Firefox extension from store
5. Pair with KeePass from extension popup

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
npm test                  # vitest unit tests
npm run test:e2e:chromium # Playwright E2E (Chromium)
.\scripts\verify.ps1       # Full verification
```

## Release

```powershell
.\scripts\build-release.ps1 -RequireCleanSource
.\scripts\verify-release-artifacts.ps1
```

Creates `KeePassBrowserBridge-chrome-extension-<version>.zip` and `KeePassBrowserBridge-firefox-extension-<version>.zip`.

For local install: `.\scripts\install-plugin.ps1`. Store screenshots: `.\scripts\capture-store-screenshots.ps1`.

## Repository Layout

- `src/` — KeePass plugin C# backend
- `extension/` — Browser extension source (Vue 3 + Web Components)
- `tests/` — Bridge, extension, E2E tests
- `scripts/` — Build, verify, release scripts
- `docs/` — Architecture, security, store submission docs

See `docs/store-submission.md`, `docs/passkeys-webauthn-design.md`, `docs/privacy-policy.md`, `docs/release-integrity.md`, and `docs/release-notes-template.md` for additional documentation.
