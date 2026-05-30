import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../extension/generator.js', import.meta.url), 'utf8');
const sandbox = {
  crypto: {
    getRandomValues(arr) {
      for (let i = 0; i < arr.length; i++) {
        // pseudo-random for testing predictability or just use Math.random
        arr[i] = Math.floor(Math.random() * 4294967296);
      }
      return arr;
    }
  },
  module: {}
};
sandbox.module.exports = {};
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'generator.js' });

const { generatePassword } = sandbox.module.exports;

// Test default settings
const p1 = generatePassword();
assert.equal(p1.length, 16, 'Default length should be 16');

// Test length
const p2 = generatePassword({ length: 32 });
assert.equal(p2.length, 32, 'Custom length should be respected');

// Test character sets
const p3 = generatePassword({ useUpper: false, useLower: false, useNumbers: true, useSymbols: false });
assert.match(p3, /^[0-9]+$/, 'Should only contain numbers');

const p4 = generatePassword({ useUpper: true, useLower: false, useNumbers: false, useSymbols: false });
assert.match(p4, /^[A-Z]+$/, 'Should only contain uppercase letters');

const p5 = generatePassword({ useUpper: false, useLower: true, useNumbers: false, useSymbols: false });
assert.match(p5, /^[a-z]+$/, 'Should only contain lowercase letters');

const p6 = generatePassword({ useUpper: false, useLower: false, useNumbers: false, useSymbols: true });
assert.match(p6, /^[^a-zA-Z0-9]+$/, 'Should only contain symbols');

// Test error when all disabled
assert.throws(() => {
  generatePassword({ useUpper: false, useLower: false, useNumbers: false, useSymbols: false });
}, /At least one character type must be selected/, 'Should throw if all charsets are disabled');

console.log('Generator tests passed.');
