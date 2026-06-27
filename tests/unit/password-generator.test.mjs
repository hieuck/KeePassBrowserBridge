import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'password-generator.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const { generatePassword } = await import(
  path.join(projectRoot, 'extension', 'shared', 'password-generator.js')
);

describe('password-generator.js - generatePassword', () => {
  it('should generate a password of default length 20', () => {
    const pwd = generatePassword();
    assert.equal(pwd.length, 20);
  });

  it('should generate a password of specified length', () => {
    const pwd = generatePassword(32);
    assert.equal(pwd.length, 32);
  });

  it('should generate a password of length 8 (minimum)', () => {
    const pwd = generatePassword(8);
    assert.equal(pwd.length, 8);
  });

  it('should exclude ambiguous characters when option set', () => {
    const pwd = generatePassword(50, { excludeAmbiguous: true });
    assert.ok(!pwd.includes('1'), 'Should exclude 1');
    assert.ok(!pwd.includes('l'), 'Should exclude l');
    assert.ok(!pwd.includes('I'), 'Should exclude I');
    assert.ok(!pwd.includes('0'), 'Should exclude 0');
    assert.ok(!pwd.includes('O'), 'Should exclude O');
  });

  it('should exclude symbols when useSymbols is false', () => {
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const pwd = generatePassword(100, { useSymbols: false });
    for (const c of pwd) {
      assert.ok(!symbols.includes(c), `Should not contain symbol: ${c}`);
    }
  });

  it('should generate different passwords each call', () => {
    const pwd1 = generatePassword();
    const pwd2 = generatePassword();
    assert.notEqual(pwd1, pwd2);
  });

  it('should contain only valid characters', () => {
    const validChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    const pwd = generatePassword(50);
    for (const c of pwd) {
      assert.ok(validChars.includes(c), `Unexpected character: ${c}`);
    }
  });

  it('should contain at least one letter and one digit', () => {
    for (let i = 0; i < 20; i++) {
      const pwd = generatePassword(50);
      if (/[a-zA-Z]/.test(pwd) && /[0-9]/.test(pwd)) return;
    }
    assert.fail('20 attempts: none contained both a letter and a digit (random fluke?)');
  });
});
