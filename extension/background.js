'use strict';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:19455/bridge';
const PROTOCOL_VERSION = 1;
const CLIENT_NAME = 'Chrome';
const AUTO_FILL_DEBOUNCE_MS = 1200;
const autoFillTimers = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab || !isFillableUrl(tab.url)) {
    return;
  }

  scheduleAutoFill(tabId, tab.url);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message)
    .then((response) => sendResponse({ ok: true, response }))
    .catch((error) => sendResponse({
      ok: false,
      error: error && error.message ? error.message : String(error)
    }));

  return true;
});

async function handleMessage(message) {
  switch (message && message.type) {
    case 'KBB_GET_STATE':
      return getState();
    case 'KBB_SAVE_ENDPOINT':
      return saveEndpoint(message.endpoint);
    case 'KBB_SET_AUTO_FILL':
      return setAutoFill(message.enabled);
    case 'KBB_HELLO':
      return bridgeCall('hello', {});
    case 'KBB_PAIR_BEGIN':
      return pairBegin();
    case 'KBB_PAIR_COMPLETE':
      return pairComplete(message.pairingCode);
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
    case 'KBB_CREATE_LOGIN':
      return createLogin(message.login);
    case 'KBB_UPDATE_LOGIN':
      return updateLogin(message.login);
    case 'KBB_FILL_LOGIN':
      return fillLogin(message.credential);
    default:
      throw new Error('Unknown message type.');
  }
}

async function getState() {
  const state = await storageGet(['endpoint', 'clientId', 'pairingSessionId', 'autoFillEnabled']);
  return {
    endpoint: state.endpoint || DEFAULT_ENDPOINT,
    paired: Boolean(state.clientId),
    clientId: state.clientId || '',
    pairingSessionId: state.pairingSessionId || '',
    autoFillEnabled: Boolean(state.autoFillEnabled)
  };
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
    await chrome.storage.local.remove(['clientId', 'sharedSecret', 'pairingSessionId']);
  }

  return result;
}

async function pairBegin() {
  const response = await bridgeCall('pair.begin', { ClientName: CLIENT_NAME });
  const payload = parsePayload(response);
  if (!payload.PairingSessionId) {
    throw new Error('KeePass did not return a pairing session.');
  }

  await chrome.storage.local.set({ pairingSessionId: payload.PairingSessionId });
  return getState();
}

async function pairComplete(pairingCode) {
  const code = String(pairingCode || '').trim();
  if (!code) {
    throw new Error('Enter the pairing code shown in KeePass.');
  }

  const state = await storageGet(['pairingSessionId']);
  if (!state.pairingSessionId) {
    throw new Error('Start pairing before completing it.');
  }

  const response = await bridgeCall('pair.complete', {
    PairingSessionId: state.pairingSessionId,
    PairingCode: code,
    ClientName: CLIENT_NAME
  });
  const payload = parsePayload(response);

  if (!payload.ClientId || !payload.SharedSecret) {
    throw new Error('KeePass did not return client credentials.');
  }

  await chrome.storage.local.set({
    clientId: payload.ClientId,
    sharedSecret: payload.SharedSecret,
    pairingSessionId: ''
  });
  return getState();
}

async function queryLogins() {
  const tab = await getActiveTab();
  if (!tab || !tab.url) {
    throw new Error('No active tab URL is available.');
  }

  return queryLoginsForUrl(tab.url);
}

async function queryLoginsForUrl(url) {
  if (!isFillableUrl(url)) {
    throw new Error('This page URL cannot be filled.');
  }

  const response = await bridgeCall('logins.query', { Url: url }, true);
  return queryResultFromResponse(url, response);
}

async function fillLogin(credential) {
  if (!credential || !credential.EntryId) {
    throw new Error('Select a login first.');
  }

  const tab = await getActiveTab();
  if (!tab || !tab.id) {
    throw new Error('No active tab is available.');
  }

  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['contentScript.js']
  });

  const result = await chrome.tabs.sendMessage(tab.id, {
    type: 'KBB_FILL',
    credential
  });

  await bridgeCall('logins.fillAck', {
    EntryId: credential.EntryId,
    Url: tab.url || ''
  }, true);

  return result || { filled: true };
}

async function createLogin(login) {
  const payload = {
    Title: login && login.title ? String(login.title) : '',
    Url: login && login.url ? String(login.url) : '',
    UserName: login && login.userName ? String(login.userName) : '',
    Password: login && login.password ? String(login.password) : ''
  };

  const response = await bridgeCall('logins.create', payload, true);
  return parsePayload(response);
}

async function updateLogin(login) {
  const payload = {
    EntryId: login && login.entryId ? String(login.entryId) : '',
    Title: login && login.title ? String(login.title) : '',
    Url: login && login.url ? String(login.url) : '',
    PageUrl: login && login.pageUrl ? String(login.pageUrl) : '',
    UserName: login && login.userName ? String(login.userName) : '',
    Password: login && login.password ? String(login.password) : ''
  };

  const response = await bridgeCall('logins.update', payload, true);
  return parsePayload(response);
}

async function autoFillTab(tabId, url) {
  const state = await storageGet(['autoFillEnabled', 'clientId', 'sharedSecret']);
  if (!state.autoFillEnabled || !state.clientId || !state.sharedSecret || !isFillableUrl(url)) {
    return { filled: false, reason: 'disabled_or_unpaired' };
  }

  const response = await bridgeCall('logins.query', { Url: url }, true);
  const result = queryResultFromResponse(url, response);
  if (result.entries.length !== 1) {
    return {
      filled: false,
      reason: result.entries.length === 0 ? 'no_match' : 'multiple_matches',
      count: result.entries.length
    };
  }

  await fillCredentialInTab(tabId, result.entries[0], url);
  return { filled: true, count: 1 };
}

async function fillCredentialInTab(tabId, credential, url) {
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['contentScript.js']
  });

  const result = await chrome.tabs.sendMessage(tabId, {
    type: 'KBB_FILL',
    credential
  });

  await bridgeCall('logins.fillAck', {
    EntryId: credential.EntryId,
    Url: url || ''
  }, true);

  return result || { filled: true };
}

async function bridgeCall(method, payload, authenticated) {
  const state = await storageGet(['endpoint', 'clientId', 'sharedSecret']);
  const request = {
    ProtocolVersion: PROTOCOL_VERSION,
    RequestId: createRequestId(),
    Method: method,
    TimestampUtcMs: Date.now(),
    Origin: `chrome-extension://${chrome.runtime.id}`,
    ClientId: authenticated ? (state.clientId || '') : '',
    Authentication: '',
    Payload: JSON.stringify(payload || {})
  };

  if (authenticated) {
    if (!state.clientId || !state.sharedSecret) {
      throw new Error('Pair this browser with KeePass first.');
    }

    request.Authentication = await createAuthentication(request, state.sharedSecret);
  }

  const endpoint = state.endpoint || DEFAULT_ENDPOINT;
  const httpResponse = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });

  if (!httpResponse.ok) {
    throw new Error(`KeePass bridge returned HTTP ${httpResponse.status}.`);
  }

  const bridgeResponse = await httpResponse.json();
  if (!bridgeResponse.Success) {
    throw new Error(bridgeResponse.Error || bridgeResponse.ErrorCode || 'KeePass bridge request failed.');
  }

  return bridgeResponse;
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

  const timerId = setTimeout(() => {
    autoFillTimers.delete(tabId);
    autoFillTab(tabId, url).catch(() => {
      // Auto-fill is intentionally silent. Manual popup actions surface errors.
    });
  }, AUTO_FILL_DEBOUNCE_MS);

  autoFillTimers.set(tabId, timerId);
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
