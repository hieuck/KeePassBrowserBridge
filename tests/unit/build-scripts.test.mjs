import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'build-scripts.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'scripts', 'build-release.ps1'), 'utf8');

describe('build-release.ps1 - Firefox extension files', () => {
  it('should pass manifest.firefox.json via -ManifestOverride (not in package files)', () => {
    // Firefox uses -ManifestOverride to supply its manifest, not package files
    const hasManifestOverride = source.includes('ManifestOverride $firefoxManifestPath');
    assert.ok(hasManifestOverride, 'Firefox packaging must pass -ManifestOverride $firefoxManifestPath');
    // The manifest should NOT be in package files since it's handled via override
    const lastAssign = source.lastIndexOf('$firefoxExtensionFiles =');
    const afterLast = source.slice(lastAssign, lastAssign + 200);
    assert.ok(!afterLast.includes('manifest.firefox.json'),
      'manifest.firefox.json should NOT be in firefoxExtensionFiles — it is passed via -ManifestOverride instead');
  });

  it('should use -ManifestOverride for Firefox packaging call', () => {
    // Check that the Firefox New-ExtensionPackage call includes -ManifestOverride
    assert.ok(source.includes('ManifestOverride $firefoxManifestPath'),
      'Firefox packaging call must pass -ManifestOverride with the firefox manifest path');
  });

  it('should include compat.js in chromeExtensionFiles', () => {
    const chromeIdx = source.indexOf('$chromeExtensionFiles');
    const afterChrome = source.slice(chromeIdx, chromeIdx + 200);
    assert.ok(afterChrome.includes('compat.js'),
      'Chrome extension files must include compat.js');
  });

  it('should include passkeysProxyExperiment.js in common files (needed by background.js importScripts)', () => {
    // background.js line 4: importScripts('passkeysProxyExperiment.js');
    // Without this file, the passkeys feature is completely broken when enabled.
    const commonIdx = source.indexOf('$commonExtensionFiles');
    const commonBlock = source.slice(commonIdx, commonIdx + 1000);
    assert.ok(commonBlock.includes('passkeysProxyExperiment'),
      'passkeysProxyExperiment.js must be in common extension files — background.js imports it');
  });

  it('should read version from manifest.json at runtime', () => {
    assert.ok(source.includes('manifest.json'),
      'build script should read version from manifest.json');
  });

  it('should compile all C# source files', () => {
    // The dotnet build command should reference the .csproj
    assert.ok(source.includes('KeePassBrowserBridge.csproj') || source.includes('dotnet build'),
      'build script should compile via dotnet build with the .csproj project file');
  });
});
