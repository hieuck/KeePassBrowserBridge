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

  it('should not include passkeysProxyExperiment.js in common files (store review)', () => {
    // The passkeys proxy experiment is not ready for production release;
    // it should not be packaged before store review.
    const commonIdx = source.indexOf('$commonExtensionFiles');
    const commonBlock = source.slice(commonIdx, commonIdx + 500);
    assert.ok(!commonBlock.includes('passkeysProxyExperiment'),
      'passkeysProxyExperiment.js must NOT be in common extension files for production release');
  });

  it('should read version from manifest.json at runtime', () => {
    assert.ok(source.includes('manifest.json'),
      'build script should read version from manifest.json');
  });

  it('should compile all C# source files', () => {
    // The csc command should reference all Bridge .cs files
    const cscFiles = ['BridgeRequestHandler.cs', 'BridgeSettings.cs', 'BridgeAuthentication.cs',
      'CredentialMutationService.cs', 'CredentialQueryService.cs', 'PairingService.cs',
      'PasskeyService.cs', 'TrustedClientStore.cs', 'ProtocolModels.cs'];
    for (const f of cscFiles) {
      assert.ok(source.includes(f), `Missing ${f} in csc compilation list`);
    }
  });
});
