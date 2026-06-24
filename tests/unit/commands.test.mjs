import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'commands.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const manifestSource = fs.readFileSync(path.join(projectRoot, 'extension', 'manifest.json'), 'utf8');
const bgSource = fs.readFileSync(path.join(projectRoot, 'extension', 'background.js'), 'utf8');

describe('Chrome keyboard shortcut commands', () => {
  it('manifest should define commands section', () => {
    assert.ok(manifestSource.includes('"commands"'),
      'manifest.json must have a "commands" section for keyboard shortcuts');
  });

  it('should define _execute_action command (popup)', () => {
    const commandsStart = manifestSource.indexOf('"commands"');
    const commandsBlock = manifestSource.slice(commandsStart, commandsStart + 300);
    assert.ok(commandsBlock.includes('_execute_action'),
      'commands must include _execute_action to open popup via keyboard');
  });

  it('should define fill-credentials command with Ctrl+Shift+F', () => {
    const commandsStart = manifestSource.indexOf('"commands"');
    const commandsBlock = manifestSource.slice(commandsStart, commandsStart + 400);
    assert.ok(commandsBlock.includes('fill-credentials'),
      'commands must include fill-credentials for keyboard fill');
    assert.ok(commandsBlock.includes('Ctrl+Shift+F') || commandsBlock.includes('Mac:Command+Shift+F'),
      'fill-credentials must have Ctrl+Shift+F shortcut');
  });

  it('background.js should handle onCommand event for fill-credentials', () => {
    assert.ok(bgSource.includes('chrome.commands'),
      'background.js must reference chrome.commands');
    assert.ok(bgSource.includes('onCommand') || bgSource.includes('onCommand.addListener'),
      'background.js must listen for chrome.commands.onCommand');
    assert.ok(bgSource.includes('fill-credentials') || bgSource.includes('fill_credentials'),
      'background.js must handle fill-credentials command');
  });
});
