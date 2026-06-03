# Passkeys And WebAuthn Design

Passkeys are not implemented as a browser-facing feature in KeePass Browser Bridge 0.9.0. This design records the required architecture before adding permissions, protocol methods, browser proxy integration, or store-listing claims.

Current backend status: `src/Bridge/PasskeyService.cs` implements the first isolated C# prototype phase with RP ID validation, ES256 credential material, WebAuthn-style client/authenticator data, assertion signing, sign-count updates, normalized user-verification and transport metadata, KeePass field storage, RP ID/allow-credential passkey lookup summaries that do not expose private key material, and pending create/get session binding. Pending sessions bind client ID, extension origin, bridge request ID, WebAuthn request ID, RP ID, caller origin, challenge, operation, timeout, and get allow-list credential IDs. The bridge also reserves passkey method names and `passkeyRead`/`passkeyWrite` trusted-client permission bits behind `BridgeSettings.PasskeysEnabled == false`; `hello` advertises the supported method list and a disabled `passkeys` feature flag with `prototype_disabled` status metadata, while list/create/get/cancel/revoke routes are wired behind an injectable test gate so backend routing, HMAC, permission checks, RP ID validation, KeePass approval decisions, pending-session creation/cancellation, lookup summaries, KeePass storage, assertion signing, sign-count persistence, passkey deletion, database save callbacks, browser-cancel cleanup, replay rejection, and revoke cleanup are covered without enabling browser-facing passkeys. `src/KeePassBrowserBridgeExt.cs` includes a KeePass-side passkey approval dialog prototype that displays RP ID, caller origin, extension origin, account data, and matching credential summaries before approving a feature-gated passkey request. Production callers with the passkey permission still receive `feature_disabled`; callers without it receive `permission_denied`. `extension/passkeysProxyExperiment.js` is a non-packaged Chrome API experiment that maps `webAuthenticationProxy` create/get request JSON into bridge payloads, models attach/detach plus cancellation, explicit browser-lock cleanup, and UVPAA handling, serializes successful/error completion payloads, includes a fail-closed trusted-origin resolver helper for top-level requestInfo origin/URL fields or `webNavigation.getFrame` frame URLs, and includes test-backed bridge request handlers that call create/get begin, complete, and cancel methods through a caller-supplied `bridgeCall` with `approveCreate` and `chooseCredential` hooks. It refuses to call create/get handlers unless a trusted caller origin is available. The production extension still does not request `webAuthenticationProxy`; trusted-browser `passkeyRead`/`passkeyWrite` controls exist behind bridge feature discovery and remain hidden while `hello` reports `passkeys=false`.

Reference standards and platform notes checked on 2026-06-03:

- W3C Web Authentication Level 3 candidate recommendation.
- MDN Web Authentication API and passkeys guidance.
- Chrome `webAuthenticationProxy` extension API documentation.
- Mozilla WebExtensions WebAuthn guidance.

## Product Goal

Add passkey support without weakening the current password/TOTP bridge:

- Keep all private-key material owned by KeePass or a KeePass-controlled plugin component.
- Preserve per-browser pairing, origin binding, HMAC authentication, replay protection, and trusted-client permissions.
- Require explicit user approval for passkey registration and assertion flows.
- Do not expose raw private keys to the browser page, content script, popup, logs, or settings export.
- Keep Chrome/Edge and Firefox behavior explicit because extension API support is not identical.

## Non-Goals For The First Passkey Release

- No silent passkey registration.
- No automatic migration of passkeys from OS/browser password managers.
- No cloud sync beyond whatever KeePass database sync the user already controls.
- No claim of platform-authenticator equivalence until attestation, user verification, and browser review behavior are validated.
- No passkey support in public store listings until implementation and review notes are complete.

## User Journeys

### Registration

1. A site calls `navigator.credentials.create({ publicKey })`.
2. Browser-side integration detects or proxies the WebAuthn create request where the browser permits it.
3. Extension asks KeePass plugin whether this browser has passkey-write permission for the requesting RP ID.
4. KeePass displays an approval dialog with RP ID, account name, user handle, browser name, and extension origin.
5. Plugin creates a credential key pair and stores the private material in the active KeePass database.
6. Extension returns the WebAuthn registration response to the browser.

### Authentication

1. A site calls `navigator.credentials.get({ publicKey })`.
2. Browser-side integration forwards request options to KeePass.
3. KeePass locates passkey entries by RP ID and allowed credential IDs.
4. User chooses the passkey in KeePass or an extension UI surface.
5. Plugin signs the challenge and increments the signature counter.
6. Extension returns the assertion response to the browser.

## Protocol Additions

The following method names are reserved in the bridge handler behind a disabled feature gate. Do not treat the shapes as stable browser API until protocol versioning, approval UX, and browser proxy behavior are complete.

| Method | Permission | Purpose |
| --- | --- | --- |
| `passkeys.create.begin` | `passkeyWrite` | Validate request, show KeePass approval, and create a pending registration session. |
| `passkeys.create.complete` | `passkeyWrite` | Finalize registration response for the browser request ID. |
| `passkeys.get.begin` | `passkeyRead` | Validate assertion request and locate matching passkeys. |
| `passkeys.get.complete` | `passkeyRead` | Sign challenge and return assertion response. |
| `passkeys.list` | `passkeyRead` | List passkeys for the current RP ID without exposing private key material. |
| `passkeys.cancel` | `read` | Cancel the current client's pending WebAuthn request after browser cancellation, detach, or user denial. |
| `passkeys.revoke` | `passkeyWrite` | Disable or delete a passkey entry after explicit user confirmation. |

Request authentication must reuse the existing HMAC envelope and replay cache. Passkey methods must reject unpaired, revoked, read-only, stale, or wrong-origin requests.

## KeePass Storage Model

Use ordinary KeePass entries so users can back up, move, and inspect metadata with the database:

| KeePass field | Proposed value |
| --- | --- |
| `Title` | Site/account label |
| `UserName` | Account display name where available |
| `URL` | Origin or login URL |
| `KBB-Passkey-RpId` | WebAuthn RP ID |
| `KBB-Passkey-CredentialId` | Base64url credential ID |
| `KBB-Passkey-UserHandle` | Base64url user handle |
| `KBB-Passkey-PublicKeyCose` | Base64url COSE public key |
| `KBB-Passkey-PrivateKey` | Protected private key material |
| `KBB-Passkey-SignCount` | Monotonic signature counter |
| `KBB-Passkey-UserVerification` | Required/preferred/discouraged policy from registration |
| `KBB-Passkey-Transports` | Optional transport metadata |

All fields containing private key material or authenticator secrets must be protected strings. Existing password/TOTP fields must remain unchanged so passkey entries do not accidentally appear as password logins unless they also contain normal credentials.

## Browser Strategy

Chrome and Edge:

- Investigate `chrome.webAuthenticationProxy` behind a feature flag first.
- Add `webAuthenticationProxy` only to a passkey build or only when the feature is ready for store review.
- Handle attach/detach explicitly so normal browser WebAuthn processing resumes when KBB is disabled.
- Complete `onIsUvpaaRequest` explicitly and return false unless a reviewed user-verifying authenticator path exists.
- Chrome's documented proxy request types expose `requestDetailsJson` and `requestId`; the current documentation does not list a caller origin, tab ID, or frame ID on create/get requests. KBB must not forward a WebAuthn request to KeePass until a trusted origin context is available for RP ID validation. Any `origin` value embedded in `requestDetailsJson` is treated as untrusted request data and ignored. The current experiment can resolve trusted origins from browser-supplied top-level requestInfo origin/URL fields or `webNavigation.getFrame` frame URLs when a browser or test harness provides that context; otherwise it fails closed before create/get handlers can run.

Firefox:

- Use Mozilla WebExtensions WebAuthn guidance to verify what can run inside extension pages versus what can be intercepted from arbitrary sites.
- If Firefox cannot proxy arbitrary site WebAuthn requests with current APIs, ship Firefox passkeys only when a supported path exists or mark it unsupported in listing copy.

Fallback:

- Keep password/TOTP behavior independent from passkey permissions.
- Sites that require passkeys should continue to use OS/browser authenticators until KBB passkeys are implemented and validated.

## Security Requirements

- Validate RP ID against the caller origin before creating or using a passkey.
- Store private key material only in protected KeePass fields.
- Never return private key material or raw protected fields to the extension UI.
- Confirm user presence in KeePass UI before registration and assertion.
- Treat user verification as unsupported until there is a concrete KeePass-side verification step.
- Bind passkey operations to the requesting extension origin, client ID, bridge request ID, WebAuthn request ID, RP ID, caller origin, operation, and challenge. Backend pending-session tests now cover these bindings before browser-facing enablement.
- Reject replayed create/get completion requests.
- Clear pending WebAuthn sessions on browser cancellation, browser revoke, timeout, KeePass database close, or browser lock. Backend and bridge tests cover timeout, client clear, explicit `passkeys.cancel`, trusted-client revoke cleanup, and the handler cleanup path used by KeePass `FileClosingPre`/`FileClosed` events. JS tests cover the non-packaged proxy lifecycle's explicit lock cleanup hook and the background lock/auto-lock/revoke path that calls it when the experiment lifecycle is present; production browser-facing WebAuthn packaging remains future work.
- Add release notes and store-review notes for any new WebAuthn permission.

## Test Plan

Backend:

- RP ID validation, including subdomain and mismatch cases. Covered by backend tests.
- Credential ID generation uniqueness. Covered by backend tests for the current random generator; add larger deterministic fixtures before public passkey support.
- Private key protected-field storage. Covered by backend tests.
- User-verification policy and transport metadata normalization plus KeePass storage round-trip. Covered by backend tests.
- Passkey discovery by RP ID and allow-credential ID filters with no private key material in lookup summaries. Covered by backend tests.
- Pending create/get session binding, completion binding mismatch, get allowCredentialIds enforcement, explicit cancel, timeout cleanup, client-scoped clearing, and clear-all cleanup for KeePass database lifecycle events. Covered by backend tests.
- Bridge-level feature discovery plus list/create/get/cancel/revoke routing behind an injectable enabled gate, including authenticated request handling, permission checks, disabled `prototype_disabled` status metadata, KeePass approval grant/deny handling, pending-session creation/cancellation, lookup summary response, KeePass passkey entry creation/deletion, assertion signing, sign-count persistence, database save callbacks, and trusted-client revoke cleanup. Covered by backend tests; production default remains `feature_disabled`.
- KeePass-side passkey approval prompt wiring that shows RP ID, caller origin, extension origin, account metadata, and matching credentials before allowing feature-gated create/get begin requests. Compiled through plugin build verification; full UI automation remains future work.
- Feature-gated trusted-browser permission controls for `passkeyRead` and `passkeyWrite` in popup and settings UI. Covered by E2E tests; production `hello` keeps the controls hidden while passkeys are disabled.
- Assertion signature verification against generated public keys. Covered by backend tests.
- Signature counter increment and persistence in credential material. Covered by backend tests; database persistence across assertion sessions remains future protocol work.
- Replay rejection for create and get completion requests. Covered by backend bridge tests that replay the authenticated completion `RequestId` and assert no duplicate entry, save, or sign-count update occurs.
- Permission denial for clients without `passkeyRead` or `passkeyWrite`. Covered by disabled-gate backend tests.
- `feature_disabled` response for authenticated clients that have the required passkey permission while browser-facing passkeys remain disabled. Covered by backend tests.

Browser:

- Non-packaged Chrome proxy experiment maps create/get `requestDetailsJson` into bridge payloads, resolves trusted origins from browser-supplied requestInfo or frame context when available, calls backend begin/complete/cancel methods through injected bridge handlers with `approveCreate` and `chooseCredential` hooks, serializes successful/error completion payloads, tracks attach/detach lifecycle, completes UVPAA requests, cancels backend pending sessions for denied or canceled requests, ignores spoofed `origin` values in request details, and refuses requests before handler dispatch when no trusted origin context exists. Covered by JS tests.
- Create/get request serialization compatibility.
- User cancellation and timeout behavior.
- Revoked browser behavior while a WebAuthn request is pending.
- Firefox compatibility or explicit unsupported behavior.

Release:

- Store permission justification for `webAuthenticationProxy`.
- Updated privacy statement covering public-key credential metadata.
- Manual passkey test against a disposable WebAuthn demo RP before any public listing.

## Implementation Phases

1. Done for the first backend slice: prototype credential creation, protected storage, passkey lookup summaries, pending create/get session binding, and assertion signing in isolated C# tests without browser integration.
2. In progress: reserved method names, payload models, permission bits, feature-gated trusted-browser permission UI, KeePass approval dialog wiring, and bridge-level list/create/get/cancel/revoke flows exist behind a disabled feature flag; stable protocol versioning and browser-facing enablement are still future work.
3. In progress: non-packaged Chrome/Edge proxy experiment maps request JSON, resolves trusted origin from browser-supplied requestInfo or frame context when available, calls injected bridge begin/complete/cancel handlers with create approval and get credential-selection hooks, serializes error/success completion, tracks attach/detach lifecycle, completes UVPAA, handles cancellation, and fails closed without trusted origin context. Browser API confirmation, real approval UI, and store-review permission path remain future work.
4. Harden the trusted-browser passkey permission UI and KeePass approval dialog UX with manual WebAuthn smoke tests.
5. Add deterministic WebAuthn fixtures and signature verification tests.
6. Run Chrome/Edge manual passkey smoke tests with disposable accounts.
7. Decide Firefox support based on available extension APIs.
8. Update store listings and privacy docs only after the feature is test-backed.
