'use strict';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:19455/bridge';
const PROTOCOL_VERSION = 1;
const CLIENT_NAME = 'Chrome';
const AUTO_FILL_DEBOUNCE_MS = 1200;
const PAIRING_SESSION_MAX_AGE_MS = 5 * 60 * 1000;
const PENDING_MULTI_STEP_MAX_AGE_MS = 10 * 60 * 1000;
const PENDING_MULTI_STEP_KEY = 'kbbPendingMultiStepCredential';
const PENDING_SUBMITTED_MAX_AGE_MS = 2 * 60 * 1000;
const PENDING_SUBMITTED_KEY = 'kbbPendingSubmittedCredential';
const HTTP_AUTH_MAX_ATTEMPTS = 2;
const DEFAULT_AUTO_FILL_ENABLED = true;
const DEFAULT_AUTO_SUBMIT_ENABLED = false;
const autoFillTimers = new Map();
const clipboardTimers = new Map();
const httpAuthAttempts = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab || !isFillableUrl(tab.url)) {
    return;
  }

  scheduleAutoFill(tabId, tab.url);
});

if (chrome.webRequest && chrome.webRequest.onAuthRequired) {
  chrome.webRequest.onAuthRequired.addListener(
    (details, callback) => {
      handleHttpAuthRequired(details)
        .then((credentials) => callback(credentials ? { authCredentials: credentials } : {}))
        .catch(() => callback({}));
    },
    { urls: ['http://*/*', 'https://*/*'] },
    ['asyncBlocking']
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  Promise.resolve()
    .then(() => assertAllowedSender(sender))
    .then(() => handleMessage(message))
    .then((response) => sendResponse({ ok: true, response }))
    .catch((error) => sendResponse({
      ok: false,
      error: error && error.message ? error.message : String(error)
    }));

  return true;
});

function assertAllowedSender(sender) {
  if (sender && sender.id && sender.id !== chrome.runtime.id) {
    throw new Error('Message sender is not allowed.');
  }
}

async function handleMessage(message) {
  switch (message && message.type) {
    case 'KBB_GET_STATE':
      return getState();
    case 'KBB_SAVE_ENDPOINT':
      return saveEndpoint(message.endpoint);
    case 'KBB_SET_AUTO_FILL':
      return setAutoFill(message.enabled);
    case 'KBB_SET_AUTO_SUBMIT':
      return setAutoSubmit(message.enabled);
    case 'KBB_HELLO':
      return bridgeCall('hello', {});
    case 'KBB_PAIR_BEGIN':
      return pairBegin();
    case 'KBB_PAIR_COMPLETE':
      return pairComplete(message.pairingCode);
    case 'KBB_PAIR_CANCEL':
      return pairCancel();
    case 'KBB_STATUS':
      return bridgeCall('client.status', {}, true);
    case 'KBB_LIST_CLIENTS':
      return listClients();
    case 'KBB_REVOKE_CLIENT':
      return revokeClient(message.clientId);
    case 'KBB_QUERY_LOGINS':
      return queryLogins();
    case 'KBB_QUERY_FOR_URL':
      return queryLoginsForUrl(message.url);
    case 'KBB_QUERY_HTTP_AUTH':
      return queryHttpAuth(message.url);
    case 'KBB_CREATE_LOGIN':
      return createLogin(message.login);
    case 'KBB_UPDATE_LOGIN':
      return updateLogin(message.login);
    case 'KBB_FILL_LOGIN':
      return fillLogin(message.credential);
    case 'KBB_FILL_ACK':
      return acknowledgeFill(message.entryId, message.url);
    case 'KBB_REMEMBER_PENDING_CREDENTIAL':
      return rememberPendingCredential(message.origin, message.credential);
    case 'KBB_CONSUME_PENDING_CREDENTIAL':
      return consumePendingCredential(message.origin);
    case 'KBB_REMEMBER_SUBMITTED_CREDENTIAL':
      return rememberSubmittedCredential(message.origin, message.credential);
    case 'KBB_CONSUME_SUBMITTED_CREDENTIAL':
      return consumeSubmittedCredential(message.origin);
    case 'KBB_COPY_TO_CLIPBOARD':
      return copyToClipboard(message.text, message.clearAfterMs);
    default:
      throw new Error('Unknown message type.');
  }
}

async function getState() {
  const state = await storageGet(['endpoint', 'clientId', 'pairingSessionId', 'pairingStartedAt', 'autoFillEnabled', 'autoSubmitEnabled']);
  const paired = Boolean(state.clientId);
  if (paired && state.pairingSessionId) {
    await clearPairingSession();
    state.pairingSessionId = '';
    state.pairingStartedAt = 0;
  }

  const pairingStartedAt = Number(state.pairingStartedAt || 0);
  if (!paired && state.pairingSessionId && pairingStartedAt &&
      Date.now() - pairingStartedAt > PAIRING_SESSION_MAX_AGE_MS) {
    await clearPairingSession();
    state.pairingSessionId = '';
    state.pairingStartedAt = 0;
  }

  const pairingActive = !paired && Boolean(state.pairingSessionId);
  return {
    endpoint: state.endpoint || DEFAULT_ENDPOINT,
    paired,
    clientId: state.clientId || '',
    pairingSessionId: pairingActive ? state.pairingSessionId : '',
    pairingExpiresAt: pairingActive && pairingStartedAt ? pairingStartedAt + PAIRING_SESSION_MAX_AGE_MS : 0,
    autoFillEnabled: booleanSetting(state.autoFillEnabled, DEFAULT_AUTO_FILL_ENABLED),
    autoSubmitEnabled: booleanSetting(state.autoSubmitEnabled, DEFAULT_AUTO_SUBMIT_ENABLED)
  };
}

function booleanSetting(value, defaultValue) {
  return typeof value === 'boolean' ? value : defaultValue;
}

async function saveEndpoint(endpoint) {
  const normalized = normalizeEndpoint(endpoint);
  await chrome.storage.local.set({ endpoint: normalized });
  return getState();
}

async function setAutoFill(enabled) {
  await chrome.storage.local.set({ autoFillEnabled: Boolean(enabled) });
  return getState();
}

async function setAutoSubmit(enabled) {
  await chrome.storage.local.set({ autoSubmitEnabled: Boolean(enabled) });
  return getState();
}

async function listClients() {
  const response = await bridgeCall('clients.list', {}, true);
  return parsePayload(response);
}

async function revokeClient(clientId) {
  const targetClientId = String(clientId || '').trim();
  if (!targetClientId) {
    throw new Error('Select a browser to revoke.');
  }

  const state = await storageGet(['clientId']);
  const response = await bridgeCall('clients.revoke', { ClientId: targetClientId }, true);
  const result = parsePayload(response);
  if (result.Revoked && state.clientId === targetClientId) {
    await chrome.storage.local.remove(['clientId', 'sharedSecret']);
    await clearPairingSession();
  }

  return result;
}

async function pairBegin() {
  const state = await storageGet(['pairingSessionId']);
  if (state.pairingSessionId) {
    try {
      await bridgeCall('pair.cancel', { PairingSessionId: state.pairingSessionId });
    } catch (error) {
      // A stale local session should not block starting a fresh pairing flow.
    }
  }

  const response = await bridgeCall('pair.begin', { ClientName: CLIENT_NAME });
  const payload = parsePayload(response);
  if (!payload.PairingSessionId) {
    throw new Error('KeePass did not return a pairing session.');
  }

  await chrome.storage.local.set({
    pairingSessionId: payload.PairingSessionId,
    pairingStartedAt: Date.now()
  });
  return getState();
}

async function pairComplete(pairingCode) {
  const code = String(pairingCode || '').trim();
  if (!code) {
    throw new Error('Enter the pairing code shown in KeePass.');
  }

  const state = await storageGet(['pairingSessionId']);
  let response;
  try {
    response = await bridgeCall('pair.complete', {
      PairingSessionId: state.pairingSessionId,
      PairingCode: code,
      ClientName: CLIENT_NAME
    });
  } catch (error) {
    if (isTerminalPairingError(error)) {
      await clearPairingSession();
    }

    throw error;
  }
  const payload = parsePayload(response);
  if (!payload.ClientId || !payload.SharedSecret) {
    throw new Error('KeePass pairing failed.');
  }

  await chrome.storage.local.set({
    clientId: payload.ClientId,
    sharedSecret: payload.SharedSecret
  });
  await clearPairingSession();
  return getState();
}

async function pairCancel() {
  const state = await storageGet(['pairingSessionId']);
  if (state.pairingSessionId) {
    try {
      await bridgeCall('pair.cancel', { PairingSessionId: state.pairingSessionId });
    } catch (error) {
      // Local cancellation should still clear stale UI even if KeePass is closed.
    }
  }

  await clearPairingSession();
  return getState();
}

async function clearPairingSession() {
  await chrome.storage.local.set({
    pairingSessionId: '',
    pairingStartedAt: 0
  });
}

function isTerminalPairingError(error) {
  const message = error && error.message ? error.message : String(error || '');
  return /expired|not found|too many invalid attempts/i.test(message);
}

async function queryLogins() {
  const tab = await getActiveTab();
  if (!tab || !tab.url) {
    throw new Error('No active tab.');
  }

  return queryLoginsForUrl(tab.url);
}

async function queryLoginsForUrl(url) {
  const response = await bridgeCall('logins.query', await buildLoginsQueryPayload(url), true);
  return queryResultFromResponse(url, response);
}

async function queryHttpAuth(url) {
  const result = await queryLoginsForUrl(url);
  const entry = result.entries.find((candidate) => candidate.UserName && candidate.Password);
  if (!entry) {
    return null;
  }

  if (entry.EntryId) {
    await acknowledgeFill(entry.EntryId, url);
  }

  return {
    username: entry.UserName,
    password: entry.Password
  };
}

async function createLogin(login) {
  const response = await bridgeCall('logins.create', login, true);
  return parsePayload(response);
}

async function updateLogin(login) {
  const response = await bridgeCall('logins.update', login, true);
  return parsePayload(response);
}

async function acknowledgeFill(entryId, url) {
  if (!entryId) {
    return { Success: false, ErrorCode: 'missing_entry_id', Error: 'Entry ID is required.' };
  }

  const response = await bridgeCall('logins.fillAck', { EntryId: entryId, Url: url || '' }, true);
  return parsePayload(response);
}

async function rememberPendingCredential(origin, credential) {
  const normalizedOrigin = normalizeWebOrigin(origin);
  if (!normalizedOrigin || !credential || !credential.Password) {
    return { remembered: false };
  }

  await sessionStorageSet({
    [PENDING_MULTI_STEP_KEY]: {
      origin: normalizedOrigin,
      credential,
      savedAt: Date.now()
    }
  });
  return { remembered: true };
}

async function consumePendingCredential(origin) {
  const normalizedOrigin = normalizeWebOrigin(origin);
  if (!normalizedOrigin) {
    return { credential: null };
  }

  const state = await sessionStorageGet([PENDING_MULTI_STEP_KEY]);
  const pending = state[PENDING_MULTI_STEP_KEY];
  if (!pending || !pending.credential) {
    return { credential: null };
  }

  if (Date.now() - Number(pending.savedAt || 0) > PENDING_MULTI_STEP_MAX_AGE_MS) {
    await sessionStorageRemove([PENDING_MULTI_STEP_KEY]);
    return { credential: null };
  }

  if (pending.origin !== normalizedOrigin) {
    return { credential: null };
  }

  await sessionStorageRemove([PENDING_MULTI_STEP_KEY]);
  return { credential: pending.credential };
}

async function rememberSubmittedCredential(origin, credential) {
  const normalizedOrigin = normalizeWebOrigin(origin);
  if (!normalizedOrigin || !credential || !credential.password) {
    return { remembered: false };
  }

  await sessionStorageSet({
    [PENDING_SUBMITTED_KEY]: {
      origin: normalizedOrigin,
      credential,
      savedAt: Date.now()
    }
  });
  return { remembered: true };
}

async function consumeSubmittedCredential(origin) {
  const normalizedOrigin = normalizeWebOrigin(origin);
  if (!normalizedOrigin) {
    return { credential: null };
  }

  const state = await sessionStorageGet([PENDING_SUBMITTED_KEY]);
  const pending = state[PENDING_SUBMITTED_KEY];
  if (!pending || !pending.credential) {
    return { credential: null };
  }

  if (Date.now() - Number(pending.savedAt || 0) > PENDING_SUBMITTED_MAX_AGE_MS) {
    await sessionStorageRemove([PENDING_SUBMITTED_KEY]);
    return { credential: null };
  }

  if (pending.origin !== normalizedOrigin) {
    return { credential: null };
  }

  await sessionStorageRemove([PENDING_SUBMITTED_KEY]);
  return { credential: pending.credential };
}

async function fillLogin(credential) {
  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    throw new Error('No active tab.');
  }

  const state = await getState();
  const autoSubmit = await getAutoSubmitForUrl(tab.url, state.autoSubmitEnabled);
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['contentScript.js'] });
  const result = await chrome.tabs.sendMessage(tab.id, {
    type: 'KBB_FILL',
    credential,
    autoSubmit
  });

  if (credential && credential.EntryId && (!result || result.filled !== false)) {
    await acknowledgeFill(credential.EntryId, tab.url || '');
  }

  return result;
}

async function copyToClipboard(text, clearAfterMs) {
  try {
    await navigator.clipboard.writeText(text);
    
    if (clearAfterMs && clearAfterMs > 0) {
      const timerId = setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {});
        clipboardTimers.delete(timerId);
      }, clearAfterMs);
      clipboardTimers.set(timerId, true);
    }
    
    return { success: true };
  } catch (error) {
    throw new Error('Failed to copy to clipboard: ' + error.message);
  }
}

async function autoFillTab(tabId, url) {
  const state = await getState();
  if (!state.autoFillEnabled || !state.paired) {
    return;
  }

  const siteOverride = await getSiteOverride(url);
  if (siteOverride && siteOverride.autoFillEnabled === false) {
    return;
  }

  try {
    const response = await bridgeCall('logins.query', await buildLoginsQueryPayload(url), true);
    const result = queryResultFromResponse(url, response);
    
    if (result.entries.length !== 1) {
      return;
    }

    const entry = result.entries[0];
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    const fillResult = await chrome.tabs.sendMessage(tabId, {
      type: 'KBB_FILL',
      credential: entry,
      autoSubmit: getEffectiveAutoSubmit(state.autoSubmitEnabled, siteOverride)
    });

    if (entry.EntryId && (!fillResult || fillResult.filled !== false)) {
      await bridgeCall('logins.fillAck', { EntryId: entry.EntryId, Url: url || '' }, true);
    }
  } catch (error) {
    // Auto-fill is intentionally silent
  }
}

async function handleHttpAuthRequired(details) {
  if (!details || !isFillableUrl(details.url)) {
    return null;
  }

  const key = [
    details.requestId || '',
    details.isProxy ? 'proxy' : 'server',
    details.challenger && details.challenger.host ? details.challenger.host : '',
    details.realm || '',
    details.url
  ].join('\n');
  const attempts = httpAuthAttempts.get(key) || 0;
  if (attempts >= HTTP_AUTH_MAX_ATTEMPTS) {
    return null;
  }

  const credentials = await queryHttpAuth(details.url);
  if (!credentials) {
    return null;
  }

  httpAuthAttempts.set(key, attempts + 1);
  return credentials;
}

async function getAutoSubmitForUrl(url, fallback) {
  const siteOverride = await getSiteOverride(url);
  return getEffectiveAutoSubmit(fallback, siteOverride);
}

async function buildLoginsQueryPayload(url) {
  const state = await storageGet(['strictUrlMatching', 'regexUrlMatching']);
  return {
    Url: url,
    StrictUrlMatching: Boolean(state.strictUrlMatching),
    RegexUrlMatching: Boolean(state.regexUrlMatching)
  };
}

function getEffectiveAutoSubmit(fallback, siteOverride) {
  if (siteOverride && typeof siteOverride.autoSubmitEnabled === 'boolean') {
    return siteOverride.autoSubmitEnabled;
  }

  return Boolean(fallback);
}

async function getSiteOverride(url) {
  const host = normalizeHostFromUrl(url);
  if (!host) {
    return null;
  }

  const state = await storageGet(['siteOverrides']);
  const rules = Array.isArray(state.siteOverrides) ? state.siteOverrides : [];
  return rules.find((rule) => normalizeHost(rule && rule.host) === host) || null;
}

function normalizeHostFromUrl(url) {
  try {
    return normalizeHost(new URL(url).hostname);
  } catch (error) {
    return '';
  }
}

function normalizeHost(host) {
  return String(host || '').trim().toLowerCase().replace(/^\.+|\.+$/g, '');
}

function normalizeWebOrigin(origin) {
  try {
    const url = new URL(String(origin || ''));
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return '';
    }

    return url.origin;
  } catch (error) {
    return '';
  }
}

async function bridgeCall(method, payload, requiresAuth) {
  const state = await storageGet(['endpoint', 'clientId', 'sharedSecret']);
  const request = {
    ProtocolVersion: PROTOCOL_VERSION,
    RequestId: createRequestId(),
    Method: method,
    TimestampUtcMs: Date.now(),
    Origin: `chrome-extension://${chrome.runtime.id}`,
    ClientId: requiresAuth ? (state.clientId || '') : '',
    Authentication: '',
    Payload: JSON.stringify(payload || {})
  };

  if (requiresAuth) {
    if (!state.clientId || !state.sharedSecret) {
      throw new Error('Pair this browser with KeePass first.');
    }

    request.Authentication = await createAuthentication(request, state.sharedSecret);
  }
  
  const response = await fetch(state.endpoint || DEFAULT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!response.ok) {
    throw new Error(`Bridge returned ${response.status}: ${response.statusText}`);
  }

  const bridgeResponse = await response.json();
  if (!bridgeResponse.Success) {
    throw new Error(bridgeResponse.Error || bridgeResponse.ErrorCode || 'KeePass bridge request failed.');
  }

  return bridgeResponse;
}

async function getEndpoint() {
  const state = await storageGet(['endpoint']);
  return state.endpoint || DEFAULT_ENDPOINT;
}

async function createAuthentication(request, sharedSecret) {
  const canonical = [
    request.ProtocolVersion,
    request.Method,
    request.RequestId,
    request.TimestampUtcMs,
    request.Origin,
    request.ClientId,
    request.Payload
  ].join('\n');

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(sharedSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(canonical));
  return base64FromBytes(new Uint8Array(signature));
}

function parsePayload(response) {
  if (!response || !response.Payload) {
    return {};
  }

  try {
    return JSON.parse(response.Payload);
  } catch (error) {
    throw new Error('KeePass bridge returned invalid JSON payload.');
  }
}

function queryResultFromResponse(url, response) {
  const payload = parsePayload(response);
  return {
    url,
    entries: Array.isArray(payload.Entries) ? payload.Entries : []
  };
}

function normalizeEndpoint(endpoint) {
  const value = String(endpoint || '').trim();
  if (!value) {
    return DEFAULT_ENDPOINT;
  }

  const url = new URL(value);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
    throw new Error('Endpoint must be an http://127.0.0.1 URL.');
  }

  return url.toString();
}

function getActiveTab() {
  return chrome.tabs.query({ active: true, currentWindow: true })
    .then((tabs) => tabs && tabs.length ? tabs[0] : null);
}

function scheduleAutoFill(tabId, url) {
  if (autoFillTimers.has(tabId)) {
    clearTimeout(autoFillTimers.get(tabId));
  }

  chrome.storage.local.get(['autoFillDelay'], (result) => {
    const delay = result.autoFillDelay || AUTO_FILL_DEBOUNCE_MS;
    const timerId = setTimeout(() => {
      autoFillTimers.delete(tabId);
      autoFillTab(tabId, url).catch(() => {});
    }, delay);

    autoFillTimers.set(tabId, timerId);
  });
}

function isFillableUrl(url) {
  if (!url) {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch (error) {
    return false;
  }
}

function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

function sessionStorageGet(keys) {
  const area = chrome.storage.session || chrome.storage.local;
  return area.get(keys);
}

function sessionStorageSet(values) {
  const area = chrome.storage.session || chrome.storage.local;
  return area.set(values);
}

function sessionStorageRemove(keys) {
  const area = chrome.storage.session || chrome.storage.local;
  return area.remove(keys);
}

function createRequestId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '');
  }

  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function base64FromBytes(bytes) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

// --- Context Menu Features ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({ id: 'kbb_fill_username', title: 'Fill Username', contexts: ['editable'] });
  chrome.contextMenus.create({ id: 'kbb_fill_password', title: 'Fill Password', contexts: ['editable'] });
  chrome.contextMenus.create({ id: 'kbb_fill_totp', title: 'Fill TOTP', contexts: ['editable'] });
  chrome.contextMenus.create({ id: 'kbb_generate_password', title: 'Generate Password', contexts: ['editable'] });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab || !tab.id) return;
  if (info.menuItemId === 'kbb_fill_username') {
    fillFromContextMenu(tab.id, tab.url, 'username');
  } else if (info.menuItemId === 'kbb_fill_password') {
    fillFromContextMenu(tab.id, tab.url, 'password');
  } else if (info.menuItemId === 'kbb_fill_totp') {
    fillFromContextMenu(tab.id, tab.url, 'otp');
  } else if (info.menuItemId === 'kbb_generate_password') {
    generateAndFillPassword(tab.id);
  }
});

async function fillFromContextMenu(tabId, url, role) {
  try {
    const response = await bridgeCall('logins.query', await buildLoginsQueryPayload(url), true);
    const result = queryResultFromResponse(url, response);
    if (result.entries.length === 0) return;
    
    const entry = result.entries[0];
    
    let credentialToFill = {};
    if (role === 'username') credentialToFill = { UserName: entry.UserName };
    else if (role === 'password') credentialToFill = { Password: entry.Password };
    else if (role === 'otp') credentialToFill = { OneTimePassword: entry.OneTimePassword };
    
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    const fillResult = await chrome.tabs.sendMessage(tabId, { type: 'KBB_FILL', credential: credentialToFill });
    
    if (entry.EntryId && (!fillResult || fillResult.filled !== false)) {
      await bridgeCall('logins.fillAck', { EntryId: entry.EntryId, Url: url || '' }, true);
    }
  } catch (error) {
    console.error('Context menu fill failed:', error);
  }
}

async function generateAndFillPassword(tabId) {
  try {
    const result = new Uint32Array(16);
    crypto.getRandomValues(result);
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><,./-=';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += charset[result[i] % charset.length];
    }
    
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    await chrome.tabs.sendMessage(tabId, { type: 'KBB_FILL', credential: { Password: password } });
  } catch (error) {
    console.error('Password generation failed:', error);
  }
}
