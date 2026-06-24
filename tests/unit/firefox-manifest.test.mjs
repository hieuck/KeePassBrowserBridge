import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'firefox-manifest.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const chromeManifest = fs.readFileSync(path.join(projectRoot, 'extension', 'manifest.json'), 'utf8');
const firefoxManifest = fs.readFileSync(path.join(projectRoot, 'extension', 'manifest.firefox.json'), 'utf8');

describe('Firefox manifest parity with Chrome manifest', () => {
  it('should include compat.js in content_scripts js array', () => {
    const chromeHasCompat = chromeManifest.includes('compat.js');
    const firefoxHasCompat = firefoxManifest.includes('compat.js');
    assert.ok(chromeHasCompat, 'Chrome manifest should include compat.js (reference)');
    assert.ok(firefoxHasCompat,
      'Firefox manifest is MISSING compat.js in content_scripts — Firefox content scripts have no browser compatibility layer');
  });

  it('should have compat.js BEFORE other content scripts (must load first)', () => {
    const chromeCompatIdx = chromeManifest.indexOf('compat.js');
    const firefoxCompatIdx = firefoxManifest.indexOf('compat.js');
    assert.ok(chromeCompatIdx >= 0, 'compat.js not found in Chrome manifest');
    assert.ok(firefoxCompatIdx >= 0, 'compat.js not found in Firefox manifest');

    // compat.js must load before contentScript.js which depends on __kbbCompat
    const chromeContentScriptIdx = chromeManifest.indexOf('contentScript.js', chromeCompatIdx);
    const firefoxContentScriptIdx = firefoxManifest.indexOf('contentScript.js', firefoxCompatIdx);
    assert.ok(firefoxCompatIdx < firefoxContentScriptIdx,
      'compat.js must load BEFORE contentScript.js in Firefox manifest');
  });

  it('should have manifest_version set to 3', () => {
    assert.ok(firefoxManifest.includes('"manifest_version": 3'), 'Firefox manifest_version must be 3');
  });

  it('should have browser_specific_settings for Firefox', () => {
    assert.ok(firefoxManifest.includes('browser_specific_settings'), 'Missing browser_specific_settings for Firefox');
    assert.ok(firefoxManifest.includes('gecko'), 'Missing gecko block in Firefox manifest');
  });

  it('should define web_accessible_resources for Picker and Prompt', () => {
    assert.ok(firefoxManifest.includes('Picker.web.js'), 'Missing Picker.web.js in web_accessible_resources');
    assert.ok(firefoxManifest.includes('Prompt.web.js'), 'Missing Prompt.web.js in web_accessible_resources');
    assert.ok(firefoxManifest.includes('icons.js'), 'Missing icons.js in web_accessible_resources');
  });
});
