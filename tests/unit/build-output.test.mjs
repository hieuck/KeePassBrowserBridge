import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'build-output.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const distDir = path.join(projectRoot, 'extension', 'dist');

describe('Vue build output', () => {
  it('should produce dist/options.js', () => {
    const f = path.join(distDir, 'options.js');
    assert.ok(fs.existsSync(f), 'dist/options.js must exist after build');
    const stat = fs.statSync(f);
    assert.ok(stat.size > 1000, 'options.js should be > 1KB');
  });

  it('should produce dist/popup.js', () => {
    const f = path.join(distDir, 'popup.js');
    assert.ok(fs.existsSync(f), 'dist/popup.js must exist after build');
    const stat = fs.statSync(f);
    assert.ok(stat.size > 1000, 'popup.js should be > 1KB');
  });

  it('should produce dist/options.css', () => {
    const f = path.join(distDir, 'options.css');
    assert.ok(fs.existsSync(f), 'dist/options.css must exist after build');
  });

  it('should produce dist/popup.css', () => {
    const f = path.join(distDir, 'popup.css');
    assert.ok(fs.existsSync(f), 'dist/popup.css must exist after build');
  });

  it('should produce dist/components.es.js (web components)', () => {
    const f = path.join(distDir, 'components.es.js');
    assert.ok(fs.existsSync(f), 'dist/components.es.js must exist');
    const stat = fs.statSync(f);
    assert.ok(stat.size > 5000, 'components.es.js should be > 5KB');
  });

  it('should not produce files larger than 2MB', () => {
    const files = fs.readdirSync(distDir).filter(f => f.endsWith('.js') || f.endsWith('.css'));
    for (const file of files) {
      const stat = fs.statSync(path.join(distDir, file));
      assert.ok(stat.size < 2 * 1024 * 1024,
        `${file} is too large: ${(stat.size / 1024).toFixed(1)}KB (max 2048KB)`);
    }
  });
});

describe('Extension source files', () => {
  it('popup.html should reference dist/popup.js', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'extension', 'popup.html'), 'utf8');
    assert.ok(html.includes('dist/popup.js'), 'popup.html must reference dist/popup.js');
  });

  it('popup.html should reference dist/popup.css', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'extension', 'popup.html'), 'utf8');
    assert.ok(html.includes('dist/popup.css'), 'popup.html must reference dist/popup.css');
  });

  it('options.html should reference dist/options.js', () => {
    const html = fs.readFileSync(path.join(projectRoot, 'extension', 'options.html'), 'utf8');
    assert.ok(html.includes('dist/options.js'), 'options.html must reference dist/options.js');
  });

  it('compat.js should have valid JS syntax', () => {
    const compat = fs.readFileSync(path.join(projectRoot, 'extension', 'compat.js'), 'utf8');
    assert.ok(compat.includes('detectBrowser'), 'compat.js must have detectBrowser function');
    assert.ok(compat.includes('navigator.brave'), 'compat.js must have Brave detection');
  });
});
