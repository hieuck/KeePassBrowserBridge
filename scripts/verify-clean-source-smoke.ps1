param(
    [string] $KeePassExe = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path

if ([string]::IsNullOrWhiteSpace($KeePassExe)) {
    $KeePassExe = Join-Path $repoRoot "..\..\KeePass.exe"
}
$KeePassExe = (Resolve-Path $KeePassExe).Path

$tempRoot = (Resolve-Path $env:TEMP).Path
$smokeRoot = Join-Path $tempRoot "KeePassBrowserBridge-clean-source-smoke"
$marker = Join-Path $repoRoot (".kbb-clean-source-smoke-{0}.tmp" -f [Guid]::NewGuid().ToString("N"))
if (-not $smokeRoot.StartsWith($tempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to use clean-source smoke output outside TEMP: $smokeRoot"
}

if (Test-Path -LiteralPath $smokeRoot) {
    Remove-Item -LiteralPath $smokeRoot -Recurse -Force
}
New-Item -ItemType Directory -Force -Path $smokeRoot | Out-Null

try {
    [System.IO.File]::WriteAllText($marker, "dirty-source-smoke", [System.Text.Encoding]::ASCII)

    $failedAsExpected = $false
    try {
        & (Join-Path $scriptDir "build-release.ps1") `
            -KeePassExe $KeePassExe `
            -ArtifactsDir (Join-Path $smokeRoot "artifacts") `
            -RequireCleanSource
    } catch {
        if ([string] $_.Exception.Message -like "*requires a clean source tree*") {
            $failedAsExpected = $true
        } else {
            throw
        }
    }

    if (-not $failedAsExpected) {
        throw "Clean-source smoke expected build-release.ps1 -RequireCleanSource to fail on a dirty source tree."
    }

    Write-Host "Clean-source smoke test passed."
} finally {
    Remove-Item -LiteralPath $marker -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath $smokeRoot -Recurse -Force -ErrorAction SilentlyContinue
}
