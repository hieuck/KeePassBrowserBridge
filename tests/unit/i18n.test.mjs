import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'i18n.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const enPath = path.join(projectRoot, 'extension', '_locales', 'en', 'messages.json');
const localesDir = path.join(projectRoot, 'extension', '_locales');
const LOCALES = fs.readdirSync(localesDir).filter((name) =>
  fs.statSync(path.join(localesDir, name)).isDirectory(),
);

describe('i18n locale files', () => {
  for (const locale of LOCALES) {
    it(`should have ${locale} locale file`, () => {
      const localePath = path.join(projectRoot, 'extension', '_locales', locale, 'messages.json');
      assert.ok(fs.existsSync(localePath), `_locales/${locale}/messages.json must exist`);
    });
  }

  it('English locale should contain appName and appDescription', () => {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    assert.ok(en.appName, 'English locale must have appName key');
    assert.ok(en.appName.message, 'appName must have a message');
    assert.ok(en.appDescription, 'English locale must have appDescription key');
  });

  it('Manifest should use __MSG_ syntax for name', () => {
    const chromeManifest = JSON.parse(fs.readFileSync(
      path.join(projectRoot, 'extension', 'manifest.json'), 'utf8'));
    assert.equal(chromeManifest.name, '__MSG_appName__',
      'manifest.json must use __MSG_appName__ for name');
  });

  it('Manifest should use __MSG_ syntax for description', () => {
    const chromeManifest = JSON.parse(fs.readFileSync(
      path.join(projectRoot, 'extension', 'manifest.json'), 'utf8'));
    assert.equal(chromeManifest.description, '__MSG_appDescription__',
      'manifest.json must use __MSG_appDescription__ for description');
  });

  it('all locales should have identical key sets', () => {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const enKeys = Object.keys(en).sort();
    for (const locale of LOCALES) {
      const localePath = path.join(projectRoot, 'extension', '_locales', locale, 'messages.json');
      const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));
      const localeKeys = Object.keys(localeData).sort();
      assert.deepEqual(enKeys, localeKeys, `${locale} must have identical translation keys to English`);
    }
  });
});

describe('i18n composable', () => {
  const composablePath = path.join(projectRoot, 'extension', 'src', 'composables', 'useI18n.js');
  it('should exist', () => {
    assert.ok(fs.existsSync(composablePath), 'useI18n.js composable must exist');
  });

  it('should export useI18n function', () => {
    const source = fs.readFileSync(composablePath, 'utf8');
    assert.ok(source.includes('export function useI18n'), 'useI18n.js must export useI18n function');
  });

  it('should have a t() function for translations', () => {
    const source = fs.readFileSync(composablePath, 'utf8');
    assert.ok(source.includes('function t') || source.includes('const t'),
      'useI18n must provide a t() translation function');
    assert.ok(source.includes('chrome.i18n') || source.includes('browser.i18n'),
      't() must use chrome.i18n.getMessage or browser.i18n.getMessage');
  });
});
