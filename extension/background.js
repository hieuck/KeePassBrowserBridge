'use strict';

try {
  importScripts('passkeysProxy.js');
} catch (_) {
  // passkeys proxy is only available when included in the extension package
}

import { normalizeStringArray, normalizeFeatureMap, normalizeFeatureDetails, normalizeReleaseVersion, compareVersions, hasPartialPairingCredentials, booleanSetting, numberSetting, isActivePairingTimestamp, normalizeClientPermissions, isTerminalPairingError } from './shared/background-utils.js';

const DEFAULT_ENDPOINT = 'http://127.0.0.1:19455/bridge';
const PROTOCOL_VERSION = 1;
const CLIENT_NAME = 'Chrome';
const REPOSITORY_URL = 'https://github.com/hieuck/KeePassBrowserBridge';
const RELEASES_URL = REPOSITORY_URL + '/releases';
const LATEST_RELEASE_API_URL = 'https://api.github.com/repos/hieuck/KeePassBrowserBridge/releases/latest';
const AUTO_FILL_DEBOUNCE_MS = 1200;
const AUTO_FILL_MAX_DELAY_MS = 5000;
const DEFAULT_CLIPBOARD_CLEAR_DELAY_MS = 30000;
const MAX_CLIPBOARD_CLEAR_DELAY_MS = 300000;
const PAIRING_SESSION_MAX_AGE_MS = 5 * 60 * 1000;
const PENDING_MULTI_STEP_MAX_AGE_MS = 10 * 60 * 1000;
const PENDING_MULTI_STEP_KEY = 'kbbPendingMultiStepCredential';
const PENDING_SUBMITTED_MAX_AGE_MS = 2 * 60 * 1000;
const PENDING_SUBMITTED_KEY = 'kbbPendingSubmittedCredential';
const HTTP_AUTH_MAX_ATTEMPTS = 2;
const DEFAULT_AUTO_FILL_ENABLED = true;
const DEFAULT_AUTO_SUBMIT_ENABLED = false;
const DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES = 0;
const DEFAULT_STRICT_URL_MATCHING = false;
const DEFAULT_REGEX_URL_MATCHING = false;
const MAX_AUTO_LOCK_TIMEOUT_MINUTES = 1440;
const autoFillTimers = new Map();
const clipboardTimers = new Map();
const httpAuthAttempts = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab) {
    return;
  }

  if (!isFillableUrl(tab.url)) {
    updateBadgeCount(tabId, 0);
    return;
  }

  scheduleAutoFill(tabId, tab.url);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab && isFillableUrl(tab.url)) {
      const result = await queryLoginsForUrl(tab.url);
      await updateBadgeCount(activeInfo.tabId, result.entries.length);
      return;
    }
  } catch (_) { /* badge cleared below */ }
  await updateBadgeCount(activeInfo.tabId, 0);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-credentials') {
    try {
      const tab = await getActiveTab();
      if (tab && tab.id && isFillableUrl(tab.url)) {
        await autoFillTab(tab.id, tab.url);
      }
    } catch (_) { /* keyboard fill is best-effort */ }
  }
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
    case 'KBB_SET_LOCKED':
      return setLocked(message.locked);
    case 'KBB_PING':
      return { ok: true, pong: true };
    case 'KBB_HELLO':
      return bridgeCall('hello', {});
    case 'KBB_PAIR_BEGIN':
      return pairBegin();
    case 'KBB_PAIR_COMPLETE':
      return pairComplete(message.pairingCode);
    case 'KBB_PAIR_CANCEL':
      return pairCancel();
    case 'KBB_STATUS':
      return clientStatus();
    case 'KBB_LIST_CLIENTS':
      return listClients();
    case 'KBB_REVOKE_CLIENT':
      return revokeClient(message.clientId);
    case 'KBB_UPDATE_CLIENT_PERMISSIONS':
      return updateClientPermissions(message.clientId, message.permissions);
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
      return fillLogin(message.credential, message.fieldRole, message.customFieldName);
    case 'KBB_COLLECT_PAGE_CREDENTIAL':
      return collectPageCredential();
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
    case 'KBB_GET_ABOUT':
      return getAbout();
    case 'KBB_CHECK_UPDATES':
      return checkUpdates();
    case 'KBB_SET_PASSKEYS_ENABLED':
      return setPasskeysEnabled(message.enabled);
    case 'KBB_LOCK_DATABASE':
      return lockDatabase();
    case 'KBB_LIST_GROUPS':
      return listGroups();
    case 'KBB_GET_DATABASE_INFO':
      return getDatabaseInfo();
    case 'KBB_AUTOTYPE':
      return performAutoType(message);
    default:
      throw new Error('Unknown message type.');
  }
}

async function getAbout() {
  const manifest = chrome.runtime.getManifest ? chrome.runtime.getManifest() : {};
  const about = {
    name: manifest.name || 'KeePass Browser Bridge',
    version: manifest.version || '0.0.0',
    browserId: chrome.runtime.id || '',
    repositoryUrl: REPOSITORY_URL,
    releasesUrl: RELEASES_URL,
    bridgeAvailable: false,
    pluginVersion: '',
    pluginUpdateUrl: '',
    pluginSupportedMethods: [],
    pluginFeatures: {},
    pluginFeatureDetails: {},
    pluginPasskeysEnabled: false,
    pluginPasskeysStatus: 'unknown'
  };

  try {
    const hello = parsePayload(await bridgeCall('hello', {}));
    about.bridgeAvailable = true;
    about.pluginVersion = hello.PluginVersion || '';
    about.pluginUpdateUrl = hello.PluginUpdateUrl || '';
    about.pluginSupportedMethods = normalizeStringArray(hello.SupportedMethods);
    about.pluginFeatures = normalizeFeatureMap(hello.Features);
    about.pluginFeatureDetails = normalizeFeatureDetails(hello.Features);
    about.pluginPasskeysEnabled = Boolean(about.pluginFeatures.passkeys);
    about.pluginPasskeysStatus = about.pluginFeatureDetails.passkeys
      ? about.pluginFeatureDetails.passkeys.status
      : (about.pluginPasskeysEnabled ? 'enabled' : 'disabled');
  } catch (error) {
    about.bridgeError = error && error.message ? error.message : String(error);
  }

  return about;
}

async function checkUpdates() {
  const about = await getAbout();
  const response = await fetch(LATEST_RELEASE_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json'
    }
  });
  if (!response.ok) {
    throw new Error(`Could not check GitHub Releases: ${response.status} ${response.statusText}`);
  }

  const latest = await response.json();
  const latestVersion = normalizeReleaseVersion(latest.tag_name || latest.name || '');
  const releaseUrl = latest.html_url || RELEASES_URL;
  return {
    currentVersion: about.version,
    latestVersion,
    updateAvailable: compareVersions(latestVersion, about.version) > 0,
    releaseUrl
  };
}

async function getState() {
  const state = await storageGet(['endpoint', 'clientId', 'sharedSecret', 'permissions', 'pairingSessionId', 'pairingStartedAt', 'autoFillEnabled', 'autoSubmitEnabled', 'locked', 'autoLockTimeoutMinutes', 'lastCredentialActivityAt']);
  if (hasPartialPairingCredentials(state)) {
    await chrome.storage.local.remove(['clientId', 'sharedSecret']);
    state.clientId = '';
    state.sharedSecret = '';
    await clearSensitiveRuntimeState('partial-pairing');
  }

  const paired = Boolean(state.clientId && state.sharedSecret);
  if (paired && state.pairingSessionId) {
    await clearPairingSession();
    state.pairingSessionId = '';
    state.pairingStartedAt = 0;
  }

  let pairingStartedAt = Number(state.pairingStartedAt || 0);
  if (!paired && state.pairingSessionId && !isActivePairingTimestamp(pairingStartedAt)) {
    await clearPairingSession();
    state.pairingSessionId = '';
    state.pairingStartedAt = 0;
    pairingStartedAt = 0;
  }

  await applyAutoLock(state);

  const pairingActive = !paired && Boolean(state.pairingSessionId);
  return {
    endpoint: state.endpoint || DEFAULT_ENDPOINT,
    paired,
    clientId: state.clientId || '',
    permissions: state.permissions || [],
    pairingSessionId: pairingActive ? state.pairingSessionId : '',
    pairingExpiresAt: pairingActive && pairingStartedAt ? pairingStartedAt + PAIRING_SESSION_MAX_AGE_MS : 0,
    autoFillEnabled: booleanSetting(state.autoFillEnabled, DEFAULT_AUTO_FILL_ENABLED),
    autoSubmitEnabled: booleanSetting(state.autoSubmitEnabled, DEFAULT_AUTO_SUBMIT_ENABLED),
    autoLockTimeoutMinutes: numberSetting(state.autoLockTimeoutMinutes, DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES, MAX_AUTO_LOCK_TIMEOUT_MINUTES),
    locked: state.locked === true
  };
}

async function applyAutoLock(state) {
  if (state.locked === true) {
    return;
  }

  const timeoutMinutes = numberSetting(state.autoLockTimeoutMinutes, DEFAULT_AUTO_LOCK_TIMEOUT_MINUTES, MAX_AUTO_LOCK_TIMEOUT_MINUTES);
  const lastActivityAt = Number(state.lastCredentialActivityAt || 0);
  if (timeoutMinutes <= 0 || lastActivityAt <= 0) {
    return;
  }

  if (Date.now() - lastActivityAt >= timeoutMinutes * 60 * 1000) {
    state.locked = true;
    await chrome.storage.local.set({ locked: true });
    await clearSensitiveRuntimeState('auto-lock');
  }
}

async function saveEndpoint(endpoint) {
  const normalized = normalizeEndpoint(endpoint);
  const state = await storageGet(['endpoint']);
  const previous = normalizeEndpoint(state.endpoint || DEFAULT_ENDPOINT);
  await chrome.storage.local.set({ endpoint: normalized });
  if (normalized !== previous) {
    await chrome.storage.local.remove(['clientId', 'sharedSecret']);
    await clearPairingSession();
    await clearSensitiveRuntimeState('endpoint-change');
  }
  return getState();
}

async function setAutoFill(enabled) {
  await chrome.storage.local.set({ autoFillEnabled: enabled === true });
  return getState();
}

async function setAutoSubmit(enabled) {
  await chrome.storage.local.set({ autoSubmitEnabled: enabled === true });
  return getState();
}

async function setLocked(locked) {
  const values = { locked: locked === true };
  if (!values.locked) {
    values.lastCredentialActivityAt = Date.now();
  }

  await chrome.storage.local.set(values);
  if (values.locked) {
    await clearSensitiveRuntimeState('lock');
  }
  return getState();
}

async function setPasskeysEnabled(enabled) {
  const enable = enabled === true;
  await chrome.storage.local.set({ passkeysEnabled: enable });

  if (enable) {
    try {
      const granted = await chrome.permissions.request({
        permissions: ['webAuthenticationProxy', 'webNavigation']
      });
      if (!granted) {
        await chrome.storage.local.set({ passkeysEnabled: false });
        throw new Error('WebAuthenticationProxy permission was denied.');
      }
    } catch (error) {
      await chrome.storage.local.set({ passkeysEnabled: false });
      throw error;
    }
    await setupPasskeyProxy();
  } else {
    await teardownPasskeyProxy();
    try {
      await chrome.permissions.remove({
        permissions: ['webAuthenticationProxy', 'webNavigation']
      });
    } catch (_) {}
  }

  return { passkeysEnabled: enable };
}

async function listClients() {
  const response = await bridgeCall('clients.list', {}, true);
  return parsePayload(response);
}

async function lockDatabase() {
  const response = await bridgeCall('database.lock', {}, true);
  await chrome.storage.local.set({ locked: true });
  return parsePayload(response);
}

async function listGroups() {
  const response = await bridgeCall('database.groups', {}, true);
  return parsePayload(response);
}

async function getDatabaseInfo() {
  const response = await bridgeCall('database.info', {}, true);
  return parsePayload(response);
}

async function performAutoType(message) {
  const response = await bridgeCall('autotype.perform', { Search: message.search || '' }, true);
  return parsePayload(response);
}

async function clientStatus() {
  const response = await bridgeCall('client.status', {}, true);
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
    await clearSensitiveRuntimeState('client-revoke');
  }

  return result;
}

async function updateClientPermissions(clientId, permissions) {
  const targetClientId = String(clientId || '').trim();
  if (!targetClientId) {
    throw new Error('Select a browser to update.');
  }

  const about = await getAbout();
  const response = await bridgeCall('clients.updatePermissions', {
    ClientId: targetClientId,
    Permissions: normalizeClientPermissions(permissions, about.pluginPasskeysEnabled)
  }, true);
  return parsePayload(response);
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
    sharedSecret: payload.SharedSecret,
    permissions: payload.Permissions || ['read', 'write', 'manageClients']
  });
  await clearPairingSession();
  await clearSensitiveRuntimeState('pair-complete');
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

async function clearPendingCredentialState() {
  await sessionStorageRemove([PENDING_MULTI_STEP_KEY, PENDING_SUBMITTED_KEY]);
}

async function clearSensitiveRuntimeState(reason = 'clear') {
  await clearPendingCredentialState();
  await clearPendingPasskeyState(reason);
  await clearClipboardState();
}

async function setupPasskeyProxy() {
  const experiment = globalThis.KeePassBrowserBridgePasskeysProxyExperiment;
  if (!experiment) return { attached: false };

  if (!experiment.isAvailable()) return { attached: false };

  await teardownPasskeyProxy();

  const handlers = experiment.createBridgeRequestHandlers({
    bridgeCall: async (method, payload) => {
      const response = await bridgeCall(method, payload, true);
      return response && response.Payload ? JSON.parse(response.Payload) : {};
    }
  });

  const lifecycle = experiment.createLifecycle({
    onCreateRequest: handlers.onCreateRequest,
    onGetRequest: handlers.onGetRequest,
    onRequestCanceled: handlers.onRequestCanceled,
    resolveTrustedOrigin: typeof experiment.createTrustedOriginResolver === 'function'
      ? experiment.createTrustedOriginResolver()
      : undefined
  });

  globalThis.KeePassBrowserBridgePasskeysProxyLifecycle = lifecycle;

  try {
    const result = await lifecycle.attach();
    return result;
  } catch (error) {
    globalThis.KeePassBrowserBridgePasskeysProxyLifecycle = null;
    throw error;
  }
}

async function teardownPasskeyProxy() {
  const lifecycle = globalThis.KeePassBrowserBridgePasskeysProxyLifecycle;
  globalThis.KeePassBrowserBridgePasskeysProxyLifecycle = null;
  if (!lifecycle) return;
  try {
    await lifecycle.detach();
  } catch (_) {
    // Experimental passkey detach must not block cleanup.
  }
}

async function clearPendingPasskeyState(reason) {
  const globalObject = typeof globalThis !== 'undefined' ? globalThis : null;
  const lifecycle = globalObject && globalObject.KeePassBrowserBridgePasskeysProxyLifecycle;
  if (!lifecycle || typeof lifecycle.cancelPending !== 'function') {
    return;
  }

  try {
    await lifecycle.cancelPending(reason || 'clear');
  } catch (_) {
    // Experimental passkey cleanup must not block lock, auto-lock, or revoke.
  }
}

async function clearClipboardState() {
  cancelClipboardClearTimers();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText('');
    } catch (_) {
      // Clipboard clearing is best-effort and should not block lock/revoke.
    }
  }
}

async function queryLogins() {
  const tab = await getActiveTab();
  if (!tab || !tab.url) {
    throw new Error('No active tab.');
  }

  const result = await queryLoginsForUrl(tab.url);
  if (tab.id) {
    await updateBadgeCount(tab.id, result.entries.length);
  }
  return result;
}

async function queryLoginsForUrl(url) {
  await assertCanAccessCredentials();
  await rememberCredentialActivity();
  const response = await bridgeCall('logins.query', await buildLoginsQueryPayload(url), true);
  return queryResultFromResponse(url, response);
}

async function queryHttpAuth(url) {
  const siteOverride = await getSiteOverride(url);
  if (siteOverride && siteOverride.autoFillEnabled === false) {
    return null;
  }

  const result = await queryLoginsForUrl(url);
  const entry = result.entries.find((candidate) => candidate.UserName && candidate.Password);
  if (!entry) {
    return null;
  }

  if (entry.EntryId) {
    await tryAcknowledgeFill(entry.EntryId, url);
  }

  return {
    username: entry.UserName,
    password: entry.Password
  };
}

async function createLogin(login) {
  await assertCanAccessCredentials();
  await rememberCredentialActivity();
  const response = await bridgeCall('logins.create', login, true);
  const result = parsePayload(response);
  if (result && result.Success !== false) {
    await notifyUser('Saved to KeePass', notificationEntryMessage(result.Entry, 'New login saved.'));
  }
  return result;
}

async function updateLogin(login) {
  await assertCanAccessCredentials();
  await rememberCredentialActivity();
  const response = await bridgeCall('logins.update', login, true);
  const result = parsePayload(response);
  if (result && result.Success !== false) {
    await notifyUser('Updated KeePass entry', notificationEntryMessage(result.Entry, 'Login updated.'));
  }
  return result;
}

async function acknowledgeFill(entryId, url) {
  await assertCanAccessCredentials();
  if (!entryId) {
    return { Success: false, ErrorCode: 'missing_entry_id', Error: 'Entry ID is required.' };
  }

  const response = await bridgeCall('logins.fillAck', { EntryId: entryId, Url: url || '' }, true);
  return parsePayload(response);
}

async function tryAcknowledgeFill(entryId, url) {
  try {
    return await acknowledgeFill(entryId, url);
  } catch (_) {
    return null;
  }
}

async function rememberPendingCredential(origin, credential) {
  await assertCanAccessCredentials();
  await rememberCredentialActivity();
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
  await assertCanAccessCredentials();
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
  await assertCanAccessCredentials();
  await rememberCredentialActivity();
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
  await assertCanAccessCredentials();
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

async function collectPageCredential() {
  await assertCanAccessCredentials();
  const tab = await getActiveTab();
  if (!tab || !tab.id || !isFillableUrl(tab.url)) {
    return { collected: false, credential: null };
  }

  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['contentScript.js'] });
  return chrome.tabs.sendMessage(tab.id, { type: 'KBB_COLLECT_PAGE_CREDENTIAL' });
}

async function fillLogin(credential, fieldRole, customFieldName) {
  await assertCanAccessCredentials();
  await rememberCredentialActivity();
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
    fieldRole: fieldRole || '',
    customFieldName: customFieldName || '',
    autoSubmit
  });

  if (credential && credential.EntryId && (!result || result.filled !== false)) {
    await tryAcknowledgeFill(credential.EntryId, tab.url || '');
    await notifyUser('Filled from KeePass', notificationCredentialMessage(credential, 'Login filled.'));
  }

  return result;
}

async function notifyUser(title, message) {
  if (!chrome.notifications || !chrome.notifications.create) {
    return;
  }

  const state = await storageGet(['notificationsEnabled']);
  if (state.notificationsEnabled === false) {
    return;
  }

  try {
    await chrome.notifications.create('kbb-' + Date.now(), {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title,
      message: message || ''
    });
  } catch (_) {
    // Notifications are feedback only; credential operations should not fail if the browser denies them.
  }
}

function notificationEntryMessage(entry, fallback) {
  if (!entry) return fallback;
  return entry.Title || entry.UserName || entry.Url || fallback;
}

function notificationCredentialMessage(credential, fallback) {
  if (!credential) return fallback;
  return credential.Title || credential.UserName || credential.Url || fallback;
}

async function copyToClipboard(text, clearAfterMs) {
  try {
    await assertCanAccessCredentials();
    await rememberCredentialActivity();
    cancelClipboardClearTimers();
    await navigator.clipboard.writeText(text);

    const normalizedClearAfterMs = normalizeClipboardClearDelayMs(clearAfterMs);
    if (normalizedClearAfterMs > 0) {
      const timerId = setTimeout(() => {
        navigator.clipboard.writeText('').catch(() => {});
        clipboardTimers.delete(timerId);
      }, normalizedClearAfterMs);
      clipboardTimers.set(timerId, true);
    }
    
    return { success: true };
  } catch (error) {
    throw new Error('Failed to copy to clipboard: ' + error.message);
  }
}

function normalizeClipboardClearDelayMs(value) {
  const delay = Number(value);
  if (Number.isFinite(delay) && delay >= 0 && delay <= MAX_CLIPBOARD_CLEAR_DELAY_MS) {
    return delay;
  }

  return DEFAULT_CLIPBOARD_CLEAR_DELAY_MS;
}

function cancelClipboardClearTimers() {
  for (const timerId of clipboardTimers.keys()) {
    clearTimeout(timerId);
  }
  clipboardTimers.clear();
}

async function autoFillTab(tabId, url) {
  const state = await getState();
  if (state.locked || !state.autoFillEnabled || !state.paired) {
    await updateBadgeCount(tabId, 0);
    return;
  }

  const siteOverride = await getSiteOverride(url);
  if (siteOverride && siteOverride.autoFillEnabled === false) {
    await updateBadgeCount(tabId, 0);
    return;
  }

  try {
    await rememberCredentialActivity();
    const response = await bridgeCall('logins.query', await buildLoginsQueryPayload(url), true);
    const result = queryResultFromResponse(url, response);
    await updateBadgeCount(tabId, result.entries.length);
    
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
      await tryAcknowledgeFill(entry.EntryId, url || '');
    }
  } catch (error) {
    await updateBadgeCount(tabId, 0);
    // Auto-fill is intentionally silent
  }
}

async function assertUnlocked() {
  const state = await storageGet(['locked', 'autoLockTimeoutMinutes', 'lastCredentialActivityAt']);
  await applyAutoLock(state);
  if (state.locked === true) {
    await clearSensitiveRuntimeState('locked-access');
    throw new Error('KeePass Bridge is locked.');
  }
}

async function assertCanAccessCredentials() {
  await assertUnlocked();
  const state = await storageGet(['clientId', 'sharedSecret']);
  if (!state.clientId || !state.sharedSecret) {
    await clearSensitiveRuntimeState('unpaired-access');
    throw new Error('Pair this browser with KeePass first.');
  }
}

async function rememberCredentialActivity() {
  await chrome.storage.local.set({ lastCredentialActivityAt: Date.now() });
}

async function updateBadgeCount(tabId, count) {
  if (!chrome.action || !chrome.action.setBadgeText) {
    return;
  }

  const text = count > 0 ? String(Math.min(count, 99)) : '';
  try {
    await chrome.action.setBadgeText({ tabId, text });
    if (text && chrome.action.setBadgeBackgroundColor) {
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#1f6f8b' });
    }
  } catch (_) {
    // Badge updates are best-effort UI feedback.
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

  httpAuthAttempts.set(key, attempts + 1);
  const credentials = await queryHttpAuth(details.url);
  if (!credentials) {
    return null;
  }

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
    StrictUrlMatching: booleanSetting(state.strictUrlMatching, DEFAULT_STRICT_URL_MATCHING),
    RegexUrlMatching: booleanSetting(state.regexUrlMatching, DEFAULT_REGEX_URL_MATCHING)
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
  let bestRule = null;
  let bestRuleHostLength = -1;
  for (const rule of rules) {
    const ruleHost = normalizeHost(rule && rule.host);
    if (!hostMatchesSiteOverride(host, ruleHost) || ruleHost.length <= bestRuleHostLength) {
      continue;
    }

    bestRule = rule;
    bestRuleHostLength = ruleHost.length;
  }

  return bestRule;
}

function normalizeHostFromUrl(url) {
  try {
    return normalizeHost(new URL(url).hostname);
  } catch (error) {
    return '';
  }
}

function normalizeHost(host) {
  const trimmed = String(host || '').trim().toLowerCase();
  if (!trimmed) {
    return '';
  }

  let normalizedHost;
  try {
    const parsed = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    normalizedHost = parsed.hostname;
  } catch (error) {
    normalizedHost = trimmed;
  }

  normalizedHost = normalizedHost.replace(/^\.+|\.+$/g, '');
  return isValidSiteOverrideHost(normalizedHost) ? normalizedHost : '';
}

function hostMatchesSiteOverride(host, ruleHost) {
  const normalizedHost = normalizeHost(host);
  const normalizedRuleHost = normalizeHost(ruleHost);
  if (!normalizedHost || !normalizedRuleHost) {
    return false;
  }

  return normalizedHost === normalizedRuleHost || normalizedHost.endsWith(`.${normalizedRuleHost}`);
}

function isValidSiteOverrideHost(host) {
  if (!host) {
    return false;
  }

  if (host === 'localhost') {
    return true;
  }

  const octets = host.split('.');
  if (octets.length === 4 && octets.every((part) => /^\d+$/.test(part))) {
    return octets.every((part) => {
      const value = Number.parseInt(part, 10);
      return value >= 0 && value <= 255 && String(value) === part;
    });
  }

  return octets.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)
  );
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
  const endpoint = normalizeEndpoint(state.endpoint || DEFAULT_ENDPOINT);
  const request = {
    ProtocolVersion: PROTOCOL_VERSION,
    RequestId: createRequestId(),
    Method: method,
    TimestampUtcMs: Date.now(),
    Origin: getExtensionOrigin(),
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
  
  try {
    const response = await fetch(endpoint, {
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
  } catch (fetchError) {
    if (fetchError && fetchError.message === 'Failed to fetch') {
      throw new Error('Cannot connect to KeePass. Please ensure KeePass is running with the plugin enabled.');
    }
    throw fetchError;
  }
}

function getExtensionOrigin() {
  if (chrome.runtime.getURL) {
    try {
      const url = new URL(chrome.runtime.getURL(''));
      if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
        return `${url.protocol}//${url.host}`;
      }
    } catch (_) {
      // Fall back to Chrome's stable extension id origin below.
    }
  }

  return `chrome-extension://${chrome.runtime.id}`;
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
  if (url.username || url.password) {
    throw new Error('Endpoint must not include credentials.');
  }
  if (url.pathname !== '/bridge' || url.search || url.hash) {
    throw new Error('Endpoint must be an http://127.0.0.1 /bridge URL without query or fragment.');
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
    const configuredDelay = Number(result && result.autoFillDelay);
    const delay = Number.isFinite(configuredDelay) && configuredDelay >= 0 && configuredDelay <= AUTO_FILL_MAX_DELAY_MS
      ? configuredDelay
      : AUTO_FILL_DEBOUNCE_MS;
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
    await assertCanAccessCredentials();
    await rememberCredentialActivity();
    const response = await bridgeCall('logins.query', await buildLoginsQueryPayload(url), true);
    const result = queryResultFromResponse(url, response);
    if (result.entries.length === 0) return;
    
    const entry = result.entries[0];
    
    let credentialToFill = {};
    if (role === 'username') credentialToFill = { UserName: entry.UserName };
    else if (role === 'password') credentialToFill = { Password: entry.Password };
    else if (role === 'otp') credentialToFill = { OneTimePassword: entry.OneTimePassword };
    
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    const fillResult = await chrome.tabs.sendMessage(tabId, {
      type: 'KBB_FILL',
      credential: credentialToFill,
      fieldRole: role
    });
    
    if (entry.EntryId && (!fillResult || fillResult.filled !== false)) {
      await tryAcknowledgeFill(entry.EntryId, url || '');
    }
  } catch (error) {
    if (isExpectedAccessStateError(error)) return;
    console.error('Context menu fill failed:', error);
  }
}

async function generateAndFillPassword(tabId) {
  try {
    await assertCanAccessCredentials();
    await rememberCredentialActivity();
    const result = new Uint32Array(16);
    crypto.getRandomValues(result);
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~|}{[]:;?><,./-=';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += charset[result[i] % charset.length];
    }
    
    await chrome.scripting.executeScript({ target: { tabId }, files: ['contentScript.js'] });
    await chrome.tabs.sendMessage(tabId, {
      type: 'KBB_FILL',
      credential: { Password: password },
      fieldRole: 'password'
    });
  } catch (error) {
    if (isExpectedAccessStateError(error)) return;
    console.error('Password generation failed:', error);
  }
}

function isExpectedAccessStateError(error) {
  const message = error && error.message ? error.message : String(error || '');
  return /locked|pair this browser/i.test(message);
}

// --- Passkey Proxy Startup & Storage Sync ---

if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.passkeysEnabled) {
      if (changes.passkeysEnabled.newValue) {
        setupPasskeyProxy();
      } else {
        teardownPasskeyProxy();
      }
    }
  });
}

// Startup: enable passkeys by default and start proxy
if (chrome.storage && chrome.storage.local) {
  chrome.storage.local.get(['passkeysEnabled'], (result) => {
    const enabled = result.passkeysEnabled !== false;
    chrome.storage.local.set({ passkeysEnabled: enabled });
    if (enabled) {
      setupPasskeyProxy();
    }
  });
}
