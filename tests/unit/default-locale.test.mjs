import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'default-locale.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const manifest = fs.readFileSync(path.join(projectRoot, 'extension', 'manifest.json'), 'utf8');
const firefoxManifest = fs.readFileSync(path.join(projectRoot, 'extension', 'manifest.firefox.json'), 'utf8');
const enLocale = path.join(projectRoot, 'extension', '_locales', 'en', 'messages.json');

describe('default_locale', () => {
  it('Chrome manifest should have default_locale = en', () => {
    assert.ok(manifest.includes('"default_locale": "en"'), 'manifest.json must have default_locale: en');
  });

  it('Firefox manifest should have default_locale = en', () => {
    assert.ok(firefoxManifest.includes('"default_locale": "en"'), 'manifest.firefox.json must have default_locale: en');
  });

  it('English locale file must exist', () => {
    assert.ok(fs.existsSync(enLocale), '_locales/en/messages.json must exist');
  });

  it('default_locale must match an existing _locales directory', () => {
    const enDir = path.join(projectRoot, 'extension', '_locales', 'en');
    assert.ok(fs.existsSync(enDir), '_locales/en/ directory must exist for default_locale');
  });
});
