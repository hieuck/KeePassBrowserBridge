[CmdletBinding()]
param(
    [string] $OutputDir,
    [switch] $InstallChromium
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not $OutputDir) {
    $OutputDir = Join-Path $repoRoot "docs\store-assets\screenshots"
}

Push-Location $repoRoot
try {
    if ($InstallChromium) {
        npx playwright install chromium
    }

    node .\scripts\capture-store-screenshots.mjs --out $OutputDir
}
finally {
    Pop-Location
}
