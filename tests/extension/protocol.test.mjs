import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

function canonicalize(request) {
  return [
    request.ProtocolVersion,
    request.Method,
    request.RequestId,
    request.TimestampUtcMs,
    request.Origin,
    request.ClientId,
    request.Payload
  ].join('\n');
}

function createAuthentication(request, sharedSecret) {
  return createHmac('sha256', Buffer.from(sharedSecret, 'utf8'))
    .update(canonicalize(request), 'utf8')
    .digest('base64');
}

function createHmacHex(key, data) {
  return createHmac('sha256', Buffer.from(key, 'utf8'))
    .update(data, 'utf8')
    .digest('hex');
}

const request = {
  ProtocolVersion: 1,
  RequestId: '00112233445566778899aabbccddeeff',
  Method: 'logins.query',
  TimestampUtcMs: 1779960000000,
  Origin: 'chrome-extension://abcdefghijklmnopabcdefghijklmnop',
  ClientId: 'client-1',
  Payload: '{"Url":"https://example.com/login"}'
};

assert.equal(
  canonicalize(request),
  [
    '1',
    'logins.query',
    '00112233445566778899aabbccddeeff',
    '1779960000000',
    'chrome-extension://abcdefghijklmnopabcdefghijklmnop',
    'client-1',
    '{"Url":"https://example.com/login"}'
  ].join('\n')
);

assert.equal(
  createHmacHex('Jefe', 'what do ya want for nothing?'),
  '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843'
);

assert.match(createAuthentication(request, 'shared-secret'), /^[A-Za-z0-9+/]+={0,2}$/);

console.log('Extension protocol tests passed.');
