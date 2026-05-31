param(
    [string] $KeePassExe = "",
    [switch] $SkipE2E
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path

if ([string]::IsNullOrWhiteSpace($KeePassExe)) {
    $KeePassExe = Join-Path $repoRoot "..\..\KeePass.exe"
}

$KeePassExe = (Resolve-Path $KeePassExe).Path
$frameworkDir = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319"
$csc = Join-Path $frameworkDir "csc.exe"
$systemDll = Join-Path $frameworkDir "System.dll"
$systemCoreDll = Join-Path $frameworkDir "System.Core.dll"
$systemDrawingDll = Join-Path $frameworkDir "System.Drawing.dll"
$serializationDll = Join-Path $frameworkDir "System.Runtime.Serialization.dll"
$formsDll = Join-Path $frameworkDir "System.Windows.Forms.dll"

if (-not (Test-Path -LiteralPath $csc)) {
    throw "Cannot find csc.exe at $csc."
}

function Invoke-NativeChecked {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FilePath,

        [string[]] $Arguments = @()
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$FilePath failed with exit code $LASTEXITCODE."
    }
}

Push-Location $repoRoot
try {
    Write-Host "Checking Chrome extension JavaScript..."
    Invoke-NativeChecked "node" @("--check", "extension\background.js")
    Invoke-NativeChecked "node" @("--check", "extension\contentScript.js")
    Invoke-NativeChecked "node" @("--check", "extension\options.js")
    Invoke-NativeChecked "node" @("--check", "extension\popup.js")
    Invoke-NativeChecked "node" @("tests\extension\manifest.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\background.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\protocol.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\http-auth.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\custom-fields.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\content-script.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\popup.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\generator.test.mjs")

    Write-Host ""
    Write-Host "Running extension module tests..."
    Invoke-NativeChecked "npx" @(
        "vitest",
        "run",
        "tests/extension/group-organization.test.mjs",
        "tests/extension/multi-page-login.test.mjs",
        "tests/extension/multi-database.test.mjs",
        "tests/extension/enhanced-security.test.mjs")

    if (-not $SkipE2E) {
        Write-Host ""
        Write-Host "Running Chromium end-to-end tests..."
        Invoke-NativeChecked "npx" @("playwright", "test", "--project=chromium")
    }

    Write-Host ""
    Write-Host "Running bridge tests..."
    $testOutputRoot = Join-Path $env:TEMP "KeePassBrowserBridgeTests"
    Invoke-NativeChecked "dotnet" @(
        "run",
        "--project",
        "tests\KeePassBrowserBridge.Tests.csproj",
        "/p:BaseOutputPath=$testOutputRoot\bin\",
        "/p:BaseIntermediateOutputPath=$testOutputRoot\obj\")

    Write-Host ""
    Write-Host "Compiling KeePass plugin sources..."
    $verifyDll = Join-Path $env:TEMP "KeePassBrowserBridge.verify.dll"
    Remove-Item -LiteralPath $verifyDll -Force -ErrorAction SilentlyContinue

    $sources = @(
        ".\src\Bridge\BridgeAuthentication.cs",
        ".\src\Bridge\BridgeClock.cs",
        ".\src\Bridge\BridgeJsonSerializer.cs",
        ".\src\Bridge\BridgeRequestHandler.cs",
        ".\src\Bridge\BridgeSettings.cs",
        ".\src\Bridge\CredentialMutationService.cs",
        ".\src\Bridge\CredentialQueryService.cs",
        ".\src\Bridge\EntryUrlMatcher.cs",
        ".\src\Bridge\LoopbackBridgeServer.cs",
        ".\src\Bridge\PairingService.cs",
        ".\src\Bridge\ProtocolModels.cs",
        ".\src\Bridge\ProtocolValidator.cs",
        ".\src\Bridge\TrustedClientStore.cs",
        ".\src\Bridge\TotpGenerator.cs",
        ".\src\Bridge\UpdateChecker.cs",
        ".\src\Bridge\UrlMatcher.cs",
        ".\src\KeePassBrowserBridgeExt.cs",
        ".\src\Properties\AssemblyInfo.cs"
    )

    $cscArgs = @(
        "/nologo",
        "/target:library",
        "/optimize+",
        "/out:$verifyDll",
        "/reference:$KeePassExe",
        "/reference:$systemDll",
        "/reference:$systemCoreDll",
        "/reference:$systemDrawingDll",
        "/reference:$serializationDll",
        "/reference:$formsDll"
    ) + $sources

    Invoke-NativeChecked $csc $cscArgs

    $compiled = Get-Item -LiteralPath $verifyDll
    Write-Host ""
    Write-Host "Verification passed."
    Write-Host "Compiled: $($compiled.FullName) ($($compiled.Length) bytes)"
}
finally {
    Remove-Item -LiteralPath (Join-Path $repoRoot "tests\bin") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath (Join-Path $repoRoot "tests\obj") -Recurse -Force -ErrorAction SilentlyContinue
    Pop-Location
}
