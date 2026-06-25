import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'multi-database-gap.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');
const handlerSource = fs.readFileSync(path.join(projectRoot, 'src', 'Bridge', 'BridgeRequestHandler.cs'), 'utf8');
const protocolModels = fs.readFileSync(path.join(projectRoot, 'src', 'Bridge', 'ProtocolModels.cs'), 'utf8');
const bridgeSource = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'composables', 'useBridge.js'), 'utf8');

describe('Multi-database: current database info (implemented)', () => {
  it('C# should define DatabaseInfoResponsePayload', () => {
    assert.ok(protocolModels.includes('DatabaseInfoResponsePayload'),
      'ProtocolModels must define DatabaseInfoResponsePayload with Name, Path, IsOpen');
  });

  it('BridgeMethods should include database.info', () => {
    assert.ok(protocolModels.includes('DatabaseInfo'),
      'BridgeMethods must include database.info');
  });

  it('C# handler should have DatabaseInfo method', () => {
    assert.ok(handlerSource.includes('DatabaseInfo'),
      'BridgeRequestHandler must implement DatabaseInfo method');
  });

  it('background.js should handle KBB_GET_DATABASE_INFO', () => {
    assert.ok(bgSource.includes('KBB_GET_DATABASE_INFO'),
      'background.js must handle KBB_GET_DATABASE_INFO');
  });

  it('background.js should have getDatabaseInfo function', () => {
    assert.ok(bgSource.includes('async function getDatabaseInfo'),
      'background.js must have getDatabaseInfo function');
  });

  it('useBridge.js should export getDatabaseInfo', () => {
    assert.ok(bridgeSource.includes('getDatabaseInfo'),
      'useBridge.js must export getDatabaseInfo method');
  });
});

describe('Multi-database: switch/list (requires master key - C# future)', () => {
  it('KBB_SWITCH_DATABASE handler is TBD (needs master key)', () => {
    // Programmatic database switching requires the master password,
    // which the plugin cannot access. This is a future C# feature.
    assert.ok(true, 'Skipped - requires KeePass master key');
  });

  it('KBB_LIST_DATABASES handler is TBD (needs recent files tracking)', () => {
    assert.ok(true, 'Skipped - requires KeePass recent files tracking');
  });
});
