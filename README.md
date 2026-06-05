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

## Known Gap

Passkeys/WebAuthn are not supported in version 0.9.0. A backend-only C# prototype now covers RP ID validation, ES256 credential material and create-algorithm policy enforcement, assertion signing, sign-count updates, protected KeePass storage fields, disabled feature discovery with `prototype_disabled` status metadata, KeePass approval grant/deny handling, invalid user-handle rejection before approval, excluded-credential rejection for create requests, attestation-conveyance rejection beyond `none`, browser timeout hints clamped to the backend pending-session maximum, requested `credProps` extension results for discoverable credentials, and reserved list/create/get/cancel/revoke bridge routes behind a disabled feature gate. Reserved `passkeyRead`/`passkeyWrite` permission bits exist for policy tests, the plugin build includes a KeePass approval dialog prototype for future feature-gated passkey requests, and the extension has test-backed trusted-browser passkey permission controls that stay hidden unless bridge feature discovery reports `passkeys=true`. The non-packaged Chrome proxy experiment now includes a fail-closed trusted-origin resolver helper for browser-supplied requestInfo or frame context, rejects invalid RP IDs, invalid challenges, invalid user handles, required user verification, create requests that do not allow ES256, and unsupported attestation conveyance, forwards create `excludeCredentials`, create/get timeout hints, and create `credProps` extension requests/results, and rejects duplicate pending WebAuthn request IDs before handler dispatch. Released builds still do not request a browser WebAuthn proxy permission or enable any user-facing passkey flow. The implementation design is tracked in `docs/passkeys-webauthn-design.md` so future work can add the browser integration and release review deliberately.

## Security Model

- The browser extension never stores the KeePass master key.
- KeePass remains the only process with direct database access.
- The bridge listens only on `127.0.0.1` and accepts JSON bridge requests only.
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

For a local release artifact, close KeePass and install exactly one plugin artifact with:

```powershell
.\scripts\install-plugin.ps1 -ArtifactType dll
```

Chrome does not allow one-click extension installation directly from GitHub. One-click install requires publishing to the Chrome Web Store.

After the first plugin install, KeePass Browser Bridge checks GitHub Releases on startup and prompts when a newer `.plgx` is available. You can also run this manually from `Tools -> KeePass Browser Bridge -> Check for Updates...`; the plugin downloads `SHA256SUMS.txt`, verifies the downloaded PLGX hash, removes or refuses a duplicate DLL artifact, installs the release asset into the KeePass `Plugins` directory, and asks you to restart KeePass.

Migrating from Kee/KeePassRPC or KeePassXC-Browser is covered in `docs/migration-guide.md`.

## Local Verification

From this repository:

```powershell
.\scripts\verify.ps1
```

The verifier runs extension syntax checks, unit tests, Chromium E2E tests, bridge tests, plugin compilation, a clean-source release-gate smoke test, and a signed-release smoke test with a fake GPG command.

Release-candidate verification should include Firefox as well:

```powershell
.\scripts\verify.ps1 -E2EProjects chromium,firefox
```

Real-site-inspired autofill coverage is tracked in `docs/real-site-validation.md`.

## Build Release Artifacts

```powershell
.\scripts\build-release.ps1
.\scripts\verify-release-artifacts.ps1
```

For public release candidates, build from a clean worktree so release provenance cannot silently publish dirty source:

```powershell
.\scripts\build-release.ps1 -RequireCleanSource
.\scripts\verify-release-artifacts.ps1
```

This creates release artifacts under `%TEMP%\KeePassBrowserBridge-artifacts\` by default:

- `KeePassBrowserBridge.dll`
- `KeePassBrowserBridge.plgx`
- `KeePassBrowserBridge-chrome-extension-<version>.zip`
- `KeePassBrowserBridge-firefox-extension-<version>.zip`
- `versioninfo.txt`
- `release-manifest.json`
- `SHA256SUMS.txt`

Keeping generated DLL/PLGX outputs outside this repository matters when the repository itself is inside KeePass' `Plugins` directory, because KeePass scans plugin subdirectories on startup.

`versioninfo.txt` is still emitted for compatibility with KeePass update metadata, while the plugin's own update checker installs `KeePassBrowserBridge.plgx` directly from GitHub Releases.

Browser-store screenshots can be regenerated from the actual extension UI with safe fixture data:

```powershell
.\scripts\capture-store-screenshots.ps1
```

Store listing metadata, permission justifications, privacy statements, reviewer notes, and screenshot expectations are tracked in `docs/store-submission.md`.

Signed release candidates can be built with `.\scripts\build-release.ps1 -RequireCleanSource -SignArtifacts -GpgKeyId "<release-key-id>"` and verified with `.\scripts\verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<full-fingerprint>"`.

The publishable privacy-policy source is `docs/privacy-policy.md`. Release-note, checksum, and signature-verification guidance is tracked in `docs/release-notes-template.md` and `docs/release-integrity.md`.

## Repository Layout

- `src/` - KeePass plugin and loopback bridge backend.
- `extension/` - browser extension source.
- `tests/` - bridge, extension, and E2E tests.
- `scripts/` - local verification and release packaging scripts.
- `docs/` - architecture and planning notes.
- `docs/replacement-roadmap.md` - replacement criteria and roadmap for Kee/KeePassXC-Browser parity.
- `docs/release-readiness.md` - release checklist, local install check, and browser-store package notes.
- `docs/security-threat-model.md` - bridge security model, implemented controls, and residual risks.
- `docs/store-submission.md` - Chrome Web Store, Firefox AMO, and Edge Add-ons listing and review notes.
- `docs/migration-guide.md` - migration and rollback guide for users moving from Kee/KeePassRPC or KeePassXC-Browser.
- `docs/passkeys-webauthn-design.md` - passkey/WebAuthn design and test plan before implementation.
- `docs/privacy-policy.md` - publishable browser-store privacy policy source.
- `docs/release-integrity.md` - release artifact checksum verification and signing limitations.
- `docs/release-notes-template.md` - GitHub Release and browser-store update notes template.
