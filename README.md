# KeePass Browser Bridge

Version 0.9.0

Clean-room KeePass 2.x browser integration inspired by KeePassRPC, Kee, and KeePassXC-Browser.

KeePass Browser Bridge has two release artifacts:

- A KeePass 2.x plugin (`KeePassBrowserBridge.plgx` or `KeePassBrowserBridge.dll`) that owns all database access and exposes a loopback-only bridge.
- A Chrome/Firefox extension ZIP that pairs with the plugin, queries matching entries, and fills browser forms.

## Features

- Short-lived pairing code between browser and KeePass.
- Authenticated loopback requests on `http://127.0.0.1:19455/bridge`.
- URL matching with primary URL, additional `URL (n)` fields, wildcard patterns, and optional regex matching.
- Popup and inline account picker with search, ranking by usage, keyboard selection, and hidden-entry expansion.
- Full form fill plus focused-field fill for username, password, OTP, and selected non-protected custom fields.
- OTP generation from KeePass TOTP fields.
- Save new logins and update changed passwords from page prompts.
- Create KeePass entries from the popup, including non-protected custom fields.
- Edit existing KeePass entries from the popup, including add/update/remove for non-protected custom fields.
- New-login popup form prefilled from fields already typed on the page when available.
- Username-first login support across navigation and same-page password reveal flows.
- HTTP Basic Auth fill support.
- Embedded login form support through content scripts running in child frames.
- Site-specific auto-fill and auto-submit overrides.
- Popup lock/unlock to temporarily block credential queries and filling.
- Optional auto-lock after credential inactivity.
- Trusted browser listing and revocation.
- About panel showing extension and KeePass plugin versions plus GitHub release update check.
- KeePass plugin About dialog with version, endpoint, server status, and update metadata URL.
- KeePass plugin auto-update check that downloads and installs the latest GitHub Release `.plgx`.
- Chrome and Firefox extension packaging.

## Security Model

- The browser extension never stores the KeePass master key.
- KeePass remains the only process with direct database access.
- The bridge listens only on `127.0.0.1`.
- Browser clients must pair before privileged methods are accepted.
- Authenticated requests use a per-client shared secret and HMAC.
- Protected custom field values are not exposed for copy, focused-field fill, or popup search.
- Settings export excludes client IDs, shared secrets, and pairing sessions.

## Install From Release

1. Download `KeePassBrowserBridge.plgx` or `KeePassBrowserBridge.dll` from the GitHub Release.
2. Place exactly one plugin artifact in the KeePass `Plugins` directory.
3. Restart KeePass.
4. Enable browser integration from the KeePass menu if it is not already enabled.
5. Download the Chrome or Firefox extension ZIP from the same release.
6. Load the extension manually in the browser, then pair it with KeePass from the extension popup.

Chrome does not allow one-click extension installation directly from GitHub. One-click install requires publishing to the Chrome Web Store.

After the first plugin install, KeePass Browser Bridge checks GitHub Releases on startup and prompts when a newer `.plgx` is available. You can also run this manually from `Tools -> KeePass Browser Bridge -> Check for Updates...`; the plugin downloads the release asset into the KeePass `Plugins` directory and asks you to restart KeePass.

## Local Verification

From this repository:

```powershell
.\scripts\verify.ps1
```

The verifier runs extension syntax checks, unit tests, Chromium E2E tests, bridge tests, and plugin compilation.

Real-site-inspired autofill coverage is tracked in `docs/real-site-validation.md`.

## Build Release Artifacts

```powershell
.\scripts\build-release.ps1
```

This creates release artifacts under `%TEMP%\KeePassBrowserBridge-artifacts\` by default:

- `KeePassBrowserBridge.dll`
- `KeePassBrowserBridge.plgx`
- `KeePassBrowserBridge-chrome-extension-0.9.0.zip`
- `KeePassBrowserBridge-firefox-extension-0.9.0.zip`
- `versioninfo.txt`

Keeping generated DLL/PLGX outputs outside this repository matters when the repository itself is inside KeePass' `Plugins` directory, because KeePass scans plugin subdirectories on startup.

`versioninfo.txt` is still emitted for compatibility with KeePass update metadata, while the plugin's own update checker installs `KeePassBrowserBridge.plgx` directly from GitHub Releases.

## Repository Layout

- `src/` - KeePass plugin and loopback bridge backend.
- `extension/` - browser extension source.
- `tests/` - bridge, extension, and E2E tests.
- `scripts/` - local verification and release packaging scripts.
- `docs/` - architecture and planning notes.
