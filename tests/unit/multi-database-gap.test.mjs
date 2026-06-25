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

describe('Multi-database support (gap for future C# implementation)', () => {
  it('background.js should handle KBB_SWITCH_DATABASE message', () => {
    assert.ok(bgSource.includes('KBB_SWITCH_DATABASE'),
      'background.js must handle KBB_SWITCH_DATABASE message to switch KeePass databases');
  });

  it('background.js should handle KBB_LIST_DATABASES message', () => {
    assert.ok(bgSource.includes('KBB_LIST_DATABASES'),
      'background.js must handle KBB_LIST_DATABASES to enumerate available databases');
  });

  it('C# handler should have SwitchDatabase method', () => {
    assert.ok(handlerSource.includes('SwitchDatabase') || handlerSource.includes('database.switch'),
      'BridgeRequestHandler must implement SwitchDatabase for database switching');
  });

  it('C# handler should have ListDatabases method', () => {
    assert.ok(handlerSource.includes('ListDatabases') || handlerSource.includes('database.list'),
      'BridgeRequestHandler must implement ListDatabases to enumerate available databases');
  });

  it('ProtocolModels should define DatabaseSwitchPayload', () => {
    assert.ok(protocolModels.includes('DatabaseSwitchPayload'),
      'ProtocolModels must define DatabaseSwitchPayload with database path/ID');
  });

  it('ProtocolModels should define DatabaseListResponsePayload', () => {
    assert.ok(protocolModels.includes('DatabaseListResponse') || protocolModels.includes('DatabaseListItem'),
      'ProtocolModels must define DatabaseListResponsePayload with available databases');
  });
});
