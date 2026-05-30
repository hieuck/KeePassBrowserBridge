import assert from 'node:assert/strict';
import fs from 'node:fs';

const manifest = JSON.parse(fs.readFileSync(new URL('../../extension/manifest.json', import.meta.url), 'utf8'));
const scripts = manifest.content_scripts.flatMap((entry) => entry.js || []);

assert.equal(scripts.includes('testingInfrastructure.js'), false, 'production manifest must not inject testingInfrastructure.js into web pages');
assert.equal(scripts.includes('quick-test.js'), false, 'production manifest must not inject quick-test.js into web pages');
assert.equal(scripts.includes('test-extension.js'), false, 'production manifest must not inject test-extension.js into web pages');
assert.equal(scripts.includes('uxEnhancements.js'), false, 'production manifest must not inject extension UX theming into web pages');
assert.equal(scripts.includes('multiPageLogin.js'), false, 'production manifest must not inject legacy page-session login flow tracking into web pages');
assert.equal(scripts.includes('multiDatabase.js'), false, 'production manifest must not inject database management helpers into web pages');
assert.equal(scripts.includes('enhancedSecurity_part1.js'), false, 'production manifest must not inject extension lock state listeners into web pages');
assert.equal(scripts.includes('enhancedSecurity_part2.js'), false, 'production manifest must not inject screenshot or clipboard helpers into web pages');
assert.equal(scripts.includes('groupOrganization.js'), false, 'production manifest must not inject popup search helpers into web pages');
assert.equal(scripts.includes('passwordQuality.js'), false, 'production manifest must not inject password quality helpers into web pages');

console.log('Manifest tests passed.');
