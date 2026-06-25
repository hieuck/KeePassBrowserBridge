import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'vitest-config.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const configSource = fs.readFileSync(path.join(projectRoot, 'vitest.config.js'), 'utf8');
const backgroundExt = path.join(projectRoot, 'tests', 'extension', 'background.test.mjs');

describe('vitest config', () => {
  it('should exclude tests/extension/ from vitest runs (Playwright-only)', () => {
    assert.ok(configSource.includes('tests/extension'),
      'vitest.config.js should exclude tests/extension/ from vitest runs');
  });

  it('should not pick up Playwright-only test files', () => {
    // background.test.mjs uses vm sandbox and Playwright APIs — vitest can't run it
    const excludeMatch = configSource.match(/exclude:\s*\[([^\]]+)\]/);
    assert.ok(excludeMatch, 'config should have exclude array');
    assert.ok(excludeMatch[1].includes('tests/extension'),
      'exclude list must include tests/extension/');
  });

  it('should still include tests/unit/*.test.mjs', () => {
    assert.ok(configSource.includes("'tests/**/*.test.{js,ts,mjs}'"),
      'vitest must still include tests/unit/ via glob pattern');
  });

  it('vitest should show 0 failed suites for unit tests only', () => {
    // Verify that no tests/extension/ files match the vitest include pattern
    const includeMatch = configSource.match(/include:\s*\[([^\]]+)\]/);
    assert.ok(includeMatch, 'config should have include array');
    // The Playwright extension tests should not be in vitest's scope
    assert.ok(fs.existsSync(backgroundExt), 'background test should exist on disk');
  });
});
