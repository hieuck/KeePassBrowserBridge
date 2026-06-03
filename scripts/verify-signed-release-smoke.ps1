param(
    [string] $KeePassExe = "",
    [string] $ArtifactsDir = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$extensionDir = (Resolve-Path (Join-Path $repoRoot "extension")).Path

if ([string]::IsNullOrWhiteSpace($KeePassExe)) {
    $KeePassExe = Join-Path $repoRoot "..\..\KeePass.exe"
}
$KeePassExe = (Resolve-Path $KeePassExe).Path

$manifest = Get-Content -LiteralPath (Join-Path $extensionDir "manifest.json") -Raw | ConvertFrom-Json
$version = [string] $manifest.version

$smokeRoot = Join-Path $env:TEMP "KeePassBrowserBridge-signed-release-smoke"
if (Test-Path -LiteralPath $smokeRoot) {
    Remove-Item -LiteralPath $smokeRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $smokeRoot | Out-Null

if ([string]::IsNullOrWhiteSpace($ArtifactsDir)) {
    $ArtifactsDir = Join-Path $smokeRoot "artifacts"
}
New-Item -ItemType Directory -Force -Path $ArtifactsDir | Out-Null
$ArtifactsDir = (Resolve-Path $ArtifactsDir).Path

$fakeGpgDir = Join-Path $smokeRoot "fake-gpg"
New-Item -ItemType Directory -Force -Path $fakeGpgDir | Out-Null
$fakeGpgPs1 = Join-Path $fakeGpgDir "fake-gpg.ps1"
$fakeGpgCmd = Join-Path $fakeGpgDir "gpg.cmd"
$fakeGpgLog = Join-Path $fakeGpgDir "invocations.log"
$fakeFingerprint = "0123456789ABCDEF0123456789ABCDEF01234567"

$fakeGpgScript = @'
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]] $RemainingArguments
)

$ErrorActionPreference = "Stop"
if ([string]::IsNullOrWhiteSpace($env:KBB_FAKE_GPG_LOG)) {
    throw "KBB_FAKE_GPG_LOG is required."
}

Add-Content -LiteralPath $env:KBB_FAKE_GPG_LOG -Value ($RemainingArguments -join "`t")

if ($RemainingArguments -contains "--detach-sign") {
    $outputIndex = [Array]::IndexOf($RemainingArguments, "--output")
    if ($outputIndex -lt 0 -or $outputIndex + 1 -ge $RemainingArguments.Length) {
        throw "Missing --output for fake detached-sign."
    }

    $signaturePath = $RemainingArguments[$outputIndex + 1]
    $artifactPath = $RemainingArguments[$RemainingArguments.Length - 1]
    if (-not (Test-Path -LiteralPath $artifactPath -PathType Leaf)) {
        throw "Cannot sign missing artifact: $artifactPath"
    }

    $signatureText = "fake-signature-for=$([System.IO.Path]::GetFileName($artifactPath))`n"
    [System.IO.File]::WriteAllText($signaturePath, $signatureText, [System.Text.Encoding]::ASCII)
    exit 0
}

if ($RemainingArguments -contains "--verify") {
    $verifyIndex = [Array]::IndexOf($RemainingArguments, "--verify")
    if ($verifyIndex -lt 0 -or $verifyIndex + 2 -ge $RemainingArguments.Length) {
        throw "Missing signature or artifact for fake verify."
    }

    $signaturePath = $RemainingArguments[$verifyIndex + 1]
    $artifactPath = $RemainingArguments[$verifyIndex + 2]
    if (-not (Test-Path -LiteralPath $signaturePath -PathType Leaf)) {
        throw "Cannot verify missing signature: $signaturePath"
    }
    if (-not (Test-Path -LiteralPath $artifactPath -PathType Leaf)) {
        throw "Cannot verify missing artifact: $artifactPath"
    }

    $signatureText = Get-Content -LiteralPath $signaturePath -Raw
    $expected = "fake-signature-for=$([System.IO.Path]::GetFileName($artifactPath))"
    if (-not $signatureText.Contains($expected)) {
        throw "Signature $signaturePath does not match $artifactPath."
    }
    if ($RemainingArguments -contains "--status-fd") {
        Write-Output "[GNUPG:] GOODSIG 01234567 KeePass Browser Bridge Release Test"
        Write-Output "[GNUPG:] VALIDSIG $env:KBB_FAKE_GPG_FINGERPRINT 2026-06-03 0 4 0 1 8 00 $env:KBB_FAKE_GPG_FINGERPRINT"
    }
    exit 0
}

throw "Unsupported fake gpg invocation: $($RemainingArguments -join ' ')"
'@

[System.IO.File]::WriteAllText($fakeGpgPs1, ($fakeGpgScript + "`r`n"), [System.Text.Encoding]::ASCII)
[System.IO.File]::WriteAllText(
    $fakeGpgCmd,
    "@echo off`r`npowershell -NoProfile -ExecutionPolicy Bypass -File ""$fakeGpgPs1"" %*`r`n",
    [System.Text.Encoding]::ASCII)

$previousFakeGpgLog = $env:KBB_FAKE_GPG_LOG
$previousFakeGpgFingerprint = $env:KBB_FAKE_GPG_FINGERPRINT
$env:KBB_FAKE_GPG_LOG = $fakeGpgLog
$env:KBB_FAKE_GPG_FINGERPRINT = $fakeFingerprint
try {
    & (Join-Path $scriptDir "build-release.ps1") `
        -KeePassExe $KeePassExe `
        -ArtifactsDir $ArtifactsDir `
        -SignArtifacts `
        -GpgKeyId "fake-release-key" `
        -GpgExe $fakeGpgCmd

    & (Join-Path $scriptDir "verify-release-artifacts.ps1") `
        -ArtifactsDir $ArtifactsDir `
        -Version $version `
        -RequireSignatures `
        -GpgExe $fakeGpgCmd `
        -ExpectedSignerFingerprint $fakeFingerprint

    $baseFiles = @(
        "KeePassBrowserBridge.dll",
        "KeePassBrowserBridge.plgx",
        "KeePassBrowserBridge-chrome-extension-$version.zip",
        "KeePassBrowserBridge-firefox-extension-$version.zip",
        "versioninfo.txt",
        "release-manifest.json",
        "SHA256SUMS.txt"
    )

    foreach ($file in $baseFiles) {
        $signaturePath = Join-Path $ArtifactsDir "$file.asc"
        if (-not (Test-Path -LiteralPath $signaturePath -PathType Leaf)) {
            throw "Signed release smoke test missing signature: $signaturePath"
        }
    }

    $checksumSignaturePath = Join-Path $ArtifactsDir "SHA256SUMS.txt.asc"
    if (-not (Test-Path -LiteralPath $checksumSignaturePath -PathType Leaf)) {
        throw "Signed release smoke test missing checksum-file signature: $checksumSignaturePath"
    }

    $invocations = @(Get-Content -LiteralPath $fakeGpgLog)
    $signCount = @($invocations | Where-Object { $_ -like "*--detach-sign*" }).Count
    $verifyCount = @($invocations | Where-Object { $_ -like "*--verify*" }).Count
    if ($signCount -ne $baseFiles.Count) {
        throw "Expected $($baseFiles.Count) fake signing invocations, got $signCount."
    }
    if ($verifyCount -ne $baseFiles.Count) {
        throw "Expected $($baseFiles.Count) fake signature verification invocations, got $verifyCount."
    }

    $statusVerifyCount = @($invocations | Where-Object { $_ -like "*--status-fd*" }).Count
    if ($statusVerifyCount -ne $baseFiles.Count) {
        throw "Expected $($baseFiles.Count) fake fingerprint-aware verification invocations, got $statusVerifyCount."
    }

    $wrongFingerprint = "FEDCBA9876543210FEDCBA9876543210FEDCBA98"
    $mismatchFailed = $false
    try {
        & (Join-Path $scriptDir "verify-release-artifacts.ps1") `
            -ArtifactsDir $ArtifactsDir `
            -Version $version `
            -RequireSignatures `
            -GpgExe $fakeGpgCmd `
            -ExpectedSignerFingerprint $wrongFingerprint
    } catch {
        if ([string] $_.Exception.Message -like "*signer fingerprint mismatch*") {
            $mismatchFailed = $true
        } else {
            throw
        }
    }

    if (-not $mismatchFailed) {
        throw "Signed release smoke test expected fingerprint mismatch verification to fail."
    }

    Write-Host "Signed release smoke test passed."
} finally {
    $env:KBB_FAKE_GPG_LOG = $previousFakeGpgLog
    $env:KBB_FAKE_GPG_FINGERPRINT = $previousFakeGpgFingerprint
    Remove-Item -LiteralPath $smokeRoot -Recurse -Force -ErrorAction SilentlyContinue
}
