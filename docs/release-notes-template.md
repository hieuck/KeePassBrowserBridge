# Release Notes Template

Use this template for GitHub Releases and browser-store update notes.

## KeePass Browser Bridge 2.0.0

Release date: 2026-06-23

KeePass Browser Bridge is a clean-room KeePass 2.x browser integration. It includes a KeePass plugin plus Chrome-family and Firefox extension packages.

## Highlights

- **Complete UI redesign** with Ant Design Vue — modern, accessible, responsive popup and options page.
- **Pairing flow** — new PairDialog guides users through connecting to KeePass.
- **Settings Import/Export** — backup and restore extension settings from the About tab.
- **CI/CD pipeline** — automated testing and release builds via GitHub Actions.
- **228 tests passing, 0 failing** — comprehensive Playwright E2E + vitest coverage.

## Replacement Status

- Core password/TOTP replacement path: pairing, authenticated local bridge, popup fill, inline fill, save-new-login, update-password, HTTP Basic Auth, trusted-browser management, and release packaging.
- Migration guidance: `docs/migration-guide.md`.
- Passkeys/WebAuthn: not supported in this release. Design work is tracked in `docs/passkeys-webauthn-design.md`.

## Installation

1. Download exactly one KeePass plugin artifact: `KeePassBrowserBridge.plgx` or `KeePassBrowserBridge.dll`.
2. Place it in the KeePass 2.x `Plugins` directory and restart KeePass.
3. Download the matching browser ZIP for Chrome-family browsers or Firefox.
4. Load or install the browser extension and pair it with KeePass.

Do not install both DLL and PLGX at the same time.

## Upgrade Notes

- Close KeePass before replacing plugin artifacts.
- Existing KeePass entries remain in the user's database.
- Browser profiles must be paired with KeePass Browser Bridge; old Kee/KeePassRPC or KeePassXC-Browser pairing records are not reused.
- Review site-specific auto-fill and auto-submit settings after upgrading.

## Verification

Release artifacts:

- `KeePassBrowserBridge.dll`
- `KeePassBrowserBridge.plgx`
- `KeePassBrowserBridge-chrome-extension-<version>.zip`
- `KeePassBrowserBridge-firefox-extension-<version>.zip`
- `versioninfo.txt`
- `release-manifest.json`
- `SHA256SUMS.txt`
- Optional `*.asc` signatures when this release is signed.

Verify downloaded artifacts with `SHA256SUMS.txt`. For signed releases, verify `SHA256SUMS.txt.asc` with the maintainer public key and compare the signer fingerprint below before trusting the checksum list. Instructions are in `docs/release-integrity.md`.

Maintainer GPG fingerprint for signed releases: `<full-maintainer-fingerprint-or-unsigned>`

Maintainer checks for this release:

```powershell
.\scripts\verify.ps1 -E2EProjects chromium,firefox
.\scripts\build-release.ps1 -RequireCleanSource
.\scripts\verify-release-artifacts.ps1
# Signed releases additionally use:
# .\scripts\build-release.ps1 -RequireCleanSource -SignArtifacts -GpgKeyId "<release-key-id>"
# .\scripts\verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<full-maintainer-fingerprint>"
```

## Privacy And Security

- The extension does not collect analytics or send credentials to a remote service.
- KeePass remains the only component with direct `.kdbx` database access.
- The extension communicates with the KeePass plugin over `http://127.0.0.1:<port>/bridge`.
- Privacy policy: `docs/privacy-policy.md`.
- Threat model: `docs/security-threat-model.md`.

## Known Gaps

- Passkeys/WebAuthn are not implemented.
- Real-site smoke testing is still recommended before replacing an existing integration on critical accounts.
- Authenticode, Sigstore, minisign, and hardware-key-backed release signing are not yet implemented. GPG detached signatures are only present when `.asc` files are attached to this release.

## Browser Store Notes

- Store submission metadata: `docs/store-submission.md`.
- Generated screenshots: `docs/store-assets/screenshots/`.
- Do not claim official KeePass, Kee, or KeePassXC endorsement.
