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
- Edit existing KeePass entries from the popup, including non-protected custom fields.
- New-login popup form prefilled from fields already typed on the page when available.
- HTTP Basic Auth fill support.
- Site-specific auto-fill and auto-submit overrides.
- Trusted browser listing and revocation.
- About panel showing extension and KeePass plugin versions plus GitHub release update check.
- KeePass plugin update checking through the built-in KeePass updater.
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

## Local Verification

From this repository:

```powershell
.\scripts\verify.ps1
```

The verifier runs extension syntax checks, unit tests, Chromium E2E tests, bridge tests, and plugin compilation.

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

`versioninfo.txt` is the KeePass plugin update metadata. Publish the same content at the URL configured by the plugin's `UpdateUrl` property so KeePass can report newer plugin releases from its built-in update check.

## Repository Layout

- `src/` - KeePass plugin and loopback bridge backend.
- `extension/` - browser extension source.
- `tests/` - bridge, extension, and E2E tests.
- `scripts/` - local verification and release packaging scripts.
- `docs/` - architecture and planning notes.
