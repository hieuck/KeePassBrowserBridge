# Passkeys And WebAuthn Design

Passkeys are not implemented as a browser-facing feature in KeePass Browser Bridge 0.9.0. This design records the required architecture before adding permissions, protocol methods, browser proxy integration, or store-listing claims.

Current backend status: `src/Bridge/PasskeyService.cs` implements the first isolated C# prototype phase with RP ID validation, ES256 credential material, WebAuthn-style client/authenticator data, assertion signing, sign-count updates, normalized user-verification, resident-key, and transport metadata, KeePass field storage, RP ID/allow-credential passkey lookup summaries that do not expose private key material, and pending create/get session binding. Pending sessions bind client ID, extension origin, bridge request ID, WebAuthn request ID, RP ID, caller origin, challenge, operation, browser timeout hint, resident-key requirement, requested create extensions, and get allow-list credential IDs; duplicate live WebAuthn request IDs for the same client are rejected instead of replacing an existing session, and browser timeouts can only shorten pending-session expiry up to the backend maximum. Create begin payloads carry normalized credential algorithm policy and backend validation rejects requests that do not allow ES256 (`alg: -7`) while the prototype only generates ES256 credentials. Create begin also rejects invalid user handles before KeePass approval instead of prompting for a request that cannot complete. Create begin rejects invalid `excludeCredentials` credential IDs before KeePass approval, and list/get paths reject invalid `allowCredentials` credential IDs instead of silently dropping them and broadening a request. User-verification values must be omitted or one of the known WebAuthn policies; unknown values and `required` are rejected until KeePass-side verification exists. Resident-key values must also be omitted or one of the known WebAuthn requirements so future/invalid values do not get silently ignored; KBB credentials are stored as RP-discoverable KeePass passkeys and the requested resident-key requirement is preserved as metadata. Because the prototype returns `none` attestation and is not validated as a platform authenticator, create begin rejects non-`none` attestation conveyance and platform authenticator attachment requests. Create/get begin rejects unsupported requested WebAuthn extensions instead of silently completing without required extension behavior, and create begin rejects `excludeCredentials` conflicts when KeePass already stores a matching passkey for the RP. When a create request asks for the WebAuthn `credProps` extension, the feature-gated bridge returns a client extension result with `rk=true` because KBB credentials are stored as RP-discoverable KeePass passkeys; the create-complete response also carries authenticator data, SPKI publicKey, the cross-platform authenticator attachment, normalized credential transports, public-key COSE storage metadata, and ES256 algorithm metadata so the proxy can serialize `authenticatorAttachment plus response.authenticatorData/transports/publicKey/publicKeyAlgorithm` for `navigator.credentials.create`. Stored public-key COSE metadata must decode as canonical CBOR EC2/P-256/ES256 material; non-canonical integer/length encodings, unknown keys, duplicate keys, trailing bytes, and non-ES256 fields are rejected before assertion signature verification. The get-complete response carries the RP ID echo and cross-platform authenticator attachment metadata for assertion responses. The bridge reserves passkey method names and `passkeyRead`/`passkeyWrite` trusted-client permission bits behind `BridgeSettings.PasskeysEnabled == false`; `hello` advertises the supported method list and a disabled `passkeys` feature flag with `prototype_disabled` status metadata, while list/create/get/cancel/revoke routes are wired behind an injectable test gate so backend routing, HMAC, permission checks, RP ID validation, KeePass approval decisions, pending-session creation/cancellation, lookup summaries, KeePass storage, assertion signing, sign-count persistence, passkey deletion, database save callbacks, browser-cancel cleanup, replay rejection, and revoke cleanup are covered without enabling browser-facing passkeys. `src/KeePassBrowserBridgeExt.cs` includes a KeePass-side passkey approval dialog prototype that displays RP ID, caller origin, extension origin, account data, resident-key requirement, and matching credential summaries before approving a feature-gated passkey request. Production callers with the passkey permission still receive `feature_disabled`; callers without it receive `permission_denied`. `extension/passkeysProxyExperiment.js` is a non-packaged Chrome API experiment that maps `webAuthenticationProxy` create/get request JSON into bridge payloads including normalized timeout hints, resident-key requirements, and requested `credProps`, models attach/detach plus cancellation, request-timeout cleanup, explicit browser-lock cleanup with browser-visible error completion, and UVPAA handling, serializes successful/error completion payloads including lowercase `clientExtensionResults.credProps.rk`, create response authenticatorData, transports, SPKI publicKey, ES256 algorithm metadata, create authenticator attachment, and get authenticator attachment, includes a fail-closed trusted-origin resolver helper for top-level requestInfo origin/URL fields or `webNavigation.getFrame` frame URLs, and includes test-backed bridge request handlers that call create/get begin, complete, and cancel methods through a caller-supplied `bridgeCall` with `approveCreate` and `chooseCredential` hooks while rejecting mismatched begin responses, mismatched complete responses, complete responses with mismatched serialized `id`/`rawId`, non-`public-key` serialized credential type, complete responses missing required WebAuthn fields including pre-serialized response JSON, and selected assertion credentials that were not returned by KeePass. It refuses to call create/get handlers unless a trusted caller origin is available, the requested RP ID is valid for that origin, the request has a base64url challenge of at least 16 bytes, public-key create `excludeCredentials` and get `allowCredentials` contain valid base64url credential IDs and `public-key` descriptor types when supplied, the create request has a valid base64url user handle between 1 and 64 bytes, the request does not require unsupported user verification, the create options allow ES256 (`alg: -7`) public-key credentials, the create request accepts `none` attestation, the create request does not require platform authenticator attachment, requested WebAuthn extensions are either create `credProps` or absent, user-verification/resident-key/attestation/authenticator-attachment enum values are known when supplied, and the WebAuthn request ID is not already pending in the proxy lifecycle. The production extension still does not request `webAuthenticationProxy`; trusted-browser `passkeyRead`/`passkeyWrite` controls exist behind bridge feature discovery and remain hidden while `hello` reports `passkeys=false`.

WebAuthn Level 3 user-agent hints (`security-key`, `client-device`, `hybrid`) are normalized for create/get request payloads as non-binding UX metadata. Known hints are retained in caller preference order, while duplicate or unknown values are dropped before pending session storage.

Reference standards and platform notes checked on 2026-06-14:

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
| `KBB-Passkey-Origin` | Canonical WebAuthn origin used for assertion verification |
| `KBB-Passkey-UserHandle` | Base64url user handle |
| `KBB-Passkey-PublicKeyCose` | Base64url COSE public key |
| `KBB-Passkey-PrivateKey` | Protected private key material |
| `KBB-Passkey-SignCount` | Monotonic signature counter |
| `KBB-Passkey-UserVerification` | Required/preferred/discouraged policy from registration |
| `KBB-Passkey-ResidentKey` | Required/preferred/discouraged resident-key policy from registration |
| `KBB-Passkey-Transports` | Optional transport metadata |

All fields containing private key material or authenticator secrets must be protected strings. Existing password/TOTP fields must remain unchanged so passkey entries do not accidentally appear as password logins unless they also contain normal credentials.

## Browser Strategy

Chrome and Edge:

- Investigate `chrome.webAuthenticationProxy` behind a feature flag first.
- Add `webAuthenticationProxy` only to a passkey build or only when the feature is ready for store review.
- Handle attach/detach explicitly so normal browser WebAuthn processing resumes when KBB is disabled.
- Complete `onIsUvpaaRequest` explicitly and return false unless a reviewed user-verifying authenticator path exists.
- Chrome's documented proxy request types expose `requestDetailsJson` and `requestId`; the current documentation does not list a caller origin, tab ID, or frame ID on create/get requests. KBB must not forward a WebAuthn request to KeePass until a trusted origin context is available for RP ID validation. Any `origin` value embedded in `requestDetailsJson` is treated as untrusted request data and ignored. The current experiment can resolve trusted origins from browser-supplied top-level requestInfo origin/URL fields or `webNavigation.getFrame` frame URLs when a browser or test harness provides that context; otherwise it fails closed before create/get handlers can run. It also rejects RP IDs that do not exactly match or parent-match the trusted origin host before handler and bridge dispatch; the backend still repeats RP ID validation as the authority.

Firefox:

- Use Mozilla WebExtensions WebAuthn guidance to verify what can run inside extension pages versus what can be intercepted from arbitrary sites.
- If Firefox cannot proxy arbitrary site WebAuthn requests with current APIs, ship Firefox passkeys only when a supported path exists or mark it unsupported in listing copy.

Fallback:

- Keep password/TOTP behavior independent from passkey permissions.
- Sites that require passkeys should continue to use OS/browser authenticators until KBB passkeys are implemented and validated.

## Security Requirements

- Validate RP ID against the caller origin before creating or using a passkey.
- Reject create/get requests with invalid base64url challenges, standard base64 alphabet characters, malformed padding, whitespace, or challenges shorter than 16 bytes before bridge dispatch; backend begin paths repeat challenge validation as the authority.
- Reject create requests with invalid base64url user handles, standard base64 alphabet characters, malformed padding, whitespace, or user handles outside 1-64 bytes before KeePass approval.
- Reject create requests with invalid base64url `excludeCredentials` credential IDs, standard base64 alphabet characters, malformed padding, whitespace, or unsupported credential descriptor types before KeePass approval.
- Reject list/get requests with invalid base64url `allowCredentials` credential IDs, standard base64 alphabet characters, malformed padding, whitespace, or unsupported credential descriptor types.
- Reject create requests whose `pubKeyCredParams`/bridge `CredentialAlgorithms` do not allow ES256 (`alg: -7`) public-key credentials while the prototype only generates ES256 keys.
- Reject unknown non-empty WebAuthn enum values for user verification, resident-key requirement, attestation conveyance, and authenticator attachment instead of treating them as omitted defaults.
- Normalize WebAuthn Level 3 user-agent hints (`security-key`, `client-device`, `hybrid`) into create/get pending sessions as non-binding UX metadata, preserving order and dropping unknown or duplicate hints.
- Reject create requests whose `attestation`/bridge `Attestation` requests conveyance other than `none` while the prototype returns none attestation.
- Reject create requests whose `authenticatorSelection.authenticatorAttachment`/bridge `AuthenticatorAttachment` requires a platform authenticator until platform-authenticator equivalence is validated.
- Normalize create `authenticatorSelection.residentKey` and legacy `requireResidentKey` into the bridge `ResidentKey` field; reject unknown resident-key values before approval and preserve the normalized requirement as KeePass metadata.
- Reject create requests whose `excludeCredentials` match an existing KeePass passkey for the RP before prompting approval.
- Return requested `credProps.rk=true` extension results only for passkey create requests that asked for `credProps`; reject unsupported requested WebAuthn create/get extensions such as PRF, hmac-secret, largeBlob, or appid until each extension has a reviewed KeePass-side behavior.
- Store private key material only in protected KeePass fields.
- Never return private key material or raw protected fields to the extension UI.
- Confirm user presence in KeePass UI before registration and assertion.
- Treat user verification as unsupported until there is a concrete KeePass-side verification step; backend begin/create/assertion paths and the non-packaged proxy experiment reject `userVerification=required` instead of returning an assertion without the UV flag.
- Bind passkey operations to the requesting extension origin, client ID, bridge request ID, WebAuthn request ID, RP ID, caller origin, operation, challenge, and timeout hint. Backend pending-session tests now cover these bindings before browser-facing enablement, and JS lifecycle tests reject duplicate pending WebAuthn request IDs before handler dispatch.
- Reject replayed create/get completion requests.
- Reject create/get begin responses for a different WebAuthn request, RP ID, or origin before approval, credential selection, or completion.
- Reject create/get complete responses for a different WebAuthn request, RP ID, or selected credential before completing the browser WebAuthn request.
- Reject create/get complete responses, including object payloads and pre-serialized response JSON, that omit required WebAuthn response fields, carry invalid base64url required or optional WebAuthn fields or invalid base64url data hidden behind alternate WebAuthn field aliases, carry mismatched or invalid credential ID aliases, carry malformed transport metadata, carry a complete-response authenticator attachment other than exact `cross-platform` or invalid data hidden behind alternate authenticator-attachment aliases, carry malformed or unsupported client extension results such as non-boolean `credProps.rk`, unsupported `appid` results, extra `credProps` fields, or invalid data hidden behind alternate client-extension-result aliases, carry mismatched serialized credential ID fields, or use a serialized credential type other than exact `public-key` before completing the browser WebAuthn request.
- Clear pending WebAuthn sessions on browser cancellation, browser revoke, clamped browser timeout expiry, KeePass database close, or browser lock. Backend and bridge tests cover timeout clamping/expiry, client clear, explicit `passkeys.cancel`, trusted-client revoke cleanup, and the handler cleanup path used by KeePass `FileClosingPre`/`FileClosed` events. JS tests cover the non-packaged proxy lifecycle's browser request timeout cleanup, explicit lock cleanup hook with browser-visible error completion, and the background lock/auto-lock/revoke path that calls it when the experiment lifecycle is present; production browser-facing WebAuthn packaging remains future work.
- Add release notes and store-review notes for any new WebAuthn permission.

## Test Plan

Backend:

- RP ID validation, including subdomain and mismatch cases. Covered by backend tests.
- Strict base64url alphabet, padding, and whitespace rejection for passkey challenge, credential ID, and user-handle inputs before bridge dispatch, plus create/get `clientDataJSON` type, canonical base64url challenge, canonical WebAuthn origin, and `crossOrigin=false` fields. Covered by backend and non-packaged proxy JS tests.
- None-attestation authenticator-data structure, including canonical RP ID hash, user-present and attested-credential flags, zero sign count, zero AAGUID, credential ID length, credential ID, and public key COSE bytes. Covered by backend tests.
- Assertion authenticator-data structure, including canonical RP ID hash, exact 37-byte length, user-present-only flags, and big-endian sign count. Covered by backend tests.
- Browser-proxy and backend create algorithm gating for ES256 (`alg: -7`) public-key credentials. Covered by non-packaged proxy JS tests before bridge dispatch and backend bridge tests after protocol deserialization.
- Browser-proxy and backend fail-closed handling for unknown WebAuthn enum values, including resident-key requirements. Covered by non-packaged proxy JS tests and backend pending/bridge tests.
- Browser-proxy and backend fail-closed handling for unsupported requested WebAuthn create/get extensions. Covered by non-packaged proxy JS tests and backend pending/bridge tests.
- Browser-proxy and backend attestation conveyance gating for `none`. Covered by non-packaged proxy JS tests before bridge dispatch and backend bridge tests after protocol deserialization.
- Browser-proxy and backend authenticator attachment gating for platform-authenticator requests. Covered by non-packaged proxy JS tests before bridge dispatch and backend pending/bridge tests after protocol deserialization.
- Create `excludeCredentials` mapping, invalid descriptor ID/type rejection, and backend conflict rejection before approval. Covered by non-packaged proxy JS tests and backend pending/bridge tests.
- User-handle validation before approval plus canonical assertion `userHandle` output from stored passkey material. Covered by backend tests and non-packaged proxy JS tests.
- Credential ID generation uniqueness. Covered by backend tests for the current random generator; add larger deterministic fixtures before public passkey support.
- Private key protected-field storage. Covered by backend tests.
- Origin, user-verification, resident-key, and transport metadata normalization plus KeePass storage round-trip, with proxy create-complete transports lower-cased, de-duplicated, and stripped of malformed tokens before browser completion, and with `userVerification=required` and unknown user-verification values rejected until a real KeePass-side verification step exists. Covered by backend tests and non-packaged proxy JS tests.
- Passkey discovery by RP ID and allow-credential ID filters with no private key material in lookup summaries, with invalid allow-credential filters returned as bridge errors. Covered by backend tests.
- Pending create/get session binding, browser timeout hint clamping, WebAuthn UX hint normalization, resident-key policy normalization, requested `credProps` extension result handling, create-complete authenticatorData, SPKI publicKey, authenticator attachment, and transport metadata plus get-complete authenticator attachment metadata, unsupported requested WebAuthn create/get extension rejection, duplicate live WebAuthn request ID rejection, invalid create excludeCredentialIds and list/get allowCredentialIds rejection, completion binding mismatch, get allowCredentialIds enforcement, explicit cancel, timeout cleanup, client-scoped clearing, and clear-all cleanup for KeePass database lifecycle events. Covered by backend tests; the non-packaged proxy lifecycle also rejects duplicate pending WebAuthn request IDs before handler dispatch.
- Bridge-level feature discovery plus list/create/get/cancel/revoke routing behind an injectable enabled gate, including authenticated request handling, permission checks, disabled `prototype_disabled` status metadata, KeePass approval grant/deny handling, pending-session creation/cancellation, lookup summary response, KeePass passkey entry creation/deletion, assertion signing, sign-count persistence, database save callbacks, and trusted-client revoke cleanup. Covered by backend tests; production default remains `feature_disabled`.
- KeePass-side passkey approval prompt wiring that shows RP ID, caller origin, extension origin, account metadata, and matching credentials before allowing feature-gated create/get begin requests. Compiled through plugin build verification; full UI automation remains future work.
- Feature-gated trusted-browser permission controls for `passkeyRead` and `passkeyWrite` in popup and settings UI. Covered by E2E tests; production `hello` keeps the controls hidden while passkeys are disabled.
- Assertion signature verification against generated public keys, with authenticatorData RP ID hash, exact length, and user-present-only flags, `clientDataJSON` origin and expected challenge, assertion credential ID, user handle, sign-count metadata, and stored public-key COSE metadata required to match the expected canonical CBOR EC2/P-256/ES256 credential. Covered by backend tests, including non-canonical COSE integer encoding rejection.
- Signature counter increment and persistence in credential material and KeePass entry storage across repeated bridge assertion sessions. Covered by backend tests.
- Replay rejection for create and get completion requests. Covered by backend bridge tests that replay the authenticated completion `RequestId` and assert no duplicate entry, save, or sign-count update occurs.
- Permission denial for clients without `passkeyRead` or `passkeyWrite`. Covered by disabled-gate backend tests.
- `feature_disabled` response for authenticated clients that have the required passkey permission while browser-facing passkeys remain disabled. Covered by backend tests.

Browser:

- Non-packaged Chrome proxy experiment maps create/get `requestDetailsJson` into bridge payloads, forwards normalized timeout hints, WebAuthn UX hints, resident-key requirements, and requested `credProps`, rejects unsupported requested WebAuthn create/get extensions, normalizes returned `credProps` extension results only when `rk` is boolean, create/get authenticator attachment, create authenticatorData, lower-cased/deduplicated transports, create public-key SPKI, COSE storage-key fallback, and ES256 algorithm metadata into browser response JSON, resolves trusted origins from browser-supplied requestInfo or frame context when available, validates RP ID, strict base64url alphabet/padding/whitespace for challenge, user handle, create `excludeCredentials` IDs/types, get `allowCredentials` IDs/types, and user-verification/resident-key/attestation/authenticator-attachment enum values against trusted origin before handler and bridge dispatch, calls backend begin/complete/cancel methods through injected bridge handlers with `approveCreate` and `chooseCredential` hooks, rejects begin responses for a different WebAuthn request/RP ID/origin binding before approval/selection/completion, rejects complete responses for a different WebAuthn request/RP ID/selected-credential binding, invalid base64url required or optional object/serialized WebAuthn fields including alternate aliases, mismatched or invalid object credential ID aliases, malformed serialized transport metadata, malformed or unsupported client extension results including nested `credProps` fields and alternate aliases, complete-response authenticator attachment other than exact `cross-platform` including alternate aliases, mismatched serialized `id`/`rawId`, serialized credential type other than exact `public-key`, or missing required WebAuthn fields, including object payloads and pre-serialized response JSON, before browser completion, rejects selected assertion credentials that were not returned by KeePass before get completion, serializes successful/error completion payloads, tracks attach/detach lifecycle, completes UVPAA requests, cancels backend pending sessions for denied, canceled, or timed-out requests, completes browser-visible WebAuthn errors for extension-initiated pending cleanup, ignores spoofed `origin` values in request details, and refuses requests before handler dispatch when no trusted origin context exists or the RP ID does not match the trusted origin. Covered by JS tests.
- Create/get request serialization compatibility.
- User cancellation and request-timeout behavior. Covered by JS tests.
- Revoked browser behavior while a WebAuthn request is pending. Covered by JS background tests that invoke proxy lifecycle cleanup on current-client revoke; lifecycle tests cover browser-visible cancellation for extension-initiated pending cleanup.
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
