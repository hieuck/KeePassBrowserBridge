import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'escape-html.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const { escapeHtml } = await import(
  path.join(projectRoot, 'extension', 'shared', 'escape-html.js')
);

describe('escape-html.js - escapeHtml', () => {
  it('should escape & to &amp;', () => {
    assert.equal(escapeHtml('&'), '&amp;');
  });

  it('should escape < to &lt;', () => {
    assert.equal(escapeHtml('<'), '&lt;');
  });

  it('should escape > to &gt;', () => {
    assert.equal(escapeHtml('>'), '&gt;');
  });

  it('should escape " to &quot;', () => {
    assert.equal(escapeHtml('"'), '&quot;');
  });

  it('should escape multiple special chars in one string', () => {
    assert.equal(escapeHtml('<script>alert("x&y")</script>'), '&lt;script&gt;alert(&quot;x&amp;y&quot;)&lt;/script&gt;');
  });

  it('should return empty string for empty input', () => {
    assert.equal(escapeHtml(''), '');
  });

  it('should return unchanged string when no special chars', () => {
    assert.equal(escapeHtml('hello world 123'), 'hello world 123');
  });

  it('should handle non-string input', () => {
    assert.equal(escapeHtml(42), '42');
    assert.equal(escapeHtml(null), 'null');
    assert.equal(escapeHtml(undefined), 'undefined');
  });
});
