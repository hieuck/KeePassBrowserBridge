import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const configPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'playwright.config.js'
);
const configUrl = pathToFileURL(configPath).href;

function loadConfig(env) {
  const script = `import config from ${JSON.stringify(configUrl)}; console.log(JSON.stringify({ baseURL: config.use.baseURL, webServerURL: config.webServer.url }));`;
  const stdout = execSync(`node --input-type=module -e ${JSON.stringify(script)}`, {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return JSON.parse(stdout.trim());
}

describe('playwright.config.js', () => {
  test('defaults E2E port to 8080 when PORT env is unset', () => {
    const result = loadConfig({ PORT: undefined });
    assert.equal(result.baseURL, 'http://127.0.0.1:8080', 'default baseURL should use port 8080');
    assert.equal(result.webServerURL, 'http://127.0.0.1:8080', 'default webServer url should use port 8080');
  });

  test('respects PORT env override', () => {
    const result = loadConfig({ PORT: '9000' });
    assert.equal(result.baseURL, 'http://127.0.0.1:9000', 'baseURL should honor PORT env var');
    assert.equal(result.webServerURL, 'http://127.0.0.1:9000', 'webServer url should honor PORT env var');
  });
});
