# KeePassBrowserBridge v2.0 — Foundation Phase

**Goal:** Make the project buildable, testable, and releasable without manual procedures.

## Scope

1. CI/CD pipeline (single monolithic GitHub Actions workflow)
2. Version alignment (C# plugin → 2.0.0)
3. Root README with install/build/test instructions
4. .gitignore cleanup for build artifacts
5. Verify scripts pass end-to-end

## CI/CD Pipeline

Single workflow `.github/workflows/main.yml` with conditional jobs:

- **lint**: ESLint + basic syntax validation
- **test-js**: vitest unit tests + Playwright E2E (chromium)
- **test-cs**: dotnet run C# backend tests
- **build**: npm build + C# compile
- **release**: On workflow_dispatch with release=true, run build-release.ps1 + upload artifacts

## Version Alignment

| File | Target |
|------|--------|
| `src/Properties/AssemblyInfo.cs` → `AssemblyVersion("2.0.0.0")` | `2.0.0` |
| `src/Bridge/BridgeSettings.cs` → `PluginVersion = "2.0.0"` | `2.0.0` |
| `extension/manifest.json` | Already `2.0.0` |
| `package.json` | Already `2.0.0` |
| `update/versioninfo.txt` → `2.0.0` | `2.0.0` |

## Files to Create/Modify

- Create: `.github/workflows/main.yml`
- Create: `README.md` (root)
- Modify: `src/Bridge/BridgeSettings.cs`
- Modify: `src/Properties/AssemblyInfo.cs`
- Modify: `update/versioninfo.txt`
- Modify: `.gitignore` (if needed)
- Read: all verify/build scripts to understand current state

## Success Criteria

- `git push` triggers CI workflow
- All tests pass in CI (vitest + Playwright + C# backend)
- All version strings are `2.0.0`
- Root README exists with install/build/test instructions
- `.gitignore` correctly excludes `extension/dist/*`
- `scripts/verify.ps1` exits 0
