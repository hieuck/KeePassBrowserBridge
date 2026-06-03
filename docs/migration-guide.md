# Migration Guide

This guide is for KeePass 2.x users moving browser integration from Kee/KeePassRPC or KeePassXC-Browser-style workflows to KeePass Browser Bridge.

KeePass Browser Bridge is clean-room. It does not reuse KeePassRPC, Kee, KeePassXC, or KeePassXC-Browser code, settings, pairing records, or native-messaging hosts.

## What Changes

| Area | Kee/KeePassRPC or KeePassXC-Browser workflow | KeePass Browser Bridge workflow |
| --- | --- | --- |
| KeePass side | Existing plugin or KeePassXC native integration | `KeePassBrowserBridge.dll` or `KeePassBrowserBridge.plgx` in KeePass 2.x `Plugins` |
| Browser side | Existing browser add-on | Chrome/Firefox/Edge package produced from this repository |
| Transport | Existing project protocol or native messaging | Loopback-only JSON bridge at `http://127.0.0.1:<port>/bridge` |
| Pairing | Existing trusted association | New short-lived KeePass pairing code per browser profile |
| Database access | Existing integration owns its own bridge path | KeePass Browser Bridge plugin owns all `.kdbx` reads/writes |
| Updates | Existing project updater/store | GitHub Release assets plus browser-store packages |

## Before Migrating

1. Back up the KeePass database.
2. Export or note any site-specific settings from the old extension.
3. Close all browsers that have the old extension enabled.
4. Close KeePass before changing plugin files.
5. Keep only one KeePass Browser Bridge plugin artifact in `Plugins`: either DLL or PLGX, not both.
6. Disable the old browser extension before enabling KeePass Browser Bridge in the same browser profile.

Running old and new browser integrations at the same time can create duplicate fill buttons, duplicate save prompts, and confusing update behavior. Keep the old integration installed only long enough to compare behavior in a separate browser profile.

## Install KeePass Browser Bridge

1. Download `KeePassBrowserBridge.dll` or `KeePassBrowserBridge.plgx` from the same release as the browser package.
2. Place exactly one plugin artifact in the KeePass 2.x `Plugins` directory.
3. Restart KeePass.
4. Open `Tools -> KeePass Browser Bridge -> About...`.
5. Confirm the plugin version and endpoint match the release.
6. Load the Chrome, Firefox, or Edge extension package.
7. Pair the browser from the extension popup using the code shown by KeePass.

For local release artifacts in this repository:

```powershell
.\scripts\install-plugin.ps1 -ArtifactType dll
```

## Entry Compatibility

KeePass Browser Bridge reads standard KeePass fields:

- `Title`
- `UserName`
- `Password`
- `URL`
- Additional URL fields named `URL (n)`, such as `URL (2)`
- TOTP fields named `otp`, `TOTP Seed`, `TOTP Secret`, `TOTP`, or `TimeOtp-Secret-Base32`
- Non-reserved custom string fields

Protected custom fields are recognized, but their values are not exposed in popup search, copy actions, or focused-field fill. Non-protected custom fields can be filled into matching page fields and can be created or edited from the popup.

## Settings To Recreate Manually

Existing Kee/KeePassRPC and KeePassXC-Browser settings are not imported automatically. Recreate these in KeePass Browser Bridge settings:

- Auto-fill enabled/disabled.
- Auto-submit enabled/disabled.
- Site-specific auto-fill and auto-submit overrides.
- Strict URL matching.
- Regex URL matching.
- Clipboard clear delay.
- Auto-lock timeout.
- Trusted browser permissions.

The old extension's trusted-browser pairing records cannot be reused. Pair each browser profile again so KeePass Browser Bridge can create a new client ID and shared secret.

## Validation Checklist

Use a disposable browser profile and throwaway entries first.

1. Pair the browser and confirm the popup shows `Paired`.
2. Query a site with one matching entry and fill it.
3. Query a site with multiple matching entries and choose the non-first entry.
4. Fill a username-first flow.
5. Fill a TOTP prompt.
6. Use HTTP Basic Auth on a disposable test endpoint.
7. Submit a new login and confirm the save prompt creates a KeePass entry.
8. Change a password and confirm the update prompt edits the existing entry.
9. Revoke the browser and confirm queries fail until it is paired again.

The fixture-based release checklist lives in `docs/real-site-validation.md`.

## Known Migration Gaps

- Passkeys/WebAuthn are not implemented yet; keep an existing passkey-capable authenticator for sites that require passkeys.
- Old extension configuration and trusted-client records are not imported automatically.
- Browser-store one-click install depends on public store approval; manual ZIP loading remains available from releases.
- Real-site smoke testing is still required before replacing an old integration on critical accounts.

## Rollback

1. Close KeePass and all browsers.
2. Remove `KeePassBrowserBridge.dll` or `KeePassBrowserBridge.plgx` from KeePass `Plugins`.
3. Reinstall or re-enable the previous plugin/extension.
4. Restart KeePass and pair the previous extension if needed.
5. Keep the KeePass database backup until the replacement workflow has been validated.
