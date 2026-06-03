# KeePassBrowserBridge Replacement Roadmap

**Goal:** make KeePassBrowserBridge a practical replacement for Kee - Password Manager/KeePassRPC and KeePassXC-Browser for KeePass 2.x users.

Reference projects:

- KeePassRPC for Kee - Password Manager: https://github.com/kee-org/keepassrpc
- KeePassXC-Browser: https://github.com/keepassxreboot/keepassxc-browser

## Baseline

Checked on 2026-06-03:

- KeePassXC-Browser is the active native-messaging benchmark, with GitHub release `1.10.3` visible on 2026-06-01.
- KeePassRPC is the KeePass plugin benchmark for Kee, with GitHub release `2.0.2` visible on 2024-06-12.
- Kee browser-addon is the browser-side Kee benchmark, with GitHub release `4.0.7` visible on 2024-10-10.

KBB intentionally stays clean-room and does not copy code from those projects. The replacement bar is user-visible capability, security posture, test coverage, and release quality.

## Replacement Criteria

| Area | Target |
| --- | --- |
| Install | One KeePass plugin artifact plus Chrome/Firefox extension packages; no dependency on KeePassRPC. |
| Pairing | Short-lived in-KeePass pairing code, per-client secret, trusted browser list, revocation, and permission management. |
| Bridge security | Loopback-only endpoint, extension-origin validation, HMAC, timestamp window, replay protection, CORS rejection for web origins. |
| Autofill | Popup and inline picker, multiple matching accounts, focused-field fill, full-form fill, OTP fill, custom fields, HTTP Basic Auth. |
| Save/update | Save new login, update changed password, change-password handling, permission-aware prompts, save-on-success database persistence. |
| UX | Search, ranking by usage, keyboard selection, hidden-entry expansion, lock/unlock, notifications, settings import/export, site overrides. |
| Compatibility | Chrome-family and Firefox packaging, fixtures for real-site form patterns, manual smoke checklist before releases. |
| Release | Repeatable verify/build scripts, CI, GitHub release assets, clean-source release gate, version consistency across source, manifests, update metadata, DLL/PLGX, plugin auto-update checksum verification, checksums, and optional detached signatures. |

## Priority Phases

### Phase 1 - Release Consistency

- Keep version values aligned across `README.md`, manifests, `BridgeSettings`, `AssemblyInfo`, `update/versioninfo.txt`, and release artifacts.
- Require clean source for public release builds with `scripts/build-release.ps1 -RequireCleanSource`.
- Replace installed plugin artifacts through `scripts/install-plugin.ps1` after successful release builds.
- Make the release checklist explicit enough that a user can reproduce the build and install.

### Phase 2 - Store-Ready Browser Extension

- Prepare Chrome Web Store, Firefox AMO, and Edge Add-ons packaging metadata.
- Document requested permissions and why each one is needed.
- Generate store screenshots from the actual extension UI with `scripts/capture-store-screenshots.ps1`.
- Keep `docs/store-submission.md` current with listing copy, privacy statements, reviewer notes, and concise user-facing installation context.
- Keep `docs/privacy-policy.md` aligned with store privacy answers before public submission.

### Phase 3 - Cross-Browser Confidence

- Keep Chromium in the fast default verifier.
- Run release-candidate verification with `.\scripts\verify.ps1 -E2EProjects chromium,firefox`.
- Track browser-specific failures separately from generic form-detection regressions.

### Phase 4 - Security Review

- Review localhost bridge threat model against malicious web pages, compromised extensions, replay, stale pairing, and permission escalation.
- Confirm protected custom fields and settings export never leak secrets.
- Review update flow for asset authenticity assumptions and safe install behavior.
- Maintain `docs/security-threat-model.md` as the source of truth for implemented controls and residual risks.
- Maintain `docs/release-integrity.md` so checksum verification, optional detached signatures, and remaining signing limitations are explicit.

### Phase 5 - Advanced Parity

- Keep `docs/passkeys-webauthn-design.md` current before adding WebAuthn permissions or browser-facing passkey flows. The backend crypto/storage prototype, disabled protocol/permission gate, and non-packaged proxy serialization experiment exist, but passkeys remain disabled until stable protocol versioning, trusted origin context, approval UX, browser proxy behavior, and release-review notes are test-backed.
- Add migration guidance for users moving from Kee/KeePassRPC or KeePassXC-Browser in `docs/migration-guide.md`.
- Treat passkeys as unsupported in public listing copy until protocol, storage, browser API, and security tests exist.

## Current Definition Of Done For Alpha

- `.\scripts\verify.ps1` passes.
- `.\scripts\verify.ps1 -E2EProjects chromium,firefox` passes before release.
- `.\scripts\build-release.ps1 -RequireCleanSource` produces DLL, PLGX, Chrome ZIP, Firefox ZIP, versioninfo, release manifest, and checksums from a clean worktree; CI and release workflows use this same packaging path.
- `.\scripts\verify-release-artifacts.ps1` verifies artifact versions, manifests, package file lists, SHA-256 checksums, and GPG signatures when `-RequireSignatures` is used.
- `.\scripts\capture-store-screenshots.ps1` regenerates browser-store screenshots with safe fixture data.
- `.\scripts\install-plugin.ps1 -ArtifactType dll` installs exactly one plugin artifact after KeePass is closed.
- Installed KeePass plugin reports the same version as source.
- `docs/migration-guide.md` covers old-extension shutdown, fresh pairing, field compatibility, validation, known gaps, and rollback.
- `docs/passkeys-webauthn-design.md` documents the unsupported browser-facing passkey gap, the backend prototype status, and the implementation path.
- `docs/privacy-policy.md` is ready to publish as the browser-store privacy policy source.
- `docs/release-notes-template.md` and `docs/release-integrity.md` are used for GitHub Release notes.
- Manual smoke checklist in `docs/real-site-validation.md` passes with a throwaway database, and release-candidate results are recorded with `docs/manual-smoke-evidence.md`.
