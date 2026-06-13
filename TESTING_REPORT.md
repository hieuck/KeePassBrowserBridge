# KeePassBrowserBridge - Testing Report

**Date:** 2026-06-03
**Version:** 0.9.0
**Status:** Verification passed

This report reflects the current repository state after running release-candidate verification:

```powershell
.\scripts\verify.ps1 -E2EProjects chromium,firefox
```

## Verification Summary

| Area | Result | Notes |
| --- | --- | --- |
| Extension JavaScript syntax | Pass | `node --check` on background, content script, options, and popup |
| Direct extension module tests | Pass | manifest, background, protocol, HTTP auth, custom fields, content script, popup, generator |
| Real-site validation matrix | Pass | `scripts/verify-real-site-matrix.mjs` checks documented local fixtures exist and documented coverage labels still appear in automated test sources |
| Security threat-model evidence | Pass | `scripts/verify-security-threat-model.mjs` ties key security-review checklist claims to backend tests, E2E labels, source controls, release scripts, store/privacy docs, and WebAuthn permission gates |
| Vitest extension modules | Pass | 67 tests across group organization, multi-page login, multi-database, enhanced security |
| Chromium E2E tests | Pass | 114 tests across popup, options, and form-detection flows |
| Firefox E2E tests | Pass | 114 tests across popup, options, and form-detection flows |
| C# bridge harness | Pass | 90+ checks covering URL matching, protocol, centralized bridge method permission policy, pairing, query, mutation, server behavior, and update integrity |
| Plugin compilation | Pass | Compiled verification DLL at `%TEMP%\KeePassBrowserBridge.verify.dll` |
| Clean-source release smoke | Pass | `scripts/verify-clean-source-smoke.ps1` creates a temporary dirty marker and confirms `build-release.ps1 -RequireCleanSource` refuses dirty release provenance |
| Signed release smoke | Pass | `scripts/verify-signed-release-smoke.ps1` builds signed artifacts with fake GPG, verifies required `.asc` files, and exercises fingerprint-pinned signature verification flow without requiring a real key |
| Release artifact verification | Pass | DLL/PLGX/versioninfo/release-manifest/checksums present, DLL version matches, extension ZIP manifests and file lists are production-only, SHA-256 hashes verify; CI and release workflow both use the same packaging/verifier scripts; artifact output is ignored for source dirty-state; release workflow requires clean source before publishing; signed builds can require GPG `.asc` verification and an expected signer fingerprint |
| Store screenshot workflow | Pass | `scripts/capture-store-screenshots.ps1` generates 1280x800 PNGs from popup, inline picker, save prompt, and settings UI with safe fixture data; `scripts/verify-store-screenshots.mjs` verifies the expected PNG assets exist and keep the required dimensions |

## Covered Behavior

### Backend Plugin

- Loopback bridge bound to `127.0.0.1`.
- `hello`, pairing, client status, trusted-client list/revoke/update, login query/create/update, and fill acknowledgement.
- HMAC authentication, timestamp validation, replayed request rejection, and origin-bound trusted clients.
- Centralized bridge method policy coverage verifies every protocol method has explicit authentication and permission classification.
- URL matching with strict host matching, optional parent-domain matching, wildcard matching, regex opt-in, and additional `URL (n)` fields.
- KeePass group path support, usage ranking metadata, generated TOTP, custom field redaction, and save-on-success for create/update/fill acknowledgement.
- Structured errors for invalid payloads, missing database, permission denial, bad HMAC, CORS/preflight rejection, and port conflicts.
- Plugin auto-update release selection requires both `KeePassBrowserBridge.plgx` and `SHA256SUMS.txt`; downloaded plugin bytes are verified against the published SHA-256 before install, and duplicate DLL artifacts are backed up/removed or block PLGX auto-update.

### Browser Extension

- Pairing, active pairing countdown, lock/unlock, read-only permission state, and trusted browser management.
- Popup query, search, ranking, fill, OTP fill, copy username/password/OTP, create login, edit login, and custom field validation.
- Settings import/export without pairing secrets, bridge connectivity checks, loopback endpoint validation, timeout validation, site-specific auto-fill and auto-submit overrides.
- Desktop notifications for fill/save/update, controlled by settings.
- Save-new and update-password prompts, including restore after navigation and username-first password-only update.
- Inline picker with search, keyboard selection, hidden-entry expansion, full-entry fill, focused-field fill, copy actions, custom field actions, and protected field suppression.
- Form detection coverage for standard, phone, username-first, same-page reveal, split OTP, ARIA OTP, Shadow DOM, embedded-frame manifest support, multi-form, mixed checkout/login, and non-login false positives. The real-site validation matrix is checked against fixture files and automated coverage labels in the verifier.

## Replacement Baseline

External baseline checked on 2026-06-03:

- KeePassXC-Browser latest GitHub release visible as `1.10.3` on 2026-06-01: https://github.com/keepassxreboot/keepassxc-browser
- KeePassRPC latest GitHub release visible as `2.0.2` on 2024-06-12: https://github.com/kee-org/keepassrpc
- Kee browser-addon latest GitHub release visible as `4.0.7` on 2024-10-10.

KeePassBrowserBridge already covers the core replacement path: browser extension pairing, local bridge, authenticated credential query, popup fill, inline fill, TOTP, custom fields, save/update prompts, trusted-browser management, HTTP auth support, site overrides, notifications, and release packaging.

Migration guidance for users moving from Kee/KeePassRPC or KeePassXC-Browser is tracked in `docs/migration-guide.md`. Passkeys/WebAuthn are explicitly unsupported as a browser-facing feature in 0.9.0 and scoped in `docs/passkeys-webauthn-design.md`; backend-only C# tests now cover the crypto/storage prototype, create/get `clientDataJSON` structure with canonical challenge and WebAuthn origin handling, strict EC2/P-256/ES256 public-key COSE verification, none-attestation authenticator-data structure, assertion authenticator-data structure, user-verification, resident-key, and transport metadata round-trip, required/unknown user-verification rejection for registration/assertion/pending flows, unknown resident-key requirement rejection, invalid user-handle rejection before approval, invalid create `excludeCredentials` and list/get `allowCredentials` rejection, ES256 create-algorithm policy enforcement, attestation conveyance gating for `none`, authenticator attachment gating for platform requests, unsupported requested WebAuthn create/get extension rejection, create `excludeCredentials` conflict rejection, browser timeout hint clamping, requested `credProps` extension result handling, RP ID/allow-credential lookup summaries, bridge feature discovery with disabled status metadata, KeePass approval grant/deny handling, bridge-level list/create/get/cancel/revoke routing behind a test-enabled gate, pending create/get session binding, duplicate live WebAuthn request ID rejection, sign-count persistence across repeated get sessions, completion replay rejection, plus disabled protocol/permission gates. JS and E2E tests cover feature-gated trusted-browser passkey permission controls and bridge feature-status parsing, while JS tests also cover the non-packaged Chrome proxy experiment, including trusted-origin resolver fail-closed behavior, RP ID validation, invalid challenge rejection, invalid user-handle rejection, invalid create `excludeCredentials` and get `allowCredentials` rejection, required/unknown user-verification rejection, unknown resident-key/attestation/authenticator-attachment rejection, unsupported WebAuthn create/get extension rejection, ES256 create-algorithm gating, authenticator attachment gating, attestation conveyance gating, create `excludeCredentials` mapping, create/get timeout mapping, create resident-key mapping, create `credProps` request/result mapping, and duplicate pending request ID rejection before handler and bridge dispatch, injected bridge begin/complete/cancel helpers with create approval and get credential-selection hooks, explicit lock cleanup, and background lock/auto-lock/revoke cleanup hooks.

## Current Risks

| Risk | Status | Required action |
| --- | --- | --- |
| Installed DLL mismatch | Resolved | Source, release artifact, and installed `Plugins\KeePassBrowserBridge.dll` report `0.9.0`. |
| Browser-store readiness | Improved | `docs/store-submission.md` covers metadata, permission justifications, reviewer notes, and generated screenshots. `docs/privacy-policy.md` is ready as the publishable privacy-policy source; public account and URL submission work remains. |
| Cross-browser E2E | Improved | Default verifier still runs Chromium for speed; release-candidate verifier supports `-E2EProjects chromium,firefox`, and both projects currently pass. |
| Real production sites | Partial | Local fixtures cover real-site patterns, and `docs/manual-smoke-evidence.md` now records release-candidate manual smoke results, but release candidates still need those tests run on throwaway accounts. |
| Passkeys | Backend prototype, disabled protocol gate, feature-gated permission UI, non-packaged proxy experiment | KeePassXC-Browser supports passkey workflows; KBB does not yet expose browser WebAuthn proxy support, protocol v2 passkey methods, browser-guaranteed origin context, or store-ready passkey flows. Backend tests now cover RP ID validation, ES256 credential generation, create/get `clientDataJSON` structure with canonical challenge and WebAuthn origin handling, strict EC2/P-256/ES256 public-key COSE verification, none-attestation authenticator-data structure, assertion authenticator-data structure, invalid user-handle rejection before approval, invalid create `excludeCredentials` and list/get `allowCredentials` rejection, ES256 create-algorithm policy enforcement after protocol deserialization, attestation conveyance gating for `none`, authenticator attachment gating for platform requests, unknown resident-key requirement rejection, unsupported requested WebAuthn create/get extension rejection, create `excludeCredentials` conflict rejection before approval, protected KeePass storage, user-verification/resident-key/transport metadata storage round-trip, required/unknown user-verification rejection, browser timeout hint clamping to the pending-session maximum, requested `credProps` extension result handling for discoverable credentials, RP ID/allow-credential lookup summaries without private key material, bridge feature discovery with disabled passkey flag and `prototype_disabled` status, KeePass approval grant/deny handling, bridge-level list/create/get/cancel/revoke routing behind a test-enabled gate, pending create/get session binding, duplicate live WebAuthn request ID rejection, and timeout/client/cancel/revoke/database-lifecycle clearing, completion replay rejection, assertion signing, sign-count persistence across repeated get sessions, passkey deletion, database save callbacks, reserved passkey permissions, and `feature_disabled` responses for permitted passkey method calls. The plugin build includes a KeePass approval dialog prototype for feature-gated passkey requests, and the extension now hides or exposes `passkeyRead`/`passkeyWrite` trusted-browser controls based on bridge feature discovery while preserving status metadata for future UI/review flows. JS tests cover the Chrome proxy experiment's request mapping, create/get timeout mapping, create resident-key mapping, create `credProps` request/result mapping, trusted-origin resolver from top-level requestInfo or webNavigation frame context, RP ID validation, invalid challenge rejection before bridge dispatch, invalid user-handle rejection before bridge dispatch, invalid create `excludeCredentials` and get `allowCredentials` rejection before bridge dispatch, required/unknown user-verification rejection, unknown resident-key/attestation/authenticator-attachment rejection, unsupported WebAuthn create/get extension rejection, ES256 create-algorithm gating before bridge dispatch, authenticator attachment gating before bridge dispatch, attestation conveyance gating before bridge dispatch, create `excludeCredentials` mapping, duplicate pending request ID rejection before handler dispatch, injected bridge begin/complete/cancel handlers, success/error completion serialization, attach/detach lifecycle, explicit pending cleanup for browser lock, UVPAA completion, backend cancellation for denied/canceled requests, spoofed-origin rejection, and fail-closed refusal to call create/get handlers without trusted origin context. |
| Security review | In progress with automated evidence guard | `docs/security-threat-model.md` captures implemented controls and residual risks, `scripts/verify-security-threat-model.mjs` checks that key checklist claims remain backed by tests/source/release scripts, and `docs/release-integrity.md` documents checksum verification plus optional fingerprint-pinned GPG detached signatures and remaining signing limitations; the bridge still needs a final pre-release review. |

## Next Steps

1. Keep `.\scripts\verify.ps1` green after every change, including the clean-source release-gate and fake-GPG signed release smokes.
2. Publish `docs/privacy-policy.md` and complete public store account details from `docs/store-submission.md`.
3. Continue passkey work with protocol v2 models, trusted-origin research, browser proxy experiments, approval UX, and review notes before enabling any WebAuthn permission or public listing claim.
