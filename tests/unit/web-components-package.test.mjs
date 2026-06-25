import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'web-components-package.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const buildScript = fs.readFileSync(path.join(projectRoot, 'scripts', 'build-release.ps1'), 'utf8');
const verifyScript = fs.readFileSync(path.join(projectRoot, 'scripts', 'verify-release-artifacts.ps1'), 'utf8');

describe('Web Components in release package', () => {
  it('build-release should include src/components/Picker.web.js', () => {
    assert.ok(buildScript.includes('Picker.web.js'),
      'build-release.ps1 must include Picker.web.js (web_accessible_resource)');
  });

  it('build-release should include src/components/Prompt.web.js', () => {
    assert.ok(buildScript.includes('Prompt.web.js'),
      'build-release.ps1 must include Prompt.web.js (web_accessible_resource)');
  });

  it('build-release should include icons.js (imported by web components)', () => {
    assert.ok(buildScript.includes('icons.js'),
      'build-release.ps1 must include icons.js (imported by Picker/Prompt)');
  });

  it('verify-release should expect Picker.web.js in ZIP', () => {
    assert.ok(verifyScript.includes('Picker.web.js'),
      'verify-release-artifacts.ps1 must expect Picker.web.js');
  });

  it('verify-release should expect Prompt.web.js in ZIP', () => {
    assert.ok(verifyScript.includes('Prompt.web.js'),
      'verify-release-artifacts.ps1 must expect Prompt.web.js');
  });

  it('manifest web_accessible_resources lists Picker and Prompt', () => {
    const manifest = fs.readFileSync(path.join(projectRoot, 'extension', 'manifest.json'), 'utf8');
    assert.ok(manifest.includes('Picker.web.js'), 'manifest.json must list Picker.web.js');
    assert.ok(manifest.includes('Prompt.web.js'), 'manifest.json must list Prompt.web.js');
  });
});
