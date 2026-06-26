# Security Threat Model

This document tracks the current security posture for KeePassBrowserBridge as a Kee/KeePassRPC and KeePassXC-Browser replacement candidate.

## Trust Boundaries

| Boundary | Trusted side | Untrusted side | Current controls |
| --- | --- | --- | --- |
| KeePass database access | KeePass plugin process | Browser extension and web pages | Only the plugin reads/writes KeePass databases. The extension never reads `.kdbx` files or stores the master key. |
| Local bridge | `127.0.0.1` HTTP listener | Any local process or web page able to attempt requests | Listener binds to `http://127.0.0.1:<port>/`; web origins are rejected by CORS/origin validation; bridge POSTs must be JSON, reject malformed JSON as a client error, and stay under the request-size cap. |
| Browser client | Paired extension origin and client ID | Unpaired extensions, malicious pages, replayed requests | Pairing, origin-bound trusted clients, HMAC-SHA256, timestamp window, replayed request cache. |
| Credential mutation | Trusted clients with write permission | Read-only or revoked clients | Permission checks for read, write, and manage-clients methods. |
| Browser page DOM | User-selected fill target | Decoy, hidden, search, checkout, profile, reset, and sign-up fields | Form detection fixtures and E2E regression tests guard false-positive fill and save prompts. |

## Assets

- KeePass database contents, including username, password, URL, TOTP secret, and custom fields.
- Trusted browser client IDs and shared secrets stored in KeePass custom configuration.
- Pairing codes and active pairing sessions.
- Extension local settings and pairing data.
- Release artifacts used by manual install and plugin auto-update.

## Implemented Controls

### Pairing

- `pair.begin` creates a short-lived pairing session and displays the pairing code in KeePass.
- Pairing codes are generated with `RandomNumberGenerator`.
- Pairing sessions expire after five minutes.
- Sessions lock after five invalid attempts.
- Starting a new pairing session for the same client name cancels older sessions.
- The KeePass pairing dialog displays the browser name and extension origin that started pairing.
- `pair.complete` must come from the same extension origin that started `pair.begin`.
- Successful pairing stores the extension origin with the trusted client.

### Bridge Authentication

- Privileged methods require a trusted `clientId`.
- Authenticated requests use HMAC-SHA256 over protocol version, method, request ID, timestamp, origin, client ID, and payload.
- HMAC comparison uses a fixed-time comparison helper.
- Requests outside the five-minute timestamp skew are rejected.
- Reused authenticated request IDs are rejected within the timestamp window.
- Trusted clients are bound to their original extension origin.

### Origin And CORS

- Allowed origins are restricted to `chrome-extension://<32-char-id>` and `moz-extension://<guid>`.
- HTTP web origins are rejected before request handling.
- CORS headers are only returned for allowed extension origins.
- The bridge accepts only `POST /bridge` and extension-origin preflight requests.
- CORS preflight requests must include a valid extension `Origin`; missing-origin preflights are rejected before CORS headers are added.
- `POST /bridge` requires `Content-Type: application/json`, rejects malformed JSON with `invalid_request`, and rejects request bodies larger than 256 KiB before dispatching to pairing or credential handlers.
- When the browser supplies an HTTP `Origin` header, that header must match the protocol request `Origin`.

### Permissions

- `client.status` and `logins.query` require read permission.
- `logins.create`, `logins.update`, and `logins.fillAck` require write permission.
- Extension-triggered fill acknowledgements are best-effort so read-only clients can still fill credentials even when usage timestamp updates are denied.
- Content-script save/update prompts fail closed unless `client.status` confirms write permission, so submitted passwords are not rendered in mutation prompts when pairing or permission state cannot be confirmed.
- `clients.list`, `clients.revoke`, and `clients.updatePermissions` require manage-clients permission.
- Reserved passkey read methods require `passkeyRead`, and reserved passkey create/revoke methods require `passkeyWrite`; the feature gate still returns `feature_disabled` after authentication and permission checks.
- `BridgeMethodPolicy` centralizes supported bridge methods, authentication requirements, and required permissions. Backend tests reflect over every `BridgeMethods` constant so newly added methods must be assigned an explicit policy before verification passes.
- Authenticated requests update the trusted client's local last-used timestamp, and trusted-browser management surfaces client origin, permissions, created time, and last-used time for auditability.
- Empty permission updates keep read-only access instead of restoring full default permissions.
- Read-only popup sessions disable create/edit controls and defensively refuse direct edit-form opening before a write-capable browser can send update payloads.
- Popup state-changing refreshes hydrate trusted-client permissions before rendering controls, so read-only sessions stay fail-closed after background state refreshes. Missing popup permission state is treated as no write/manage permission.
- Popup and Options trusted-browser controls disable themselves when the current browser removes its own manage-browsers permission.
- Popup trusted-browser management fails closed on backend permission-denied responses by refreshing permissions and clearing stale client rows.

### Data Minimization

- The bridge returns matching entries, not the whole database.
- Protected custom field values are redacted before being exposed to popup search, copy, or focused-field fill.
- Create, update, and fill acknowledgements return metadata without passwords after mutating or touching entries.
- Locked or unpaired credential access clears pending runtime credentials, passkey proxy state, and clipboard state before returning a denial.
- The popup query action refreshes state and refuses locked or unpaired sessions before sending a credential query.
- Partial pairing credentials are treated as unpaired state and cleared with pending runtime credentials before state is exposed to the popup.
- Changing the bridge endpoint clears pairing credentials, active pairing sessions, and pending runtime credentials before using the new endpoint.
- Successful pairing clears pending runtime credentials, passkey proxy state, and clipboard state before exposing the newly paired client.
- The popup clears rendered credential results when credential access becomes locked or unpaired, so stale fill/copy controls and visible secrets do not remain on screen.
- The popup clears trusted-browser management rows when manage access becomes unavailable, so stale client controls do not remain actionable after endpoint, lock, or permission changes.
- The Options page clears trusted-browser rows locally after revoking the current browser, avoiding a follow-up list request with pairing credentials that were just removed. It also clears stale trusted-browser rows on backend permission-denied refreshes.
- Settings export excludes client IDs, shared secrets, and pairing sessions.
- Additional URL fields are used for matching but are not exposed as custom fields.

### Release And Install

- `build-release.ps1` refuses to write artifacts under the repo when the repo is inside KeePass `Plugins`.
- `install-plugin.ps1` refuses to install while KeePass is running.
- `install-plugin.ps1` backs up existing plugin artifacts outside the KeePass `Plugins` directory.
- `install-plugin.ps1` removes the opposite plugin artifact type so KeePass loads exactly one DLL or PLGX.
- Plugin auto-update selects the newest non-draft, non-prerelease GitHub Release with a `KeePassBrowserBridge.plgx` asset.
- Plugin auto-update requires the selected GitHub Release to publish `SHA256SUMS.txt`, rejects duplicate PLGX checksum entries, and verifies the downloaded PLGX against the published SHA-256 before replacing the local plugin package.
- Plugin auto-update backs up and removes a duplicate `KeePassBrowserBridge.dll` before installing PLGX updates, and refuses to install if the DLL cannot be removed.
- Release builds emit `SHA256SUMS.txt`, and the artifact verifier checks each published artifact against its SHA-256 hash before release upload.
- Public release builds use `build-release.ps1 -RequireCleanSource` so dirty non-artifact source changes fail before release artifacts are compiled or uploaded.
- Maintainers can build GPG detached `.asc` signatures for release assets with `build-release.ps1 -SignArtifacts`, and the artifact verifier can require and verify them with `verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<full-fingerprint>"`.

## Residual Risks

| Risk | Current status | Next action |
| --- | --- | --- |
| Local malware or compromised OS can access KeePass process memory or extension storage | Out of scope for local bridge controls | Document as an environmental risk in user docs. |
| Any installed extension with a valid extension origin could attempt pairing while the user approves a code | Mitigated by in-KeePass pairing code, pairing-dialog browser/origin display, pair.begin/pair.complete origin binding, and trusted-client list | Continue to keep browser name and origin visible in pairing and trusted-browser management UI. |
| Shared secrets are stored in browser local storage | Accepted for extension pairing model | Consider OS-level protected storage where browser APIs make that possible. |
| GitHub Release auto-update authenticity depends on HTTPS and GitHub account integrity | Partially mitigated by PLGX asset name/version checks, mandatory `SHA256SUMS.txt` verification for plugin auto-update, duplicate PLGX checksum rejection, and optional fingerprint-pinned GPG detached signatures for release assets | Follow `docs/release-integrity.md`; do not claim a release is signed unless every published asset has a verified `.asc` signature from the published maintainer fingerprint. |
| Cross-browser behavior beyond Chromium is not fully automated in the fast path | Improved | Keep release-candidate verification on Chromium and Firefox with `-E2EProjects chromium,firefox`. |
| Passkeys/WebAuthn are not implemented as browser-facing support | Backend-only C# prototype covers RP ID validation, strict base64url alphabet/padding/whitespace validation, protected private-key storage, KeePass approval grant/deny handling, assertion signing with authenticatorData RP ID hash, exact length, user-present-only flags, origin, expected challenge, credential ID, user handle, sign-count, canonical CBOR EC2/P-256/ES256 public-key COSE verification, strict DER ECDSA signature decoding, sign-count increment, required/unknown user-verification rejection, platform authenticator-attachment rejection, unknown resident-key requirement rejection with resident-key metadata storage, WebAuthn UX hint normalization, unsupported requested WebAuthn create/get extension rejection, disabled protocol permission gates, and feature-gated trusted-browser passkey permission controls; the Chrome WebAuthn proxy rejects missing/invalid request IDs and missing/malformed/non-object request JSON before bridge dispatch, and extension manifests still do not request WebAuthn proxy permissions | Use `docs/passkeys-webauthn-design.md` before adding browser proxy integration, enabled passkey protocol behavior, or store-listing claims. |

## Security Review Checklist

Before public replacement release:

- [x] 1. Run `scripts/verify-security-threat-model.mjs` through `.\scripts\verify.ps1` so implemented security claims stay tied to test, source, and release-script evidence.
      Confirmed 2026-06-21: 703 checks pass in `.\scripts\verify.ps1`.
- [x] 2. Review bridge methods and confirm every method has the minimum required permission; keep `BridgeMethodPolicyCoversEveryBridgeMethod` and `BridgeMethodPolicyAssignsExpectedPermissions` passing.
      Confirmed: Backend bridge tests cover every protocol method with explicit authentication and permission checks; `BridgeMethodPolicy` tests pass.
- [x] 3. Confirm web-origin, missing-origin preflight, and web-origin POST requests never reach pairing or credential handlers.
      Confirmed: `LoopbackBridgeServer` rejects web origins before dispatch; backend tests verify CORS/preflight rejection.
- [x] 4. Confirm non-JSON, malformed JSON, oversized, and mismatched-origin bridge POSTs are rejected before request handlers run.
      Confirmed: Backend bridge tests cover invalid payload rejection.
- [x] 5. Confirm request replay tests cover authenticated methods.
      Confirmed: `TrackAuthenticatedRequest` in `BridgeRequestHandler` rejects replayed IDs; backend tests verify replay rejection.
- [x] 6. Confirm protected custom fields cannot appear in popup search, copy actions, focused-field fill, settings export, or logs.
      Confirmed: E2E tests verify protected fields are suppressed; security verifier checks source for redaction logic.
- [x] 7. Confirm save/update prompts never capture sign-up, reset, profile, payment, search, or API-token forms.
      Confirmed: Form detection fixtures and E2E tests guard false-positive save/update prompts for non-login forms.
- [x] 8. Confirm release artifacts have reproducible version metadata and no stale files in the artifact directory.
      Confirmed: Release smoke test verifies DLL version matches source and no stale files; `-RequireCleanSource` gate enforces clean provenance.
- [x] 9. Confirm release notes document residual risks, migration guidance, unsupported passkeys, and checksum verification from `docs/release-integrity.md`.
      Confirmed: `docs/release-notes-template.md` includes risks, migration, passkey status, and checksum guidance.
- [x] 10. Confirm `docs/privacy-policy.md` matches the browser-store privacy answers.
      Confirmed: Privacy policy reviewed and published-ready; matches store-submission privacy statements.
- [x] 11. Confirm any future WebAuthn permission follows `docs/passkeys-webauthn-design.md`.
      Confirmed: `webAuthenticationProxy` is a required permission in Chrome MV3 (cannot be optional); design doc governs any passkey-related permission addition.
