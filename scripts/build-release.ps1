param(
    [string] $KeePassExe = "",
    [string] $Configuration = "Release",
    [string] $ArtifactsDir = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$srcDir = (Resolve-Path (Join-Path $repoRoot "src")).Path
$extensionDir = (Resolve-Path (Join-Path $repoRoot "extension")).Path

if ([string]::IsNullOrWhiteSpace($KeePassExe)) {
    $KeePassExe = Join-Path $repoRoot "..\..\KeePass.exe"
}

$KeePassExe = (Resolve-Path $KeePassExe).Path

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

$frameworkDir = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319"
$csc = Join-Path $frameworkDir "csc.exe"
if (-not (Test-Path -LiteralPath $csc)) {
    throw "Cannot find csc.exe at $csc."
}

$pluginDllTarget = Join-Path $ArtifactsDir "KeePassBrowserBridge.dll"
$sources = @(
    (Join-Path $srcDir "Bridge\BridgeAuthentication.cs"),
    (Join-Path $srcDir "Bridge\BridgeClock.cs"),
    (Join-Path $srcDir "Bridge\BridgeJsonSerializer.cs"),
    (Join-Path $srcDir "Bridge\BridgeRequestHandler.cs"),
    (Join-Path $srcDir "Bridge\BridgeSettings.cs"),
    (Join-Path $srcDir "Bridge\CredentialMutationService.cs"),
    (Join-Path $srcDir "Bridge\CredentialQueryService.cs"),
    (Join-Path $srcDir "Bridge\LoopbackBridgeServer.cs"),
    (Join-Path $srcDir "Bridge\PairingService.cs"),
    (Join-Path $srcDir "Bridge\ProtocolModels.cs"),
    (Join-Path $srcDir "Bridge\ProtocolValidator.cs"),
    (Join-Path $srcDir "Bridge\TrustedClientStore.cs"),
    (Join-Path $srcDir "Bridge\TotpGenerator.cs"),
    (Join-Path $srcDir "Bridge\UrlMatcher.cs"),
    (Join-Path $srcDir "KeePassBrowserBridgeExt.cs"),
    (Join-Path $srcDir "Properties\AssemblyInfo.cs")
)

$cscArgs = @(
    "/nologo",
    "/target:library",
    "/optimize+",
    "/out:$pluginDllTarget",
    "/reference:$KeePassExe",
    "/reference:$(Join-Path $frameworkDir "System.dll")",
    "/reference:$(Join-Path $frameworkDir "System.Core.dll")",
    "/reference:$(Join-Path $frameworkDir "System.Drawing.dll")",
    "/reference:$(Join-Path $frameworkDir "System.Runtime.Serialization.dll")",
    "/reference:$(Join-Path $frameworkDir "System.Windows.Forms.dll")"
) + $sources

& $csc @cscArgs
if ($LASTEXITCODE -ne 0) {
    throw "DLL compile failed with exit code $LASTEXITCODE."
}

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
Move-Item -LiteralPath $createdPlgx.FullName -Destination $plgxTarget -Force

$extensionTarget = Join-Path $ArtifactsDir "KeePassBrowserBridge-chrome-extension-$version.zip"
if (Test-Path -LiteralPath $extensionTarget) {
    Remove-Item -LiteralPath $extensionTarget -Force
}

$extensionItems = Get-ChildItem -LiteralPath $extensionDir -Force |
    Where-Object { $_.Name -notin @(".git", "node_modules") }

Compress-Archive -Path $extensionItems.FullName -DestinationPath $extensionTarget -Force

Write-Host ""
Write-Host "Release artifacts:"
Write-Host " - $pluginDllTarget"
Write-Host " - $plgxTarget"
Write-Host " - $extensionTarget"
