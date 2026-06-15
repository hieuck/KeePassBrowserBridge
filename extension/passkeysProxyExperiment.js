/* global chrome */
(function (globalScope) {
  'use strict';

  const missingOriginMessage =
    'Chrome webAuthenticationProxy requestInfo does not expose caller origin; supply a trusted origin before forwarding to KeePass.';
  const duplicatePendingRequestMessage =
    'A pending passkey request already exists for this WebAuthn request.';
  const requestTimeoutMessage =
    'Passkey WebAuthn request timed out.';
  const requestCanceledMessage =
    'Passkey WebAuthn request was canceled.';
  const beginResponseMismatchMessage =
    'Passkey begin response did not match the WebAuthn request.';
  const completeResponseMismatchMessage =
    'Passkey complete response did not match the WebAuthn request.';
  const missingCompleteResponseFieldsMessage =
    'Passkey complete response was missing required WebAuthn fields.';
  const credentialIdFieldsMismatchMessage =
    'Passkey complete response credential ID fields did not match.';
  const credentialTypeMismatchMessage =
    'Passkey complete response credential type was not public-key.';
  const selectedCredentialNotReturnedMessage =
    'Selected passkey credential was not returned by KeePass.';
  const unsupportedUserVerificationMessage =
    'Passkey user verification is not supported by this build.';
  const unsupportedAlgorithmMessage =
    'Passkey ES256 public-key credential algorithm is not allowed by this request.';
  const unsupportedAttestationMessage =
    'Passkey attestation conveyance is not supported by this build.';
  const unsupportedAuthenticatorAttachmentMessage =
    'Passkey authenticator attachment is not supported by this build.';
  const unsupportedResidentKeyMessage =
    'Passkey resident-key requirement is not supported by this build.';
  const unsupportedExtensionMessage =
    'Passkey requested WebAuthn extension is not supported by this build.';
  const invalidUserHandleMessage =
    'WebAuthn user handle must be base64url-encoded and between 1 and 64 bytes.';
  const invalidChallengeMessage =
    'WebAuthn challenge must be base64url-encoded and at least 16 bytes.';
  const invalidExcludeCredentialMessage =
    'Passkey excludeCredentials contains an invalid credential ID.';
  const invalidAllowCredentialMessage =
    'Passkey allowCredentials contains an invalid credential ID.';

  function getApi(chromeLike = globalScope.chrome) {
    return chromeLike && chromeLike.webAuthenticationProxy ? chromeLike.webAuthenticationProxy : null;
  }

  function isAvailable(chromeLike = globalScope.chrome) {
    const api = getApi(chromeLike);
    return Boolean(
      api &&
      typeof api.attach === 'function' &&
      typeof api.detach === 'function' &&
      typeof api.completeCreateRequest === 'function' &&
      typeof api.completeGetRequest === 'function' &&
      typeof api.completeIsUvpaaRequest === 'function' &&
      api.onCreateRequest &&
      typeof api.onCreateRequest.addListener === 'function' &&
      api.onGetRequest &&
      typeof api.onGetRequest.addListener === 'function' &&
      api.onIsUvpaaRequest &&
      typeof api.onIsUvpaaRequest.addListener === 'function' &&
      api.onRequestCanceled &&
      typeof api.onRequestCanceled.addListener === 'function'
    );
  }

  async function attach(chromeLike = globalScope.chrome) {
    if (!isAvailable(chromeLike)) {
      throw new Error('chrome.webAuthenticationProxy is not available.');
    }
    return getApi(chromeLike).attach();
  }

  async function detach(chromeLike = globalScope.chrome) {
    if (!isAvailable(chromeLike)) return undefined;
    return getApi(chromeLike).detach();
  }

  function createLifecycle(options = {}) {
    const chromeLike = options.chromeLike || globalScope.chrome;
    const setTimer = typeof options.setTimeout === 'function'
      ? options.setTimeout
      : (typeof globalScope.setTimeout === 'function' ? globalScope.setTimeout.bind(globalScope) : null);
    const clearTimer = typeof options.clearTimeout === 'function'
      ? options.clearTimeout
      : (typeof globalScope.clearTimeout === 'function' ? globalScope.clearTimeout.bind(globalScope) : null);
    const pending = new Map();
    const state = {
      attached: false,
      listeners: null
    };

    async function attachProxy() {
      if (!isAvailable(chromeLike)) {
        throw new Error('chrome.webAuthenticationProxy is not available.');
      }
      if (state.attached) {
        return { alreadyAttached: true, pendingCount: pending.size };
      }

      registerListeners();
      try {
        const result = await getApi(chromeLike).attach();
        state.attached = true;
        return result;
      } catch (error) {
        unregisterListeners();
        throw error;
      }
    }

    async function detachProxy() {
      const api = getApi(chromeLike);
      const wasAttached = state.attached;
      state.attached = false;
      await cancelPendingRequests('detach');
      unregisterListeners();
      if (wasAttached && api && typeof api.detach === 'function') {
        return api.detach();
      }
      return undefined;
    }

    async function cancelPendingRequests(reason = 'cancel') {
      const normalizedReason = stringValue(reason).trim() || 'cancel';
      const pendingRequests = Array.from(pending.entries());
      pending.clear();
      for (const [requestId, request] of pendingRequests) {
        clearPendingTimer(request);
        await notifyCanceled(requestId, request, normalizedReason);
        await completePendingErrorBestEffort(requestId, request, notAllowedError(requestCanceledMessage));
      }
      return {
        canceled: pendingRequests.length,
        reason: normalizedReason
      };
    }

    function registerListeners() {
      if (state.listeners) return;
      const api = getApi(chromeLike);
      state.listeners = {
        create: (requestInfo) => handleRequest('create', requestInfo),
        get: (requestInfo) => handleRequest('get', requestInfo),
        isUvpaa: (requestInfo) => handleIsUvpaaRequest(requestInfo),
        canceled: (requestId) => handleCanceled(requestId)
      };
      api.onCreateRequest.addListener(state.listeners.create);
      api.onGetRequest.addListener(state.listeners.get);
      api.onIsUvpaaRequest.addListener(state.listeners.isUvpaa);
      api.onRequestCanceled.addListener(state.listeners.canceled);
    }

    function unregisterListeners() {
      if (!state.listeners) return;
      const api = getApi(chromeLike);
      removeListener(api && api.onCreateRequest, state.listeners.create);
      removeListener(api && api.onGetRequest, state.listeners.get);
      removeListener(api && api.onIsUvpaaRequest, state.listeners.isUvpaa);
      removeListener(api && api.onRequestCanceled, state.listeners.canceled);
      state.listeners = null;
    }

    async function handleRequest(kind, requestInfo) {
      const requestId = String(requestInfo && requestInfo.requestId);
      if (pending.has(requestId)) {
        await rejectDuplicateRequest(kind, requestId);
        return;
      }

      const pendingRequest = { kind, requestInfo, timeoutId: null };
      pending.set(requestId, pendingRequest);
      scheduleRequestTimeout(requestId, pendingRequest);
      const context = requestContext(kind, requestId);

      try {
        context.origin = await resolveTrustedOrigin(requestInfo, context);
        if (!context.origin) {
          throw {
            name: 'NotAllowedError',
            message: missingOriginMessage
          };
        }
        assertRequestAllowedForTrustedOrigin(kind, requestInfo, context);

        const handler = kind === 'create' ? options.onCreateRequest : options.onGetRequest;
        if (typeof handler !== 'function') {
          throw new Error(`No WebAuthn ${kind} handler configured.`);
        }

        const response = await handler(requestInfo, context);
        if (response !== undefined && context.isPending()) {
          await context.completeSuccess(response);
        }
      } catch (error) {
        if (context.isPending()) {
          await context.completeError(error);
        }
      }
    }

    async function rejectDuplicateRequest(kind, requestId) {
      const existing = pending.get(requestId);
      pending.delete(requestId);
      clearPendingTimer(existing);
      await notifyCanceled(requestId, existing, 'duplicate');

      const completionKind = existing && existing.kind ? existing.kind : kind;
      const error = notAllowedError(duplicatePendingRequestMessage);
      if (completionKind === 'create') {
        return completeCreateError(chromeLike, requestId, error);
      }
      return completeGetError(chromeLike, requestId, error);
    }

    async function resolveTrustedOrigin(requestInfo, context) {
      if (typeof options.resolveTrustedOrigin !== 'function') return '';
      return stringValue(await options.resolveTrustedOrigin(requestInfo, {
        kind: context.kind,
        requestId: context.requestId
      })).trim();
    }

    async function handleIsUvpaaRequest(requestInfo) {
      const requestId = String(requestInfo && requestInfo.requestId);
      try {
        const result = typeof options.onIsUvpaaRequest === 'function'
          ? await options.onIsUvpaaRequest(requestInfo)
          : false;
        await completeIsUvpaa(chromeLike, requestId, result);
      } catch {
        await completeIsUvpaa(chromeLike, requestId, false);
      }
    }

    async function handleCanceled(requestId) {
      const key = String(requestId);
      const request = pending.get(key);
      pending.delete(key);
      clearPendingTimer(request);
      await notifyCanceled(key, request, 'canceled');
    }

    function scheduleRequestTimeout(requestId, request) {
      if (!setTimer) return;
      const timeoutMs = requestTimeoutMs(request && request.requestInfo);
      if (timeoutMs <= 0) return;
      request.timeoutId = setTimer(() => {
        handleTimedOut(requestId).catch(() => {});
      }, timeoutMs);
    }

    function clearPendingTimer(request) {
      if (!request || request.timeoutId === null || request.timeoutId === undefined || !clearTimer) return;
      clearTimer(request.timeoutId);
      request.timeoutId = null;
    }

    async function handleTimedOut(requestId) {
      const key = String(requestId);
      const request = pending.get(key);
      if (!request) return undefined;
      pending.delete(key);
      clearPendingTimer(request);
      await notifyCanceled(key, request, 'timeout');

      const error = notAllowedError(requestTimeoutMessage);
      if (request.kind === 'create') {
        return completeCreateError(chromeLike, key, error);
      }
      return completeGetError(chromeLike, key, error);
    }

    async function completePendingErrorBestEffort(requestId, request, error) {
      if (!request) return undefined;
      try {
        if (request.kind === 'create') {
          return await completeCreateError(chromeLike, requestId, error);
        }
        return await completeGetError(chromeLike, requestId, error);
      } catch {
        return undefined;
      }
    }

    async function notifyCanceled(requestId, request, reason) {
      if (typeof options.onRequestCanceled !== 'function') return;
      try {
        await options.onRequestCanceled(String(requestId), request, reason);
      } catch {
        // Browser cancellation must not leave the proxy attached or block detach.
      }
    }

    function requestContext(kind, requestId) {
      return {
        requestId,
        kind,
        isPending() {
          return pending.has(requestId);
        },
        async completeSuccess(response) {
          const request = pending.get(requestId);
          if (!request) return undefined;
          pending.delete(requestId);
          clearPendingTimer(request);
          if (kind === 'create') {
            return completeCreateSuccess(chromeLike, requestId, response);
          }
          return completeGetSuccess(chromeLike, requestId, response);
        },
        async completeError(error) {
          const request = pending.get(requestId);
          if (!request) return undefined;
          pending.delete(requestId);
          clearPendingTimer(request);
          if (kind === 'create') {
            return completeCreateError(chromeLike, requestId, error);
          }
          return completeGetError(chromeLike, requestId, error);
        }
      };
    }

    return {
      attach: attachProxy,
      detach: detachProxy,
      cancelPending: cancelPendingRequests,
      pendingCount() {
        return pending.size;
      },
      isAttached() {
        return state.attached;
      }
    };
  }

  function assertRequestAllowedForTrustedOrigin(kind, requestInfo, context) {
    if (kind === 'create') {
      normalizeCreateRequest(requestInfo, context);
      return;
    }
    normalizeGetRequest(requestInfo, context);
  }

  function parseRequestDetails(requestInfo) {
    if (!requestInfo || typeof requestInfo.requestDetailsJson !== 'string') {
      throw new Error('WebAuthn proxy request is missing requestDetailsJson.');
    }

    const details = JSON.parse(requestInfo.requestDetailsJson);
    return {
      requestId: String(requestInfo.requestId),
      details
    };
  }

  function requestTimeoutMs(requestInfo) {
    try {
      const parsed = parseRequestDetails(requestInfo);
      return normalizeTimeoutMs(parsed.details && parsed.details.timeout);
    } catch {
      return 0;
    }
  }

  function normalizeCreateRequest(requestInfo, context = {}) {
    const parsed = parseRequestDetails(requestInfo);
    const options = parsed.details || {};
    const origin = trustedOrigin(context);
    const user = options.user || {};
    const authenticatorSelection = options.authenticatorSelection || {};
    const rpId = normalizeRpId(options.rp && options.rp.id ? options.rp.id : rpIdFromOrigin(origin));
    assertRpIdAllowedForOrigin(rpId, origin);
    const userVerification = normalizeUserVerification(authenticatorSelection.userVerification);
    assertUserVerificationSupported(userVerification);
    const attestation = normalizeAttestationConveyance(options.attestation);
    assertAttestationSupported(attestation);
    const authenticatorAttachment = normalizeAuthenticatorAttachment(authenticatorSelection.authenticatorAttachment);
    assertAuthenticatorAttachmentSupported(authenticatorAttachment);
    const residentKey = normalizeResidentKey(authenticatorSelection);
    const credentialAlgorithms = normalizeCredentialAlgorithms(options.pubKeyCredParams);
    assertEs256CredentialAlgorithmAllowed(credentialAlgorithms);
    const challenge = normalizeChallenge(options.challenge);
    const userHandle = normalizeUserHandle(user.id);

    return {
      WebAuthnRequestId: parsed.requestId,
      RpId: rpId,
      Origin: origin,
      Challenge: challenge,
      UserHandle: userHandle,
      UserName: stringValue(user.name),
      UserDisplayName: stringValue(user.displayName),
      UserVerification: userVerification,
      TimeoutMs: normalizeTimeoutMs(options.timeout),
      Hints: normalizeHints(options.hints),
      Attestation: attestation,
      AuthenticatorAttachment: authenticatorAttachment,
      ResidentKey: residentKey,
      CredentialAlgorithms: credentialAlgorithms,
      ExcludeCredentialIds: normalizeExcludeCredentialIds(options.excludeCredentials),
      RequestedExtensions: normalizeRequestedExtensions(options.extensions),
      Transports: []
    };
  }

  function normalizeGetRequest(requestInfo, context = {}) {
    const parsed = parseRequestDetails(requestInfo);
    const options = parsed.details || {};
    const origin = trustedOrigin(context);
    const rpId = normalizeRpId(options.rpId || rpIdFromOrigin(origin));
    assertRpIdAllowedForOrigin(rpId, origin);
    const userVerification = normalizeUserVerification(options.userVerification);
    assertUserVerificationSupported(userVerification);
    const challenge = normalizeChallenge(options.challenge);
    assertNoUnsupportedGetExtensions(options.extensions);

    return {
      WebAuthnRequestId: parsed.requestId,
      RpId: rpId,
      Origin: origin,
      Challenge: challenge,
      AllowCredentialIds: normalizeAllowCredentialIds(options.allowCredentials),
      UserVerification: userVerification,
      TimeoutMs: normalizeTimeoutMs(options.timeout),
      Hints: normalizeHints(options.hints)
    };
  }

  function createBridgeRequestHandlers(options = {}) {
    const bridgeCall = options.bridgeCall;
    if (typeof bridgeCall !== 'function') {
      throw new Error('Passkey bridge experiment requires a bridgeCall function.');
    }

    return {
      async onCreateRequest(requestInfo, context) {
        const payload = normalizeCreateRequest(requestInfo, context);
        const begin = await bridgeCall('passkeys.create.begin', payload);
        try {
          assertBeginMatchesRequest(payload, begin);
          if (typeof options.approveCreate === 'function') {
            const approved = await options.approveCreate({ payload, begin, context });
            if (!approved) throw notAllowedError('Passkey registration was denied.');
          }

          const completePayload = {
            WebAuthnRequestId: payload.WebAuthnRequestId,
            RpId: payload.RpId,
            Origin: payload.Origin
          };
          const complete = await bridgeCall('passkeys.create.complete', completePayload);
          assertCreateCompleteMatchesRequest(completePayload, complete);
          return complete;
        } catch (error) {
          await cancelBridgeRequestBestEffort(bridgeCall, payload.WebAuthnRequestId);
          throw error;
        }
      },

      async onGetRequest(requestInfo, context) {
        const payload = normalizeGetRequest(requestInfo, context);
        const begin = await bridgeCall('passkeys.get.begin', payload);
        try {
          assertBeginMatchesRequest(payload, begin);
          const credentials = Array.isArray(begin && begin.Credentials) ? begin.Credentials : [];
          const selected = typeof options.chooseCredential === 'function'
            ? await options.chooseCredential({ payload, begin, credentials, context })
            : credentials[0];
          const credentialId = firstString(
            selected && selected.CredentialId,
            selected && selected.credentialId,
            selected && selected.id,
            selected && selected.rawId
          );
          if (!credentialId) throw notAllowedError('No matching passkey was selected.');
          if (!credentials.some((credential) => credentialIdFromSummary(credential) === credentialId)) {
            throw notAllowedError(selectedCredentialNotReturnedMessage);
          }

          const completePayload = {
            WebAuthnRequestId: payload.WebAuthnRequestId,
            RpId: payload.RpId,
            Origin: payload.Origin,
            CredentialId: credentialId
          };
          const complete = await bridgeCall('passkeys.get.complete', completePayload);
          assertGetCompleteMatchesRequest(completePayload, complete);
          return complete;
        } catch (error) {
          await cancelBridgeRequestBestEffort(bridgeCall, payload.WebAuthnRequestId);
          throw error;
        }
      },

      async onRequestCanceled(requestId) {
        return cancelBridgeRequest(bridgeCall, requestId);
      }
    };
  }

  function assertBeginMatchesRequest(payload, begin) {
    assertBeginFieldMatches(payload, begin, 'WebAuthnRequestId');
    assertBeginFieldMatches(payload, begin, 'RpId');
    assertBeginFieldMatches(payload, begin, 'Origin');
  }

  function assertBeginFieldMatches(payload, begin, fieldName) {
    const expected = stringValue(payload && payload[fieldName]).trim();
    const actual = stringValue(begin && begin[fieldName]).trim();
    if (!actual || actual !== expected) {
      throw notAllowedError(beginResponseMismatchMessage);
    }
  }

  function assertCreateCompleteMatchesRequest(payload, complete) {
    assertCompleteFieldMatches(payload, complete, 'WebAuthnRequestId');
    assertCompleteFieldMatches(payload, complete, 'RpId');
  }

  function assertGetCompleteMatchesRequest(payload, complete) {
    assertCompleteFieldMatches(payload, complete, 'WebAuthnRequestId');
    assertCompleteFieldMatches(payload, complete, 'RpId');
    assertCompleteFieldMatches(payload, complete, 'CredentialId');
  }

  function assertCompleteFieldMatches(payload, complete, fieldName) {
    const expected = stringValue(payload && payload[fieldName]).trim();
    const actual = stringValue(complete && complete[fieldName]).trim();
    if (!actual || actual !== expected) {
      throw notAllowedError(completeResponseMismatchMessage);
    }
  }

  function credentialIdFromSummary(credential) {
    return firstString(
      credential && credential.CredentialId,
      credential && credential.credentialId,
      credential && credential.id,
      credential && credential.rawId
    );
  }

  function createTrustedOriginResolver(options = {}) {
    const chromeLike = options.chromeLike || globalScope.chrome;
    return async function resolveTrustedOrigin(requestInfo) {
      const directOrigin = trustedOriginFromRequestInfo(requestInfo);
      if (directOrigin) return directOrigin;
      return resolveFrameOrigin(chromeLike, requestInfo);
    };
  }

  function trustedOriginFromRequestInfo(requestInfo) {
    if (!requestInfo || typeof requestInfo !== 'object') return '';

    for (const field of ['origin', 'callerOrigin', 'sourceOrigin', 'documentOrigin', 'initiator']) {
      const origin = normalizeTrustedWebOrigin(requestInfo[field]);
      if (origin) return origin;
    }

    for (const field of ['url', 'documentUrl', 'frameUrl', 'pageUrl']) {
      const origin = originFromUrlString(requestInfo[field]);
      if (origin) return origin;
    }

    return '';
  }

  async function resolveFrameOrigin(chromeLike, requestInfo) {
    const webNavigation = chromeLike && chromeLike.webNavigation;
    if (!webNavigation || typeof webNavigation.getFrame !== 'function') return '';

    const tabId = integerValue(requestInfo && requestInfo.tabId);
    if (tabId < 0) return '';

    const frameId = integerValue(requestInfo && requestInfo.frameId);
    const details = {
      tabId,
      frameId: frameId >= 0 ? frameId : 0
    };

    try {
      const frame = await callChromeApi(webNavigation.getFrame.bind(webNavigation), details);
      return originFromUrlString(frame && frame.url);
    } catch {
      return '';
    }
  }

  function callChromeApi(fn, details) {
    return new Promise((resolve, reject) => {
      let callbackResolved = false;
      try {
        const result = fn(details, (value) => {
          callbackResolved = true;
          resolve(value);
        });
        if (result && typeof result.then === 'function') {
          result.then(resolve, reject);
        } else if (result !== undefined) {
          resolve(result);
        } else if (fn.length < 2 && !callbackResolved) {
          resolve(undefined);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  function normalizeTrustedWebOrigin(value) {
    const text = stringValue(value).trim();
    if (!text) return '';

    try {
      const url = new URL(text);
      return isAllowedWebOrigin(url) ? url.origin : '';
    } catch {
      return '';
    }
  }

  function originFromUrlString(value) {
    return normalizeTrustedWebOrigin(value);
  }

  function isAllowedWebOrigin(url) {
    if (!url || !url.hostname) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && isLoopbackHost(url.hostname);
  }

  function isLoopbackHost(hostname) {
    const host = stringValue(hostname).toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1';
  }

  function isRpIdAllowedForOrigin(rpId, origin) {
    const normalizedRpId = normalizeRpId(rpId);
    if (!isValidRpId(normalizedRpId)) return false;

    try {
      const url = new URL(stringValue(origin).trim());
      if (!isPotentiallyTrustworthyRpOrigin(url)) return false;
      const host = normalizeRpId(url.hostname);
      return host === normalizedRpId || host.endsWith(`.${normalizedRpId}`);
    } catch {
      return false;
    }
  }

  function assertRpIdAllowedForOrigin(rpId, origin) {
    if (isRpIdAllowedForOrigin(rpId, origin)) return;
    throw notAllowedError('Passkey RP ID is not valid for the trusted caller origin.');
  }

  function normalizeUserVerification(value) {
    return normalizeKnownOptionalEnum(value,
      ['required', 'preferred', 'discouraged'],
      unsupportedUserVerificationMessage);
  }

  function assertUserVerificationSupported(userVerification) {
    if (userVerification !== 'required') return;
    throw notAllowedError(unsupportedUserVerificationMessage);
  }

  function assertEs256CredentialAlgorithmAllowed(credentialAlgorithms) {
    if (Array.isArray(credentialAlgorithms) && credentialAlgorithms.includes(-7)) return;
    throw notAllowedError(unsupportedAlgorithmMessage);
  }

  function normalizeAttestationConveyance(value) {
    return normalizeKnownOptionalEnum(value,
      ['none', 'indirect', 'direct', 'enterprise'],
      unsupportedAttestationMessage);
  }

  function assertAttestationSupported(attestation) {
    if (!attestation || attestation === 'none') return;
    throw notAllowedError(unsupportedAttestationMessage);
  }

  function normalizeAuthenticatorAttachment(value) {
    return normalizeKnownOptionalEnum(value,
      ['platform', 'cross-platform'],
      unsupportedAuthenticatorAttachmentMessage);
  }

  function assertAuthenticatorAttachmentSupported(authenticatorAttachment) {
    if (!authenticatorAttachment || authenticatorAttachment === 'cross-platform') return;
    throw notAllowedError(unsupportedAuthenticatorAttachmentMessage);
  }

  function normalizeResidentKey(authenticatorSelection) {
    const residentKey = normalizeKnownOptionalEnum(authenticatorSelection && authenticatorSelection.residentKey,
      ['required', 'preferred', 'discouraged'],
      unsupportedResidentKeyMessage);
    if (residentKey) return residentKey;
    return authenticatorSelection && authenticatorSelection.requireResidentKey === true ? 'required' : '';
  }

  function normalizeUserHandle(value) {
    const text = stringValue(value);
    const byteLength = base64UrlByteLength(text);
    if (byteLength < 1 || byteLength > 64) {
      throw notAllowedError(invalidUserHandleMessage);
    }
    return text.replace(/=+$/g, '');
  }

  function normalizeChallenge(value) {
    const text = stringValue(value);
    if (base64UrlByteLength(text) < 16) {
      throw notAllowedError(invalidChallengeMessage);
    }
    return text.replace(/=+$/g, '');
  }

  function base64UrlByteLength(value) {
    const text = stringValue(value);
    if (!text || text !== text.trim()) return -1;
    if (!/^[A-Za-z0-9_-]+={0,2}$/.test(text)) return -1;
    const paddingStart = text.indexOf('=');
    if (paddingStart >= 0) {
      const paddingLength = text.length - paddingStart;
      if (text.length % 4 !== 0 || paddingLength < 1 || paddingLength > 2) return -1;
    }
    const unpadded = text.replace(/=+$/g, '');
    if (unpadded.length === 0 || unpadded.length % 4 === 1) return -1;
    const paddedLength = unpadded.length + ((4 - (unpadded.length % 4)) % 4);
    return (paddedLength / 4) * 3 - (paddedLength - unpadded.length);
  }

  function normalizeCredentialAlgorithms(pubKeyCredParams) {
    if (!Array.isArray(pubKeyCredParams)) return [];
    const algorithms = [];
    for (const value of pubKeyCredParams) {
      const algorithm = normalizeCredentialAlgorithm(value);
      if (algorithm === undefined || algorithms.includes(algorithm)) continue;
      algorithms.push(algorithm);
    }
    return algorithms;
  }

  function normalizeCredentialAlgorithm(value) {
    if (!value || typeof value !== 'object') return undefined;
    const type = stringValue(value.type).trim().toLowerCase();
    if (type !== 'public-key') return undefined;
    const algorithm = Number(value.alg);
    return Number.isInteger(algorithm) ? algorithm : undefined;
  }

  function normalizeKnownOptionalEnum(value, allowedValues, unsupportedMessage) {
    const text = stringValue(value).trim();
    if (!text) return '';
    const normalized = text.toLowerCase();
    if (allowedValues.includes(normalized)) return normalized;
    throw notAllowedError(unsupportedMessage);
  }

  function normalizeHints(hints) {
    if (!Array.isArray(hints)) return [];
    const normalizedHints = [];
    for (const value of hints) {
      const hint = stringValue(value).trim().toLowerCase();
      if (!['security-key', 'client-device', 'hybrid'].includes(hint)) continue;
      if (normalizedHints.includes(hint)) continue;
      normalizedHints.push(hint);
    }
    return normalizedHints;
  }

  function normalizeCredentialDescriptorIds(credentials) {
    return normalizeCredentialDescriptorIdsWithError(credentials, '');
  }

  function normalizeExcludeCredentialIds(credentials) {
    return normalizeCredentialDescriptorIdsWithError(credentials, invalidExcludeCredentialMessage);
  }

  function normalizeAllowCredentialIds(credentials) {
    return normalizeCredentialDescriptorIdsWithError(credentials, invalidAllowCredentialMessage);
  }

  function normalizeCredentialDescriptorIdsWithError(credentials, invalidMessage) {
    if (!Array.isArray(credentials)) return [];
    const ids = [];
    for (const credential of credentials) {
      const type = stringValue(credential && credential.type).trim().toLowerCase();
      if (type && type !== 'public-key') {
        if (invalidMessage) throw notAllowedError(invalidMessage);
        continue;
      }
      const id = normalizeCredentialId(credential && credential.id);
      if (!id && invalidMessage) throw notAllowedError(invalidMessage);
      if (!id || ids.includes(id)) continue;
      ids.push(id);
    }
    return ids;
  }

  function normalizeCredentialId(value) {
    const text = stringValue(value);
    if (base64UrlByteLength(text) < 1) return '';
    return text.replace(/=+$/g, '');
  }

  function rpIdFromOrigin(origin) {
    try {
      return normalizeRpId(new URL(stringValue(origin).trim()).hostname);
    } catch {
      return '';
    }
  }

  function normalizeRpId(value) {
    return stringValue(value).trim().replace(/\.+$/g, '').toLowerCase();
  }

  function isValidRpId(rpId) {
    if (!rpId || rpId.length > 253) return false;
    if (rpId.startsWith('.') || rpId.includes('..')) return false;
    if (/[\\/:@]/.test(rpId)) return false;
    if (isIpAddressLike(rpId)) return false;

    return rpId.split('.').every((label) =>
      label.length > 0 &&
      label.length <= 63 &&
      !label.startsWith('-') &&
      !label.endsWith('-')
    );
  }

  function isIpAddressLike(value) {
    const text = stringValue(value).trim().toLowerCase();
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(text)) return true;
    return text.includes(':');
  }

  function isPotentiallyTrustworthyRpOrigin(url) {
    if (!url || !url.hostname) return false;
    if (url.protocol === 'https:') return true;
    return url.protocol === 'http:' && normalizeRpId(url.hostname) === 'localhost';
  }

  function integerValue(value) {
    const parsed = Number(value);
    return Number.isInteger(parsed) ? parsed : -1;
  }

  async function cancelBridgeRequest(bridgeCall, requestId) {
    const webAuthnRequestId = stringValue(requestId).trim();
    if (!webAuthnRequestId) {
      return { WebAuthnRequestId: '', Cancelled: false };
    }

    return bridgeCall('passkeys.cancel', {
      WebAuthnRequestId: webAuthnRequestId
    });
  }

  async function cancelBridgeRequestBestEffort(bridgeCall, requestId) {
    try {
      return await cancelBridgeRequest(bridgeCall, requestId);
    } catch {
      return undefined;
    }
  }

  async function completeCreateError(chromeLike, requestId, error) {
    const api = getApi(chromeLike);
    if (!api || typeof api.completeCreateRequest !== 'function') {
      throw new Error('chrome.webAuthenticationProxy.completeCreateRequest is not available.');
    }
    return api.completeCreateRequest(errorDetails(requestId, error));
  }

  async function completeGetError(chromeLike, requestId, error) {
    const api = getApi(chromeLike);
    if (!api || typeof api.completeGetRequest !== 'function') {
      throw new Error('chrome.webAuthenticationProxy.completeGetRequest is not available.');
    }
    return api.completeGetRequest(errorDetails(requestId, error));
  }

  async function completeCreateSuccess(chromeLike, requestId, response) {
    const api = getApi(chromeLike);
    if (!api || typeof api.completeCreateRequest !== 'function') {
      throw new Error('chrome.webAuthenticationProxy.completeCreateRequest is not available.');
    }
    let responseJson;
    try {
      responseJson = createResponseJson(response);
    } catch (error) {
      return completeCreateError(chromeLike, requestId, error);
    }
    return api.completeCreateRequest(successDetails(requestId, responseJson));
  }

  async function completeGetSuccess(chromeLike, requestId, response) {
    const api = getApi(chromeLike);
    if (!api || typeof api.completeGetRequest !== 'function') {
      throw new Error('chrome.webAuthenticationProxy.completeGetRequest is not available.');
    }
    let responseJson;
    try {
      responseJson = getResponseJson(response);
    } catch (error) {
      return completeGetError(chromeLike, requestId, error);
    }
    return api.completeGetRequest(successDetails(requestId, responseJson));
  }

  async function completeIsUvpaa(chromeLike, requestId, result) {
    const api = getApi(chromeLike);
    if (!api || typeof api.completeIsUvpaaRequest !== 'function') {
      throw new Error('chrome.webAuthenticationProxy.completeIsUvpaaRequest is not available.');
    }
    return api.completeIsUvpaaRequest({
      requestId: Number(requestId),
      isUvpaa: normalizeIsUvpaaResult(result)
    });
  }

  function trustedOrigin(context) {
    const origin = stringValue(context && context.origin);
    if (!origin) throw new Error(missingOriginMessage);
    return origin;
  }

  function errorDetails(requestId, error) {
    const normalized = normalizeError(error);
    return {
      requestId: Number(requestId),
      error: normalized
    };
  }

  function successDetails(requestId, responseJson) {
    return {
      requestId: Number(requestId),
      responseJson
    };
  }

  function createResponseJson(response) {
    const responseJson = responseJsonString(response);
    if (responseJson) return validatedSerializedCreateResponseJson(responseJson);

    const credential = (response && (response.Credential || response.credential)) || {};
    const credentialId = firstString(
      response && response.CredentialId,
      response && response.credentialId,
      credential.CredentialId,
      credential.credentialId,
      response && response.id,
      response && response.rawId
    );
    const publicKey = firstString(
      response && response.PublicKey,
      response && response.publicKey,
      response && response.PublicKeySpki,
      response && response.publicKeySpki,
      credential.PublicKey,
      credential.publicKey,
      credential.PublicKeySpki,
      credential.publicKeySpki,
      response && response.PublicKeyCose,
      response && response.publicKeyCose,
      credential.PublicKeyCose,
      credential.publicKeyCose
    );
    const clientDataJson = firstString(response && response.ClientDataJson, response && response.clientDataJSON);
    const attestationObject = firstString(response && response.AttestationObject, response && response.attestationObject);
    const authenticatorData = firstString(
      response && response.AuthenticatorData,
      response && response.authenticatorData,
      credential.AuthenticatorData,
      credential.authenticatorData);
    assertRequiredCompleteFields(credentialId, clientDataJson, attestationObject);

    return JSON.stringify(compactObject({
      id: credentialId,
      rawId: credentialId,
      type: 'public-key',
      authenticatorAttachment: firstString(response && response.AuthenticatorAttachment, response && response.authenticatorAttachment),
      response: compactObject({
        clientDataJSON: clientDataJson,
        attestationObject,
        authenticatorData,
        publicKey,
        publicKeyAlgorithm: publicKey ? -7 : undefined,
        transports: normalizeStringArray(response && (response.Transports || response.transports || credential.Transports || credential.transports))
      }),
      clientExtensionResults: normalizeClientExtensionResults(
        response && (response.ClientExtensionResults || response.clientExtensionResults))
    }));
  }

  function getResponseJson(response) {
    const responseJson = responseJsonString(response);
    if (responseJson) return validatedSerializedGetResponseJson(responseJson);

    const assertion = response && (response.Assertion || response.assertion) || response || {};
    const credentialId = firstString(
      response && response.CredentialId,
      response && response.credentialId,
      assertion.CredentialId,
      assertion.credentialId,
      response && response.id,
      response && response.rawId
    );
    const authenticatorData = firstString(assertion.AuthenticatorData, assertion.authenticatorData);
    const clientDataJson = firstString(assertion.ClientDataJson, assertion.clientDataJSON);
    const signature = firstString(assertion.Signature, assertion.signature);
    assertRequiredCompleteFields(credentialId, authenticatorData, clientDataJson, signature);

    return JSON.stringify(compactObject({
      id: credentialId,
      rawId: credentialId,
      type: 'public-key',
      authenticatorAttachment: firstString(response && response.AuthenticatorAttachment, response && response.authenticatorAttachment),
      response: compactObject({
        authenticatorData,
        clientDataJSON: clientDataJson,
        signature,
        userHandle: firstString(assertion.UserHandle, assertion.userHandle)
      }),
      clientExtensionResults: normalizeClientExtensionResults(
        response && (response.ClientExtensionResults || response.clientExtensionResults))
    }));
  }

  function responseJsonString(response) {
    if (typeof response === 'string') return response;
    if (response && typeof response.responseJson === 'string') return response.responseJson;
    return '';
  }

  function validatedSerializedCreateResponseJson(responseJson) {
    const parsed = parseSerializedResponseJson(responseJson);
    const response = (parsed && parsed.response) || {};
    assertSerializedCredentialType(parsed);
    assertRequiredCompleteFields(
      serializedCredentialId(parsed),
      firstString(response.clientDataJSON, response.ClientDataJson),
      firstString(response.attestationObject, response.AttestationObject)
    );
    return responseJson;
  }

  function validatedSerializedGetResponseJson(responseJson) {
    const parsed = parseSerializedResponseJson(responseJson);
    const response = (parsed && parsed.response) || {};
    assertSerializedCredentialType(parsed);
    assertRequiredCompleteFields(
      serializedCredentialId(parsed),
      firstString(response.authenticatorData, response.AuthenticatorData),
      firstString(response.clientDataJSON, response.ClientDataJson),
      firstString(response.signature, response.Signature)
    );
    return responseJson;
  }

  function parseSerializedResponseJson(responseJson) {
    const text = stringValue(responseJson).trim();
    if (!text) throw notAllowedError(missingCompleteResponseFieldsMessage);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw notAllowedError(missingCompleteResponseFieldsMessage);
    }
    if (!parsed || typeof parsed !== 'object') {
      throw notAllowedError(missingCompleteResponseFieldsMessage);
    }
    return parsed;
  }

  function serializedCredentialId(parsed) {
    const id = stringValue(parsed && parsed.id).trim();
    const rawId = stringValue(parsed && parsed.rawId).trim();
    assertRequiredCompleteFields(id, rawId);
    if (id !== rawId) {
      throw notAllowedError(credentialIdFieldsMismatchMessage);
    }
    return id;
  }

  function assertSerializedCredentialType(parsed) {
    if (stringValue(parsed && parsed.type).trim() !== 'public-key') {
      throw notAllowedError(credentialTypeMismatchMessage);
    }
  }

  function assertRequiredCompleteFields(...values) {
    if (values.some((value) => !stringValue(value).trim())) {
      throw notAllowedError(missingCompleteResponseFieldsMessage);
    }
  }

  function normalizeError(error) {
    if (error && typeof error === 'object') {
      return {
        name: stringValue(error.name) || 'NotAllowedError',
        message: stringValue(error.message) || 'KeePass Browser Bridge could not complete the WebAuthn request.'
      };
    }

    return {
      name: 'NotAllowedError',
      message: stringValue(error) || 'KeePass Browser Bridge could not complete the WebAuthn request.'
    };
  }

  function notAllowedError(message) {
    return {
      name: 'NotAllowedError',
      message
    };
  }

  function normalizeIsUvpaaResult(result) {
    if (result && typeof result === 'object' && 'isUvpaa' in result) {
      return Boolean(result.isUvpaa);
    }
    return Boolean(result);
  }

  function normalizeRequestedExtensions(extensions) {
    if (!extensions || typeof extensions !== 'object') return undefined;
    const unsupportedExtensions = unsupportedRequestedExtensionNames(extensions);
    if (unsupportedExtensions.length > 0) {
      throw notAllowedError(unsupportedExtensionMessage);
    }
    return extensions.credProps === true ? { CredProps: true } : undefined;
  }

  function assertNoUnsupportedGetExtensions(extensions) {
    if (!extensions || typeof extensions !== 'object') return;
    if (unsupportedRequestedExtensionNames(extensions).length > 0 ||
        isRequestedExtensionValue(extensions.credProps)) {
      throw notAllowedError(unsupportedExtensionMessage);
    }
  }

  function unsupportedRequestedExtensionNames(extensions) {
    const unsupported = [];
    for (const [name, value] of Object.entries(extensions || {})) {
      if (name === 'credProps') continue;
      if (isRequestedExtensionValue(value)) unsupported.push(name);
    }
    return unsupported;
  }

  function isRequestedExtensionValue(value) {
    if (value === undefined || value === null || value === false) return false;
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  function normalizeClientExtensionResults(results) {
    if (!results || typeof results !== 'object') return {};
    const normalized = {};
    const credProps = results.credProps || results.CredProps;
    if (credProps && typeof credProps === 'object') {
      const rk = firstDefined(credProps.rk, credProps.Rk, credProps.residentKey, credProps.ResidentKey);
      if (rk !== undefined) {
        normalized.credProps = { rk: Boolean(rk) };
      }
    }
    return normalized;
  }

  function normalizeTimeoutMs(value) {
    const timeout = Number(value);
    return Number.isFinite(timeout) && timeout > 0 ? Math.floor(timeout) : 0;
  }

  function stringValue(value) {
    return value === undefined || value === null ? '' : String(value);
  }

  function firstString(...values) {
    for (const value of values) {
      const normalized = stringValue(value);
      if (normalized) return normalized;
    }
    return '';
  }

  function firstDefined(...values) {
    for (const value of values) {
      if (value !== undefined && value !== null) return value;
    }
    return undefined;
  }

  function normalizeStringArray(value) {
    if (!Array.isArray(value)) return undefined;
    const normalized = value.map((item) => stringValue(item)).filter(Boolean);
    return normalized.length ? normalized : undefined;
  }

  function compactObject(value) {
    const compacted = {};
    for (const [key, entry] of Object.entries(value || {})) {
      if (entry === undefined || entry === null || entry === '') continue;
      if (Array.isArray(entry) && entry.length === 0) continue;
      compacted[key] = entry;
    }
    return compacted;
  }

  function removeListener(event, listener) {
    if (event && typeof event.removeListener === 'function') {
      event.removeListener(listener);
    }
  }

  const api = {
    attach,
    detach,
    createLifecycle,
    isAvailable,
    normalizeCreateRequest,
    normalizeGetRequest,
    createBridgeRequestHandlers,
    createTrustedOriginResolver,
    isRpIdAllowedForOrigin,
    completeCreateSuccess,
    completeGetSuccess,
    completeIsUvpaa,
    completeCreateError,
    completeGetError,
    createResponseJson,
    getResponseJson,
    missingOriginMessage
  };

  globalScope.KeePassBrowserBridgePasskeysProxyExperiment = api;
  if (typeof module !== 'undefined') {
    module.exports = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
