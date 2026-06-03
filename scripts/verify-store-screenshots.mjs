import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const screenshotDir = resolveScreenshotDir();
const expectedSize = { width: 1280, height: 800 };
const minimumBytes = 10 * 1024;
const expectedFiles = [
  '01-popup-pairing.png',
  '02-popup-account-picker.png',
  '03-inline-picker.png',
  '04-save-login-prompt.png',
  '05-settings-trusted-browsers.png'
];

for (const fileName of expectedFiles) {
  const filePath = path.join(screenshotDir, fileName);
  assert.equal(fs.existsSync(filePath), true, `Missing store screenshot: ${fileName}`);

  const bytes = fs.readFileSync(filePath);
  assert.ok(bytes.length >= minimumBytes, `Store screenshot is unexpectedly small: ${fileName}`);

  const dimensions = readPngDimensions(bytes, fileName);
  assert.deepEqual(dimensions, expectedSize, `Store screenshot dimensions mismatch: ${fileName}`);
}

console.log(`Store screenshots verified (${expectedFiles.length} files, ${expectedSize.width}x${expectedSize.height}).`);

function readPngDimensions(bytes, fileName) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  assert.ok(bytes.length >= 33, `Store screenshot is not a complete PNG: ${fileName}`);
  for (let index = 0; index < signature.length; index += 1) {
    assert.equal(bytes[index], signature[index], `Store screenshot is not a PNG file: ${fileName}`);
  }

  const ihdrLength = bytes.readUInt32BE(8);
  const ihdrType = bytes.subarray(12, 16).toString('ascii');
  assert.equal(ihdrLength, 13, `Store screenshot has invalid IHDR length: ${fileName}`);
  assert.equal(ihdrType, 'IHDR', `Store screenshot is missing PNG IHDR chunk: ${fileName}`);

  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20)
  };
}

function resolveScreenshotDir() {
  const dirIndex = process.argv.indexOf('--dir');
  if (dirIndex >= 0 && process.argv[dirIndex + 1]) {
    return path.resolve(process.cwd(), process.argv[dirIndex + 1]);
  }

  return path.join(repoRoot, 'docs', 'store-assets', 'screenshots');
}
