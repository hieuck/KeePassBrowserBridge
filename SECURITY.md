# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in KeePass Browser Bridge, please report it privately by emailing the maintainer directly. **Do not disclose it publicly until a fix is available.**

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Security Features

- **Loopback-only bridge**: The bridge server binds to 127.0.0.1 only
- **HMAC-SHA256 authentication**: All authenticated requests require HMAC
- **Extension origin validation**: Only `chrome-extension://` and `moz-extension://` origins are accepted
- **Timestamp window**: Requests outside a time window are rejected
- **Replay protection**: Request IDs are tracked and rejected on reuse
- **CORS rejection**: Web origins cannot make bridge requests
- **Optional passkey permission**: `webAuthenticationProxy` requires explicit user opt-in

## Permissions

See `docs/store-submission.md` for detailed permission justifications.
