import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../../extension/passkeysProxyExperiment.js', import.meta.url), 'utf8');

function loadSandbox(chrome) {
  const sandbox = {
    chrome,
    URL,
    module: { exports: {} }
  };
  sandbox.globalThis = sandbox;
  vm.runInNewContext(source, sandbox, { filename: 'passkeysProxyExperiment.js' });
  return sandbox.module.exports;
}

const unavailable = loadSandbox({});
assert.equal(unavailable.isAvailable({}), false, 'passkey proxy experiment should detect missing Chrome API');

const calls = [];
const createEvent = makeEvent();
const getEvent = makeEvent();
const isUvpaaEvent = makeEvent();
const cancelEvent = makeEvent();
const chromeApi = {
  webAuthenticationProxy: {
    attach: async () => 'attached',
    detach: async () => 'detached',
    completeCreateRequest: async (details) => calls.push(['create', details]),
    completeGetRequest: async (details) => calls.push(['get', details]),
    completeIsUvpaaRequest: async (details) => calls.push(['isUvpaa', details]),
    onCreateRequest: createEvent,
    onGetRequest: getEvent,
    onIsUvpaaRequest: isUvpaaEvent,
    onRequestCanceled: cancelEvent
  }
};
const api = loadSandbox(chromeApi);

assert.equal(api.isAvailable(), true, 'passkey proxy experiment should detect the Chrome API surface');
assert.equal(await api.attach(), 'attached', 'attach should delegate to chrome.webAuthenticationProxy.attach');
assert.equal(await api.detach(), 'detached', 'detach should delegate to chrome.webAuthenticationProxy.detach');

const createPayload = api.normalizeCreateRequest({
  requestId: 42,
  requestDetailsJson: JSON.stringify(createOptions({
    rp: { id: 'example.com', name: 'Example' },
    user: {
      id: 'YWxpY2U',
      name: 'alice@example.com',
      displayName: 'Alice'
    },
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
    timeout: 45000,
    hints: ['hybrid', 'security-key', 'hybrid', 'future-hint'],
    extensions: {
      credProps: true
    },
    attestation: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'cross-platform',
      residentKey: 'preferred',
      userVerification: 'preferred'
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -257 },
      { type: 'public-key', alg: -7 },
      { type: 'PUBLIC-KEY', alg: '-7' },
      { type: 'password', alg: -8 }
    ],
    excludeCredentials: [
      { type: 'public-key', id: 'ZXhjbHVkZS0x==' },
      { type: 'PUBLIC-KEY', id: 'ZXhjbHVkZS0x' },
      { id: 'ZXhjbHVkZS0y' }
    ]
  }))
}, {
  origin: 'https://example.com'
});

assert.deepEqual(plain(createPayload), {
  WebAuthnRequestId: '42',
  RpId: 'example.com',
  Origin: 'https://example.com',
  Challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
  UserHandle: 'YWxpY2U',
  UserName: 'alice@example.com',
  UserDisplayName: 'Alice',
  UserVerification: 'preferred',
  TimeoutMs: 45000,
  Hints: ['hybrid', 'security-key'],
  Attestation: 'none',
  AuthenticatorAttachment: 'cross-platform',
  ResidentKey: 'preferred',
  CredentialAlgorithms: [-257, -7],
  ExcludeCredentialIds: ['ZXhjbHVkZS0x', 'ZXhjbHVkZS0y'],
  RequestedExtensions: { CredProps: true },
  Transports: []
}, 'create request should map Chrome JSON options to bridge payload fields');

const createWithUntrustedOptionOrigin = api.normalizeCreateRequest({
  requestId: 42,
  requestDetailsJson: JSON.stringify(createOptions({
    rp: { id: 'example.com', name: 'Example' },
    user: {
      id: 'YWxpY2U',
      name: 'alice@example.com',
      displayName: 'Alice'
    },
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
    origin: 'https://spoofed.example'
  }))
}, {
  origin: 'https://example.com'
});
assert.equal(createWithUntrustedOptionOrigin.Origin, 'https://example.com',
  'trusted context origin should override any origin value inside requestDetailsJson');

const createWithoutRpId = api.normalizeCreateRequest({
  requestId: 42,
  requestDetailsJson: JSON.stringify(createOptions({
    rp: { name: 'Example' },
    user: {
      id: 'YWxpY2U',
      name: 'alice@example.com',
      displayName: 'Alice'
    },
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
  }))
}, {
  origin: 'https://login.example.com'
});
assert.equal(createWithoutRpId.RpId, 'login.example.com',
  'create request should default a missing RP ID to the trusted origin host');

const createWithLegacyResidentKey = api.normalizeCreateRequest({
  requestId: 44,
  requestDetailsJson: JSON.stringify(createOptions({
    rp: { id: 'example.com', name: 'Example' },
    user: {
      id: 'YWxpY2U',
      name: 'alice@example.com',
      displayName: 'Alice'
    },
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
    authenticatorSelection: {
      requireResidentKey: true
    }
  }))
}, {
  origin: 'https://example.com'
});
assert.equal(createWithLegacyResidentKey.ResidentKey, 'required',
  'create request should map legacy requireResidentKey=true to a required resident-key requirement');

const getPayload = api.normalizeGetRequest({
  requestId: 43,
  requestDetailsJson: JSON.stringify({
    rpId: 'Example.com',
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
    timeout: 12000.9,
    hints: ['client-device', 'hybrid', 'unknown-hint'],
    userVerification: 'discouraged',
    allowCredentials: [
      { id: 'Y3JlZC0x==', type: 'public-key' },
      { id: 'Y3JlZC0y', type: 'public-key' }
    ]
  })
}, {
  origin: 'https://accounts.example.com'
});

assert.deepEqual(plain(getPayload), {
  WebAuthnRequestId: '43',
  RpId: 'example.com',
  Origin: 'https://accounts.example.com',
  Challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
  AllowCredentialIds: ['Y3JlZC0x', 'Y3JlZC0y'],
  UserVerification: 'discouraged',
  TimeoutMs: 12000,
  Hints: ['client-device', 'hybrid']
}, 'get request should normalize RP ID and allow trusted subdomain origins');

const getWithoutRpId = api.normalizeGetRequest({
  requestId: 43,
  requestDetailsJson: JSON.stringify({
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
  })
}, {
  origin: 'https://login.example.com'
});
assert.equal(getWithoutRpId.RpId, 'login.example.com',
  'get request should default a missing RP ID to the trusted origin host');

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 46,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        userVerification: 'required'
      }
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedUserVerificationError,
  'proxy experiment must reject create requests requiring unsupported user verification'
);

assert.throws(
  () => api.normalizeGetRequest({
    requestId: 47,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      userVerification: 'required'
    })
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedUserVerificationError,
  'proxy experiment must reject get requests requiring unsupported user verification'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 57,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        userVerification: 'future-required'
      }
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedUserVerificationError,
  'proxy experiment must reject create requests with unknown user verification values'
);

assert.throws(
  () => api.normalizeGetRequest({
    requestId: 58,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      userVerification: 'future-required'
    })
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedUserVerificationError,
  'proxy experiment must reject get requests with unknown user verification values'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 48,
    requestDetailsJson: JSON.stringify({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
    })
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedAlgorithmError,
  'proxy experiment must reject create requests missing ES256 public-key credential parameters'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 49,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      pubKeyCredParams: [
        { type: 'public-key', alg: -257 },
        { type: 'public-key', alg: -37 }
      ]
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedAlgorithmError,
  'proxy experiment must reject create requests that do not allow ES256 credentials'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 50,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      attestation: 'direct'
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedAttestationError,
  'proxy experiment must reject create requests requiring unsupported attestation conveyance'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 59,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      attestation: 'future-attestation'
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedAttestationError,
  'proxy experiment must reject create requests with unknown attestation conveyance'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 56,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        authenticatorAttachment: 'platform'
      }
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedAuthenticatorAttachmentError,
  'proxy experiment must reject create requests requiring unsupported authenticator attachment'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 60,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        authenticatorAttachment: 'future-attachment'
      }
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedAuthenticatorAttachmentError,
  'proxy experiment must reject create requests with unknown authenticator attachment'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 61,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        residentKey: 'future-resident-key'
      }
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedResidentKeyError,
  'proxy experiment must reject create requests with unknown resident-key requirements'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 62,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      extensions: {
        credProps: true,
        prf: { eval: { first: 'Zmlyc3Qtc2FsdC0xMjM0NTY' } }
      }
    }))
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedExtensionError,
  'proxy experiment must reject create requests with unsupported WebAuthn extensions'
);

assert.throws(
  () => api.normalizeGetRequest({
    requestId: 63,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      extensions: {
        appid: 'https://example.com'
      }
    })
  }, {
    origin: 'https://example.com'
  }),
  isUnsupportedExtensionError,
  'proxy experiment must reject get requests with unsupported WebAuthn extensions'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 51,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'not@base64url', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
    }))
  }, {
    origin: 'https://example.com'
  }),
  isInvalidUserHandleError,
  'proxy experiment must reject create requests with invalid user handles'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 52,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'c2hvcnQ'
    }))
  }, {
    origin: 'https://example.com'
  }),
  isInvalidChallengeError,
  'proxy experiment must reject create requests with short challenges'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 53,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      excludeCredentials: [
        { id: 'ZXhjbHVkZS0x', type: 'public-key' },
        { id: 'not@base64url', type: 'public-key' }
      ]
    }))
  }, {
    origin: 'https://example.com'
  }),
  isInvalidExcludeCredentialError,
  'proxy experiment must reject create requests with invalid excludeCredentials'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 56,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      excludeCredentials: [
        { id: 'ZXhjbHVkZS0x', type: 'future-public-key' }
      ]
    }))
  }, {
    origin: 'https://example.com'
  }),
  isInvalidExcludeCredentialError,
  'proxy experiment must reject create requests with unsupported excludeCredentials descriptor types'
);

assert.throws(
  () => api.normalizeGetRequest({
    requestId: 54,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'not@base64url'
    })
  }, {
    origin: 'https://example.com'
  }),
  isInvalidChallengeError,
  'proxy experiment must reject get requests with invalid challenges'
);

assert.throws(
  () => api.normalizeGetRequest({
    requestId: 55,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      allowCredentials: [
        { id: 'Y3JlZC0x', type: 'public-key' },
        { id: 'not@base64url', type: 'public-key' }
      ]
    })
  }, {
    origin: 'https://example.com'
  }),
  isInvalidAllowCredentialError,
  'proxy experiment must reject get requests with invalid allowCredentials'
);

assert.throws(
  () => api.normalizeGetRequest({
    requestId: 57,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      allowCredentials: [
        { id: 'Y3JlZC0x', type: 'future-public-key' }
      ]
    })
  }, {
    origin: 'https://example.com'
  }),
  isInvalidAllowCredentialError,
  'proxy experiment must reject get requests with unsupported allowCredentials descriptor types'
);

assert.equal(api.isRpIdAllowedForOrigin('example.com', 'https://example.com/login'), true,
  'RP ID validation should allow exact origin hosts');
assert.equal(api.isRpIdAllowedForOrigin('example.com', 'https://accounts.example.com/login'), true,
  'RP ID validation should allow subdomain origin hosts');
assert.equal(api.isRpIdAllowedForOrigin('example.com', 'https://evil-example.com/login'), false,
  'RP ID validation should reject suffix lookalike hosts');
assert.equal(api.isRpIdAllowedForOrigin('127.0.0.1', 'https://127.0.0.1/login'), false,
  'RP ID validation should reject IP-address RP IDs');
assert.equal(api.isRpIdAllowedForOrigin('example.com', 'http://example.com/login'), false,
  'RP ID validation should reject non-local HTTP origins');

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 44,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
    }))
  }, {
    origin: 'https://evil-example.com'
  }),
  (error) => error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey RP ID is not valid for the trusted caller origin.',
  'proxy experiment must reject create requests whose RP ID does not match the trusted origin'
);

assert.throws(
  () => api.normalizeCreateRequest({
    requestId: 44,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'YWxpY2U', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
    }))
  }),
  /does not expose caller origin/,
  'proxy experiment must refuse to forward WebAuthn requests without a trusted caller origin'
);

assert.throws(
  () => api.normalizeGetRequest({
    requestId: 45,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      origin: 'https://spoofed.example'
    })
  }),
  /does not expose caller origin/,
  'proxy experiment must not trust origin values embedded in requestDetailsJson'
);

const trustedOriginResolver = api.createTrustedOriginResolver({
  chromeLike: {
    webNavigation: {
      getFrame: async ({ tabId, frameId }) => {
        if (tabId === 9 && frameId === 4) {
          return { url: 'https://frame.example.test/login?step=passkey' };
        }
        if (tabId === 10 && frameId === 0) {
          return { url: 'http://localhost:8080/webauthn-demo' };
        }
        return { url: 'http://remote.example.test/insecure' };
      }
    }
  }
});
assert.equal(await trustedOriginResolver({
  requestId: 46,
  origin: 'https://direct.example.test/account',
  requestDetailsJson: JSON.stringify({ origin: 'https://spoofed.example' })
}), 'https://direct.example.test', 'trusted-origin resolver should use browser-supplied top-level origin fields');
assert.equal(await trustedOriginResolver({
  requestId: 47,
  url: 'https://url.example.test/login/path',
  requestDetailsJson: JSON.stringify({ origin: 'https://spoofed.example' })
}), 'https://url.example.test', 'trusted-origin resolver should derive origin from browser-supplied top-level URL fields');
assert.equal(await trustedOriginResolver({
  requestId: 48,
  tabId: 9,
  frameId: 4,
  requestDetailsJson: JSON.stringify({ origin: 'https://spoofed.example' })
}), 'https://frame.example.test', 'trusted-origin resolver should fall back to webNavigation frame URLs when requestInfo includes frame context');
assert.equal(await trustedOriginResolver({
  requestId: 49,
  tabId: 10,
  requestDetailsJson: JSON.stringify({ origin: 'https://spoofed.example' })
}), 'http://localhost:8080', 'trusted-origin resolver should allow loopback HTTP for local WebAuthn development');
assert.equal(await trustedOriginResolver({
  requestId: 50,
  requestDetailsJson: JSON.stringify({ origin: 'https://spoofed.example' })
}), '', 'trusted-origin resolver must not use origin values embedded in requestDetailsJson');
assert.equal(await trustedOriginResolver({
  requestId: 51,
  origin: 'chrome-extension://abcdefghijklmnopabcdefghijklmnop',
  tabId: 11,
  frameId: 0
}), '', 'trusted-origin resolver should reject extension and insecure remote origins');

const bridgeCalls = [];
const handlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    bridgeCalls.push([method, payload]);
    if (method === 'passkeys.create.begin') {
      return { PendingApproval: true, WebAuthnRequestId: payload.WebAuthnRequestId };
    }
    if (method === 'passkeys.create.complete') {
      return {
        CredentialId: 'Y3JlZC1jcmVhdGU',
        ClientDataJson: 'Y2xpZW50LWNyZWF0ZQ',
        AttestationObject: 'YXR0ZXN0'
      };
    }
    if (method === 'passkeys.get.begin') {
      return {
        PendingApproval: true,
        Credentials: [
          { CredentialId: 'Y3JlZC0x', UserName: 'alice@example.com' },
          { CredentialId: 'Y3JlZC0y', UserName: 'bob@example.com' }
        ]
      };
    }
    if (method === 'passkeys.get.complete') {
      return {
        CredentialId: payload.CredentialId,
        AuthenticatorData: 'YXV0aC1kYXRh',
        ClientDataJson: 'Y2xpZW50LWdldA',
        Signature: 'c2lnbmF0dXJl',
        UserHandle: 'dXNlcg'
      };
    }
    if (method === 'passkeys.cancel') {
      return { WebAuthnRequestId: payload.WebAuthnRequestId, Cancelled: true };
    }
    throw new Error(`unexpected method ${method}`);
  },
  approveCreate: async ({ payload, begin }) => {
    assert.equal(payload.WebAuthnRequestId, '80', 'create approval should receive normalized payload');
    assert.equal(begin.PendingApproval, true, 'create approval should receive begin response');
    return true;
  },
  chooseCredential: async ({ credentials }) => credentials[1]
});

const bridgeCreateResponse = await handlers.onCreateRequest({
  requestId: 80,
  requestDetailsJson: JSON.stringify(createOptions({
    rp: { id: 'example.com' },
    user: { id: 'dXNlcg', name: 'alice@example.com' },
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
  }))
}, {
  origin: 'https://example.com'
});
assert.equal(bridgeCreateResponse.CredentialId, 'Y3JlZC1jcmVhdGU',
  'create bridge helper should return the complete response');
assert.deepEqual(plain(bridgeCalls.slice(0, 2).map(([method, payload]) => [method, payload.WebAuthnRequestId, payload.RpId, payload.Origin])), [
  ['passkeys.create.begin', '80', 'example.com', 'https://example.com'],
  ['passkeys.create.complete', '80', 'example.com', 'https://example.com']
], 'create bridge helper should call begin then complete with the trusted-origin payload');

const bridgeGetResponse = await handlers.onGetRequest({
  requestId: 81,
  requestDetailsJson: JSON.stringify({
    rpId: 'example.com',
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
    allowCredentials: [{ id: 'Y3JlZC0y' }]
  })
}, {
  origin: 'https://example.com'
});
assert.equal(bridgeGetResponse.CredentialId, 'Y3JlZC0y',
  'get bridge helper should return the selected credential assertion response');
assert.deepEqual(plain(bridgeCalls.slice(2, 4).map(([method, payload]) => [method, payload.WebAuthnRequestId, payload.RpId, payload.Origin, payload.CredentialId || ''])), [
  ['passkeys.get.begin', '81', 'example.com', 'https://example.com', ''],
  ['passkeys.get.complete', '81', 'example.com', 'https://example.com', 'Y3JlZC0y']
], 'get bridge helper should call begin then complete with the selected credential');

const bridgeCancelResponse = await handlers.onRequestCanceled('81', { kind: 'get' }, 'canceled');
assert.equal(bridgeCancelResponse.Cancelled, true, 'cancel bridge helper should return cancel response');
assert.deepEqual(plain(bridgeCalls[4]), [
  'passkeys.cancel',
  { WebAuthnRequestId: '81' }
], 'cancel bridge helper should call backend cancel method with the WebAuthn request ID');

const deniedCalls = [];
const deniedHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    deniedCalls.push([method, payload]);
    return method === 'passkeys.cancel'
      ? { WebAuthnRequestId: payload.WebAuthnRequestId, Cancelled: true }
      : { PendingApproval: true };
  },
  approveCreate: async () => false
});
await assert.rejects(
  () => deniedHandlers.onCreateRequest({
    requestId: 82,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
    }))
  }, { origin: 'https://example.com' }),
  (error) => error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey registration was denied.',
  'create bridge helper should surface denied approval as a WebAuthn error'
);
assert.deepEqual(plain(deniedCalls.map(([method, payload]) => [method, payload.WebAuthnRequestId])), [
  ['passkeys.create.begin', '82'],
  ['passkeys.cancel', '82']
], 'denied create approval should cancel the backend pending passkey session');

const invalidRpBridgeCalls = [];
const invalidRpHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    invalidRpBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => invalidRpHandlers.onGetRequest({
    requestId: 83,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
    })
  }, { origin: 'https://evil-example.com' }),
  (error) => error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey RP ID is not valid for the trusted caller origin.',
  'bridge helper should reject invalid RP IDs before calling KeePass'
);
assert.deepEqual(invalidRpBridgeCalls, [],
  'bridge helper must not call backend passkey methods when trusted-origin RP ID validation fails');

const requiredUvBridgeCalls = [];
const requiredUvHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    requiredUvBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => requiredUvHandlers.onCreateRequest({
    requestId: 84,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        userVerification: 'required'
      }
    }))
  }, { origin: 'https://example.com' }),
  isUnsupportedUserVerificationError,
  'create bridge helper should reject required user verification before calling KeePass'
);
await assert.rejects(
  () => requiredUvHandlers.onGetRequest({
    requestId: 85,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      userVerification: 'required'
    })
  }, { origin: 'https://example.com' }),
  isUnsupportedUserVerificationError,
  'get bridge helper should reject required user verification before calling KeePass'
);
assert.deepEqual(requiredUvBridgeCalls, [],
  'bridge helper must not call backend passkey methods when required user verification is unsupported');

const unsupportedAlgBridgeCalls = [];
const unsupportedAlgHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedAlgBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedAlgHandlers.onCreateRequest({
    requestId: 86,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      pubKeyCredParams: [{ type: 'public-key', alg: -257 }]
    }))
  }, { origin: 'https://example.com' }),
  isUnsupportedAlgorithmError,
  'create bridge helper should reject unsupported credential algorithms before calling KeePass'
);
assert.deepEqual(unsupportedAlgBridgeCalls, [],
  'bridge helper must not call backend passkey methods when ES256 is not allowed by the request');

const unsupportedAttestationBridgeCalls = [];
const unsupportedAttestationHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedAttestationBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedAttestationHandlers.onCreateRequest({
    requestId: 87,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      attestation: 'enterprise'
    }))
  }, { origin: 'https://example.com' }),
  isUnsupportedAttestationError,
  'create bridge helper should reject unsupported attestation before calling KeePass'
);
assert.deepEqual(unsupportedAttestationBridgeCalls, [],
  'bridge helper must not call backend passkey methods when attestation conveyance is unsupported');

const unsupportedAttachmentBridgeCalls = [];
const unsupportedAttachmentHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedAttachmentBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedAttachmentHandlers.onCreateRequest({
    requestId: 92,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        authenticatorAttachment: 'platform'
      }
    }))
  }, { origin: 'https://example.com' }),
  isUnsupportedAuthenticatorAttachmentError,
  'create bridge helper should reject unsupported authenticator attachment before calling KeePass'
);
assert.deepEqual(unsupportedAttachmentBridgeCalls, [],
  'bridge helper must not call backend passkey methods when authenticator attachment is unsupported');

const unsupportedResidentKeyBridgeCalls = [];
const unsupportedResidentKeyHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedResidentKeyBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedResidentKeyHandlers.onCreateRequest({
    requestId: 95,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      authenticatorSelection: {
        residentKey: 'future-resident-key'
      }
    }))
  }, { origin: 'https://example.com' }),
  isUnsupportedResidentKeyError,
  'create bridge helper should reject unknown resident-key requirements before calling KeePass'
);
assert.deepEqual(unsupportedResidentKeyBridgeCalls, [],
  'bridge helper must not call backend passkey methods when resident-key requirement is unsupported');

const unsupportedExtensionBridgeCalls = [];
const unsupportedExtensionHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedExtensionBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedExtensionHandlers.onCreateRequest({
    requestId: 93,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      extensions: {
        largeBlob: { support: 'required' }
      }
    }))
  }, { origin: 'https://example.com' }),
  isUnsupportedExtensionError,
  'create bridge helper should reject unsupported WebAuthn extensions before calling KeePass'
);
assert.deepEqual(unsupportedExtensionBridgeCalls, [],
  'bridge helper must not call backend passkey methods when requested extensions are unsupported');

const unsupportedGetExtensionBridgeCalls = [];
const unsupportedGetExtensionHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedGetExtensionBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedGetExtensionHandlers.onGetRequest({
    requestId: 94,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      extensions: {
        prf: { eval: { first: 'Zmlyc3Qtc2FsdC0xMjM0NTY' } }
      }
    })
  }, { origin: 'https://example.com' }),
  isUnsupportedExtensionError,
  'get bridge helper should reject unsupported WebAuthn extensions before calling KeePass'
);
assert.deepEqual(unsupportedGetExtensionBridgeCalls, [],
  'bridge helper must not call backend get passkey methods when requested extensions are unsupported');

const invalidUserHandleBridgeCalls = [];
const invalidUserHandleHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    invalidUserHandleBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => invalidUserHandleHandlers.onCreateRequest({
    requestId: 88,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: '', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg'
    }))
  }, { origin: 'https://example.com' }),
  isInvalidUserHandleError,
  'create bridge helper should reject invalid user handles before calling KeePass'
);
assert.deepEqual(invalidUserHandleBridgeCalls, [],
  'bridge helper must not call backend passkey methods when user handle is invalid');

const invalidExcludeCredentialBridgeCalls = [];
const invalidExcludeCredentialHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    invalidExcludeCredentialBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => invalidExcludeCredentialHandlers.onCreateRequest({
    requestId: 89,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      excludeCredentials: [{ id: 'not@base64url', type: 'public-key' }]
    }))
  }, { origin: 'https://example.com' }),
  isInvalidExcludeCredentialError,
  'create bridge helper should reject invalid excludeCredentials before calling KeePass'
);
assert.deepEqual(invalidExcludeCredentialBridgeCalls, [],
  'bridge helper must not call backend passkey methods when excludeCredentials is invalid');

const unsupportedExcludeCredentialTypeBridgeCalls = [];
const unsupportedExcludeCredentialTypeHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedExcludeCredentialTypeBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedExcludeCredentialTypeHandlers.onCreateRequest({
    requestId: 92,
    requestDetailsJson: JSON.stringify(createOptions({
      rp: { id: 'example.com' },
      user: { id: 'dXNlcg', name: 'alice@example.com' },
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      excludeCredentials: [{ id: 'ZXhjbHVkZS0x', type: 'future-public-key' }]
    }))
  }, { origin: 'https://example.com' }),
  isInvalidExcludeCredentialError,
  'create bridge helper should reject unsupported excludeCredentials descriptor types before calling KeePass'
);
assert.deepEqual(unsupportedExcludeCredentialTypeBridgeCalls, [],
  'bridge helper must not call backend passkey methods when excludeCredentials descriptor type is unsupported');

const invalidChallengeBridgeCalls = [];
const invalidChallengeHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    invalidChallengeBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => invalidChallengeHandlers.onGetRequest({
    requestId: 90,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'c2hvcnQ'
    })
  }, { origin: 'https://example.com' }),
  isInvalidChallengeError,
  'get bridge helper should reject invalid challenges before calling KeePass'
);
assert.deepEqual(invalidChallengeBridgeCalls, [],
  'bridge helper must not call backend passkey methods when challenge is invalid');

const invalidAllowCredentialBridgeCalls = [];
const invalidAllowCredentialHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    invalidAllowCredentialBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => invalidAllowCredentialHandlers.onGetRequest({
    requestId: 91,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      allowCredentials: [{ id: 'not@base64url', type: 'public-key' }]
    })
  }, { origin: 'https://example.com' }),
  isInvalidAllowCredentialError,
  'get bridge helper should reject invalid allowCredentials before calling KeePass'
);
assert.deepEqual(invalidAllowCredentialBridgeCalls, [],
  'bridge helper must not call backend passkey methods when allowCredentials is invalid');

const unsupportedAllowCredentialTypeBridgeCalls = [];
const unsupportedAllowCredentialTypeHandlers = api.createBridgeRequestHandlers({
  bridgeCall: async (method, payload) => {
    unsupportedAllowCredentialTypeBridgeCalls.push([method, payload]);
    return { PendingApproval: true };
  }
});
await assert.rejects(
  () => unsupportedAllowCredentialTypeHandlers.onGetRequest({
    requestId: 93,
    requestDetailsJson: JSON.stringify({
      rpId: 'example.com',
      challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
      allowCredentials: [{ id: 'Y3JlZC0x', type: 'future-public-key' }]
    })
  }, { origin: 'https://example.com' }),
  isInvalidAllowCredentialError,
  'get bridge helper should reject unsupported allowCredentials descriptor types before calling KeePass'
);
assert.deepEqual(unsupportedAllowCredentialTypeBridgeCalls, [],
  'bridge helper must not call backend passkey methods when allowCredentials descriptor type is unsupported');

await api.completeCreateError(chromeApi, 42, { name: 'NotAllowedError', message: 'Denied' });
await api.completeGetError(chromeApi, 43, 'Bridge unavailable');
await api.completeCreateSuccess(chromeApi, 45, {
  Credential: { CredentialId: 'Y3JlZC00NQ' },
  ClientDataJson: 'Y2xpZW50LWNyZWF0ZQ',
  AttestationObject: 'YXR0ZXN0YXRpb24',
  AuthenticatorData: 'YXV0aC1jcmVhdGU',
  PublicKey: 'c3BraS1wdWJsaWMta2V5',
  PublicKeyCose: 'cHVibGljLWtleS1jb3Nl',
  AuthenticatorAttachment: 'cross-platform',
  ClientExtensionResults: {
    CredProps: {
      Rk: true
    }
  },
  Transports: ['internal', 'usb']
});
await api.completeGetSuccess(chromeApi, 46, {
  AuthenticatorAttachment: 'cross-platform',
  Assertion: {
    CredentialId: 'Y3JlZC00Ng',
    AuthenticatorData: 'YXV0aC1kYXRh',
    ClientDataJson: 'Y2xpZW50LWdldA',
    Signature: 'c2lnbmF0dXJl',
    UserHandle: 'dXNlcg'
  }
});
await api.completeIsUvpaa(chromeApi, 47, { isUvpaa: false });

const createSuccessJson = JSON.parse(calls[2][1].responseJson);
const getSuccessJson = JSON.parse(calls[3][1].responseJson);
assert.deepEqual(createSuccessJson, {
  id: 'Y3JlZC00NQ',
  rawId: 'Y3JlZC00NQ',
  type: 'public-key',
  authenticatorAttachment: 'cross-platform',
  response: {
    clientDataJSON: 'Y2xpZW50LWNyZWF0ZQ',
    attestationObject: 'YXR0ZXN0YXRpb24',
    authenticatorData: 'YXV0aC1jcmVhdGU',
    publicKey: 'c3BraS1wdWJsaWMta2V5',
    publicKeyAlgorithm: -7,
    transports: ['internal', 'usb']
  },
  clientExtensionResults: {
    credProps: {
      rk: true
    }
  }
}, 'create success should serialize a PublicKeyCredential.toJSON-like response');
assert.deepEqual(getSuccessJson, {
  id: 'Y3JlZC00Ng',
  rawId: 'Y3JlZC00Ng',
  type: 'public-key',
  authenticatorAttachment: 'cross-platform',
  response: {
    authenticatorData: 'YXV0aC1kYXRh',
    clientDataJSON: 'Y2xpZW50LWdldA',
    signature: 'c2lnbmF0dXJl',
    userHandle: 'dXNlcg'
  },
  clientExtensionResults: {}
}, 'get success should serialize a PublicKeyCredential.toJSON-like response');

assert.deepEqual(plain(calls.slice(0, 2)), [
  ['create', { requestId: 42, error: { name: 'NotAllowedError', message: 'Denied' } }],
  ['get', { requestId: 43, error: { name: 'NotAllowedError', message: 'Bridge unavailable' } }]
], 'error completion should call the matching Chrome completion APIs');
assert.deepEqual(plain(calls[4]), ['isUvpaa', { requestId: 47, isUvpaa: false }],
  'UVPAA completion should call the Chrome completion API with an explicit boolean');

const noOriginCalls = [];
const noOriginCreateEvent = makeEvent();
const noOriginGetEvent = makeEvent();
const noOriginIsUvpaaEvent = makeEvent();
const noOriginCancelEvent = makeEvent();
let noOriginHandlerCalled = false;
const noOriginLifecycle = api.createLifecycle({
  chromeLike: {
    webAuthenticationProxy: {
      attach: async () => noOriginCalls.push(['attach']),
      detach: async () => noOriginCalls.push(['detach']),
      completeCreateRequest: async (details) => noOriginCalls.push(['createComplete', details]),
      completeGetRequest: async (details) => noOriginCalls.push(['getComplete', details]),
      completeIsUvpaaRequest: async (details) => noOriginCalls.push(['isUvpaaComplete', details]),
      onCreateRequest: noOriginCreateEvent,
      onGetRequest: noOriginGetEvent,
      onIsUvpaaRequest: noOriginIsUvpaaEvent,
      onRequestCanceled: noOriginCancelEvent
    }
  },
  onCreateRequest: async () => {
    noOriginHandlerCalled = true;
  }
});
await noOriginLifecycle.attach();
await noOriginCreateEvent.dispatch({
  requestId: 70,
  requestDetailsJson: JSON.stringify(createOptions({ rp: { id: 'example.com' }, user: { id: 'dXNlcg', name: 'alice' }, challenge: 'MDEyMzQ1Njc4OWFiY2RlZg' }))
});
assert.equal(noOriginHandlerCalled, false, 'lifecycle should not call create handler without trusted origin resolver');
assert.deepEqual(plain(noOriginCalls.find((entry) => entry[0] === 'createComplete')), [
  'createComplete',
  { requestId: 70, error: { name: 'NotAllowedError', message: api.missingOriginMessage } }
], 'lifecycle should complete missing-origin create requests with a WebAuthn error');
await noOriginLifecycle.detach();

const invalidRpCalls = [];
const invalidRpCreateEvent = makeEvent();
const invalidRpLifecycle = api.createLifecycle({
  chromeLike: {
    webAuthenticationProxy: {
      attach: async () => invalidRpCalls.push(['attach']),
      detach: async () => invalidRpCalls.push(['detach']),
      completeCreateRequest: async (details) => invalidRpCalls.push(['createComplete', details]),
      completeGetRequest: async (details) => invalidRpCalls.push(['getComplete', details]),
      completeIsUvpaaRequest: async (details) => invalidRpCalls.push(['isUvpaaComplete', details]),
      onCreateRequest: invalidRpCreateEvent,
      onGetRequest: makeEvent(),
      onIsUvpaaRequest: makeEvent(),
      onRequestCanceled: makeEvent()
    }
  },
  resolveTrustedOrigin: async () => 'https://evil-example.com',
  onCreateRequest: async () => {
    throw new Error('invalid RP ID request should not reach create handler');
  }
});
await invalidRpLifecycle.attach();
await invalidRpCreateEvent.dispatch({
  requestId: 71,
  requestDetailsJson: JSON.stringify(createOptions({ rp: { id: 'example.com' }, user: { id: 'dXNlcg', name: 'alice' }, challenge: 'MDEyMzQ1Njc4OWFiY2RlZg' }))
});
assert.deepEqual(plain(invalidRpCalls.find((entry) => entry[0] === 'createComplete')), [
  'createComplete',
  { requestId: 71, error: { name: 'NotAllowedError', message: 'Passkey RP ID is not valid for the trusted caller origin.' } }
], 'lifecycle should reject create requests whose RP ID does not match the trusted origin before calling handlers');
await invalidRpLifecycle.detach();

const invalidGetRpCalls = [];
const invalidGetRpEvent = makeEvent();
const invalidGetRpLifecycle = api.createLifecycle({
  chromeLike: {
    webAuthenticationProxy: {
      attach: async () => invalidGetRpCalls.push(['attach']),
      detach: async () => invalidGetRpCalls.push(['detach']),
      completeCreateRequest: async (details) => invalidGetRpCalls.push(['createComplete', details]),
      completeGetRequest: async (details) => invalidGetRpCalls.push(['getComplete', details]),
      completeIsUvpaaRequest: async (details) => invalidGetRpCalls.push(['isUvpaaComplete', details]),
      onCreateRequest: makeEvent(),
      onGetRequest: invalidGetRpEvent,
      onIsUvpaaRequest: makeEvent(),
      onRequestCanceled: makeEvent()
    }
  },
  resolveTrustedOrigin: async () => 'https://evil-example.com',
  onGetRequest: async () => {
    throw new Error('invalid RP ID request should not reach get handler');
  }
});
await invalidGetRpLifecycle.attach();
await invalidGetRpEvent.dispatch({
  requestId: 72,
  requestDetailsJson: JSON.stringify({ rpId: 'example.com', challenge: 'MDEyMzQ1Njc4OWFiY2RlZg', allowCredentials: [{ id: 'Y3JlZA' }] })
});
assert.deepEqual(plain(invalidGetRpCalls.find((entry) => entry[0] === 'getComplete')), [
  'getComplete',
  { requestId: 72, error: { name: 'NotAllowedError', message: 'Passkey RP ID is not valid for the trusted caller origin.' } }
], 'lifecycle should reject get requests whose RP ID does not match the trusted origin before calling handlers');
await invalidGetRpLifecycle.detach();

const requiredUvLifecycleCalls = [];
const requiredUvCreateEvent = makeEvent();
let requiredUvHandlerCalled = false;
const requiredUvLifecycle = api.createLifecycle({
  chromeLike: {
    webAuthenticationProxy: {
      attach: async () => requiredUvLifecycleCalls.push(['attach']),
      detach: async () => requiredUvLifecycleCalls.push(['detach']),
      completeCreateRequest: async (details) => requiredUvLifecycleCalls.push(['createComplete', details]),
      completeGetRequest: async (details) => requiredUvLifecycleCalls.push(['getComplete', details]),
      completeIsUvpaaRequest: async (details) => requiredUvLifecycleCalls.push(['isUvpaaComplete', details]),
      onCreateRequest: requiredUvCreateEvent,
      onGetRequest: makeEvent(),
      onIsUvpaaRequest: makeEvent(),
      onRequestCanceled: makeEvent()
    }
  },
  resolveTrustedOrigin: async () => 'https://example.com',
  onCreateRequest: async () => {
    requiredUvHandlerCalled = true;
  }
});
await requiredUvLifecycle.attach();
await requiredUvCreateEvent.dispatch({
  requestId: 73,
  requestDetailsJson: JSON.stringify(createOptions({
    rp: { id: 'example.com' },
    user: { id: 'dXNlcg', name: 'alice' },
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
    authenticatorSelection: {
      userVerification: 'required'
    }
  }))
});
assert.equal(requiredUvHandlerCalled, false,
  'lifecycle should not call create handlers for unsupported user verification requests');
assert.equal(requiredUvLifecycle.pendingCount(), 0,
  'lifecycle should remove unsupported user verification requests from pending state after completing the error');
assert.deepEqual(plain(requiredUvLifecycleCalls.find((entry) => entry[0] === 'createComplete')), [
  'createComplete',
  { requestId: 73, error: { name: 'NotAllowedError', message: 'Passkey user verification is not supported by this build.' } }
], 'lifecycle should reject required user verification before calling handlers');
await requiredUvLifecycle.detach();

const lifecycleCalls = [];
const lifecycleCreateEvent = makeEvent();
const lifecycleGetEvent = makeEvent();
const lifecycleIsUvpaaEvent = makeEvent();
const lifecycleCancelEvent = makeEvent();
const lifecycleTimers = makeTimerApi();
const lifecycleChrome = {
  webAuthenticationProxy: {
    attach: async () => lifecycleCalls.push(['attach']),
    detach: async () => lifecycleCalls.push(['detach']),
    completeCreateRequest: async (details) => lifecycleCalls.push(['createComplete', details]),
    completeGetRequest: async (details) => lifecycleCalls.push(['getComplete', details]),
    completeIsUvpaaRequest: async (details) => lifecycleCalls.push(['isUvpaaComplete', details]),
    onCreateRequest: lifecycleCreateEvent,
    onGetRequest: lifecycleGetEvent,
    onIsUvpaaRequest: lifecycleIsUvpaaEvent,
    onRequestCanceled: lifecycleCancelEvent
  }
};
let releaseGetHandler;
let lifecycleGetHandlerCalls = 0;
const canceled = [];
const lifecycle = api.createLifecycle({
  chromeLike: lifecycleChrome,
  setTimeout: lifecycleTimers.setTimeout,
  clearTimeout: lifecycleTimers.clearTimeout,
  resolveTrustedOrigin: async (requestInfo, context) => {
    assert.equal(typeof requestInfo.requestId, 'number', 'resolver should receive Chrome request info');
    assert.equal(['create', 'get'].includes(context.kind), true, 'resolver should receive request kind');
    return 'https://example.com';
  },
  onCreateRequest: async (requestInfo, context) => {
    assert.equal(context.origin, 'https://example.com', 'create handler should receive trusted origin context');
    assert.equal(api.normalizeCreateRequest(requestInfo, context).Origin, 'https://example.com',
      'create handler should be able to normalize with resolved origin context');
    return {
      Credential: { CredentialId: 'Y3JlZC03Nw' },
      ClientDataJson: 'Y2xpZW50',
      AttestationObject: 'YXR0ZXN0'
    };
  },
  onGetRequest: async (requestInfo, context) => {
    lifecycleGetHandlerCalls += 1;
    assert.equal(context.origin, 'https://example.com', 'get handler should receive trusted origin context');
    assert.equal(api.normalizeGetRequest(requestInfo, context).Origin, 'https://example.com',
      'get handler should be able to normalize with resolved origin context');
    return new Promise((resolve) => {
      releaseGetHandler = resolve;
    });
  },
  onIsUvpaaRequest: async () => true,
  onRequestCanceled: (requestId, request, reason) => canceled.push([requestId, request && request.kind, reason])
});

await lifecycle.attach();
assert.equal(lifecycle.isAttached(), true, 'lifecycle attach should mark proxy attached');
assert.equal(lifecycleCreateEvent.listenerCount(), 1, 'lifecycle attach should register create listener');
assert.equal(lifecycleIsUvpaaEvent.listenerCount(), 1, 'lifecycle attach should register UVPAA listener');
await lifecycleIsUvpaaEvent.dispatch({ requestId: 76 });
assert.deepEqual(plain(lifecycleCalls.find((entry) => entry[0] === 'isUvpaaComplete')),
  ['isUvpaaComplete', { requestId: 76, isUvpaa: true }],
  'lifecycle should complete UVPAA requests through the configured handler');
await lifecycleCreateEvent.dispatch({
  requestId: 77,
  requestDetailsJson: JSON.stringify(createOptions({ rp: { id: 'example.com' }, user: { id: 'dXNlcg', name: 'alice' }, challenge: 'MDEyMzQ1Njc4OWFiY2RlZg' }))
});
assert.equal(lifecycle.pendingCount(), 0, 'create request should be completed and removed from pending state');

const getDispatch = lifecycleGetEvent.dispatch({
  requestId: 78,
  requestDetailsJson: JSON.stringify({ rpId: 'example.com', challenge: 'MDEyMzQ1Njc4OWFiY2RlZg' })
});
await flushPromises();
assert.equal(lifecycle.pendingCount(), 1, 'in-flight get request should be tracked');
await lifecycleCancelEvent.dispatch(78);
assert.deepEqual(canceled, [['78', 'get', 'canceled']], 'cancellation should report the canceled request kind and reason');
releaseGetHandler({
  Assertion: {
    CredentialId: 'Y3JlZC03OA',
    AuthenticatorData: 'YXV0aA',
    ClientDataJson: 'Y2xpZW50',
    Signature: 'c2ln'
  }
});
await getDispatch;
assert.equal(lifecycleCalls.some((entry) => entry[0] === 'getComplete'), false, 'canceled get request must not be completed');

const lockDispatch = lifecycleGetEvent.dispatch({
  requestId: 79,
  requestDetailsJson: JSON.stringify({ rpId: 'example.com', challenge: 'MDEyMzQ1Njc4OWFiY2RlZg' })
});
await flushPromises();
assert.equal(lifecycle.pendingCount(), 1, 'in-flight get request should be tracked before lock cleanup');
const lockCancelResult = await lifecycle.cancelPending('lock');
assert.deepEqual(plain(lockCancelResult), { canceled: 1, reason: 'lock' },
  'explicit lifecycle cleanup should report canceled pending WebAuthn requests');
assert.deepEqual(canceled.at(-1), ['79', 'get', 'lock'],
  'explicit lifecycle cleanup should report lock as the cancellation reason');
releaseGetHandler({
  Assertion: {
    CredentialId: 'Y3JlZC03OQ',
    AuthenticatorData: 'YXV0aA',
    ClientDataJson: 'Y2xpZW50',
    Signature: 'c2ln'
  }
});
await lockDispatch;
assert.equal(lifecycleCalls.some((entry) => entry[0] === 'getComplete'), false,
  'lock-canceled get request must not be completed after the handler resolves');

const timeoutDispatch = lifecycleGetEvent.dispatch({
  requestId: 90,
  requestDetailsJson: JSON.stringify({
    rpId: 'example.com',
    challenge: 'MDEyMzQ1Njc4OWFiY2RlZg',
    timeout: 5
  })
});
await flushPromises();
assert.equal(lifecycle.pendingCount(), 1, 'in-flight get request should be tracked before timeout cleanup');
assert.equal(lifecycleTimers.lastDelay(), 5, 'lifecycle should schedule pending cleanup from the WebAuthn request timeout');
await lifecycleTimers.fireLast();
assert.equal(lifecycle.pendingCount(), 0, 'timed-out get request should be removed from pending state');
assert.deepEqual(canceled.at(-1), ['90', 'get', 'timeout'],
  'timeout cleanup should report timeout as the cancellation reason');
assert.deepEqual(plain(lifecycleCalls.filter((entry) => entry[0] === 'getComplete' && entry[1].requestId === 90)), [
  ['getComplete', { requestId: 90, error: { name: 'NotAllowedError', message: 'Passkey WebAuthn request timed out.' } }]
], 'lifecycle should complete timed-out WebAuthn requests with a WebAuthn error');
releaseGetHandler({
  Assertion: {
    CredentialId: 'Y3JlZC05MA',
    AuthenticatorData: 'YXV0aA',
    ClientDataJson: 'Y2xpZW50',
    Signature: 'c2ln'
  }
});
await timeoutDispatch;
assert.deepEqual(plain(lifecycleCalls.filter((entry) => entry[0] === 'getComplete' && entry[1].requestId === 90)), [
  ['getComplete', { requestId: 90, error: { name: 'NotAllowedError', message: 'Passkey WebAuthn request timed out.' } }]
], 'timed-out WebAuthn requests must not complete success after the handler resolves');

const duplicateDispatch = lifecycleGetEvent.dispatch({
  requestId: 80,
  requestDetailsJson: JSON.stringify({ rpId: 'example.com', challenge: 'MDEyMzQ1Njc4OWFiY2RlZg' })
});
await flushPromises();
assert.equal(lifecycle.pendingCount(), 1, 'first duplicate-check request should be tracked while handler is pending');
const getHandlerCallsBeforeDuplicate = lifecycleGetHandlerCalls;
await lifecycleGetEvent.dispatch({
  requestId: 80,
  requestDetailsJson: JSON.stringify({ rpId: 'example.com', challenge: 'MDEyMzQ1Njc4OWFiY2RlZg' })
});
assert.equal(lifecycleGetHandlerCalls, getHandlerCallsBeforeDuplicate,
  'lifecycle should not call get handlers for duplicate pending WebAuthn request IDs');
assert.equal(lifecycle.pendingCount(), 0,
  'lifecycle should clear duplicate pending WebAuthn request IDs instead of overwriting pending state');
assert.deepEqual(canceled.at(-1), ['80', 'get', 'duplicate'],
  'duplicate WebAuthn request IDs should cancel the ambiguous pending request');
assert.deepEqual(plain(lifecycleCalls.filter((entry) => entry[0] === 'getComplete' && entry[1].requestId === 80)), [
  ['getComplete', { requestId: 80, error: { name: 'NotAllowedError', message: 'A pending passkey request already exists for this WebAuthn request.' } }]
], 'lifecycle should complete duplicate pending WebAuthn request IDs with a WebAuthn error');
releaseGetHandler({
  Assertion: {
    CredentialId: 'Y3JlZC04MA',
    AuthenticatorData: 'YXV0aA',
    ClientDataJson: 'Y2xpZW50',
    Signature: 'c2ln'
  }
});
await duplicateDispatch;
assert.deepEqual(plain(lifecycleCalls.filter((entry) => entry[0] === 'getComplete' && entry[1].requestId === 80)), [
  ['getComplete', { requestId: 80, error: { name: 'NotAllowedError', message: 'A pending passkey request already exists for this WebAuthn request.' } }]
], 'duplicate-canceled WebAuthn requests must not complete success after the original handler resolves');
await lifecycle.detach();
assert.equal(lifecycle.isAttached(), false, 'lifecycle detach should mark proxy detached');
assert.equal(lifecycleCreateEvent.listenerCount(), 0, 'lifecycle detach should remove create listener');

console.log('Passkey proxy experiment tests passed.');

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

function createOptions(options) {
  return {
    ...options,
    pubKeyCredParams: Object.prototype.hasOwnProperty.call(options, 'pubKeyCredParams')
      ? options.pubKeyCredParams
      : [{ type: 'public-key', alg: -7 }]
  };
}

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function makeTimerApi() {
  const timers = [];
  return {
    setTimeout(callback, delay) {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimeout(timer) {
      if (timer) timer.cleared = true;
    },
    lastDelay() {
      return timers.length ? timers[timers.length - 1].delay : undefined;
    },
    async fireLast() {
      const timer = timers[timers.length - 1];
      assert.ok(timer, 'expected a pending timer');
      if (!timer.cleared) {
        timer.cleared = true;
        timer.callback();
        await flushPromises();
      }
    }
  };
}

function isUnsupportedUserVerificationError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey user verification is not supported by this build.');
}

function isUnsupportedAlgorithmError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey ES256 public-key credential algorithm is not allowed by this request.');
}

function isUnsupportedAttestationError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey attestation conveyance is not supported by this build.');
}

function isUnsupportedAuthenticatorAttachmentError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey authenticator attachment is not supported by this build.');
}

function isUnsupportedResidentKeyError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey resident-key requirement is not supported by this build.');
}

function isUnsupportedExtensionError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey requested WebAuthn extension is not supported by this build.');
}

function isInvalidUserHandleError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'WebAuthn user handle must be base64url-encoded and between 1 and 64 bytes.');
}

function isInvalidExcludeCredentialError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey excludeCredentials contains an invalid credential ID.');
}

function isInvalidChallengeError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'WebAuthn challenge must be base64url-encoded and at least 16 bytes.');
}

function isInvalidAllowCredentialError(error) {
  return Boolean(error &&
    error.name === 'NotAllowedError' &&
    error.message === 'Passkey allowCredentials contains an invalid credential ID.');
}

function makeEvent() {
  const listeners = [];
  return {
    addListener(listener) {
      listeners.push(listener);
    },
    removeListener(listener) {
      const index = listeners.indexOf(listener);
      if (index >= 0) listeners.splice(index, 1);
    },
    listenerCount() {
      return listeners.length;
    },
    async dispatch(...args) {
      await Promise.all([...listeners].map((listener) => listener(...args)));
    }
  };
}
