# KeePass Browser Bridge

Clean-room KeePass 2.x browser integration inspired by KeePassRPC and KeePassXC-Browser.

## Current Status

MVP development is in progress. The repository contains:

- KeePass 2.x plugin source for a local loopback bridge.
- Chrome MV3 extension source for pairing, querying matching logins, and filling the active tab.
- Local verification and release packaging scripts.

## Verify

From this repository:

```powershell
.\scripts\verify.ps1
```

## Build Release Artifacts

```powershell
.\scripts\build-release.ps1
```

This creates a KeePass `.plgx` plugin artifact using KeePass' `--plgx-create` command and a zipped Chrome extension artifact under `artifacts\`.
