# KeePass Browser Bridge Design

## Goal

Build a new KeePass 2.x browser integration for Chrome-family browsers.

The project is a clean-room reimplementation inspired by KeePassRPC, Kee, KeePassXC-Browser, and the general browser-password-manager bridge pattern. It should not copy source code from KeePassRPC or KeePassXC-Browser.

Primary user flow:

1. User downloads the KeePass plugin release.
2. User copies the plugin into the KeePass `Plugins` folder.
3. User restarts KeePass.
4. User installs the Chrome extension.
5. User pairs the extension with KeePass once.
6. User opens a login page and fills credentials from the active KeePass database.

## Non-Goals For MVP

- The extension will not read `.kdbx` files.
- The extension will not store KeePass master keys.
- The project will not depend on KeePassRPC as a runtime dependency.
- The first MVP will not implement passkeys.
- The first MVP will not implement full automatic save/update flows.
- The first MVP will not require a native host installer or registry setup.

## Recommended Architecture

Use a KeePass plugin with a localhost bridge, plus a Chrome Manifest V3 extension.

```text
Chrome Extension
  -> ws://127.0.0.1:<configured-port>
KeePass Browser Bridge Plugin
  -> active KeePass 2.x database
```

The KeePass plugin owns all database access. The extension only requests credentials for the current tab origin and fills the page after a user action.

This keeps installation simple for KeePass users: install plugin, install extension, pair, use.

## Components

### KeePass Plugin

Responsibilities:

- Start and stop a loopback-only WebSocket server.
- Bind only to `127.0.0.1`, never public interfaces.
- Expose a small browser bridge API.
- Display pairing codes in KeePass UI.
- Store trusted browser clients in KeePass custom config.
- Allow users to revoke trusted clients.
- Search the active KeePass database for entries matching a URL/origin.
- Return only the fields needed for the requested action.

Initial menu:

- `Tools -> KeePass Browser Bridge -> Enable Browser Integration`
- `Tools -> KeePass Browser Bridge -> Pair New Browser`
- `Tools -> KeePass Browser Bridge -> Trusted Browsers...`

### Chrome Extension

Responsibilities:

- Detect likely login forms.
- Connect to the local KeePass plugin.
- Pair with KeePass using a one-time code.
- Ask KeePass for logins matching the current tab URL.
- Show matching entries in the popup or inline UI.
- Fill username/password only after user selection.

Initial surfaces:

- Toolbar popup for connect/pair/status.
- Toolbar popup list of matching credentials.
- Content script that performs filling after popup selection.

## Protocol MVP

Messages should be JSON over WebSocket, with a small versioned protocol.

Initial methods:

- `hello`: check plugin availability and protocol version.
- `pair.begin`: request a pairing session.
- `pair.complete`: submit one-time code and establish trusted client identity.
- `client.status`: check whether this browser is trusted.
- `logins.query`: request matching logins for a URL/origin.
- `logins.fillAck`: optional audit signal that a selected login was filled.

Every request after pairing must include:

- `protocolVersion`
- `clientId`
- `requestId`
- `timestamp`
- `origin`
- `payload`
- message authentication data

## Pairing And Security

Minimum security requirements:

- Pairing is required before credential access.
- Pairing code is shown only inside KeePass.
- Trusted browser clients can be revoked inside KeePass.
- Plugin rejects all requests from unpaired clients.
- Plugin rejects requests when no database is open.
- Plugin rejects requests for origins that do not match returned entries.
- Plugin never returns the whole database.
- Plugin should avoid auto-filling without explicit user action in MVP.

Localhost alone is not treated as sufficient security. Malicious websites can attempt local connections, so pairing and message authentication are required.

For MVP, use a per-client shared secret created during pairing and HMAC-authenticated messages. A later version can add message encryption if needed.

## URL Matching

MVP matching rules:

- Normalize the current tab URL to scheme, host, and effective domain.
- Match KeePass entry URL host against the current host.
- Prefer exact host matches over parent-domain matches.
- Never return entries for unrelated domains.

The first version should be conservative. Users can refine entries in KeePass if matching is too strict.

## Release Flow

Plugin release:

- Build KeePass plugin DLL.
- Optionally build PLGX if packaging is reliable.
- Publish GitHub release with `KeePassBrowserBridge.dll`.
- End-user installation: copy DLL to KeePass `Plugins`, restart KeePass.

Extension release:

- During development, load unpacked extension.
- For public release, publish to Chrome Web Store or provide signed package instructions.

## Testing Strategy

Plugin:

- Unit tests for URL matching.
- Unit tests for protocol validation.
- Unit tests for trusted client storage.
- Integration smoke test that starts the local server.

Extension:

- Unit tests for message construction.
- Browser tests for form detection/fill behavior.
- Manual test with KeePass open, locked, no database, and paired/unpaired states.

Security tests:

- Unpaired client cannot query logins.
- Wrong HMAC is rejected.
- Expired timestamp is rejected.
- Mismatched origin is rejected.

## MVP Milestones

1. KeePass plugin skeleton with menu and enable setting.
2. Local WebSocket server bound to `127.0.0.1`.
3. Chrome extension connects and shows plugin status.
4. Pairing flow with one-time code.
5. Query matching logins for current tab.
6. Fill selected credential into a login form.
7. Release workflow for plugin DLL.
8. Basic documentation and install guide.

## Open Decisions

- Final project name.
- Default local port.
- Whether the first release ships DLL only or DLL plus PLGX.
- Whether inline suggestions are included in MVP or deferred after toolbar popup fill.
