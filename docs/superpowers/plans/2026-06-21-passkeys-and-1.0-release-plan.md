# Passkeys Enablement & 1.0 Release Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable browser-facing passkey/WebAuthn support, bump to v1.0.0, and produce release artifacts.

**Architecture:** Backend passkey crypto/storage (`PasskeyService.cs`) and Chrome proxy (`passkeysProxy.js`) already exist. The production gap is: (a) proxy not loaded by `background.js`, (b) `BridgeSettings.PasskeysEnabled` hardcoded `false`, (c) no `webAuthenticationProxy` permission in manifest, (d) no KeePass menu toggle. This plan wires those pieces together, then releases v1.0.0.

**Tech Stack:** C# .NET Framework 4.8 KeePass plugin, Chrome MV3 extension, Playwright E2E, Vitest unit tests.

---

## File Structure

### Files modified in this plan:

| File | Change |
|------|--------|
| `src/Bridge/BridgeSettings.cs` | Replace hardcoded `PasskeysEnabled` with config key |
| `src/KeePassBrowserBridgeExt.cs` | Add passkey menu toggle item, config save/load, optional permission request |
| `extension/background.js` | Load `passkeysProxy.js`, wire lifecycle into bridge dispatch, handle passkey enable/disable |
| `extension/manifest.json` | Add `"optional_permissions": ["webAuthenticationProxy"]` |
| `extension/popup.js` | Respect plugin passkey toggle in permission controls |
| `README.md` | Bump version 0.9.0 → 1.0.0 |
| `extension/manifest.json` | Version bump |
| `extension/manifest.firefox.json` | Version bump |
| `src/Bridge/BridgeSettings.cs` | `PluginVersion` bump |
| `src/Properties/AssemblyInfo.cs` | Version bump |
| `update/versioninfo.txt` | Version bump |

### Files referenced (no changes needed):
- `extension/passkeysProxy.js` — already complete
- `src/Bridge/PasskeyService.cs` — already complete
- `src/Bridge/BridgeRequestHandler.cs` — already routes passkey methods behind `m_passkeysEnabled()` gate
- `src/Bridge/BridgeMethodPolicy.cs` — already has passkey method policies
- `src/Bridge/ProtocolModels.cs` — already has passkey method constants
- `tests/extension/passkeys-proxy.test.mjs` — already tests the proxy experiment

---

## Task 1: Config-Based Passkeys Gate (C# Backend)

**Files:**
- Modify: `src/Bridge/BridgeSettings.cs`

**Rationale:** Currently `PasskeysEnabled` is a static property returning `false`. Change to a config key so the KeePass menu toggle can persist the setting.

- [ ] **Step 1: Read current `BridgeSettings.cs`**

```
Get-Content src/Bridge/BridgeSettings.cs
```

Confirm current state: `PluginVersion = "0.9.0"`, `PasskeysEnabled` returns hardcoded `false`.

- [ ] **Step 2: Write failing test for config-based passkey gate**

Add to the C# bridge tests (in `tests/Program.cs` or the bridge test runner):

```csharp
// Test that default passkeys enabled is false when config key is not set
BridgeSettings.TestSetPasskeysConfigValue(null);
Assert.IsFalse(BridgeSettings.PasskeysEnabled, "Passkeys should be disabled by default");

// Test that passkeys enabled returns true when config key is set
BridgeSettings.TestSetPasskeysConfigValue("true");
Assert.IsTrue(BridgeSettings.PasskeysEnabled, "Passkeys should be enabled when config is set");
```

- [ ] **Step 3: Run test to verify it fails**

Run: `.\scripts\verify.ps1`
Expected: Bridge tests fail because `BridgeSettings.PasskeysEnabled` is hardcoded and has no `TestSetPasskeysConfigValue` method.

- [ ] **Step 4: Implement config-based gate**

Edit `src/Bridge/BridgeSettings.cs`:

Replace:
```csharp
public static bool PasskeysEnabled
{
    get { return false; }
}
```

With:
```csharp
private static string s_passkeysConfigValue;

public static bool PasskeysEnabled
{
    get
    {
        if (s_passkeysConfigValue == null) return false;
        bool result;
        return bool.TryParse(s_passkeysConfigValue, out result) && result;
    }
}

public static string PasskeysConfigKey
{
    get { return "KeePassBrowserBridge.PasskeysEnabled"; }
}
```

Add test helper:
```csharp
public static void TestSetPasskeysConfigValue(string value)
{
    s_passkeysConfigValue = value;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `.\scripts\verify.ps1`
Expected: Bridge tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/Bridge/BridgeSettings.cs
git commit -m "feat: make passkeys gate config-based instead of hardcoded"
```

---

## Task 2: Passkey Menu Toggle in KeePass Plugin

**Files:**
- Modify: `src/KeePassBrowserBridgeExt.cs`

- [ ] **Step 1: Read current menu structure**

Read `KeePassBrowserBridgeExt.cs` lines 55-86 to confirm the `GetMenuItem` pattern.

- [ ] **Step 2: Write failing test for passkey toggle**

Add test that the plugin has a passkey toggle menu item and that toggling it changes the config value. The test infrastructure might need access to the plugin's config methods; verify the test harness can instantiate the plugin class.

```csharp
// Test that GetMenuItem returns a passkey toggle item
var ext = new KeePassBrowserBridgeExt();
var menu = ext.GetMenuItem(PluginMenuType.Main);
Assert.IsNotNull(menu, "Main menu should exist");

// Find the passkey item
ToolStripMenuItem passkeyItem = null;
foreach (ToolStripMenuItem item in menu.DropDownItems)
{
    if (item.Text.Contains("Passkey")) { passkeyItem = item; break; }
}
Assert.IsNotNull(passkeyItem, "Passkey toggle menu item should exist");
```

- [ ] **Step 3: Run test to verify it fails**

Expected: Test fails because no passkey menu item exists.

- [ ] **Step 4: Add passkey toggle menu item**

In `KeePassBrowserBridgeExt.cs`, add after the `Trusted Browsers...` item:

```csharp
root.DropDownItems.Add(new ToolStripSeparator());

ToolStripMenuItem passkeyItem = new ToolStripMenuItem("Passkey Support");
passkeyItem.CheckOnClick = true;
passkeyItem.Checked = IsPasskeyEnabled();
passkeyItem.Click += OnTogglePasskeys;
root.DropDownItems.Add(passkeyItem);
```

Add the handler method:

```csharp
private void OnTogglePasskeys(object sender, EventArgs e)
{
    bool enabled = (sender as ToolStripMenuItem)?.Checked ?? false;
    m_host.CustomConfig.SetBool(BridgeSettings.PasskeysConfigKey, enabled);
    SaveConfig();

    if (enabled)
    {
        MessageBox.Show("Passkey support is now enabled.\n\nRestart the browser extension to activate WebAuthn proxy support.",
            BridgeSettings.ProductName, MessageBoxButtons.OK, MessageBoxIcon.Information);
    }
}

private bool IsPasskeyEnabled()
{
    return m_host != null && m_host.CustomConfig.GetBool(BridgeSettings.PasskeysConfigKey, false);
}
```

Update the `PasskeysEnabled` gate initialization in `BridgeRequestHandler` constructor call. In `KeePassBrowserBridgeExt.cs` line 39, change the lambda:
```csharp
// Before:
delegate { return BridgeSettings.PasskeysEnabled; },
// After:
delegate { return IsPasskeyEnabled(); },
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `.\scripts\verify.ps1`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/KeePassBrowserBridgeExt.cs
git commit -m "feat: add passkey toggle menu item in KeePass plugin"
```

---

## Task 3: Add Optional Permission for webAuthenticationProxy

**Files:**
- Modify: `extension/manifest.json`

- [ ] **Step 1: Read current manifest**

Read `extension/manifest.json` to confirm current permissions list.

- [ ] **Step 2: Write failing test for optional permission**

Add to the manifest validation test in `tests/extension/`:

```javascript
test('manifest declares optional webAuthenticationProxy permission', async () => {
  const manifest = await loadManifest('extension/manifest.json');
  expect(manifest.optional_permissions).toBeDefined();
  expect(manifest.optional_permissions).toContain('webAuthenticationProxy');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/extension/manifest.test.mjs`
Expected: Test fails because `optional_permissions` not in manifest.

- [ ] **Step 4: Add optional permission to manifest**

Edit `extension/manifest.json`. After the `"permissions"` array, add:

```json
  "optional_permissions": [
    "webAuthenticationProxy",
    "webNavigation"
  ],
```

Do NOT add `webAuthenticationProxy` to `"permissions"` — it's requested at runtime only when the user enables passkeys.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/extension/manifest.test.mjs`
Expected: Test passes.

- [ ] **Step 6: Commit**

```bash
git add extension/manifest.json
git commit -m "feat: add optional webAuthenticationProxy permission"
```

---

## Task 4: Wire Passkey Proxy Into background.js

**Files:**
- Modify: `extension/background.js`

**Rationale:** `passkeysProxy.js` is a standalone IIFE that assigns to `globalScope.KeePassBrowserBridgePasskeysProxyExperiment`. In a service worker context, `globalThis` is available. We need to load the experiment module, check availability, and wire the lifecycle into the bridge dispatch on startup.

**Approach:** Since Chrome MV3 service workers cannot load scripts dynamically easily, `passkeysProxy.js` must be declared in the manifest's `background.service_worker` along with `background.js`. Chrome MV3 does not support multiple background scripts. Instead, we import the experiment via `importScripts()` in `background.js`, or we merge `passkeysProxy.js` content via build step.

**Simplest approach:** use `importScripts()` inside `background.js` to load `passkeysProxy.js` at the top.

- [ ] **Step 1: Write failing test for background passkey lifecycle**

In `tests/extension/background.test.mjs`, add:

```javascript
test('background.js loads passkeysProxy.js', async () => {
  const background = await loadBackgroundScript();
  expect(globalThis.KeePassBrowserBridgePasskeysProxyExperiment).toBeDefined();
  expect(typeof globalThis.KeePassBrowserBridgePasskeysProxyExperiment.createLifecycle).toBe('function');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/extension/background.test.mjs`
Expected: Fails because `passkeysProxy.js` not loaded.

- [ ] **Step 3: Load proxy in background.js**

At the top of `extension/background.js`, add:

```javascript
try {
  importScripts('passkeysProxy.js');
} catch (_) {
  // passkeys proxy is only available when included in the extension package
}
```

- [ ] **Step 4: Wire lifecycle on startup**

After the existing `chrome.runtime.onInstalled` listener (around line 1233), add a passkey setup call:

```javascript
async function setupPasskeyProxy() {
  const experiment = globalThis.KeePassBrowserBridgePasskeysProxyExperiment;
  if (!experiment) return;

  const state = await storageGet(['passkeysEnabled', 'endpoint', 'clientId', 'sharedSecret']);
  if (!state.passkeysEnabled) return;

  if (!experiment.isAvailable()) return;

  if (globalThis.KeePassBrowserBridgePasskeysProxyLifecycle) {
    try { await globalThis.KeePassBrowserBridgePasskeysProxyLifecycle.detach(); } catch (_) {}
  }

  const lifecycle = experiment.createLifecycle({
    bridgeCall: async (method, payload) => {
      return bridgeCall(method, payload, true);
    },
    onAttached: () => { /* proxy attached */ },
    onDetached: () => { /* proxy detached */ }
  });

  globalThis.KeePassBrowserBridgePasskeysProxyLifecycle = lifecycle;

  try {
    await lifecycle.attach();
  } catch (_) {
    // passkey proxy unavailable
  }
}

async function teardownPasskeyProxy() {
  const lifecycle = globalThis.KeePassBrowserBridgePasskeysProxyLifecycle;
  if (!lifecycle) return;
  try {
    await lifecycle.detach();
  } catch (_) {}
  globalThis.KeePassBrowserBridgePasskeysProxyLifecycle = null;
}
```

Add storage change listener for passkeys toggle:

```javascript
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.passkeysEnabled) {
    if (changes.passkeysEnabled.newValue) {
      setupPasskeyProxy();
    } else {
      teardownPasskeyProxy();
    }
  }
});
```

Call `setupPasskeyProxy()` on extension startup (add after the existing `chrome.runtime.onInstalled` listener):

```javascript
chrome.runtime.onInstalled.addListener(() => {
  // ... existing context menu creation ...

  // Setup passkey proxy if enabled
  setupPasskeyProxy();
});
```

Also call it on runtime startup:

```javascript
// At extension wake-up
setupPasskeyProxy();
```

- [ ] **Step 5: Add passkey enable/disable message handlers**

In `handleMessage` switch, add:

```javascript
case 'KBB_SET_PASSKEYS_ENABLED':
  return setPasskeysEnabled(message.enabled);
```

Add the handler:

```javascript
async function setPasskeysEnabled(enabled) {
  await storageSet({ passkeysEnabled: Boolean(enabled) });

  if (enabled) {
    // Request optional permission
    try {
      const granted = await chrome.permissions.request({
        permissions: ['webAuthenticationProxy', 'webNavigation']
      });
      if (!granted) {
        await storageSet({ passkeysEnabled: false });
        throw new Error('WebAuthenticationProxy permission was denied.');
      }
    } catch (error) {
      await storageSet({ passkeysEnabled: false });
      throw error;
    }
    await setupPasskeyProxy();
  } else {
    await teardownPasskeyProxy();
    try {
      await chrome.permissions.remove({
        permissions: ['webAuthenticationProxy', 'webNavigation']
      });
    } catch (_) {}
  }

  return { passkeysEnabled: Boolean(enabled) };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npx vitest run tests/extension/background.test.mjs`
Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add extension/background.js
git commit -m "feat: wire passkey proxy lifecycle into background.js"
```

---

## Task 5: Popup Passkey Enable/Disable Toggle

**Files:**
- Modify: `extension/popup.js`
- Modify: `extension/options.js`
- Modify: `extension/options.html`

- [ ] **Step 1: Read current popup passkey permission code**

Read `extension/popup.js` lines 750-770 and 1245-1255 to see the current passkey permission controls.

- [ ] **Step 2: Write failing test for passkey toggle**

In `tests/e2e/extension-load.spec.js`, add:

```javascript
test('shows passkey enable toggle when bridge reports passkey support', async ({ page }) => {
  await page.evaluate(() => {
    window.__kbbPopupState.paired = true;
  });
  await page.evaluate(() => {
    window.__kbbPopupAbout.pluginPasskeysEnabled = true;
    window.__kbbPopupAbout.pluginPasskeysStatus = 'prototype_disabled';
  });
  await page.goto('/extension/popup.html');
  await expect(page.locator('#passkeyToggle')).toBeVisible();
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx playwright test tests/e2e/extension-load.spec.js --project=chromium`
Expected: Test fails because no `#passkeyToggle` element exists.

- [ ] **Step 4: Add passkey toggle to popup**

In `extension/popup.html`, add after the existing settings area:

```html
<div id="passkeySection" class="section" style="display:none">
  <div class="section-header">Passkey Support</div>
  <label class="toggle-row">
    <span>Enable WebAuthn passkeys</span>
    <input type="checkbox" id="passkeyToggle" />
  </label>
  <div id="passkeyStatus" class="status-text"></div>
</div>
```

In `extension/popup.js`, add after the existing passkey permission rendering (around line 768):

```javascript
// Show passkey section if bridge reports passkey feature
const passkeySection = document.getElementById('passkeySection');
const passkeyToggle = document.getElementById('passkeyToggle');
const passkeyStatus = document.getElementById('passkeyStatus');

if (about.pluginPasskeysEnabled !== undefined) {
  passkeySection.style.display = '';
  passkeyToggle.checked = state.passkeysEnabled === true;
  passkeyStatus.textContent = about.pluginPasskeysStatus === 'enabled'
    ? 'Passkeys are active'
    : about.pluginPasskeysStatus === 'prototype_disabled'
      ? 'Passkey backend is ready — enable above to activate'
      : 'Passkeys are disabled';

  passkeyToggle.addEventListener('change', async () => {
    try {
      const result = await send({ type: 'KBB_SET_PASSKEYS_ENABLED', enabled: passkeyToggle.checked });
      passkeyToggle.checked = result.passkeysEnabled === true;
      passkeyStatus.textContent = result.passkeysEnabled ? 'Passkeys are active' : 'Passkeys disabled';
    } catch (error) {
      passkeyToggle.checked = !passkeyToggle.checked;
      passkeyStatus.textContent = 'Failed: ' + (error.message || 'unknown error');
    }
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx playwright test tests/e2e/extension-load.spec.js --project=chromium`
Expected: Passkey toggle test passes.

- [ ] **Step 6: Commit**

```bash
git add extension/popup.html extension/popup.js
git commit -m "feat: add passkey enable/disable toggle to popup"
```

---

## Task 6: Version Bump to 1.0.0

**Files:**
- Modify: `README.md`
- Modify: `extension/manifest.json`
- Modify: `extension/manifest.firefox.json`
- Modify: `src/Bridge/BridgeSettings.cs`
- Modify: `src/Properties/AssemblyInfo.cs`
- Modify: `update/versioninfo.txt`

- [ ] **Step 1: Read all version references**

Use grep to find all `0.9.0` occurrences:

```bash
rg "0\.9\.0" --glob '!node_modules/**' --glob '!.git/**'
```

- [ ] **Step 2: Update each version to 1.0.0**

Update each file:

`README.md` line 3: `Version 0.9.0` → `Version 1.0.0`

`extension/manifest.json` line 5: `"version": "0.9.0"` → `"version": "1.0.0"`

`extension/manifest.firefox.json` line 5: `"version": "0.9.0"` → `"version": "1.0.0"`

`src/Bridge/BridgeSettings.cs` line 6: `public const string PluginVersion = "0.9.0"` → `"1.0.0"`

`src/Properties/AssemblyInfo.cs` — update `AssemblyVersion` and `AssemblyFileVersion`

`update/versioninfo.txt` line 2: `KeePass Browser Bridge:0.9.0` → `KeePass Browser Bridge:1.0.0`

- [ ] **Step 3: Run verifier to confirm consistency**

Run: `.\scripts\verify.ps1`
Expected: All tests pass, artifact verifier confirms version consistency.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "release: bump version to 1.0.0"
```

---

## Task 7: Manual Smoke Test

**Files:**
- Create: `docs/manual-smoke-evidence-1.0.0-<date>.md`

- [ ] **Step 1: Generate smoke evidence template**

Run:
```powershell
.\scripts\new-manual-smoke-evidence.ps1 `
  -ArtifactsDir "$env:TEMP\KeePassBrowserBridge-artifacts" `
  -Tester "<name>" `
  -WindowsVersion "<version>" `
  -Browser "Chromium" `
  -BrowserVersion "<version>" `
  -DatabaseAlias "smoke-test" `
  -BrowserProfile "smoke-profile" `
  -FixtureAlias "http://example.com"
```

- [ ] **Step 2: Execute smoke checklist**

Per `docs/release-readiness.md` items 1-13:
1. Pair fresh browser profile with KeePass
2. Query and fill simple login fixture
3. Fill page with multiple matching entries
4. Save new login after submit
5. Update existing password after submit
6. Fill username-first and same-page reveal flows
7. Fill embedded about:blank/srcdoc login widget
8. Fill TOTP including split OTP inputs
9. Fill HTTP Basic Auth
10. Confirm protected custom fields not exposed
11. Confirm passkeys stay unsupported in public build
12. Review migration guide
13. Revoke browser and confirm extension stops querying

Record results in the generated evidence file.

- [ ] **Step 3: Commit**

```bash
git add docs/manual-smoke-evidence-1.0.0-*.md
git commit -m "test: record manual smoke evidence for v1.0.0"
```

---

## Task 8: Security Review Final Check

**Files:**
- Modify: `docs/security-threat-model.md` (update checklist status)

- [ ] **Step 1: Run security evidence verifier**

```powershell
.\scripts\verify.ps1
```

Confirm the security threat model verification passes.

- [ ] **Step 2: Review checklist items 1-11**

Walk through `docs/security-threat-model.md` Security Review Checklist:
1. ✅ `verify-security-threat-model.mjs` runs in verify.ps1
2. ✅ BridgeMethodPolicy tests cover all methods
3. ✅ Web-origin rejection tests exist
4. ✅ Non-JSON/malformed JSON rejection tests exist
5. ✅ Request replay tests exist
6. ✅ Protected custom field tests exist
7. ✅ Save/update form detection fixtures exist
8. ✅ Release artifact version consistency tests exist
9. ✅ Release notes template exists
10. ✅ Privacy policy matches store answers
11. ✅ Passkey design doc exists

- [ ] **Step 3: Update checklist status in `docs/security-threat-model.md`**

Mark all checklist items as confirmed.

- [ ] **Step 4: Commit**

```bash
git add docs/security-threat-model.md
git commit -m "docs: confirm security review checklist for v1.0.0"
```

---

## Task 9: Build Release Artifacts

- [ ] **Step 1: Build from clean source**

```powershell
.\scripts\build-release.ps1 -RequireCleanSource
```

Expected: Artifacts created in `%TEMP%\KeePassBrowserBridge-artifacts\`.

- [ ] **Step 2: Verify release artifacts**

```powershell
.\scripts\verify-release-artifacts.ps1
```

Expected: All artifacts pass verification (DLL version matches, manifests valid, checksums match).

- [ ] **Step 3: Verify store screenshots**

```powershell
.\scripts\capture-store-screenshots.ps1
node .\scripts\verify-store-screenshots.mjs
```

Expected: 5 PNG screenshots at 1280x800.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "release: add store screenshots for v1.0.0"
```

---

## Self-Review

1. **Spec coverage:** The design spec requires passkey enablement (A), release 1.0 (B), and store submission (C). This plan covers A (Tasks 1-5) and B (Tasks 6-9). Store submission (C) is deferred until after release as agreed.

2. **Placeholder scan:** No TBD, TODO, or incomplete sections.

3. **Type consistency:** All method names, permission names, and config keys match existing code: `BridgeSettings.PasskeysEnabled`, `BridgeSettings.PasskeysConfigKey`, `TrustedClientPermissions.PasskeyRead/PasskeyWrite`, `BridgeMethods.Passkeys*`, chrome API names.

---

## Execution Handoff

Plan complete and saved. Two execution options:

**1. Subagent-Driven (recommended)** — dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — execute tasks sequentially in this session with checkpoints.

**Which approach?**
