# Release Integrity

KeePass Browser Bridge releases publish checksums for every release artifact and can publish optional GPG detached signatures. This document explains what is verified today and what is not yet covered.

## Release Artifact Set

Every release should include:

- `KeePassBrowserBridge.dll`
- `KeePassBrowserBridge.plgx`
- `KeePassBrowserBridge-chrome-extension-<version>.zip`
- `KeePassBrowserBridge-firefox-extension-<version>.zip`
- `versioninfo.txt`
- `release-manifest.json`
- `SHA256SUMS.txt`
- Optional `*.asc` GPG detached signatures for each file above.

`scripts/build-release.ps1` creates these artifacts. `release-manifest.json` records the product version, build timestamp, Git source revision and dirty-state, KeePass build version, minimum runtime versions, and SHA-256/size metadata for the DLL, PLGX, browser ZIPs, and `versioninfo.txt`. Dirty-state detection ignores the configured artifact output directory so CI/release builds under `artifacts/` do not mark otherwise clean source as dirty. Passing `-RequireCleanSource` makes the build fail before compilation when any non-artifact Git status remains; the GitHub release workflow always uses this gate. `scripts/verify-release-artifacts.ps1` verifies the exact artifact set, DLL version metadata, KeePass update metadata, browser manifests, extension ZIP file lists, release-manifest metadata, and SHA-256 checksums. When signatures are required, it also verifies each `.asc` file with GPG and can pin the expected maintainer signer fingerprint by parsing GPG `VALIDSIG` status output.

## Maintainer Verification

Before publishing:

```powershell
.\scripts\verify.ps1 -E2EProjects chromium,firefox
.\scripts\build-release.ps1 -RequireCleanSource
.\scripts\verify-release-artifacts.ps1
```

Confirm `SHA256SUMS.txt` and `release-manifest.json` are attached to the same GitHub Release as the DLL, PLGX, browser ZIPs, and `versioninfo.txt`.

For a signed release, import the maintainer GPG private key into the release environment and run:

```powershell
.\scripts\build-release.ps1 -RequireCleanSource -SignArtifacts -GpgKeyId "<release-key-id>"
.\scripts\verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<full-maintainer-fingerprint>"
```

Confirm every published file has a matching `.asc` signature, including `SHA256SUMS.txt.asc`, and that verification fails if the expected fingerprint is changed.

The normal verifier also runs `scripts/verify-clean-source-smoke.ps1`, which creates a temporary dirty marker and confirms `-RequireCleanSource` fails before a release build proceeds. It also runs `scripts/verify-signed-release-smoke.ps1`, which uses a fake GPG command to exercise signed artifact creation and required-signature verification without needing a real maintainer key.

## User Verification On Windows

Download the artifact and `SHA256SUMS.txt` into the same directory, then run:

```powershell
$file = "KeePassBrowserBridge.plgx"
$expected = (Select-String -Path .\SHA256SUMS.txt -Pattern " $file$").Line.Split(" ")[0]
$actual = (Get-FileHash .\$file -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw "SHA-256 mismatch for $file" }
"SHA-256 verified for $file"
```

Repeat for the selected extension ZIP and, if used, `KeePassBrowserBridge.dll`.

If `.asc` signatures and the maintainer public key are published, verify the signed checksum file before trusting the checksum list. Compare the primary-key fingerprint printed by GPG to the fingerprint published in the release notes:

```powershell
gpg --verify .\SHA256SUMS.txt.asc .\SHA256SUMS.txt
gpg --fingerprint "<maintainer-release-key-id>"
```

## User Verification On macOS Or Linux

Download the artifact and `SHA256SUMS.txt` into the same directory, then run:

```bash
sha256sum -c SHA256SUMS.txt
```

If the platform uses `shasum` instead of `sha256sum`, verify a single artifact with:

```bash
shasum -a 256 KeePassBrowserBridge.plgx
```

Compare the printed hash to the matching line in `SHA256SUMS.txt`.

If `.asc` signatures and the maintainer public key are published, verify the signed checksum file before trusting the checksum list. Compare the primary-key fingerprint printed by GPG to the fingerprint published in the release notes:

```bash
gpg --verify SHA256SUMS.txt.asc SHA256SUMS.txt
gpg --fingerprint "<maintainer-release-key-id>"
```

## Current Trust Model

The current release process provides:

- Version consistency checks across source, plugin metadata, manifests, and update metadata.
- Production-only extension ZIP packaging.
- Structured release provenance metadata with source revision, dirty-state, build runtime versions, artifact sizes, and artifact hashes.
- Clean-source release gating with `-RequireCleanSource` in the GitHub release workflow and maintainer release commands.
- SHA-256 checksums for accidental corruption detection.
- Plugin auto-update verifies `KeePassBrowserBridge.plgx` against the release `SHA256SUMS.txt` before replacing the local plugin package.
- Optional GPG detached signatures for authenticated release assets when maintainers build with `-SignArtifacts`.
- Optional expected-signer fingerprint pinning with `-ExpectedSignerFingerprint` when maintainers verify signed releases.
- GitHub Release asset pinning for plugin update discovery.

The current release process does not yet provide:

- Authenticode signing for DLL or PLGX artifacts.
- Mandatory detached signatures on every release.
- Sigstore, minisign, or hardware-key-backed release signing.
- Reproducible-build proof from a clean builder beyond the clean-source gate, source revision, and dirty-state recorded in `release-manifest.json`.

Do not claim a release is signed unless every published release artifact includes a verified `.asc` signature, `verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<full-fingerprint>"` passes, and the release notes identify the maintainer public key fingerprint.

## Future Hardening Plan

1. Document release-key custody, rotation, and revocation.
2. Decide whether public replacement releases must always be signed instead of supporting unsigned builds.
3. Consider Authenticode for Windows plugin artifacts.
4. Evaluate Sigstore or hardware-key-backed signing for stronger public provenance.
5. Document reproducible-build checks once clean-builder evidence is available.
