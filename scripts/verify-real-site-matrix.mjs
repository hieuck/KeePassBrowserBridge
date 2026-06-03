import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const matrixPath = path.join(repoRoot, 'docs', 'real-site-validation.md');
const fixturesDir = path.join(repoRoot, 'tests', 'fixtures');

const matrix = fs.readFileSync(matrixPath, 'utf8');
const searchableSources = [
  'tests/e2e/form-detection.spec.js',
  'tests/extension/content-script.test.mjs',
  'tests/extension/manifest.test.mjs',
  'tests/Program.cs'
].map((relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')).join('\n');

let checkedRows = 0;
const missingFixtures = [];
const missingCoverage = [];

for (const line of matrix.split(/\r?\n/)) {
  if (!line.startsWith('|')) continue;
  if (line.includes('---')) continue;
  if (line.includes('Real-site behavior')) continue;

  const cells = line.split('|').slice(1, -1).map((cell) => cell.trim());
  if (cells.length !== 3) continue;

  checkedRows += 1;
  const [, fixtureCell, coverageCell] = cells;

  for (const fixture of extractBacktickValues(fixtureCell).filter((value) => value.endsWith('.html'))) {
    if (!fs.existsSync(path.join(fixturesDir, fixture))) {
      missingFixtures.push(fixture);
    }
  }

  const coverageLabels = extractBacktickValues(coverageCell);
  assert.notEqual(coverageLabels.length, 0, `Real-site matrix row must list exact coverage labels in backticks: ${line}`);

  for (const label of coverageLabels) {
    if (!searchableSources.includes(label)) {
      missingCoverage.push(label);
    }
  }
}

assert.ok(checkedRows > 0, 'Real-site validation matrix should contain covered journey rows.');
assert.deepEqual(missingFixtures, [], 'Real-site validation matrix references missing fixtures.');
assert.deepEqual(missingCoverage, [], 'Real-site validation matrix references missing automated coverage labels.');

console.log(`Real-site validation matrix verified (${checkedRows} rows).`);

function extractBacktickValues(value) {
  const matches = [];
  const pattern = /`([^`]+)`/g;
  let match;
  while ((match = pattern.exec(value)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}
