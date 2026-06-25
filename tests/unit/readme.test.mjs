import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'readme.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const readme = fs.readFileSync(path.join(projectRoot, 'README.md'), 'utf8');

describe('README.md accuracy', () => {
  it('should mention keyboard shortcuts', () => {
    assert.ok(readme.includes('keyboard') || readme.includes('shortcut') || readme.includes('Ctrl+Shift'),
      'README must mention keyboard shortcuts (Ctrl+Shift+F/K)');
  });

  it('should mention lock database from browser', () => {
    assert.ok(readme.includes('lock') || readme.includes('Lock'),
      'README should mention lock database from browser feature');
  });

  it('should mention the correct test count (>= 700)', () => {
    // Extract the test count mentioned in the README
    const matches = readme.match(/\d+\+?\s*(test|E2E)/gi);
    const hasHighCount = matches && matches.some(m => {
      const num = parseInt(m, 10);
      return !isNaN(num) && num >= 700;
    });
    assert.ok(hasHighCount || readme.includes('700') || readme.includes('784'),
      'README should reflect current test count (700+)');
  });

  it('should mention group browser feature', () => {
    assert.ok(readme.includes('group') || readme.includes('tree'),
      'README should mention group browser/tree feature');
  });

  it('should mention i18n or translations', () => {
    assert.ok(readme.includes('i18n') || readme.includes('locale') || readme.includes('translation') || readme.includes('Vietnamese'),
      'README should mention i18n/translation support (EN+VI)');
  });

  it('should mention inline copy from card', () => {
    assert.ok(readme.includes('copy') || readme.includes('inline'),
      'README should mention copy username/password from collapsed card');
  });

  it('should mention auto-type or autotype', () => {
    assert.ok(readme.includes('auto-type') || readme.includes('autotype') || readme.includes('AutoType'),
      'README should mention auto-type bridge support');
  });

  it('should mention CI/CD pipeline', () => {
    assert.ok(readme.includes('CI') || readme.includes('GitHub Actions'),
      'README should mention CI/CD pipeline');
  });

  it('should mention 0 dotnet build errors', () => {
    assert.ok(readme.includes('0 error') || readme.includes('build 0'),
      'README should mention dotnet build 0 errors');
  });
});
