# KeePass Browser Bridge 1.0 Completion Design

**Date:** 2026-06-21
**Status:** Approved
**Version:** 1.0.0 (target)

## Goal

Complete KeePassBrowserBridge as a practical replacement for KeePassXC-Browser and Kee - Password Manager, then publish to browser stores.

## Background

The project is at v0.9.0 with all core features working:
- KeePass plugin with loopback HTTP bridge
- Chrome/Firefox MV3 extension
- Pairing, credential query/fill/save/update
- TOTP, HTTP Basic Auth, inline picker, site overrides
- 118+118 E2E tests, 67 unit tests, 90+ C# checks — all passing
- Release scripts, CI, store submission docs

## Three Workstreams

### Workstream A: Passkeys/WebAuthn (Gate for Release)

Enable browser-facing passkey support. Backend (`PasskeyService.cs` ~1983 lines) and Chrome proxy (`passkeysProxy.js` ~1559 lines) exist but are not wired into production.

**Current state:**
- `BridgeSettings.PasskeysEnabled` hardcoded `false`
- `passkeysProxy.js` is standalone, not imported by `background.js`
- `manifest.json` lacks `webAuthenticationProxy` permission
- Passkey methods exist in `BridgeRequestHandler` behind feature gate

**Implementation:**

1. **Integrate proxy into background.js**
   - Import `passkeysProxy.js` module into `background.js`
   - Wire attach/detach lifecycle to service worker events
   - Connect proxy handlers to bridge dispatch via background bridge client

2. **Config-based feature gate**
   - Replace hardcoded `PasskeysEnabled` in `BridgeSettings.cs` with KeePass custom config key
   - Default: `false` (disabled)
   - Menu toggle: `Tools -> KeePass Browser Bridge -> Passkey Support (Experimental)`
   - Backend unit tests use test-enabled gate

3. **Optional permission for webAuthenticationProxy**
   - Add `"optional_permissions": ["webAuthenticationProxy"]` to `manifest.json`
   - When passkey setting enabled in popup/settings, request permission via `chrome.permissions.request`
   - Remove permission when passkey setting disabled
   - Keep `manifest.json` unchanged for Firefox (no `webAuthenticationProxy` on Firefox)

4. **Trusted origin resolution**
   - Proxy experiment already resolves trusted origins from browser-supplied `requestInfo` or `webNavigation.getFrame`
   - Ensure `background.js` grants `webNavigation` permission when passkeys enabled
   - Keep fail-closed behavior: reject if trusted origin unavailable

5. **E2E passkey tests**
   - Mock `chrome.webAuthenticationProxy` API in Playwright tests
   - Test: create begin/complete, get begin/complete, cancel, timeout, UVPAA

6. **Firefox passkey strategy**
   - Keep passkeys disabled on Firefox until equivalent API exists
   - Document in release notes and store listing

### Workstream B: Release 1.0.0 (Gated on Passkeys)

**Current state:**
- Version: 0.9.0
- `TESTING_REPORT.md` confirms all verification passed
- `docs/release-readiness.md` checklist exists

**Implementation:**

1. **Version bump** — update all version references from 0.9.0 to 1.0.0:
   - `README.md`
   - `extension/manifest.json`
   - `extension/manifest.firefox.json`
   - `src/Bridge/BridgeSettings.cs` (`PluginVersion`)
   - `src/Properties/AssemblyInfo.cs`
   - `update/versioninfo.txt`

2. **Manual smoke test** — execute release-readiness checklist items 1-13 with disposable accounts, record evidence

3. **Security review** — confirm all 11 items in `docs/security-threat-model.md` Security Review Checklist

4. **Build release artifacts:**
   ```
   .\scripts\build-release.ps1 -RequireCleanSource
   .\scripts\verify-release-artifacts.ps1
   ```

5. **GitHub Release** — create v1.0.0 with release notes, checksums, migration guidance

### Workstream C: Store Submission (After Release)

Deferred until after passkeys and release are complete.

- Public privacy policy URL
- Create Chrome Web Store / Firefox AMO / Edge Add-ons accounts
- Submit release ZIP artifacts with metadata from `docs/store-submission.md`
- Do not claim passkey support until Workstream A is complete

## Dependencies

```
Passkeys (A) ──> Release (B) ──> Store (C)
       ↑ gate          ↑ ship
```

Release 1.0.0 ships with or without passkeys depending on progress. If passkeys are not ready in time, release without them (as documented in store listing).
