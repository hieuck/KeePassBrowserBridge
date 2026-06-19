[CmdletBinding()]
param(
    [string] $ArtifactsDir = "",
    [string] $TemplatePath = "",
    [string] $OutputPath = "",
    [string] $Tester = "",
    [string] $WindowsVersion = "",
    [string] $Browser = "",
    [string] $BrowserVersion = "",
    [string] $DatabaseAlias = "",
    [string] $BrowserProfile = "",
    [string] $FixtureAlias = "",
    [string] $NetworkNotes = "",
    [string] $Date = "",
    [switch] $Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

function Invoke-NewManualSmokeEvidence {
if ([string]::IsNullOrWhiteSpace($TemplatePath)) {
    $TemplatePath = Join-Path $repoRoot "docs\manual-smoke-evidence.md"
}

$TemplatePath = (Resolve-Path $TemplatePath).Path

if ([string]::IsNullOrWhiteSpace($ArtifactsDir)) {
    $ArtifactsDir = Join-Path $env:TEMP "KeePassBrowserBridge-artifacts"
}

$artifactDirectoryLabel = Get-AbsolutePathLabel -PathValue $ArtifactsDir
$manifestPath = Join-Path $ArtifactsDir "release-manifest.json"
$releaseManifest = $null
if (Test-Path -LiteralPath $manifestPath -PathType Leaf) {
    $releaseManifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
}

$version = Get-ReleaseVersion -ReleaseManifest $releaseManifest
$sourceRevision = Get-SourceRevision -ReleaseManifest $releaseManifest
$sourceDirty = Get-SourceDirtyLabel -ReleaseManifest $releaseManifest
$keepassVersion = Get-KeePassVersion -ReleaseManifest $releaseManifest
$artifactSummary = Get-ArtifactSummary -ReleaseManifest $releaseManifest

if ([string]::IsNullOrWhiteSpace($Date)) {
    $Date = (Get-Date).ToString("yyyy-MM-dd")
}

if ([string]::IsNullOrWhiteSpace($OutputPath)) {
    $safeVersion = ConvertTo-FileNameToken $version
    $safeDate = ConvertTo-FileNameToken $Date
    $OutputPath = Join-Path $repoRoot "docs\manual-smoke-evidence-$safeVersion-$safeDate.md"
}

$outputPathFull = Get-AbsolutePathLabel -PathValue $OutputPath
if ((Test-Path -LiteralPath $outputPathFull) -and -not $Force) {
    throw "Manual smoke evidence already exists: $outputPathFull. Pass -Force to overwrite it intentionally."
}

$content = Get-Content -LiteralPath $TemplatePath -Raw

$content = Set-TwoColumnRow -Content $content -Name "Version" -Value $version
$content = Set-TwoColumnRow -Content $content -Name "Commit" -Value $sourceRevision
$content = Set-TwoColumnRow -Content $content -Name "Artifact directory" -Value $artifactDirectoryLabel
$content = Set-TwoColumnRow -Content $content -Name "KeePass version" -Value $keepassVersion
$content = Set-TwoColumnRow -Content $content -Name "KeePassBrowserBridge artifact" -Value $artifactSummary
$content = Set-TwoColumnRow -Content $content -Name "Windows version" -Value $WindowsVersion
$content = Set-TwoColumnRow -Content $content -Name "Tester" -Value $Tester
$content = Set-TwoColumnRow -Content $content -Name "Date" -Value $Date

$content = Set-TwoColumnRow -Content $content -Name "Throwaway KeePass database path" -Value $DatabaseAlias
$content = Set-TwoColumnRow -Content $content -Name "Browser profile path or label" -Value $BrowserProfile
$content = Set-TwoColumnRow -Content $content -Name "Browser under test" -Value $Browser
$content = Set-TwoColumnRow -Content $content -Name "Browser version" -Value $BrowserVersion
$content = Set-TwoColumnRow -Content $content -Name "Fixture host or disposable account alias" -Value $FixtureAlias
$content = Set-TwoColumnRow -Content $content -Name "Network notes" -Value $NetworkNotes

$content = Set-FourColumnRow `
    -Content $content `
    -Name "Full verifier" `
    -Command '`.\scripts\verify.ps1`' `
    -Result "Pending" `
    -Evidence "Paste fresh command output or log path for $sourceRevision."

$content = Set-FourColumnRow `
    -Content $content `
    -Name "Chromium and Firefox E2E" `
    -Command '`.\scripts\verify.ps1 -E2EProjects chromium,firefox`' `
    -Result "Pending" `
    -Evidence "Paste fresh command output or log path for release-candidate browser coverage."

$content = Set-FourColumnRow `
    -Content $content `
    -Name "Clean release build" `
    -Command '`.\scripts\build-release.ps1 -RequireCleanSource`' `
    -Result "Pending" `
    -Evidence "Confirm command output for $sourceRevision; release-manifest SourceDirty=$sourceDirty."

$content = Set-FourColumnRow `
    -Content $content `
    -Name "Artifact verification" `
    -Command '`.\scripts\verify-release-artifacts.ps1`' `
    -Result "Pending" `
    -Evidence "Verify artifacts under $artifactDirectoryLabel for $version."

$content = Set-FourColumnRow `
    -Content $content `
    -Name "Store screenshots" `
    -Command '`.\scripts\capture-store-screenshots.ps1`; `node .\scripts\verify-store-screenshots.mjs`' `
    -Result "Pending" `
    -Evidence "Attach command output after regenerating final UI screenshots."

$content = Set-FourColumnRow `
    -Content $content `
    -Name "Optional signatures" `
    -Command '`.\scripts\verify-release-artifacts.ps1 -RequireSignatures -ExpectedSignerFingerprint "<fingerprint>"`' `
    -Result "Pending / N/A" `
    -Evidence 'Required only when publishing signed `.asc` artifacts.'

$outputDirectory = Split-Path -Parent $outputPathFull
if (-not [string]::IsNullOrWhiteSpace($outputDirectory)) {
    New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
}

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outputPathFull, $content, $utf8NoBom)

Write-Host "Manual smoke evidence prepared: $outputPathFull"
}

function Get-AbsolutePathLabel {
    param(
        [Parameter(Mandatory = $true)]
        [string] $PathValue
    )

    if (Test-Path -LiteralPath $PathValue) {
        return (Resolve-Path $PathValue).Path
    }

    if ([System.IO.Path]::IsPathRooted($PathValue)) {
        return [System.IO.Path]::GetFullPath($PathValue)
    }

    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $PathValue))
}

function Get-ReleaseVersion {
    param(
        [object] $ReleaseManifest
    )

    if ($null -ne $ReleaseManifest -and -not [string]::IsNullOrWhiteSpace([string] $ReleaseManifest.Version)) {
        return [string] $ReleaseManifest.Version
    }

    $manifestPath = Join-Path $repoRoot "extension\manifest.json"
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    return [string] $manifest.version
}

function Get-SourceRevision {
    param(
        [object] $ReleaseManifest
    )

    if ($null -ne $ReleaseManifest -and -not [string]::IsNullOrWhiteSpace([string] $ReleaseManifest.SourceRevision)) {
        return [string] $ReleaseManifest.SourceRevision
    }

    return Invoke-GitText @("-C", $repoRoot, "rev-parse", "HEAD")
}

function Get-SourceDirtyLabel {
    param(
        [object] $ReleaseManifest
    )

    if ($null -ne $ReleaseManifest -and $null -ne $ReleaseManifest.SourceDirty) {
        return ([bool] $ReleaseManifest.SourceDirty).ToString()
    }

    return "Unknown"
}

function Get-KeePassVersion {
    param(
        [object] $ReleaseManifest
    )

    if ($null -ne $ReleaseManifest -and $null -ne $ReleaseManifest.Build -and -not [string]::IsNullOrWhiteSpace([string] $ReleaseManifest.Build.KeePassFileVersion)) {
        return [string] $ReleaseManifest.Build.KeePassFileVersion
    }

    return ""
}

function Get-ArtifactSummary {
    param(
        [object] $ReleaseManifest
    )

    if ($null -eq $ReleaseManifest -or $null -eq $ReleaseManifest.Artifacts) {
        return "DLL / PLGX"
    }

    $artifactNames = @($ReleaseManifest.Artifacts | ForEach-Object { [string] $_.Name })
    $hasDll = $artifactNames -contains "KeePassBrowserBridge.dll"
    $hasPlgx = $artifactNames -contains "KeePassBrowserBridge.plgx"

    if ($hasDll -and $hasPlgx) {
        return "DLL and PLGX built; install exactly one for smoke testing"
    }

    if ($hasPlgx) {
        return "PLGX"
    }

    if ($hasDll) {
        return "DLL"
    }

    return "DLL / PLGX"
}

function Invoke-GitText {
    param(
        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    try {
        $output = & git @Arguments 2>$null
        if ($LASTEXITCODE -ne 0) {
            return ""
        }

        return (($output -join "`n").Trim())
    } catch {
        return ""
    }
}

function ConvertTo-FileNameToken {
    param(
        [string] $Value
    )

    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "unknown"
    }

    return ($Value -replace "[^0-9A-Za-z._-]", "_")
}

function Escape-MarkdownTableCell {
    param(
        [string] $Value
    )

    if ($null -eq $Value) {
        return ""
    }

    return (($Value.Replace("|", "\|")) -replace "`r?`n", " ").Trim()
}

function Set-TwoColumnRow {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string] $Name,

        [string] $Value = ""
    )

    return Set-MarkdownTableRow -Content $Content -Name $Name -Cells @($Name, (Escape-MarkdownTableCell $Value))
}

function Set-FourColumnRow {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [string] $Command,

        [Parameter(Mandatory = $true)]
        [string] $Result,

        [Parameter(Mandatory = $true)]
        [string] $Evidence
    )

    return Set-MarkdownTableRow -Content $Content -Name $Name -Cells @(
        $Name,
        (Escape-MarkdownTableCell $Command),
        (Escape-MarkdownTableCell $Result),
        (Escape-MarkdownTableCell $Evidence)
    )
}

function Set-MarkdownTableRow {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Content,

        [Parameter(Mandatory = $true)]
        [string] $Name,

        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string[]] $Cells
    )

    $lines = $Content -split "`r?`n", -1
    $updated = $false
    $escapedName = [regex]::Escape($Name)

    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index] -match "^\|\s*$escapedName\s*\|") {
            $lines[$index] = "| " + ($Cells -join " | ") + " |"
            $updated = $true
            break
        }
    }

    if (-not $updated) {
        throw "Cannot find manual smoke evidence table row: $Name"
    }

    return ($lines -join "`n")
}

Invoke-NewManualSmokeEvidence
