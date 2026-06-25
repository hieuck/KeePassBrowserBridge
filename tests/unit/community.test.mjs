import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'community.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

describe('GitHub community standards', () => {
  it('should have CONTRIBUTING.md', () => {
    const filePath = path.join(projectRoot, 'CONTRIBUTING.md');
    assert.ok(fs.existsSync(filePath), 'CONTRIBUTING.md must exist for GitHub community standards');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('develop') || content.includes('test'), 'CONTRIBUTING.md should mention development');
  });

  it('should have SECURITY.md', () => {
    const filePath = path.join(projectRoot, 'SECURITY.md');
    assert.ok(fs.existsSync(filePath), 'SECURITY.md must exist for vulnerability reporting');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('security') || content.includes('vulnerability'), 'SECURITY.md should cover vulnerability reporting');
  });

  it('should have CODE_OF_CONDUCT.md', () => {
    const filePath = path.join(projectRoot, 'CODE_OF_CONDUCT.md');
    assert.ok(fs.existsSync(filePath), 'CODE_OF_CONDUCT.md must exist for community standards');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('conduct') || content.includes('Contributor Covenant'), 'CODE_OF_CONDUCT.md should reference a code of conduct');
  });

  it('should have .github/ISSUE_TEMPLATE/bug-report.md', () => {
    const filePath = path.join(projectRoot, '.github', 'ISSUE_TEMPLATE', 'bug-report.md');
    assert.ok(fs.existsSync(filePath), 'Bug report issue template must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('Steps to reproduce') || content.includes('expected behavior'),
      'Bug template should ask for reproduction steps');
  });

  it('should have .github/PULL_REQUEST_TEMPLATE.md', () => {
    const filePath = path.join(projectRoot, '.github', 'PULL_REQUEST_TEMPLATE.md');
    assert.ok(fs.existsSync(filePath), 'PR template must exist');
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('Description') || content.includes('Type of change'),
      'PR template should have description field');
  });

  it('should have ISSUE_TEMPLATE/config.yml for blank issues', () => {
    const filePath = path.join(projectRoot, '.github', 'ISSUE_TEMPLATE', 'config.yml');
    assert.ok(fs.existsSync(filePath), 'Issue template config must exist');
  });
});
