import assert from 'node:assert/strict';
import { DEFAULT_E2E_PORT } from '../../tests/e2e/e2e-port.mjs';

describe('E2E port constant', () => {
  test('DEFAULT_E2E_PORT is 8080', () => {
    assert.equal(DEFAULT_E2E_PORT, 8080, 'default E2E port should be 8080');
  });
});
