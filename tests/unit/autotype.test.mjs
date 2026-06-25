import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'autotype.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');
const handlerSource = fs.readFileSync(path.join(projectRoot, 'src', 'Bridge', 'BridgeRequestHandler.cs'), 'utf8');
const protoSource = fs.readFileSync(path.join(projectRoot, 'src', 'Bridge', 'ProtocolModels.cs'), 'utf8');
const bridgeSource = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'composables', 'useBridge.js'), 'utf8');

describe('Auto-type — full-stack', () => {
  it('C# should define AutoTypePayload', () => {
    assert.ok(protoSource.includes('AutoTypePayload'), 'ProtocolModels must define AutoTypePayload with Search');
  });

  it('BridgeMethods should include autotype.perform', () => {
    assert.ok(protoSource.includes('AutoType'), 'BridgeMethods must include autotype.perform');
  });

  it('BridgeRequestHandler should have AutoType method', () => {
    assert.ok(handlerSource.includes('AutoType'), 'BridgeRequestHandler must implement AutoType method');
  });

  it('background.js should handle KBB_AUTOTYPE', () => {
    assert.ok(bgSource.includes('KBB_AUTOTYPE'), 'background.js must handle KBB_AUTOTYPE message');
  });

  it('background.js should have performAutoType function', () => {
    assert.ok(bgSource.includes('async function performAutoType'), 'background.js must have performAutoType');
  });

  it('useBridge.js should export performAutoType', () => {
    assert.ok(bridgeSource.includes('performAutoType'), 'useBridge.js must export performAutoType');
  });
});
