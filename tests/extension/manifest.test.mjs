import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const manifest = JSON.parse(fs.readFileSync(new URL('../../extension/manifest.json', import.meta.url), 'utf8'));
const firefoxManifest = JSON.parse(fs.readFileSync(new URL('../../extension/manifest.firefox.json', import.meta.url), 'utf8'));
const assemblyInfo = fs.readFileSync(new URL('../../src/Properties/AssemblyInfo.cs', import.meta.url), 'utf8');
const extensionRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'extension');
const scripts = manifest.content_scripts.flatMap((entry) => entry.js || []);
const assemblyVersion = `${manifest.version}.0`;

assert.equal(scripts.includes('testingInfrastructure.js'), false, 'production manifest must not inject testingInfrastructure.js into web pages');
assert.equal(scripts.includes('quick-test.js'), false, 'production manifest must not inject quick-test.js into web pages');
assert.equal(scripts.includes('test-extension.js'), false, 'production manifest must not inject test-extension.js into web pages');
assert.equal(scripts.includes('uxEnhancements.js'), false, 'production manifest must not inject extension UX theming into web pages');
assert.equal(scripts.includes('multiPageLogin.js'), false, 'production manifest must not inject legacy page-session login flow tracking into web pages');
assert.equal(scripts.includes('multiDatabase.js'), false, 'production manifest must not inject database management helpers into web pages');
assert.equal(scripts.includes('enhancedSecurity_part1.js'), false, 'production manifest must not inject extension lock state listeners into web pages');
assert.equal(scripts.includes('enhancedSecurity_part2.js'), false, 'production manifest must not inject screenshot or clipboard helpers into web pages');
assert.equal(scripts.includes('groupOrganization.js'), false, 'production manifest must not inject popup search helpers into web pages');
assert.equal(scripts.includes('passwordQuality.js'), false, 'production manifest must not inject password quality helpers into web pages');
assert.equal(manifest.permissions.includes('notifications'), true, 'manifest should request notifications for save/update/fill feedback');
assert.equal(firefoxManifest.version, manifest.version, 'Firefox and Chrome extension manifests should use the same release version');
assert.equal(assemblyInfo.includes(`[assembly: AssemblyVersion("${assemblyVersion}")]`), true, 'plugin AssemblyVersion should match extension release version');
assert.equal(assemblyInfo.includes(`[assembly: AssemblyFileVersion("${assemblyVersion}")]`), true, 'plugin AssemblyFileVersion should match extension release version');
for (const size of ['16', '48', '128']) {
  assert.equal(typeof manifest.icons?.[size], 'string', `manifest should declare ${size}px extension icon`);
  assert.equal(fs.existsSync(path.join(extensionRoot, manifest.icons[size])), true, `${size}px extension icon should exist`);
  assert.equal(typeof manifest.action?.default_icon?.[size], 'string', `action should declare ${size}px toolbar icon`);
  assert.equal(fs.existsSync(path.join(extensionRoot, manifest.action.default_icon[size])), true, `${size}px toolbar icon should exist`);
}

console.log('Manifest tests passed.');
