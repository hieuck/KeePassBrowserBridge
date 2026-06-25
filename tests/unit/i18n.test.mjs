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

const REQUIRED_KEYS = [
  'appName',
  'appDescription',
  'popupTitle',
  'optionsTitle',
  'newLogin',
  'editLogin',
  'saveChanges',
  'cancel',
  'fill',
  'copyUsername',
  'copyPassword',
  'searchPlaceholder',
  'noLoginsFound',
  'settings',
  'about',
  'themeLight',
  'themeDark',
  'themeSystem',
  'locked',
  'unlock',
  'pairing',
  'startPairing',
  'pairingCode',
  'bridgeEndpoint',
  'general',
  'autofill',
  'clients',
  'passkeys',
  'sites',
  'debugMode',
  'version',
  'errorGeneric',
  'success',
  'failed',
];

const enPath = path.join(projectRoot, 'extension', '_locales', 'en', 'messages.json');
const viPath = path.join(projectRoot, 'extension', '_locales', 'vi', 'messages.json');

describe('i18n locale files', () => {
  it('should have English locale file', () => {
    assert.ok(fs.existsSync(enPath), '_locales/en/messages.json must exist');
  });

  it('should have Vietnamese locale file', () => {
    assert.ok(fs.existsSync(viPath), '_locales/vi/messages.json must exist');
  });

  it('English locale should contain all required keys', () => {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    for (const key of REQUIRED_KEYS) {
      assert.ok(en[key], `Missing required key: ${key} in English locale`);
      assert.ok(en[key].message, `Key ${key} must have a 'message' field in English locale`);
    }
  });

  it('Vietnamese locale should contain all required keys', () => {
    const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
    for (const key of REQUIRED_KEYS) {
      assert.ok(vi[key], `Missing required key: ${key} in Vietnamese locale`);
      assert.ok(vi[key].message, `Key ${key} must have a 'message' field in Vietnamese locale`);
    }
  });

  it('English and Vietnamese locales should have identical key sets', () => {
    const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
    const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
    const enKeys = Object.keys(en).sort();
    const viKeys = Object.keys(vi).sort();
    assert.deepEqual(enKeys, viKeys, 'English and Vietnamese must have identical translation keys');
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
