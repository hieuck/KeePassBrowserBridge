# Release Readiness Checklist

Use this checklist before publishing a release intended to replace Kee/KeePassRPC or KeePassXC-Browser for KeePass 2.x users.

## Preflight

1. Confirm the version is aligned in `README.md`, `extension/manifest.json`, `extension/manifest.firefox.json`, `src/Bridge/BridgeSettings.cs`, `src/Properties/AssemblyInfo.cs`, and `update/versioninfo.txt`.
2. Run the verifier:

   ```powershell
   .\scripts\verify.ps1
   ```

3. Run release-candidate browser coverage:

   ```powershell
   .\scripts\verify.ps1 -E2EProjects chromium,firefox
   ```

4. Build release artifacts:

   ```powershell
   .\scripts\build-release.ps1 -RequireCleanSource
   ```

5. Verify release artifacts:

   ```powershell
   .\scripts\verify-release-artifacts.ps1
   ```

   The artifact verifier checks the exact artifact set, DLL version metadata, KeePass update metadata, browser manifests, packaged extension file lists, release manifest, and SHA-256 checksums. The main verifier also runs clean-source release-gate and fake-GPG signed release smoke tests.

   For a signed release, build and verify with GPG signatures:

   ```powershell
   .\scripts\build-release.ps1 -RequireCleanSource -SignArtifacts -GpgKeyId "<release-key-id>"
   .\scripts\verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<full-maintainer-fingerprint>"
   ```

6. Regenerate browser-store screenshots after the final UI build:

   ```powershell
   .\scripts\capture-store-screenshots.ps1
   node .\scripts\verify-store-screenshots.mjs
   ```

   The screenshot workflow writes safe fixture-data PNGs to `docs/store-assets/screenshots/`; the verifier confirms the five expected PNGs exist and are 1280x800.

7. Confirm the artifact directory contains exactly these release outputs:

   - `KeePassBrowserBridge.dll`
   - `KeePassBrowserBridge.plgx`
   - `KeePassBrowserBridge-chrome-extension-<version>.zip`
   - `KeePassBrowserBridge-firefox-extension-<version>.zip`
   - `versioninfo.txt`
   - `release-manifest.json`
   - `SHA256SUMS.txt`
   - Matching `*.asc` files when publishing a signed release

8. Confirm `release-manifest.json` records a clean `SourceDirty: false` for clean release builders; the release workflow passes `-RequireCleanSource`, and the artifact output directory itself must not make source provenance dirty.
9. Prepare release notes from `docs/release-notes-template.md`, including checksum and signature verification guidance from `docs/release-integrity.md`.

## Local Install Check

Install one plugin artifact into the local KeePass directory only after KeePass is closed:

```powershell
.\scripts\install-plugin.ps1 -ArtifactType dll
```

The install script backs up any existing `KeePassBrowserBridge.dll` or `KeePassBrowserBridge.plgx` under `%TEMP%\KeePassBrowserBridge-installed-backups`, removes the duplicate artifact type, and installs exactly one selected plugin artifact.

After restarting KeePass:

1. Open `Tools -> KeePass Browser Bridge -> About...`.
2. Confirm the plugin version matches the release version.
3. Confirm the bridge endpoint is `http://127.0.0.1:19455/bridge` unless a custom port is configured.
4. Confirm the server status matches the enabled/disabled setting.

## Manual Smoke Test

Use a throwaway KeePass database and disposable browser profile.

1. Pair a fresh browser profile with KeePass.
2. Query and fill a simple login fixture.
3. Fill a page with multiple matching entries and choose a non-first entry.
4. Save a new login after submit.
5. Update an existing password after submit.
6. Fill username-first and same-page reveal flows.
7. Fill TOTP, including split OTP inputs.
8. Fill HTTP Basic Auth with a disposable credential.
9. Review `docs/migration-guide.md` against the release package and remove any stale migration notes.
10. Revoke the browser in KeePass and confirm the extension stops querying until re-paired.

The detailed fixture matrix is in `docs/real-site-validation.md`.

## Store Package Preparation

Chrome Web Store, Firefox AMO, and Edge Add-ons submissions need separate metadata even when they use the same extension source. Keep `docs/store-submission.md` as the source of truth for listing text, screenshots, privacy statements, permission justifications, reviewer notes, and store-specific checks.

For every store package:

1. Use the matching release ZIP, not the source tree.
2. Include a permission explanation for:
   - `activeTab` and `tabs` for current-page URL and fill targeting.
   - `storage` for local settings and pairing data.
   - `scripting` for controlled page fill actions.
   - `clipboardWrite` for copy actions.
   - `contextMenus` for field actions.
   - `notifications` for fill/save/update feedback.
   - `webRequest` and `webRequestAuthProvider` for HTTP Basic Auth.
   - `http://127.0.0.1/*` for the KeePass bridge.
   - `http://*/*` and `https://*/*` for login form detection and fill.
3. State that the extension does not store the KeePass master key and does not read `.kdbx` files.
4. State that credentials remain owned by the KeePass plugin and are only returned after pairing and authenticated requests.
5. Include generated screenshots for pairing, popup account picker, inline picker, save/update prompt, and settings from `docs/store-assets/screenshots/`.
6. State that passkeys/WebAuthn are not supported in this release; do not request WebAuthn-specific permissions until `docs/passkeys-webauthn-design.md` is implemented and tested.
7. Publish `docs/privacy-policy.md` and use the same public URL for Chrome Web Store, Firefox AMO, and Edge Add-ons.

## Publish

1. Trigger the release workflow with the exact semantic version.
2. Confirm GitHub Release assets include DLL, PLGX, Chrome ZIP, Firefox ZIP, `versioninfo.txt`, `release-manifest.json`, and `SHA256SUMS.txt`.
3. For signed releases, confirm every asset has a matching `.asc` signature and `.\scripts\verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<full-maintainer-fingerprint>"` passes.
4. Confirm release notes include `docs/release-integrity.md` checksum and signature verification guidance.
5. Confirm the plugin update check finds the release, points to `KeePassBrowserBridge.plgx`, downloads `SHA256SUMS.txt`, refuses to install if the PLGX hash does not match, and does not leave both DLL and PLGX plugin artifacts in `Plugins`.
6. Link `docs/migration-guide.md` from release notes so existing Kee/KeePassRPC and KeePassXC-Browser users have a rollback path.
7. Submit browser-store packages after the GitHub Release is available.
