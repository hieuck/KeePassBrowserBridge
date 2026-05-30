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

This creates a KeePass `.dll` plugin artifact, a KeePass `.plgx` source plugin artifact using KeePass' `--plgx-create` command, and zipped Chrome/Firefox extension artifacts under `%TEMP%\KeePassBrowserBridge-artifacts\` by default. Keeping DLL/PLGX outputs outside this repository matters when the repository itself is inside KeePass' `Plugins` directory, because KeePass scans plugin subdirectories on startup.

## Install

For KeePass users, download `KeePassBrowserBridge.plgx` or `KeePassBrowserBridge.dll` from the GitHub Release and place exactly one of them in the KeePass `Plugins` directory.

For Chrome users, the extension ZIP in GitHub Releases is intended for developer/manual loading. Chrome does not allow one-click extension installation directly from GitHub. One-click install requires publishing the extension to the Chrome Web Store, then linking users to the store listing.
