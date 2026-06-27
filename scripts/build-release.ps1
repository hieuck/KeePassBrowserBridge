param(
    [string] $KeePassExe = "",
    [string] $Configuration = "Release",
    [string] $ArtifactsDir = "",
    [switch] $RequireCleanSource,
    [switch] $SignArtifacts,
    [string] $GpgKeyId = "",
    [string] $GpgExe = "gpg"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$srcDir = (Resolve-Path (Join-Path $repoRoot "src")).Path
$extensionDir = (Resolve-Path (Join-Path $repoRoot "extension")).Path
$updateDir = (Resolve-Path (Join-Path $repoRoot "update")).Path

if ([string]::IsNullOrWhiteSpace($KeePassExe)) {
    $KeePassExe = Join-Path $repoRoot "..\..\KeePass.exe"
}

$KeePassExe = (Resolve-Path $KeePassExe).Path
$KeePassDir = Split-Path -Parent $KeePassExe

if ([string]::IsNullOrWhiteSpace($ArtifactsDir)) {
    $ArtifactsDir = Join-Path $env:TEMP "KeePassBrowserBridge-artifacts"
}

New-Item -ItemType Directory -Force -Path $ArtifactsDir | Out-Null
$ArtifactsDir = (Resolve-Path $ArtifactsDir).Path

$repoUnderKeePassPlugins = $repoRoot -match "\\Plugins(\\|$)"
$artifactsUnderRepo = $ArtifactsDir.StartsWith($repoRoot, [System.StringComparison]::OrdinalIgnoreCase)
if ($repoUnderKeePassPlugins -and $artifactsUnderRepo) {
    throw "Refusing to write release artifacts under this repository because it is inside KeePass' Plugins directory. KeePass scans subdirectories and can load duplicate plugin DLLs. Use the default temp output or pass -ArtifactsDir outside the KeePass Plugins tree."
}

Get-ChildItem -LiteralPath $ArtifactsDir -Force -ErrorAction SilentlyContinue |
    Where-Object {
        $_.Name -like "KeePassBrowserBridge*" -or
        $_.Name -eq "versioninfo.txt" -or
        $_.Name -eq "versioninfo.txt.asc" -or
        $_.Name -eq "release-manifest.json" -or
        $_.Name -eq "release-manifest.json.asc" -or
        $_.Name -eq "SHA256SUMS.txt" -or
        $_.Name -eq "SHA256SUMS.txt.asc" -or
        $_.Name -in @("_chrome-extension", "_firefox-extension", "backup", "installed-backups")
    } |
    ForEach-Object {
        Remove-Item -LiteralPath $_.FullName -Recurse -Force
    }

$version = "0.1.0"
$manifestPath = Join-Path $extensionDir "manifest.json"
if (Test-Path -LiteralPath $manifestPath) {
    $manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
    if ($manifest.version) {
        $version = [string] $manifest.version
    }
}

Write-Host "Building KeePassBrowserBridge release $version"
Write-Host "KeePass: $KeePassExe"
Write-Host "Source:  $srcDir"
Write-Host "Output:  $ArtifactsDir"

function Move-ItemWithRetry {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath,

        [Parameter(Mandatory = $true)]
        [string] $Destination,

        [int] $Retries = 10,
        [int] $DelayMilliseconds = 500
    )

    for ($attempt = 1; $attempt -le $Retries; $attempt++) {
        try {
            Move-Item -LiteralPath $LiteralPath -Destination $Destination -Force
            return
        } catch {
            if ($attempt -eq $Retries) {
                throw
            }

            Start-Sleep -Milliseconds $DelayMilliseconds
        }
    }
}

function Invoke-GpgDetachedSignature {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath
    )

    $signaturePath = "$LiteralPath.asc"
    if (Test-Path -LiteralPath $signaturePath) {
        Remove-Item -LiteralPath $signaturePath -Force
    }

    $arguments = @("--batch", "--yes", "--armor", "--detach-sign", "--output", $signaturePath)
    if (-not [string]::IsNullOrWhiteSpace($GpgKeyId)) {
        $arguments += @("--local-user", $GpgKeyId)
    }
    $arguments += $LiteralPath

    & $GpgExe @arguments
    if ($LASTEXITCODE -ne 0) {
        throw "GPG detached signature failed for $LiteralPath with exit code $LASTEXITCODE."
    }

    return $signaturePath
}

function New-ExtensionPackage {
    param(
        [Parameter(Mandatory = $true)]
        [string] $StagingDir,

        [Parameter(Mandatory = $true)]
        [string] $DestinationPath,

        [Parameter(Mandatory = $true)]
        [string[]] $PackageFiles,

        [string] $ManifestOverride = ""
    )

    if (Test-Path -LiteralPath $StagingDir) {
        Remove-Item -LiteralPath $StagingDir -Recurse -Force
    }

    New-Item -ItemType Directory -Force -Path $StagingDir | Out-Null

    foreach ($relativePath in $PackageFiles) {
        $sourcePath = Join-Path $extensionDir $relativePath
        if (-not (Test-Path -LiteralPath $sourcePath)) {
            throw "Cannot find extension package file: $sourcePath"
        }

        $destinationPathForFile = Join-Path $StagingDir $relativePath
        $destinationDir = Split-Path -Parent $destinationPathForFile
        if (-not [string]::IsNullOrWhiteSpace($destinationDir)) {
            New-Item -ItemType Directory -Force -Path $destinationDir | Out-Null
        }

        Copy-Item -LiteralPath $sourcePath -Destination $destinationPathForFile -Force
    }

    if (-not [string]::IsNullOrWhiteSpace($ManifestOverride)) {
        if (-not (Test-Path -LiteralPath $ManifestOverride)) {
            throw "Cannot find extension manifest override: $ManifestOverride"
        }

        Copy-Item -LiteralPath $ManifestOverride -Destination (Join-Path $StagingDir "manifest.json") -Force
    }

    if (Test-Path -LiteralPath $DestinationPath) {
        Remove-Item -LiteralPath $DestinationPath -Force
    }

    $packageItems = Get-ChildItem -LiteralPath $StagingDir -Force
    Compress-Archive -Path $packageItems.FullName -DestinationPath $DestinationPath -Force
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

function Get-RepoRelativePath {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath
    )

    $fullPath = (Resolve-Path $LiteralPath).Path
    $repoPrefix = $repoRoot
    if (-not $repoPrefix.EndsWith("\", [System.StringComparison]::Ordinal)) {
        $repoPrefix += "\"
    }

    if (-not $fullPath.StartsWith($repoPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        return ""
    }

    return $fullPath.Substring($repoPrefix.Length).Replace("\", "/")
}

function Get-GitStatusIgnoringArtifactOutput {
    $status = Invoke-GitText @("-C", $repoRoot, "status", "--porcelain")
    if ([string]::IsNullOrWhiteSpace($status)) {
        return ""
    }

    $artifactRelative = Get-RepoRelativePath -LiteralPath $ArtifactsDir
    if ([string]::IsNullOrWhiteSpace($artifactRelative)) {
        return $status
    }

    $artifactPrefix = $artifactRelative.TrimEnd("/") + "/"
    $filteredLines = @()
    foreach ($line in ($status -split "`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $pathPart = ""
        if ($line.Length -gt 3) {
            $pathPart = $line.Substring(3).Trim().Trim('"').Replace("\", "/")
        }

        $renamedPath = ""
        $renameSeparator = $pathPart.IndexOf(" -> ", [System.StringComparison]::Ordinal)
        if ($renameSeparator -ge 0) {
            $renamedPath = $pathPart.Substring($renameSeparator + 4).Trim().Trim('"').Replace("\", "/")
        }

        if ([string]::Equals($pathPart.TrimEnd("/"), $artifactRelative.TrimEnd("/"), [System.StringComparison]::OrdinalIgnoreCase) -or
            $pathPart.StartsWith($artifactPrefix, [System.StringComparison]::OrdinalIgnoreCase) -or
            [string]::Equals($renamedPath.TrimEnd("/"), $artifactRelative.TrimEnd("/"), [System.StringComparison]::OrdinalIgnoreCase) -or
            $renamedPath.StartsWith($artifactPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
            continue
        }

        $filteredLines += $line
    }

    return (($filteredLines -join "`n").Trim())
}

function Get-ArtifactMetadata {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath
    )

    $item = Get-Item -LiteralPath $LiteralPath
    $hash = Get-FileHash -LiteralPath $LiteralPath -Algorithm SHA256
    [pscustomobject] @{
        Name = $item.Name
        Sha256 = $hash.Hash.ToLowerInvariant()
        SizeBytes = $item.Length
    }
}

$gitStatus = Get-GitStatusIgnoringArtifactOutput
if ($RequireCleanSource -and -not [string]::IsNullOrWhiteSpace($gitStatus)) {
    throw "Release build requires a clean source tree. Commit, stash, or remove source changes before publishing.`nDirty status:`n$gitStatus"
}

$frameworkDir = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319"
$csc = Join-Path $frameworkDir "csc.exe"
if (-not (Test-Path -LiteralPath $csc)) {
    throw "Cannot find csc.exe at $csc."
}

$pluginDllTarget = Join-Path $ArtifactsDir "KeePassBrowserBridge.dll"
$updateInfoSource = Join-Path $updateDir "versioninfo.txt"
$expectedUpdateInfo = ":`nKeePass Browser Bridge:$version`n:`n"
if (-not (Test-Path -LiteralPath $updateInfoSource)) {
    throw "Cannot find KeePass update info file: $updateInfoSource"
}

$actualUpdateInfo = (Get-Content -LiteralPath $updateInfoSource -Raw).Replace("`r`n", "`n")
if ($actualUpdateInfo -ne $expectedUpdateInfo) {
    throw "KeePass update info file must contain the current plugin version $version."
}

$updateInfoTarget = Join-Path $ArtifactsDir "versioninfo.txt"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($updateInfoTarget, $expectedUpdateInfo, $utf8NoBom)

Write-Host "Compiling KeePass plugin via dotnet build..."
$projectPath = Join-Path $PSScriptRoot "..\src\KeePassBrowserBridge.csproj"
$buildOutput = "$env:TEMP\KeePassBrowserBridge-build\"
Remove-Item -Path $buildOutput -Recurse -Force -ErrorAction SilentlyContinue
dotnet build $projectPath /p:BaseOutputPath="$buildOutput" --configuration Release -p:KeePassReferencePath="$KeePassDir"
if ($LASTEXITCODE -ne 0) {
    throw "dotnet build failed with exit code $LASTEXITCODE."
}
$compiledDll = "${buildOutput}Release\net40\KeePassBrowserBridge.dll"
if (-not (Test-Path -LiteralPath $compiledDll)) {
    throw "Compiled DLL not found at $compiledDll"
}
Copy-Item -LiteralPath $compiledDll -Destination $pluginDllTarget -Force

$expectedPlgx = Join-Path $repoRoot "src.plgx"
$existingPlgx = @()
$existingPlgx += Get-ChildItem -LiteralPath $srcDir -Filter "*.plgx" -File -ErrorAction SilentlyContinue
if (Test-Path -LiteralPath $expectedPlgx) {
    $existingPlgx += Get-Item -LiteralPath $expectedPlgx
}

foreach ($file in $existingPlgx) {
    Remove-Item -LiteralPath $file.FullName -Force
}

& $KeePassExe --plgx-create $srcDir --plgx-prereq-kp:2.50 --plgx-prereq-net:4.0
if ($LASTEXITCODE -and $LASTEXITCODE -ne 0) {
    throw "KeePass PLGX creation failed with exit code $LASTEXITCODE."
}

$deadline = (Get-Date).AddSeconds(30)
do {
    Start-Sleep -Milliseconds 500
    $plgxExists = Test-Path -LiteralPath $expectedPlgx
} while (-not $plgxExists -and (Get-Date) -lt $deadline)

$createdPlgxCandidates = @()
if (Test-Path -LiteralPath $expectedPlgx) {
    $createdPlgxCandidates += Get-Item -LiteralPath $expectedPlgx
}
$createdPlgxCandidates += Get-ChildItem -LiteralPath $srcDir -Filter "*.plgx" -File -ErrorAction SilentlyContinue

$createdPlgx = $createdPlgxCandidates |
    Sort-Object LastWriteTimeUtc -Descending |
    Select-Object -First 1

if (-not $createdPlgx) {
    throw "KeePass did not create a PLGX file for $srcDir."
}

$plgxTarget = Join-Path $ArtifactsDir "KeePassBrowserBridge.plgx"
Move-ItemWithRetry -LiteralPath $createdPlgx.FullName -Destination $plgxTarget

$chromeExtensionTarget = Join-Path $ArtifactsDir "KeePassBrowserBridge-chrome-extension-$version.zip"
$firefoxExtensionTarget = Join-Path $ArtifactsDir "KeePassBrowserBridge-firefox-extension-$version.zip"
$chromeStagingDir = Join-Path $ArtifactsDir "_chrome-extension"
$firefoxStagingDir = Join-Path $ArtifactsDir "_firefox-extension"
$firefoxManifestPath = Join-Path $extensionDir "manifest.firefox.json"
$commonExtensionFiles = @(
    "_locales\en\messages.json",
    "_locales\vi\messages.json",
    "background.js",
    "contentScript.js",
    "customFields.js",
    "design-tokens.css",
    "dist\_plugin-vue_export-helper.js",
    "dist\antd-vendor.js",
    "dist\BaseInput.css",
    "dist\BaseInput.js",
    "dist\BaseBadge.css",
    "dist\BaseBadge.js",
    "dist\components.es.js",
    "dist\options.css",
    "dist\options.js",
    "dist\popup.css",
    "dist\popup.js",
    "httpAuth.js",
    "icons\icon-16.png",
    "icons\icon-48.png",
    "icons\icon-128.png",
    "icons.js",
    "options.css",
    "options.html",
    "passkeysProxy.js",
    "popup.css",
    "popup.html",
    "src\components\Picker.web.js",
    "src\components\Prompt.web.js")
$chromeExtensionFiles = $commonExtensionFiles + @(
    "compat.js",
    "manifest.json"
)
$firefoxExtensionFiles = $commonExtensionFiles

New-ExtensionPackage -StagingDir $chromeStagingDir -DestinationPath $chromeExtensionTarget -PackageFiles $chromeExtensionFiles
New-ExtensionPackage -StagingDir $firefoxStagingDir -DestinationPath $firefoxExtensionTarget -PackageFiles $firefoxExtensionFiles -ManifestOverride $firefoxManifestPath

Remove-Item -LiteralPath $chromeStagingDir -Recurse -Force
Remove-Item -LiteralPath $firefoxStagingDir -Recurse -Force

$releaseArtifactPaths = @(
    $pluginDllTarget,
    $plgxTarget,
    $chromeExtensionTarget,
    $firefoxExtensionTarget,
    $updateInfoTarget
)

$sourceRevision = Invoke-GitText @("-C", $repoRoot, "rev-parse", "HEAD")
$sourceDescribe = Invoke-GitText @("-C", $repoRoot, "describe", "--tags", "--always")
if (-not [string]::IsNullOrWhiteSpace($sourceDescribe) -and -not [string]::IsNullOrWhiteSpace($gitStatus)) {
    $sourceDescribe += "-dirty"
}
$manifestTarget = Join-Path $ArtifactsDir "release-manifest.json"
$releaseManifest = [pscustomobject] @{
    Product = "KeePass Browser Bridge"
    Version = $version
    BuiltUtc = (Get-Date).ToUniversalTime().ToString("o")
    SourceRevision = $sourceRevision
    SourceDescribe = $sourceDescribe
    SourceDirty = -not [string]::IsNullOrWhiteSpace($gitStatus)
    Build = [pscustomobject] @{
        KeePassFileVersion = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($KeePassExe).FileVersion
        MinimumKeePassVersion = "2.50"
        MinimumDotNetVersion = "4.0"
    }
    Artifacts = @($releaseArtifactPaths | ForEach-Object { Get-ArtifactMetadata -LiteralPath $_ })
    ChecksumFile = "SHA256SUMS.txt"
}
$manifestJson = $releaseManifest | ConvertTo-Json -Depth 6
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($manifestTarget, ($manifestJson + "`n"), $utf8NoBom)

$releaseArtifactPaths += $manifestTarget
$checksumsTarget = Join-Path $ArtifactsDir "SHA256SUMS.txt"
$checksumLines = foreach ($artifactPath in $releaseArtifactPaths) {
    $hash = Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256
    "$($hash.Hash.ToLowerInvariant())  $(Split-Path -Leaf $artifactPath)"
}
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($checksumsTarget, (($checksumLines -join "`n") + "`n"), $utf8NoBom)

$signaturePaths = @()
if ($SignArtifacts) {
    foreach ($artifactPath in ($releaseArtifactPaths + $checksumsTarget)) {
        $signaturePaths += Invoke-GpgDetachedSignature -LiteralPath $artifactPath
    }
}

Write-Host ""
Write-Host "Release artifacts:"
Write-Host " - $pluginDllTarget"
Write-Host " - $plgxTarget"
Write-Host " - $chromeExtensionTarget"
Write-Host " - $firefoxExtensionTarget"
Write-Host " - $updateInfoTarget"
Write-Host " - $manifestTarget"
Write-Host " - $checksumsTarget"
foreach ($signaturePath in $signaturePaths) {
    Write-Host " - $signaturePath"
}
