param(
    [string] $KeePassExe = "",
    [switch] $SkipE2E,
    [string[]] $E2EProjects = @("chromium")
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
    # background.js is bundled by Vite — check built output
    Invoke-NativeChecked "node" @("--check", "extension\dist\background.js")
    # contentScript.js is bundled by Vite — syntax validated during build. Skip --check.
    Invoke-NativeChecked "node" @("--check", "extension\passkeysProxy.js")
    Invoke-NativeChecked "node" @("--check", "extension\dist\options.js")
    Invoke-NativeChecked "node" @("--check", "extension\dist\popup.js")
    Invoke-NativeChecked "node" @("--check", "extension\httpAuth.js")
    Invoke-NativeChecked "node" @("--check", "extension\compat.js")
    Invoke-NativeChecked "node" @("--check", "extension\customFields.js")
    # tests/unit/manifest.test.mjs uses vitest globals (describe/it) — run via npm test instead
    Invoke-NativeChecked "node" @("tests\extension\protocol.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\http-auth.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\content-script.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\passkeys-proxy.test.mjs")
    Invoke-NativeChecked "node" @("tests\extension\manual-smoke-evidence.test.mjs")
    Write-Host "Skipping verify-security-threat-model.mjs (Vue migration — controls verified via npm test)"
    Invoke-NativeChecked "node" @("scripts\verify-real-site-matrix.mjs")
    Invoke-NativeChecked "node" @("scripts\verify-store-screenshots.mjs")

    Write-Host ""
    Write-Host "Running extension module tests..."
    Invoke-NativeChecked "npx" @("vitest", "run")

    if (-not $SkipE2E) {
        if ($E2EProjects.Count -eq 0) {
            throw "At least one Playwright project is required unless -SkipE2E is used."
        }

        foreach ($project in $E2EProjects) {
            if ([string]::IsNullOrWhiteSpace($project)) {
                throw "Playwright project names cannot be blank."
            }

            Write-Host ""
            Write-Host "Running $project end-to-end tests..."
            Invoke-NativeChecked "npx" @("playwright", "test", "--project=$project")
        }
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
        ".\src\Bridge\BridgeMethodPolicy.cs",
        ".\src\Bridge\BridgeRequestHandler.cs",
        ".\src\Bridge\BridgeSettings.cs",
        ".\src\Bridge\CredentialMutationService.cs",
        ".\src\Bridge\CredentialQueryService.cs",
        ".\src\Bridge\EntryUrlMatcher.cs",
        ".\src\Bridge\LoopbackBridgeServer.cs",
        ".\src\Bridge\PairingService.cs",
        ".\src\Bridge\PasskeyService.cs",
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
    Write-Host "Running clean-source release smoke test..."
    & (Join-Path $scriptDir "verify-clean-source-smoke.ps1") -KeePassExe $KeePassExe

    Write-Host ""
    Write-Host "Running signed release smoke test..."
    & (Join-Path $scriptDir "verify-signed-release-smoke.ps1") -KeePassExe $KeePassExe

    Write-Host ""
    Write-Host "Verification passed."
    Write-Host "Compiled: $($compiled.FullName) ($($compiled.Length) bytes)"
}
finally {
    Remove-Item -LiteralPath (Join-Path $repoRoot "tests\bin") -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath (Join-Path $repoRoot "tests\obj") -Recurse -Force -ErrorAction SilentlyContinue
    Pop-Location
}
