param(
    [string] $ArtifactsDir = "",
    [string] $Version = "",
    [switch] $RequireSignatures,
    [string] $GpgExe = "gpg",
    [string] $GpgHome = "",
    [string] $ExpectedSignerFingerprint = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$extensionDir = (Resolve-Path (Join-Path $repoRoot "extension")).Path

if ([string]::IsNullOrWhiteSpace($ArtifactsDir)) {
    $ArtifactsDir = Join-Path $env:TEMP "KeePassBrowserBridge-artifacts"
}

$ArtifactsDir = (Resolve-Path $ArtifactsDir).Path

if ([string]::IsNullOrWhiteSpace($Version)) {
    $manifest = Get-Content -LiteralPath (Join-Path $extensionDir "manifest.json") -Raw | ConvertFrom-Json
    $Version = [string] $manifest.version
}

function Assert-FileExists {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath
    )

    if (-not (Test-Path -LiteralPath $LiteralPath -PathType Leaf)) {
        throw "Missing release artifact: $LiteralPath"
    }
}

function Assert-Equal {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Expected,

        [Parameter(Mandatory = $true)]
        [string] $Actual,

        [Parameter(Mandatory = $true)]
        [string] $Message
    )

    if (-not [string]::Equals($Expected, $Actual, [System.StringComparison]::Ordinal)) {
        throw "$Message Expected '$Expected', got '$Actual'."
    }
}

function Read-ZipEntryText {
    param(
        [Parameter(Mandatory = $true)]
        [System.IO.Compression.ZipArchive] $Archive,

        [Parameter(Mandatory = $true)]
        [string] $EntryName
    )

    $entry = $Archive.GetEntry($EntryName)
    if ($null -eq $entry) {
        throw "Missing zip entry $EntryName."
    }

    $stream = $entry.Open()
    try {
        $reader = New-Object System.IO.StreamReader($stream, [System.Text.Encoding]::UTF8)
        try {
            return $reader.ReadToEnd()
        } finally {
            $reader.Dispose()
        }
    } finally {
        $stream.Dispose()
    }
}

function Assert-ZipEntrySet {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Browser,

        [Parameter(Mandatory = $true)]
        [string[]] $Expected,

        [Parameter(Mandatory = $true)]
        [string[]] $Actual
    )

    $expectedSorted = @($Expected | Sort-Object)
    $actualSorted = @($Actual | Sort-Object)
    Assert-Equal -Expected ($expectedSorted -join "|") -Actual ($actualSorted -join "|") -Message "$Browser extension package file list mismatch."
}

function Assert-ExtensionZip {
    param(
        [Parameter(Mandatory = $true)]
        [string] $ZipPath,

        [Parameter(Mandatory = $true)]
        [string] $Browser
    )

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
    try {
        $entryNames = @($archive.Entries | ForEach-Object { $_.FullName.Replace("\", "/") })
        $expectedEntryNames = @(
            "manifest.json",
            "_locales/en/messages.json",
            "_locales/vi/messages.json",
            "background.js",
            "contentScript.js",
            "customFields.js",
            "design-tokens.css",
            "dist/BaseBadge.css",
            "dist/BaseBadge.js",
            "dist/BaseInput.css",
            "dist/BaseInput.js",
            "dist/components.es.js",
            "dist/options.css",
            "dist/options.js",
            "dist/popup.css",
            "dist/popup.js",
            "httpAuth.js",
            "icons.js",
            "icons/icon-16.png",
            "icons/icon-48.png",
            "icons/icon-128.png",
            "options.css",
            "options.html",
            "passkeysProxy.js",
            "popup.css",
            "popup.html",
            "src/components/Picker.web.js",
            "src/components/Prompt.web.js"
        )

        if ($Browser -eq "chrome") {
            $expectedEntryNames += "compat.js"
        } elseif ($Browser -eq "firefox") {
        } else {
            throw "Unknown browser package type: $Browser"
        }

        $forbidden = @(
            "README.md",
            "TESTING_GUIDE.md",
            "quick-test.js",
            "test-extension.js",
            "test-page.html",
            "testingInfrastructure.js",
            "passwordQuality.js"
        )

        foreach ($name in $forbidden) {
            if ($entryNames -contains $name) {
                throw "$Browser extension package contains non-production file: $name"
            }
        }

        Assert-ZipEntrySet -Browser $Browser -Expected $expectedEntryNames -Actual $entryNames

        foreach ($required in @("manifest.json", "background.js", "popup.html", "popup.css", "dist/popup.js", "dist/popup.css", "dist/options.js", "dist/options.css", "design-tokens.css", "dist/components.es.js", "options.html", "options.css", "contentScript.js", "customFields.js", "httpAuth.js", "icons/icon-16.png", "icons/icon-48.png", "icons/icon-128.png")) {
            if ($entryNames -notcontains $required) {
                throw "$Browser extension package is missing required file: $required"
            }
        }

        $manifestJson = Read-ZipEntryText -Archive $archive -EntryName "manifest.json"
        $manifest = $manifestJson | ConvertFrom-Json
        Assert-Equal -Expected $Version -Actual ([string] $manifest.version) -Message "$Browser extension manifest version mismatch."

        if (-not ($manifest.permissions -contains "contextMenus")) {
            throw "$Browser extension manifest is missing contextMenus permission for field actions."
        }

        if ($Browser -eq "chrome") {
            if ($entryNames -notcontains "compat.js") {
                throw "Chrome extension package is missing compat.js."
            }
            if (-not $manifest.background.service_worker) {
                throw "Chrome extension manifest must use a service worker background."
            }
            if ($manifest.browser_specific_settings) {
                throw "Chrome extension package should not contain Firefox browser_specific_settings."
            }
        } elseif ($Browser -eq "firefox") {
            if ($entryNames -contains "compat.js") {
                throw "Firefox extension package should not contain Chrome-only compat.js."
            }
            if (-not $manifest.background.scripts) {
                throw "Firefox extension manifest must use background scripts."
            }
            if (-not $manifest.browser_specific_settings.gecko.id) {
                throw "Firefox extension manifest must include a Gecko extension id."
            }
        }
    } finally {
        $archive.Dispose()
    }
}

function Read-ChecksumFile {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath
    )

    $checksums = @{}
    $lines = Get-Content -LiteralPath $LiteralPath
    foreach ($line in $lines) {
        if ([string]::IsNullOrWhiteSpace($line)) {
            continue
        }

        $match = [System.Text.RegularExpressions.Regex]::Match($line, "^(?<hash>[0-9a-fA-F]{64})\s\s(?<name>.+)$")
        if (-not $match.Success) {
            throw "Invalid checksum line: $line"
        }

        $name = $match.Groups["name"].Value
        if ($checksums.ContainsKey($name)) {
            throw "Duplicate checksum entry: $name"
        }

        $checksums[$name] = $match.Groups["hash"].Value.ToLowerInvariant()
    }

    return $checksums
}

function Assert-ReleaseManifest {
    param(
        [Parameter(Mandatory = $true)]
        [string] $LiteralPath,

        [Parameter(Mandatory = $true)]
        [string[]] $ManifestArtifactFiles
    )

    $manifest = Get-Content -LiteralPath $LiteralPath -Raw | ConvertFrom-Json
    Assert-Equal -Expected "KeePass Browser Bridge" -Actual ([string] $manifest.Product) -Message "release-manifest product mismatch."
    Assert-Equal -Expected $Version -Actual ([string] $manifest.Version) -Message "release-manifest version mismatch."
    Assert-Equal -Expected "SHA256SUMS.txt" -Actual ([string] $manifest.ChecksumFile) -Message "release-manifest checksum file mismatch."

    if ([string]::IsNullOrWhiteSpace([string] $manifest.BuiltUtc)) {
        throw "release-manifest BuiltUtc is required."
    }

    try {
        [DateTimeOffset]::Parse([string] $manifest.BuiltUtc) | Out-Null
    } catch {
        throw "release-manifest BuiltUtc is not a valid timestamp."
    }

    if ([string]::IsNullOrWhiteSpace([string] $manifest.SourceRevision)) {
        throw "release-manifest SourceRevision is required."
    }

    if ($null -eq $manifest.SourceDirty) {
        throw "release-manifest SourceDirty is required."
    }

    if (-not $manifest.Build -or [string]::IsNullOrWhiteSpace([string] $manifest.Build.KeePassFileVersion)) {
        throw "release-manifest Build.KeePassFileVersion is required."
    }

    Assert-Equal -Expected "2.50" -Actual ([string] $manifest.Build.MinimumKeePassVersion) -Message "release-manifest minimum KeePass version mismatch."
    Assert-Equal -Expected "4.0" -Actual ([string] $manifest.Build.MinimumDotNetVersion) -Message "release-manifest minimum .NET version mismatch."

    $manifestArtifacts = @($manifest.Artifacts)
    $actualNames = @($manifestArtifacts | ForEach-Object { [string] $_.Name } | Sort-Object)
    Assert-Equal -Expected (($ManifestArtifactFiles | Sort-Object) -join "|") -Actual ($actualNames -join "|") -Message "release-manifest artifact set mismatch."

    foreach ($artifact in $manifestArtifacts) {
        $name = [string] $artifact.Name
        $artifactPath = Join-Path $ArtifactsDir $name
        Assert-FileExists -LiteralPath $artifactPath

        $item = Get-Item -LiteralPath $artifactPath
        Assert-Equal -Expected ([string] $item.Length) -Actual ([string] $artifact.SizeBytes) -Message "release-manifest size mismatch for $name."

        $hash = Get-FileHash -LiteralPath $artifactPath -Algorithm SHA256
        Assert-Equal -Expected $hash.Hash.ToLowerInvariant() -Actual ([string] $artifact.Sha256) -Message "release-manifest SHA-256 mismatch for $name."
    }
}

function Assert-GpgSignature {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FileName
    )

    $artifactPath = Join-Path $ArtifactsDir $FileName
    $signaturePath = Join-Path $ArtifactsDir "$FileName.asc"
    Assert-FileExists -LiteralPath $artifactPath
    Assert-FileExists -LiteralPath $signaturePath

    $signature = Get-Item -LiteralPath $signaturePath
    if ($signature.Length -le 0) {
        throw "Signature file is empty: $signaturePath"
    }

    $previousGpgHome = $env:GNUPGHOME
    try {
        if (-not [string]::IsNullOrWhiteSpace($GpgHome)) {
            $env:GNUPGHOME = (Resolve-Path $GpgHome).Path
        }

        $gpgOutput = @(& $GpgExe --batch --status-fd 1 --verify $signaturePath $artifactPath 2>&1)
        if ($LASTEXITCODE -ne 0) {
            throw "GPG signature verification failed for $FileName with exit code $LASTEXITCODE."
        }

        if (-not [string]::IsNullOrWhiteSpace($ExpectedSignerFingerprint)) {
            Assert-GpgSignerFingerprint -FileName $FileName -GpgOutput $gpgOutput
        }
    } finally {
        $env:GNUPGHOME = $previousGpgHome
    }
}

function Normalize-GpgFingerprint {
    param(
        [string] $Fingerprint
    )

    if ([string]::IsNullOrWhiteSpace($Fingerprint)) {
        return ""
    }

    return ($Fingerprint -replace "[^0-9A-Fa-f]", "").ToUpperInvariant()
}

function Assert-GpgSignerFingerprint {
    param(
        [Parameter(Mandatory = $true)]
        [string] $FileName,

        [Parameter(Mandatory = $true)]
        [object[]] $GpgOutput
    )

    $expected = Normalize-GpgFingerprint $ExpectedSignerFingerprint
    if ([string]::IsNullOrWhiteSpace($expected)) {
        throw "Expected signer fingerprint contains no hexadecimal fingerprint characters."
    }

    $validSignerFingerprints = @()
    foreach ($line in $GpgOutput) {
        $text = [string] $line
        $match = [System.Text.RegularExpressions.Regex]::Match($text, "^\[GNUPG:\]\s+VALIDSIG\s+(?<fingerprint>[0-9A-Fa-f]+)\b")
        if ($match.Success) {
            $validSignerFingerprints += (Normalize-GpgFingerprint $match.Groups["fingerprint"].Value)
        }
    }

    if ($validSignerFingerprints.Count -eq 0) {
        throw "GPG verification for $FileName did not report a VALIDSIG signer fingerprint."
    }

    foreach ($actual in $validSignerFingerprints) {
        if ([string]::Equals($expected, $actual, [System.StringComparison]::Ordinal)) {
            return
        }
    }

    throw "GPG signer fingerprint mismatch for $FileName. Expected $expected, got $($validSignerFingerprints -join ', ')."
}

$baseExpectedFiles = @(
    "KeePassBrowserBridge.dll",
    "KeePassBrowserBridge.plgx",
    "KeePassBrowserBridge-chrome-extension-$Version.zip",
    "KeePassBrowserBridge-firefox-extension-$Version.zip",
    "versioninfo.txt",
    "release-manifest.json",
    "SHA256SUMS.txt"
)
$expectedFiles = @($baseExpectedFiles)
if ($RequireSignatures) {
    $expectedFiles += @($baseExpectedFiles | ForEach-Object { "$_.asc" })
}

$actualFiles = @(Get-ChildItem -LiteralPath $ArtifactsDir -File | Select-Object -ExpandProperty Name | Sort-Object)
$expectedSorted = @($expectedFiles | Sort-Object)
Assert-Equal -Expected ($expectedSorted -join "|") -Actual ($actualFiles -join "|") -Message "Release artifact set mismatch."

foreach ($file in $expectedFiles) {
    Assert-FileExists -LiteralPath (Join-Path $ArtifactsDir $file)
}

$dllPath = Join-Path $ArtifactsDir "KeePassBrowserBridge.dll"
$dllVersion = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($dllPath)
Assert-Equal -Expected "$Version.0" -Actual ([string] $dllVersion.FileVersion) -Message "Plugin DLL file version mismatch."
Assert-Equal -Expected $Version -Actual ([string] $dllVersion.ProductVersion) -Message "Plugin DLL product version mismatch."

$updateInfo = (Get-Content -LiteralPath (Join-Path $ArtifactsDir "versioninfo.txt") -Raw).Replace("`r`n", "`n")
Assert-Equal -Expected ":`nKeePass Browser Bridge:$Version`n:`n" -Actual $updateInfo -Message "versioninfo.txt content mismatch."

Assert-ExtensionZip -ZipPath (Join-Path $ArtifactsDir "KeePassBrowserBridge-chrome-extension-$Version.zip") -Browser "chrome"
Assert-ExtensionZip -ZipPath (Join-Path $ArtifactsDir "KeePassBrowserBridge-firefox-extension-$Version.zip") -Browser "firefox"

$manifestArtifactFiles = @(
    "KeePassBrowserBridge.dll",
    "KeePassBrowserBridge.plgx",
    "KeePassBrowserBridge-chrome-extension-$Version.zip",
    "KeePassBrowserBridge-firefox-extension-$Version.zip",
    "versioninfo.txt"
)
Assert-ReleaseManifest -LiteralPath (Join-Path $ArtifactsDir "release-manifest.json") -ManifestArtifactFiles $manifestArtifactFiles

$checksums = Read-ChecksumFile -LiteralPath (Join-Path $ArtifactsDir "SHA256SUMS.txt")
$checksummedFiles = @($baseExpectedFiles | Where-Object { $_ -ne "SHA256SUMS.txt" })
Assert-Equal -Expected (($checksummedFiles | Sort-Object) -join "|") -Actual (($checksums.Keys | Sort-Object) -join "|") -Message "Checksum file set mismatch."
foreach ($file in $checksummedFiles) {
    $hash = Get-FileHash -LiteralPath (Join-Path $ArtifactsDir $file) -Algorithm SHA256
    Assert-Equal -Expected $hash.Hash.ToLowerInvariant() -Actual ([string] $checksums[$file]) -Message "Checksum mismatch for $file."
}

if ($RequireSignatures) {
    foreach ($file in $baseExpectedFiles) {
        Assert-GpgSignature -FileName $file
    }
}

Write-Host "Release artifact verification passed for KeePassBrowserBridge $Version."
