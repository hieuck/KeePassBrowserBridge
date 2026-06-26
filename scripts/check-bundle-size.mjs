import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '..', 'extension', 'dist');

const LIMITS = {
  'popup.js': 100 * 1024,
  'options.js': 100 * 1024,
  'background.js': 100 * 1024,
  'contentScript.js': 100 * 1024,
  'components.es.js': 150 * 1024,
};

let failed = false;

for (const [file, limit] of Object.entries(LIMITS)) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing: ${file}`);
    failed = true;
    continue;
  }
  const size = fs.statSync(filePath).size;
  const ok = size <= limit;
  console.log(`${ok ? 'PASS' : 'FAIL'} ${file}: ${(size / 1024).toFixed(1)}KB / ${(limit / 1024).toFixed(0)}KB limit`);
  if (!ok) failed = true;
}

if (failed) {
  console.error('\nFAIL: Bundle size check failed. Some files exceed their limits.');
  process.exit(1);
} else {
  console.log('\nPASS: All bundle sizes within limits.');
}
