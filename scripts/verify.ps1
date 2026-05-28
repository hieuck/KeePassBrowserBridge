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

Push-Location $repoRoot
try {
    Write-Host "Checking Chrome extension JavaScript..."
    node --check extension\background.js
    node --check extension\contentScript.js
    node --check extension\popup.js
    node tests\extension\background.test.mjs
    node tests\extension\protocol.test.mjs
    node tests\extension\content-script.test.mjs
    node tests\extension\popup.test.mjs

    Write-Host ""
    Write-Host "Running bridge tests..."
    $testOutputRoot = Join-Path $env:TEMP "KeePassBrowserBridgeTests"
    dotnet run `
        --project tests\KeePassBrowserBridge.Tests.csproj `
        /p:BaseOutputPath="$testOutputRoot\bin\" `
        /p:BaseIntermediateOutputPath="$testOutputRoot\obj\"

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

    & $csc @cscArgs

    if ($LASTEXITCODE -ne 0) {
        throw "C# compile failed with exit code $LASTEXITCODE."
    }

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
