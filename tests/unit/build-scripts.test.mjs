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

  it('should include passkeysProxy.js in common files (needed by background.js importScripts)', () => {
    // background.js line 4: importScripts('passkeysProxy.js');
    // Without this file, the passkeys feature is completely broken when enabled.
    const commonIdx = source.indexOf('$commonExtensionFiles');
    const commonBlock = source.slice(commonIdx, commonIdx + 1000);
    assert.ok(commonBlock.includes('passkeysProxy'),
      'passkeysProxy.js must be in common extension files — background.js imports it');
  });

  it('should read version from manifest.json at runtime', () => {
    assert.ok(source.includes('manifest.json'),
      'build script should read version from manifest.json');
  });

  it('should compile all C# source files', () => {
    // The build script should compile via dotnet build with reference path
    assert.ok(source.includes('dotnet build') && source.includes('KeePassReferencePath'),
      'build script should compile via dotnet build with KeePassReferencePath');
  });

  it('should include dist/_plugin-vue_export-helper.js in common extension files', () => {
    const commonStart = source.indexOf('$commonExtensionFiles = @(');
    const afterCommonStart = source.slice(commonStart);
    const commonEnd = afterCommonStart.indexOf('$chromeExtensionFiles');
    const commonBlock = afterCommonStart.slice(0, commonEnd);
    assert.ok(commonBlock.includes('_plugin-vue_export-helper.js'),
      'commonExtensionFiles must include _plugin-vue_export-helper.js — popup.js imports it at runtime');
  });

  it('should include dist/vue-vendor.js in common extension files', () => {
    const commonStart = source.indexOf('$commonExtensionFiles = @(');
    const commonBlock = source.slice(commonStart, source.indexOf('$chromeExtensionFiles'));
    assert.ok(commonBlock.includes('vue-vendor.js'),
      'commonExtensionFiles must include vue-vendor.js — Vue runtime needed by popup');
  });

  it('should include dist/icons-vendor.js in common extension files', () => {
    const commonStart = source.indexOf('$commonExtensionFiles = @(');
    const commonBlock = source.slice(commonStart, source.indexOf('$chromeExtensionFiles'));
    assert.ok(commonBlock.includes('icons-vendor.js'),
      'commonExtensionFiles must include icons-vendor.js — ant-design icons needed by popup');
  });

  it('should include dist/antd-vendor.js in common extension files', () => {
    const commonStart = source.indexOf('$commonExtensionFiles = @(');
    const commonBlock = source.slice(commonStart, source.indexOf('$chromeExtensionFiles'));
    assert.ok(commonBlock.includes('antd-vendor.js'),
      'commonExtensionFiles must include antd-vendor.js — needed by options page');
  });

  it('should include dist/antd-vendor.css in common extension files', () => {
    const commonStart = source.indexOf('$commonExtensionFiles = @(');
    const commonBlock = source.slice(commonStart, source.indexOf('$chromeExtensionFiles'));
    assert.ok(commonBlock.includes('antd-vendor.css'),
      'commonExtensionFiles must include antd-vendor.css — antd component styles');
  });
});

const verifySource = fs.readFileSync(path.join(projectRoot, 'scripts', 'verify-release-artifacts.ps1'), 'utf8');

describe('verify-release-artifacts.ps1 - extension ZIP contents', () => {
  it('should expect dist/_plugin-vue_export-helper.js in the extension package', () => {
    assert.ok(verifySource.includes('dist/_plugin-vue_export-helper.js'),
      'verify-release-artifacts must expect _plugin-vue_export-helper.js in the ZIP');
  });

  it('should expect dist/vue-vendor.js in the extension package', () => {
    assert.ok(verifySource.includes('dist/vue-vendor.js'),
      'verify-release-artifacts must expect vue-vendor.js in the ZIP');
  });

  it('should expect dist/icons-vendor.js in the extension package', () => {
    assert.ok(verifySource.includes('dist/icons-vendor.js'),
      'verify-release-artifacts must expect icons-vendor.js in the ZIP');
  });

  it('should expect dist/antd-vendor.js in the extension package', () => {
    assert.ok(verifySource.includes('dist/antd-vendor.js'),
      'verify-release-artifacts must expect antd-vendor.js in the ZIP');
  });
});

const releaseSource = fs.readFileSync(path.join(projectRoot, '.github', 'workflows', 'release.yml'), 'utf8');

describe('release.yml - extension package', () => {
  it('should copy popup.html into extension package', () => {
    assert.ok(releaseSource.includes('popup.html'),
      'release.yml must copy popup.html into extension ZIP');
  });

  it('should copy options.html into extension package', () => {
    assert.ok(releaseSource.includes('options.html'),
      'release.yml must copy options.html into extension ZIP');
  });

  it('should copy design-tokens.css into extension package', () => {
    assert.ok(releaseSource.includes('design-tokens.css'),
      'release.yml must copy design-tokens.css into extension ZIP — popup.html references it');
  });

  it('should copy _locales into extension package', () => {
    assert.ok(releaseSource.includes('_locales'),
      'release.yml must copy _locales directory with translations');
  });

  it('should copy icons into extension package', () => {
    assert.ok(releaseSource.includes('icons'),
      'release.yml must copy icons directory');
  });

  it('should copy web-accessible resources (Picker.web.js, Prompt.web.js)', () => {
    assert.ok(releaseSource.includes('Picker.web.js'),
      'release.yml must copy Picker.web.js — manifest.json declares it as web_accessible_resource');
  });

  it('should include _plugin-vue_export-helper.css in common extension files', () => {
    assert.ok(releaseSource.includes('dist\\_plugin-vue_export-helper.css') || releaseSource.includes('dist/_plugin-vue_export-helper.css'),
      'release.yml must include _plugin-vue_export-helper.css — antd base CSS reset needed by popup.html');
  });
});
