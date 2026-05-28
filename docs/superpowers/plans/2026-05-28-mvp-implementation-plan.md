# KeePass Browser Bridge MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable MVP where a Chrome extension pairs with a KeePass 2.x plugin, queries matching credentials from the active database, and fills a selected login.

**Architecture:** The KeePass plugin owns database access and exposes a loopback-only HTTP JSON browser bridge. The Chrome MV3 extension connects to the bridge, pairs once, requests matches for the current tab URL, and fills only after the user selects an entry.

**Tech Stack:** C# .NET Framework 4.8 KeePass plugin, local loopback HTTP bridge, Chrome Manifest V3 extension, plain JavaScript, focused unit tests.

---

## File Structure

- `src/KeePassBrowserBridge.csproj`: KeePass plugin project.
- `src/KeePassBrowserBridgeExt.cs`: plugin entry point, menu, settings, lifecycle.
- `src/Properties/AssemblyInfo.cs`: plugin assembly metadata.
- `src/Bridge/BridgeSettings.cs`: default port and enabled setting keys.
- `src/Bridge/UrlMatcher.cs`: conservative URL normalization and matching.
- `src/Bridge/ProtocolModels.cs`: request/response DTOs.
- `src/Bridge/TrustedClientStore.cs`: trusted client config serialization.
- `src/Bridge/PairingService.cs`: one-time code and shared secret generation.
- `src/Bridge/CredentialQueryService.cs`: KeePass database search.
- `src/Bridge/LoopbackBridgeServer.cs`: loopback HTTP bridge listener.
- `tests/KeePassBrowserBridge.Tests.csproj`: lightweight test harness.
- `tests/Program.cs`: test runner for core plugin units.
- `extension/manifest.json`: Chrome MV3 manifest.
- `extension/background.js`: bridge connection and popup messaging.
- `extension/popup.html`, `extension/popup.js`, `extension/popup.css`: pairing/status/query UI.
- `extension/contentScript.js`: form detection and fill operation.
- `.github/workflows/release.yml`: plugin test/build/release workflow.

## Task 1: KeePass Plugin Skeleton

**Files:**
- Create: `src/KeePassBrowserBridge.csproj`
- Create: `src/KeePassBrowserBridgeExt.cs`
- Create: `src/Properties/AssemblyInfo.cs`
- Create: `src/Bridge/BridgeSettings.cs`
- Modify: `README.md`

- [ ] Create a plugin that loads in KeePass and adds `Tools -> KeePass Browser Bridge`.
- [ ] Add menu items for enable/disable, pair new browser, and trusted browsers.
- [ ] Store the enabled flag in `IPluginHost.CustomConfig`.
- [ ] Build locally with `csc.exe` against the installed `KeePass.exe`.
- [ ] Commit with message `feat: scaffold keepass plugin`.

## Task 2: URL Matching

**Files:**
- Create: `src/Bridge/UrlMatcher.cs`
- Create/modify: `tests/Program.cs`
- Create/modify: `tests/KeePassBrowserBridge.Tests.csproj`

- [ ] Write tests for exact host match, parent-domain mismatch, invalid URL rejection, and scheme handling.
- [ ] Implement conservative matching: exact host match first, parent-domain only when explicitly allowed later.
- [ ] Run tests locally.
- [ ] Commit with message `test: add url matching rules`.

## Task 3: Protocol Models And Validation

**Files:**
- Create: `src/Bridge/ProtocolModels.cs`
- Create: `src/Bridge/ProtocolValidator.cs`
- Modify: `tests/Program.cs`

- [ ] Add DTOs for `hello`, `pair.begin`, `pair.complete`, `client.status`, and `logins.query`.
- [ ] Add validation for protocol version, request ID, timestamp, origin, and known method.
- [ ] Test invalid methods, missing origin, stale timestamp, and valid hello.
- [ ] Commit with message `feat: add bridge protocol validation`.

## Task 4: Pairing And Trusted Clients

**Files:**
- Create: `src/Bridge/TrustedClientStore.cs`
- Create: `src/Bridge/PairingService.cs`
- Modify: `src/KeePassBrowserBridgeExt.cs`
- Modify: `tests/Program.cs`

- [ ] Generate a six-digit pairing code shown only in KeePass.
- [ ] Generate a per-client shared secret after successful pairing.
- [ ] Serialize trusted clients in KeePass custom config.
- [ ] Add revoke/list support for trusted clients.
- [ ] Test successful pairing, wrong code rejection, and revoke behavior.
- [ ] Commit with message `feat: add pairing and trusted clients`.

## Task 5: Credential Query Service

**Files:**
- Create: `src/Bridge/CredentialQueryService.cs`
- Modify: `tests/Program.cs`

- [ ] Search active KeePass database entries by URL host.
- [ ] Return only entry ID, title, username, URL, and password for trusted requests.
- [ ] Reject queries when no database is open.
- [ ] Test exact URL match and unrelated-domain rejection.
- [ ] Commit with message `feat: query matching credentials`.

## Task 6: Loopback Bridge Server

**Files:**
- Create: `src/Bridge/LoopbackBridgeServer.cs`
- Modify: `src/KeePassBrowserBridgeExt.cs`

- [ ] Start server only when browser integration is enabled.
- [ ] Bind only to `127.0.0.1`.
- [ ] Implement `hello`, `pair.begin`, `pair.complete`, `client.status`, and `logins.query`.
- [ ] Add HMAC verification for paired-client requests.
- [ ] Add a smoke test or manual verification command against `hello`.
- [ ] Commit with message `feat: add loopback bridge server`.

## Task 7: Chrome Extension MVP

**Files:**
- Create: `extension/manifest.json`
- Create: `extension/background.js`
- Create: `extension/popup.html`
- Create: `extension/popup.js`
- Create: `extension/popup.css`
- Create: `extension/contentScript.js`

- [ ] Add MV3 extension manifest with activeTab, storage, scripting permissions.
- [ ] Connect to bridge and show plugin status.
- [ ] Implement pair flow in popup.
- [ ] Query current tab logins.
- [ ] Fill selected credential through content script.
- [ ] Commit with message `feat: add chrome extension mvp`.

## Task 8: Release Workflow And Docs

**Files:**
- Create: `.github/workflows/release.yml`
- Modify: `README.md`

- [ ] Build plugin DLL on Windows GitHub Actions.
- [ ] Run unit tests in Actions.
- [ ] Upload `KeePassBrowserBridge.dll` as a release asset.
- [ ] Document plugin installation and extension developer install.
- [ ] Commit with message `ci: add release workflow`.

## Self-Review

- The plan covers all MVP milestones in the design spec.
- The plan intentionally defers passkeys, full save/update, and native messaging.
- The first executable slice is plugin skeleton plus build verification.
