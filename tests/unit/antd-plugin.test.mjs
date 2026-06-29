import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'antd-plugin.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'shared', 'antd-plugin.js'), 'utf8');

describe('antd-plugin.js — unused components removed', () => {
  const removed = ['Avatar', 'Checkbox', 'InputPassword', 'Slider', 'Tooltip', 'TreeSelect'];
  for (const comp of removed) {
    it(`should NOT import ${comp}`, () => {
      assert.ok(!source.includes(comp),
        `${comp} is no longer used in templates — remove from antd-plugin.js`);
    });
  }

  it('should NOT import standalone Form', () => {
    // FormItem contains "Form" substring, so check import block specifically
    const importBlock = source.match(/import \{[^}]+\}/)?.[0] || '';
    const formNames = importBlock.match(/\bForm\b/g) || [];
    assert.ok(formNames.length === 0,
      'Form import found — only FormItem is needed');
  });

  it('should NOT export $message', () => {
    assert.ok(!source.includes('$message'),
      'message/$message not used anywhere — remove antd message import');
  });

  it('should export registerAntd function', () => {
    assert.ok(source.includes('export function registerAntd'),
      'must export registerAntd function');
  });
});
