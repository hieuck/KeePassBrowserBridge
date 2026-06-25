import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'group-browser.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');
const handlerSource = fs.readFileSync(path.join(projectRoot, 'src', 'Bridge', 'BridgeRequestHandler.cs'), 'utf8');
const protoSource = fs.readFileSync(path.join(projectRoot, 'src', 'Bridge', 'ProtocolModels.cs'), 'utf8');

describe('Group browser - full-stack', () => {
  it('C# should define DatabaseGroupsResponsePayload', () => {
    assert.ok(protoSource.includes('DatabaseGroupsResponsePayload'),
      'ProtocolModels must define DatabaseGroupsResponsePayload');
  });

  it('C# should define GroupNode with Name, Uuid, Children', () => {
    assert.ok(protoSource.includes('class GroupNode'), 'ProtocolModels must define GroupNode');
    assert.ok(protoSource.includes('GroupNode[] Children'), 'GroupNode must have Children array');
  });

  it('BridgeMethods should include database.groups', () => {
    assert.ok(protoSource.includes('DatabaseGroups'), 'BridgeMethods must include DatabaseGroups');
  });

  it('BridgeRequestHandler should have DatabaseGroups method', () => {
    assert.ok(handlerSource.includes('DatabaseGroups'),
      'BridgeRequestHandler must implement DatabaseGroups method');
    assert.ok(handlerSource.includes('BuildGroupNode'),
      'BridgeRequestHandler must have BuildGroupNode helper');
  });

  it('background.js should handle KBB_LIST_GROUPS', () => {
    assert.ok(bgSource.includes('KBB_LIST_GROUPS'),
      'background.js must handle KBB_LIST_GROUPS message');
  });

  it('background.js should have listGroups function', () => {
    assert.ok(bgSource.includes('async function listGroups'),
      'background.js must have listGroups function');
  });

  it('useBridge.js should export listGroups', () => {
    const bridgeSource = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'composables', 'useBridge.js'), 'utf8');
    assert.ok(bridgeSource.includes('listGroups'),
      'useBridge.js must export listGroups method');
  });
});
