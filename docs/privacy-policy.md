# Privacy Policy

Effective date: 2026-06-03

This policy describes the KeePass Browser Bridge browser extension and KeePass 2.x plugin maintained through the public project repository at https://github.com/hieuck/KeePassBrowserBridge.

## Summary

KeePass Browser Bridge connects a browser extension to KeePass 2.x through a local plugin running on the user's computer. The extension does not use a hosted credential service, does not collect analytics, and does not send passwords, one-time codes, form contents, browsing history, or KeePass database data to the project maintainers.

## Data The Extension Processes

KeePass Browser Bridge may process the following data locally:

- Current tab URL and page title, used to find matching KeePass entries.
- Login form fields on visited HTTP/HTTPS pages, used for fill, save-new-login, and update-password prompts.
- User-selected username, password, one-time password, and non-protected custom field values returned by the local KeePass plugin.
- HTTP Basic Auth challenge URLs, used to request matching KeePass entries.
- Local extension settings such as auto-fill, auto-submit, theme, site overrides, notification preference, clipboard clear delay, and auto-lock timeout.
- Pairing data such as client ID, shared secret, pairing session state, trusted-browser status, trusted-browser origin, and created/last-used timestamps.

## Data The Extension Does Not Collect

KeePass Browser Bridge does not collect or transmit:

- Analytics, telemetry, advertising identifiers, or tracking identifiers.
- KeePass master keys.
- `.kdbx` database files.
- Complete browsing history.
- Credentials to any remote server controlled by the project maintainers.
- Passkey/WebAuthn credentials in version 1.0.0.

## Local Storage And Retention

The browser extension stores settings and pairing data in browser extension storage on the user's device. KeePass trusted-browser records are stored in KeePass plugin configuration on the user's device. Credentials remain in the user's KeePass database unless the user chooses to create or update an entry.

Settings export intentionally excludes pairing secrets, client IDs, pairing sessions, lock state, and last-activity state.

Users can remove local extension data by uninstalling the extension or clearing its extension storage. Users can revoke trusted browsers from the extension settings or KeePass plugin UI.

## Local Bridge Communication

The extension communicates with the KeePass plugin through `http://127.0.0.1:<port>/bridge`. This loopback address is local to the user's computer. Privileged requests require browser pairing and authenticated HMAC requests.

The bridge is not intended to be reachable from the public internet. Web page origins are rejected by origin and CORS checks.

## Permissions

KeePass Browser Bridge requests browser permissions only to provide local KeePass integration:

- `activeTab` and `tabs` identify the active page and URL.
- `storage` stores local settings and pairing data.
- `scripting` performs controlled fill actions and restores prompts after navigation.
- `clipboardWrite` copies selected values when the user chooses a copy action.
- `contextMenus` exposes field actions where supported.
- `notifications` shows optional fill/save/update feedback.
- `webRequest`, `webRequestAuthProvider`, and Firefox `webRequestBlocking` support HTTP Basic Auth.
- `http://127.0.0.1/*` allows communication with the local KeePass plugin.
- `http://*/*` and `https://*/*` allow form detection and fill controls on user-visited sites.

## Data Sharing

KeePass Browser Bridge does not sell, rent, or share personal data with advertisers, analytics providers, or data brokers.

The project maintainers may receive information voluntarily provided by users in issue reports, crash reports, screenshots, logs, or support requests. Users should remove real credentials and private database details before sharing support material.

## Security Notes

KeePass Browser Bridge reduces remote exposure by keeping database access inside KeePass and using a local loopback bridge. It does not protect against malware, a compromised operating system, a compromised browser profile, or a malicious extension that can access local extension storage after the user has installed it.

Users should install release artifacts only from the official release location and verify `SHA256SUMS.txt` as described in `docs/release-integrity.md`.

## Changes

Privacy policy changes should be documented in release notes. Material changes should be published before or alongside the release that introduces them.

## Contact

Use the public issue tracker for privacy and support requests: https://github.com/hieuck/KeePassBrowserBridge/issues.
