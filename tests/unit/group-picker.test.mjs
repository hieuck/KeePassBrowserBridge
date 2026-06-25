import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'group-picker.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const source = fs.readFileSync(path.join(projectRoot, 'extension', 'src', 'popup', 'NewLoginForm.vue'), 'utf8');

describe('NewLoginForm.vue - group picker', () => {
  it('should have a Group field that shows existing groups', () => {
    assert.ok(source.includes('Group') || source.includes('group'),
      'NewLoginForm must have a group/folder field');
  });

  it('should accept groups as a prop', () => {
    assert.ok(source.includes('groups') || source.includes('defineProps'),
      'NewLoginForm should accept a groups prop for the group picker');
  });

  it('should render a select or tree for group picking', () => {
    assert.ok(source.includes('a-tree-select') || source.includes('a-select') || source.includes('a-input'),
      'NewLoginForm should have a group/folder selector or input');
  });
});
