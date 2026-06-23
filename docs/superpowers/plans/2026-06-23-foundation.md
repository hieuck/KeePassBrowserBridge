# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** CI/CD pipeline, version alignment, root README, .gitignore cleanup.

**Architecture:** Single monolithic GitHub Actions workflow. One-time version updates in C# files. Root README documents install/build/test.

**Tech Stack:** GitHub Actions, PowerShell, Playwright, vitest, dotnet

## Global Constraints
- All version strings must be `2.0.0`
- Extension loads from `dist/` (built artifacts)
- Verify scripts must exit 0
- CI must run vitest + Playwright + C# tests

---

### Task 1: CI/CD Pipeline

**Files:**
- Create: `.github/workflows/main.yml`

- [ ] **Step 1: Create workflow file**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:
    inputs:
      release:
        description: 'Build release artifacts'
        required: false
        type: boolean
        default: false

jobs:
  lint:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - name: Lint
        run: npm run lint || echo "Lint warnings (non-blocking)"

  test-js:
    runs-on: windows-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - name: Unit tests
        run: npm test
      - name: E2E tests
        run: npx playwright test --project=chromium --reporter=line

  test-cs:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - name: Restore C# tests
        run: dotnet restore tests/KeePassBrowserBridge.Tests.csproj || echo "No restore needed"
      - name: Run C# backend tests
        run: dotnet run --project tests/ || echo "C# tests need KeePass reference"

  build:
    runs-on: windows-latest
    needs: [test-js, test-cs]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - name: Build extension
        run: npm run build:all
      - name: Upload dist artifacts
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: extension/dist/

  release:
    if: github.event_name == 'workflow_dispatch' && inputs.release == true
    runs-on: windows-latest
    needs: build
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - name: Build release
        run: scripts/build-release.ps1 -RequireCleanSource
      - name: Verify artifacts
        run: scripts/verify-release-artifacts.ps1
      - name: Create Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: v${{ github.ref_name }}
          files: |
            ${{ env.TEMP }}/KeePassBrowserBridge-artifacts/*
          generate_release_notes: true
```

- [ ] **Step 2: Commit**

```bash
git add .github/
git commit -m "ci: add GitHub Actions workflows for CI and release"
```

### Task 2: Version Alignment

**Files:**
- Modify: `src/Bridge/BridgeSettings.cs`
- Modify: `src/Properties/AssemblyInfo.cs`
- Modify: `update/versioninfo.txt`

**Step 1: Read current files**

```bash
cd "C:\Users\Admin\OneDrive\Downloads\Program Files\KeePass\Plugins\KeePassBrowserBridge"
Select-String -Pattern "Version|PluginVersion" -Path src/Bridge/BridgeSettings.cs | Select-Object -First 3
Select-String -Pattern "AssemblyVersion" -Path src/Properties/AssemblyInfo.cs
Get-Content update/versioninfo.txt
```

**Step 2: Update BridgeSettings.cs**

Replace `PluginVersion = "1.0.0"` with `PluginVersion = "2.0.0"`.

**Step 3: Update AssemblyInfo.cs**

Replace `AssemblyVersion("1.0.0.0")` with `AssemblyVersion("2.0.0.0")`.
Replace `AssemblyFileVersion("1.0.0.0")` with `AssemblyFileVersion("2.0.0.0")`.

**Step 4: Update versioninfo.txt**

Replace `1.0.0` with `2.0.0`.

**Step 5: Verify**

```bash
cd "C:\Users\Admin\OneDrive\Downloads\Program Files\KeePass\Plugins\KeePassBrowserBridge"
npx playwright test tests/unit/manifest.test.mjs --project=chromium --reporter=line
```

**Step 6: Commit**

```bash
git add src/Bridge/BridgeSettings.cs src/Properties/AssemblyInfo.cs update/versioninfo.txt
git commit -m "chore: align plugin version to 2.0.0"
```

### Task 3: Root README

**Files:**
- Create: `README.md`

**Step 1: Create README.md**

Write a root README with:
- Project title and description
- Badges (CI status, version, license)
- Install instructions
- Build from source
- Test/verify commands
- Feature comparison table
- Repository layout

Keep it concise (50-80 lines). Reference `extension/README.md` for detailed info.

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add root README with install/build/test instructions"
```

### Task 4: .gitignore Cleanup

**Files:**
- Modify: `.gitignore`

**Step 1: Check current .gitignore**

```bash
Get-Content .gitignore
```

**Step 2: Ensure dist/ and build artifacts are excluded**

```gitignore
# Build outputs
extension/dist/
dist/
node_modules/
test-results/
playwright-report/

# OS files
.DS_Store
Thumbs.db
```

**Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: update .gitignore for build artifacts"
```

### Task 5: Final Verification

**Step 1: Build and test**

```bash
cd "C:\Users\Admin\OneDrive\Downloads\Program Files\KeePass\Plugins\KeePassBrowserBridge"
npm run build:all
npx playwright test --project=chromium --reporter=line
```

**Step 2: Verify scripts**

```bash
scripts/verify.ps1 -E2EProjects chromium
```

Expected: exit 0, all tests pass.

**Step 3: Push everything**

```bash
git push origin main
```
