# KeePass Browser Bridge Extension

Version 0.9.0

This directory contains the Chrome MV3 and Firefox-compatible browser extension for KeePass Browser Bridge. The extension talks to the KeePass plugin through the local loopback bridge at `http://127.0.0.1:19455/bridge`.

## Current Features

- Pair with KeePass using a short-lived pairing code.
- Query matching entries for the current page.
- Auto-fill when exactly one login matches.
- Inline account picker with search, keyboard selection, OTP actions, and custom field actions.
- Popup account picker with search over title, group, username, URL, and non-protected custom fields.
- Fill full forms or fill the focused field with username, password, OTP, or selected non-protected custom fields.
- Copy username, password, OTP, and non-protected custom fields with clipboard auto-clear support.
- Create a new KeePass entry from the popup, prefilled from fields already typed on the page when available, with optional non-protected custom field capture.
- Edit existing entries, update changed passwords, generate replacement passwords, add/update/remove non-protected custom fields, and clear TOTP secrets.
- Save/update prompts after submitted login forms, including redirect and multi-step login flows.
- Username-first login support across navigation and same-page password reveal flows.
- HTTP Basic Auth credential lookup.
- Embedded login form support through content scripts running in child frames.
- Site-specific auto-fill and auto-submit overrides.
- Popup lock/unlock to temporarily block credential queries and filling.
- Optional auto-lock after credential inactivity.
- Trusted browser listing and revocation from popup/options.
- About panel showing extension and KeePass plugin versions plus GitHub release update check.

## Security Notes

- The extension never stores the KeePass master key.
- Credential access requires pairing and authenticated bridge requests.
- Bridge endpoints are restricted to `http://127.0.0.1`; bridge calls are JSON `POST /bridge` requests.
- Protected custom field values are not exposed for copy, focused-field fill, or popup search.
- Settings export intentionally excludes pairing secrets.

## Known Gap

Passkeys/WebAuthn are not supported in extension release 0.9.0. Public builds do not request WebAuthn proxy permissions or expose passkey workflows. Backend and proxy experiment work is tracked in `docs/passkeys-webauthn-design.md`.

## Development Checks

From the repository root:

```powershell
.\scripts\verify.ps1
```

To build release artifacts:

```powershell
.\scripts\build-release.ps1
```

Release packaging emits Chrome and Firefox extension ZIP files alongside the KeePass plugin artifacts.

Release and store-submission checks are tracked in `docs/release-readiness.md` and `docs/store-submission.md`. Regenerate store screenshots from fixture data with `scripts/capture-store-screenshots.ps1` after UI changes.
