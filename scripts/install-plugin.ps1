param(
    [ValidateSet("dll", "plgx")]
    [string] $ArtifactType = "dll",

    [string] $ArtifactsDir = "",
    [string] $KeePassRoot = "",
    [switch] $WhatIf
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path

if ([string]::IsNullOrWhiteSpace($ArtifactsDir)) {
    $ArtifactsDir = Join-Path $env:TEMP "KeePassBrowserBridge-artifacts"
}

if ([string]::IsNullOrWhiteSpace($KeePassRoot)) {
    $KeePassRoot = Join-Path $repoRoot "..\.."
}

$ArtifactsDir = (Resolve-Path $ArtifactsDir).Path
$KeePassRoot = (Resolve-Path $KeePassRoot).Path
$pluginsDir = (Resolve-Path (Join-Path $KeePassRoot "Plugins")).Path
$keePassExe = Join-Path $KeePassRoot "KeePass.exe"

if (-not (Test-Path -LiteralPath $keePassExe)) {
    throw "Cannot find KeePass.exe under $KeePassRoot."
}

function Test-PathUnderDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ChildPath,

        [Parameter(Mandatory = $true)]
        [string] $ParentPath
    )

    $childFull = [System.IO.Path]::GetFullPath($ChildPath)
    $parentFull = [System.IO.Path]::GetFullPath($ParentPath)
    if (-not $parentFull.EndsWith([System.IO.Path]::DirectorySeparatorChar.ToString())) {
        $parentFull += [System.IO.Path]::DirectorySeparatorChar
    }

    return $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)
}

function Assert-ExistingPathUnderDirectory {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath,

        [Parameter(Mandatory = $true)]
        [string] $Directory
    )

    $resolved = (Resolve-Path -LiteralPath $LiteralPath).Path
    if (-not (Test-PathUnderDirectory -ChildPath $resolved -ParentPath $Directory)) {
        throw "Refusing to operate on a path outside $Directory`: $resolved"
    }

    return $resolved
}

$artifactName = if ($ArtifactType -eq "plgx") { "KeePassBrowserBridge.plgx" } else { "KeePassBrowserBridge.dll" }
$artifactPath = Join-Path $ArtifactsDir $artifactName
if (-not (Test-Path -LiteralPath $artifactPath)) {
    throw "Cannot find release artifact: $artifactPath. Run .\scripts\build-release.ps1 first."
}

$runningKeePass = @(
    Get-Process -Name "KeePass" -ErrorAction SilentlyContinue |
        Where-Object {
            try {
                $processPath = $_.Path
            } catch {
                $processPath = ""
            }

            [string]::IsNullOrWhiteSpace($processPath) -or
                [string]::Equals($processPath, $keePassExe, [System.StringComparison]::OrdinalIgnoreCase)
        }
)

if ($runningKeePass.Count -gt 0) {
    $ids = ($runningKeePass | ForEach-Object { $_.Id }) -join ", "
    throw "Close KeePass before installing KeePassBrowserBridge. Running KeePass process id(s): $ids"
}

$targetPath = Join-Path $pluginsDir $artifactName
$otherArtifactName = if ($ArtifactType -eq "plgx") { "KeePassBrowserBridge.dll" } else { "KeePassBrowserBridge.plgx" }
$otherPath = Join-Path $pluginsDir $otherArtifactName

$backupDir = Join-Path $env:TEMP "KeePassBrowserBridge-installed-backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$backupDir = (Resolve-Path $backupDir).Path
if (Test-PathUnderDirectory -ChildPath $backupDir -ParentPath $pluginsDir) {
    throw "Refusing to place backups under KeePass' Plugins directory: $backupDir"
}

$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

function Backup-InstalledArtifact {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath
    )

    if (-not (Test-Path -LiteralPath $LiteralPath)) {
        return
    }

    $resolved = Assert-ExistingPathUnderDirectory -LiteralPath $LiteralPath -Directory $pluginsDir
    $extension = [System.IO.Path]::GetExtension($resolved)
    $backupPath = Join-Path $backupDir ("KeePassBrowserBridge-" + $stamp + $extension)
    Copy-Item -LiteralPath $resolved -Destination $backupPath -Force
    Write-Host "Backed up: $backupPath"
}

Backup-InstalledArtifact -LiteralPath $targetPath
Backup-InstalledArtifact -LiteralPath $otherPath

if ($WhatIf) {
    Write-Host "Would install: $artifactPath"
    Write-Host "Would target:  $targetPath"
    if (Test-Path -LiteralPath $otherPath) {
        Write-Host "Would remove duplicate plugin artifact: $otherPath"
    }
    return
}

if (Test-Path -LiteralPath $otherPath) {
    $resolvedOther = Assert-ExistingPathUnderDirectory -LiteralPath $otherPath -Directory $pluginsDir
    Remove-Item -LiteralPath $resolvedOther -Force
    Write-Host "Removed duplicate plugin artifact: $resolvedOther"
}

Copy-Item -LiteralPath $artifactPath -Destination $targetPath -Force
Write-Host "Installed: $targetPath"

if ($ArtifactType -eq "dll") {
    $version = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($targetPath)
    Write-Host "Installed DLL version: $($version.FileVersion)"
}
