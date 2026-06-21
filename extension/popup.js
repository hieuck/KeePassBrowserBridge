'use strict';

const DEFAULT_CLIPBOARD_CLEAR_DELAY_SECONDS = 30;
const MAX_CLIPBOARD_CLEAR_DELAY_SECONDS = 300;

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  statusBadge: document.getElementById('statusBadge'),
  endpoint: document.getElementById('endpoint'),
  saveEndpoint: document.getElementById('saveEndpoint'),
  checkStatus: document.getElementById('checkStatus'),
  beginPair: document.getElementById('beginPair'),
  autoFill: document.getElementById('autoFill'),
  autoSubmit: document.getElementById('autoSubmit'),
  listClients: document.getElementById('listClients'),
  lockBridge: document.getElementById('lockBridge'),
  clientsPanel: document.getElementById('clientsPanel'),
  pairingPanel: document.getElementById('pairingPanel'),
  pairingTimer: document.getElementById('pairingTimer'),
  pairingCode: document.getElementById('pairingCode'),
  pastePairingCode: document.getElementById('pastePairingCode'),
  completePair: document.getElementById('completePair'),
  cancelPair: document.getElementById('cancelPair'),
  queryLogins: document.getElementById('queryLogins'),
  newLogin: document.getElementById('newLogin'),
  toggleSiteAutoFill: document.getElementById('toggleSiteAutoFill'),
  toggleSiteAutoSubmit: document.getElementById('toggleSiteAutoSubmit'),
  stateNotice: document.getElementById('stateNotice'),
  aboutVersion: document.getElementById('aboutVersion'),
  aboutPluginVersion: document.getElementById('aboutPluginVersion'),
  aboutBrowserId: document.getElementById('aboutBrowserId'),
  repositoryLink: document.getElementById('repositoryLink'),
  releasesLink: document.getElementById('releasesLink'),
  checkUpdates: document.getElementById('checkUpdates'),
  currentUrl: document.getElementById('currentUrl'),
  loginSearch: document.getElementById('loginSearch'),
  results: document.getElementById('results'),
  message: document.getElementById('message'),
  passkeySection: document.getElementById('passkeySection'),
  passkeyToggle: document.getElementById('passkeyToggle'),
  passkeyStatus: document.getElementById('passkeyStatus')
};



let currentEntries = [];
let visibleEntries = [];
let currentState = { locked: false };
let trustedBrowserClients = [];
let bridgePasskeysEnabled = false;
let pairingExpiryTimer = null;
let pairingCountdownTimer = null;

document.addEventListener('DOMContentLoaded', init);

function init() {
  detectAndApplyTheme();
  elements.themeToggle.addEventListener('click', toggleTheme);
  document.addEventListener('keydown', handleKeyboardShortcuts);
  
  elements.saveEndpoint.addEventListener('click', () => runAction(saveEndpoint));
  elements.checkStatus.addEventListener('click', () => runAction(checkStatus));
  elements.beginPair.addEventListener('click', () => runAction(beginPair));
  elements.autoFill.addEventListener('change', () => runAction(setAutoFill));
  elements.autoSubmit.addEventListener('change', () => runAction(setAutoSubmit));
  elements.listClients.addEventListener('click', () => runAction(listClients));
  elements.lockBridge.addEventListener('click', () => runAction(toggleLocked));
  elements.pastePairingCode.addEventListener('click', () => runAction(pastePairingCode));
  elements.completePair.addEventListener('click', () => runAction(completePair));
  elements.cancelPair.addEventListener('click', () => runAction(cancelPair));
  elements.pairingCode.addEventListener('input', syncPairingCodeState);
  elements.pairingCode.addEventListener('keydown', handlePairingCodeKeydown);
  elements.queryLogins.addEventListener('click', () => runAction(queryLogins));
  elements.newLogin.addEventListener('click', () => runAction(beginCreateLogin));
  elements.toggleSiteAutoFill.addEventListener('click', () => runAction(toggleSiteAutoFill));
  elements.toggleSiteAutoSubmit.addEventListener('click', () => runAction(toggleSiteAutoSubmit));
  elements.checkUpdates.addEventListener('click', () => runAction(checkUpdates));
  elements.loginSearch.addEventListener('input', () => runAction(filterCurrentLogins));
  elements.loginSearch.addEventListener('keydown', handleLoginSearchKeydown);
  if (elements.passkeyToggle) {
    elements.passkeyToggle.addEventListener('change', () => runAction(togglePasskeys));
  }

  document.getElementById('showSites')?.addEventListener('click', () => runAction(toggleSiteAutoFill));
  document.getElementById('showClients')?.addEventListener('click', () => runAction(listClients));
  document.getElementById('showAbout')?.addEventListener('click', () => runAction(showAbout));

  syncPairingCodeState();
  runAction(renderAbout);
  runAction(refreshState);
}

function handleLoginSearchKeydown(event) {
  if (event.key !== 'Escape' || !elements.loginSearch.value) {
    return;
  }

  event.preventDefault();
  runAction(clearLoginSearch);
}

function handlePairingCodeKeydown(event) {
  if (elements.pairingPanel.classList.contains('hidden')) {
    return;
  }

  if (event.key === 'Enter') {
    event.preventDefault();
    if (!elements.completePair.disabled) {
      runAction(completePair);
    }
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    runAction(cancelPair);
  }
}

function handleKeyboardShortcuts(event) {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }

  switch (event.key) {
    case 'Enter':
      if (!elements.pairingPanel.classList.contains('hidden')) {
        event.preventDefault();
        if (elements.completePair.disabled === false) {
          runAction(completePair);
        }
        return;
      }
      if (credentialActionsEnabled() && visibleEntries.length > 0 && elements.results.children.length > 0) {
        event.preventDefault();
        const firstEntry = visibleEntries[0];
        runAction(() => fillLogin(firstEntry));
        return;
      }
      break;
    case 'Escape':
      if (!elements.pairingPanel.classList.contains('hidden')) {
        event.preventDefault();
        runAction(cancelPair);
        return;
      }
      if (!elements.clientsPanel.classList.contains('hidden')) {
        event.preventDefault();
        elements.clientsPanel.classList.add('hidden');
        return;
      }
      break;
    case ' ':
      if (document.activeElement === elements.autoFill) {
        elements.autoFill.checked = !elements.autoFill.checked;
        runAction(() => setAutoFill(elements.autoFill.checked));
        return;
      }
      break;
    case 'f':
    case 'F':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        elements.queryLogins.click();
        return;
      }
      break;
    case 'p':
    case 'P':
      if (event.ctrlKey || event.metaKey) {
        event.preventDefault();
        elements.beginPair.click();
        return;
      }
      break;
  }
}

function detectAndApplyTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    let theme = result.theme || 'system';
    
    if (theme === 'system') {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    applyTheme(theme);
  });
}

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.setAttribute('data-theme', 'dark');
    elements.themeToggle.querySelector('.theme-icon').textContent = '☀️';
  } else {
    html.removeAttribute('data-theme');
    elements.themeToggle.querySelector('.theme-icon').textContent = '🌙';
  }
}

function toggleTheme() {
  chrome.storage.local.get(['theme'], (result) => {
    let currentTheme = result.theme || 'system';
    let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    chrome.storage.local.set({ theme: newTheme }, () => {
      applyTheme(newTheme);
    });
  });
}

async function saveEndpoint() {
  const state = await send({ type: 'KBB_SAVE_ENDPOINT', endpoint: elements.endpoint.value });
  renderState(await hydrateStatePermissions(state));
  setMessage('Endpoint saved.');
}

async function checkStatus() {
  await send({ type: 'KBB_HELLO' });
  const state = await send({ type: 'KBB_GET_STATE' });

  if (state.locked) {
    renderState(state);
    setMessage('KeePass bridge is reachable. Unlock KeePass Bridge to use logins.');
    return;
  }

  if (state.paired) {
    const status = await send({ type: 'KBB_STATUS' });
    state.permissions = normalizeClientPermissions(status.Permissions);
    state.trusted = status.Trusted === true;
    renderState(state);
    setStatus('Paired', 'paired');
    setMessage('KeePass bridge is reachable.');
  } else {
    renderState(state);
    setStatus('Ready', '');
    setMessage('KeePass bridge is reachable. Pair this browser to query logins.');
  }
}

async function beginPair() {
  const state = await send({ type: 'KBB_PAIR_BEGIN' });
  elements.pairingCode.value = '';
  renderState(state);
  setMessage('Enter the pairing code shown in KeePass.');
}

async function setAutoFill() {
  const state = await send({
    type: 'KBB_SET_AUTO_FILL',
    enabled: elements.autoFill.checked
  });
  renderState(await hydrateStatePermissions(state));
  setMessage(state.autoFillEnabled
    ? 'Auto-fill enabled for single matching logins.'
    : 'Auto-fill disabled.');
}

async function setAutoSubmit() {
  const state = await send({
    type: 'KBB_SET_AUTO_SUBMIT',
    enabled: elements.autoSubmit.checked
  });
  renderState(await hydrateStatePermissions(state));
  setMessage(state.autoSubmitEnabled
    ? 'Auto-submit form after filling enabled.'
    : 'Auto-submit disabled.');
}

async function toggleLocked() {
  const lockLabel = elements.lockBridge?.querySelector('span')?.textContent?.trim() || elements.lockBridge.textContent;
  const state = await send({ type: 'KBB_SET_LOCKED', locked: lockLabel !== 'Unlock' });
  renderState(await hydrateStatePermissions(state));
  setMessage(state.locked ? 'KeePass Bridge is locked.' : 'KeePass Bridge is unlocked.');
}

async function listClients() {
  ensureManageClientActionsEnabled();
  try {
    await refreshAboutMetadata();
    const result = await send({ type: 'KBB_LIST_CLIENTS' });
    trustedBrowserClients = Array.isArray(result.Clients) ? result.Clients : [];
    renderClients(trustedBrowserClients);
    elements.clientsPanel.classList.remove('hidden');
    setMessage(result.Clients && result.Clients.length
      ? `${result.Clients.length} trusted browser(s).`
      : 'No trusted browsers found.');
  } catch (error) {
    await failClosedManageClientAccess(error);
    throw error;
  }
}

async function revokeClient(client) {
  ensureManageClientActionsEnabled();
  const clientName = client && client.ClientName ? client.ClientName : 'Browser';
  const confirmed = window.confirm(
    `Revoke browser "${clientName}"?\n\nIt will need to pair again before accessing KeePass.`
  );
  if (!confirmed) {
    setMessage('Revoke cancelled.');
    return;
  }

  const result = await send({ type: 'KBB_REVOKE_CLIENT', clientId: client.ClientId });
  if (!result || !result.Revoked) {
    throw new Error('Browser was not revoked.');
  }

  if (client.Current) {
    renderState(await send({ type: 'KBB_GET_STATE' }));
    elements.clientsPanel.classList.add('hidden');
    elements.clientsPanel.textContent = '';
    setMessage('This browser was revoked. Pair again to use KeePass.');
    return;
  }

  await listClients();
  setMessage('Browser revoked.');
}

async function updateClientPermissions(client, permission, enabled) {
  ensureManageClientActionsEnabled();
  const clientId = client && client.ClientId ? client.ClientId : '';
  const nextPermissions = normalizeClientPermissions(client && client.Permissions);
  const existingIndex = nextPermissions.indexOf(permission);
  if (enabled && existingIndex < 0) {
    nextPermissions.push(permission);
  } else if (!enabled && existingIndex >= 0) {
    nextPermissions.splice(existingIndex, 1);
  }

  const normalized = normalizeClientPermissions(nextPermissions);
  const result = await send({
    type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
    clientId,
    permissions: normalized
  });
  if (!result || !result.Updated) {
    throw new Error('Browser permissions were not updated.');
  }

  const stored = trustedBrowserClients.find((candidate) => candidate.ClientId === clientId);
  let currentClientLostManage = false;
  if (stored) {
    stored.Permissions = normalizeClientPermissions(result.Permissions || normalized);
    if (stored.Current) {
      currentState = {
        ...currentState,
        permissions: stored.Permissions
      };
      currentClientLostManage = !stored.Permissions.includes('manageClients');
      syncCredentialActionAvailability();
    }
  }

  renderClients(trustedBrowserClients);
  setMessage(currentClientLostManage
    ? 'Browser permissions updated. Manage browsers permission was removed for this browser.'
    : 'Browser permissions updated.');
}

async function completePair() {
  const state = await send({
    type: 'KBB_PAIR_COMPLETE',
    pairingCode: elements.pairingCode.value
  });
  renderState(state);
  elements.pairingCode.value = '';
  setMessage('Browser paired with KeePass.');
}

async function pastePairingCode() {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    throw new Error('Clipboard read is not available. Paste the pairing code manually.');
  }

  const text = await navigator.clipboard.readText();
  const code = extractPairingCode(text);
  if (!code) {
    throw new Error('Clipboard does not contain a six digit pairing code.');
  }

  elements.pairingCode.value = code;
  syncPairingCodeState();
  await completePair();
}

function extractPairingCode(text) {
  const digits = String(text || '').replace(/\D/g, '');
  return digits.length === 6 ? digits : '';
}

async function cancelPair() {
  clearPairingTimers();
  const state = await send({ type: 'KBB_PAIR_CANCEL' });
  elements.pairingCode.value = '';
  renderState(await hydrateStatePermissions(state));
  setMessage(state.paired ? 'Ready to query KeePass.' : 'Pairing cancelled.');
}

async function expirePairingSession() {
  clearPairingTimers();
  const state = await send({ type: 'KBB_PAIR_CANCEL' });
  elements.pairingCode.value = '';
  renderState(await hydrateStatePermissions(state));
  setMessage('Pairing code expired. Start pairing again.');
}

async function queryLogins() {
  const state = await send({ type: 'KBB_GET_STATE' });
  const hydratedState = await hydrateStatePermissions(state);
  renderState(hydratedState);
  if (hydratedState.locked) {
    setMessage('Unlock KeePass Bridge before querying logins.', true);
    return;
  }
  if (!credentialActionsEnabled()) {
    setMessage('Pair this browser with KeePass before querying logins.', true);
    return;
  }

  const result = await send({ type: 'KBB_QUERY_LOGINS' });
  elements.currentUrl.textContent = result.url || '';
  currentEntries = sortCredentialEntries(result.entries || []);
  elements.loginSearch.value = '';
  await renderResults(currentEntries);
  setMessage(result.entries && result.entries.length
    ? `${result.entries.length} login(s) found.`
    : 'No matching logins found.');
}

async function beginCreateLogin() {
  const state = await send({ type: 'KBB_GET_STATE' });
  renderState(await hydrateStatePermissions(state));
  if (state.locked) {
    setMessage('Unlock KeePass Bridge before creating logins.', true);
    return;
  }
  ensureWriteActionsEnabled();

  const result = await send({ type: 'KBB_QUERY_LOGINS' });
  const pageCredential = await collectPageCredential();
  const url = result.url || '';
  currentEntries = sortCredentialEntries(result.entries || []);
  elements.loginSearch.value = '';
  elements.currentUrl.textContent = url;
  updateSearchVisibility();
  showCreateForm(url, pageCredential);
  setMessage('Create a new KeePass login for this page.');
}

async function collectPageCredential() {
  try {
    const result = await send({ type: 'KBB_COLLECT_PAGE_CREDENTIAL' });
    return result && result.collected ? result.credential : null;
  } catch (error) {
    return null;
  }
}

async function toggleSiteAutoFill() {
  ensureCredentialActionsEnabled();
  const context = await getCurrentSiteOverrideContext();
  const { host, overrides, exactIndex, effective, inherited } = context;
  const isDisabled = effective && effective.autoFillEnabled === false;

  if (isDisabled) {
    const inheritedKeepsDisabled = inherited && inherited.autoFillEnabled === false;
    if (exactIndex >= 0 && !inheritedKeepsDisabled) {
      overrides.splice(exactIndex, 1);
    } else {
      const nextRule = {
        host,
        autoFillEnabled: true,
        autoSubmitEnabled: Boolean(effective && effective.autoSubmitEnabled === true)
      };
      if (exactIndex >= 0) {
        overrides[exactIndex] = nextRule;
      } else {
        overrides.push(nextRule);
      }
    }
    await chrome.storage.local.set({ siteOverrides: overrides });
    setMessage(`Auto-fill enabled for ${host}.`);
    return;
  }

  const nextRule = {
    host,
    autoFillEnabled: false,
    autoSubmitEnabled: Boolean(effective && effective.autoSubmitEnabled === true)
  };
  if (exactIndex >= 0) {
    overrides[exactIndex] = nextRule;
  } else {
    overrides.push(nextRule);
  }

  await chrome.storage.local.set({ siteOverrides: overrides });
  setMessage(`Auto-fill disabled for ${host}.`);
}

async function toggleSiteAutoSubmit() {
  ensureCredentialActionsEnabled();
  const context = await getCurrentSiteOverrideContext();
  const { host, overrides, exactIndex, exact, effective, inherited } = context;
  const isEnabled = effective && effective.autoSubmitEnabled === true;

  if (isEnabled) {
    const inheritedKeepsEnabled = inherited && inherited.autoSubmitEnabled === true;
    if (exactIndex >= 0 && !inheritedKeepsEnabled) {
      if (exact.autoFillEnabled === false) {
        overrides[exactIndex] = {
          host,
          autoFillEnabled: false,
          autoSubmitEnabled: false
        };
      } else {
        overrides.splice(exactIndex, 1);
      }
    } else {
      const nextRule = {
        host,
        autoFillEnabled: effective && effective.autoFillEnabled === false ? false : true,
        autoSubmitEnabled: false
      };
      if (exactIndex >= 0) {
        overrides[exactIndex] = nextRule;
      } else {
        overrides.push(nextRule);
      }
    }
    await chrome.storage.local.set({ siteOverrides: overrides });
    setMessage(`Auto-submit disabled for ${host}.`);
    return;
  }

  const nextRule = {
    host,
    autoFillEnabled: effective && effective.autoFillEnabled === false ? false : true,
    autoSubmitEnabled: true
  };
  if (exactIndex >= 0) {
    overrides[exactIndex] = nextRule;
  } else {
    overrides.push(nextRule);
  }

  await chrome.storage.local.set({ siteOverrides: overrides });
  setMessage(`Auto-submit enabled for ${host}.`);
}

async function getCurrentSiteOverrideContext() {
  const result = await send({ type: 'KBB_QUERY_LOGINS' });
  const url = result.url || elements.currentUrl.textContent || '';
  const host = hostFromUrl(url);
  if (!host) {
    throw new Error('Current page URL is not available.');
  }

  elements.currentUrl.textContent = url;
  currentEntries = sortCredentialEntries(result.entries || currentEntries || []);

  const settings = await chrome.storage.local.get(['siteOverrides']);
  const overrides = normalizeSiteOverrides(settings.siteOverrides);
  const exactIndex = overrides.findIndex((rule) => rule.host === host);
  const exact = exactIndex >= 0 ? overrides[exactIndex] : null;
  const effective = findBestSiteOverride(overrides, host);
  const inherited = findBestSiteOverride(overrides, host, exactIndex);
  return { host, overrides, exactIndex, exact, effective, inherited };
}

async function fillLogin(credential, fieldRole, customFieldName) {
  ensureCredentialActionsEnabled();
  const result = await send({
    type: 'KBB_FILL_LOGIN',
    credential,
    fieldRole: fieldRole || '',
    customFieldName: customFieldName || ''
  });
  if (result && result.filled === false) {
    throw new Error(result.error || 'The page could not be filled.');
  }

  setMessage(fieldRole ? `${fieldRoleLabel(fieldRole, customFieldName)} filled into focused field.` : 'Login filled.');
}

function fieldRoleLabel(fieldRole, customFieldName) {
  if (fieldRole === 'username') return 'Username';
  if (fieldRole === 'password') return 'Password';
  if (fieldRole === 'otp') return 'OTP';
  if (fieldRole === 'custom') return customFieldName || 'Custom field';
  return 'Value';
}

async function copyToClipboard(label, text) {
  ensureCredentialActionsEnabled();
  if (!text) {
    throw new Error(`${label} is empty.`);
  }

  const clearAfterMs = await getClipboardClearDelayMs();
  const result = await send({
    type: 'KBB_COPY_TO_CLIPBOARD',
    text,
    clearAfterMs
  });
  if (!result || result.success === false) {
    throw new Error(result && result.error ? result.error : `${label} could not be copied.`);
  }

  setMessage(`Copied ${label} to clipboard.`);
}

async function getClipboardClearDelayMs() {
  const settings = await chrome.storage.local.get(['clipboardClearDelay']);
  const seconds = Number(settings.clipboardClearDelay);
  if (Number.isFinite(seconds) && seconds >= 0 && seconds <= MAX_CLIPBOARD_CLEAR_DELAY_SECONDS) {
    return seconds * 1000;
  }

  return DEFAULT_CLIPBOARD_CLEAR_DELAY_SECONDS * 1000;
}

async function updateLogin(entry, form) {
  ensureCredentialActionsEnabled();
  ensureWriteActionsEnabled();
  const login = {
    entryId: entry.EntryId,
    title: form.querySelector('[name="title"]').value,
    group: form.querySelector('[name="group"]').value,
    url: form.querySelector('[name="url"]').value,
    userName: form.querySelector('[name="userName"]').value,
    password: form.querySelector('[name="password"]').value,
    clearOtp: form.querySelector('[name="clearOtp"]').checked
  };
  if (!login.clearOtp) {
    addOptionalSecret(login, 'otp', form.querySelector('[name="otp"]').value);
  }
  login.replaceCustomFields = true;
  addOptionalCustomField(login, form);

  const result = await send({ type: 'KBB_UPDATE_LOGIN', login });
  if (!result || !result.Success) {
    throw new Error(result && result.Error ? result.Error : 'KeePass entry could not be updated.');
  }

  Object.assign(entry, result.Entry || {}, {
    Title: login.title,
    Group: login.group,
    Url: login.url,
    UserName: login.userName,
    Password: login.password,
    CustomFields: result.Entry && result.Entry.CustomFields ? result.Entry.CustomFields : entry.CustomFields
  });
  await renderResults(currentEntries);
  setMessage('Entry updated.');
}

async function createLogin(form) {
  ensureCredentialActionsEnabled();
  ensureWriteActionsEnabled();
  const login = {
    title: form.querySelector('[name="title"]').value,
    group: form.querySelector('[name="group"]').value,
    url: form.querySelector('[name="url"]').value,
    userName: form.querySelector('[name="userName"]').value,
    password: form.querySelector('[name="password"]').value
  };
  addOptionalSecret(login, 'otp', form.querySelector('[name="otp"]').value);
  addOptionalCustomField(login, form);

  const result = await send({ type: 'KBB_CREATE_LOGIN', login });
  if (!result || !result.Success) {
    throw new Error(result && result.Error ? result.Error : 'KeePass entry could not be created.');
  }

  const entry = mergeCreatedEntry(login, result.Entry);
  currentEntries = sortCredentialEntries([entry].concat(currentEntries || []));
  await renderResults(currentEntries);
  setMessage('Entry created.');
}

function mergeCreatedEntry(login, resultEntry) {
  const entry = resultEntry || {};
  return Object.assign({}, entry, {
    Title: entry.Title || login.title,
    Group: entry.Group || login.group,
    Url: entry.Url || login.url,
    UserName: entry.UserName || login.userName,
    Password: login.password,
    CustomFields: entry.CustomFields || []
  });
}

function addOptionalSecret(payload, name, value) {
  const trimmed = String(value || '').trim();
  if (trimmed) {
    payload[name] = trimmed;
  }
}

function addOptionalCustomField(payload, form) {
  const fields = Array.from(form.querySelectorAll('.custom-field-row'))
    .map((row) => ({
      name: String(row.querySelector('[name="customFieldName"]')?.value || '').trim(),
      value: String(row.querySelector('[name="customFieldValue"]')?.value || '').trim(),
      isProtected: false
    }))
    .filter((field) => field.name && field.value);

  const seenNames = new Set();
  for (const field of fields) {
    const key = field.name.toLowerCase();
    if (seenNames.has(key)) {
      throw new Error(`Custom field "${field.name}" is duplicated.`);
    }
    seenNames.add(key);
  }

  if (fields.length) {
    payload.customFields = fields;
  }
}

async function filterCurrentLogins() {
  await renderResults(currentEntries);
  const total = currentEntries.length;
  const shown = visibleEntries.length;
  const hasQuery = Boolean(elements.loginSearch.value.trim());
  if (hasQuery) {
    setMessage(`${shown} of ${total} login(s) shown.`);
  }
}

async function refreshState() {
  const state = await send({ type: 'KBB_GET_STATE' });
  renderState(await hydrateStatePermissions(state));
  setMessage(state.paired ? 'Ready to query KeePass.' : 'Pair this browser with KeePass.');
}

async function hydrateStatePermissions(state) {
  if (!state || !state.paired || state.locked) {
    return state;
  }

  try {
    const status = await send({ type: 'KBB_STATUS' });
    return {
      ...state,
      trusted: status.Trusted === true,
      permissions: normalizeClientPermissions(status.Permissions)
    };
  } catch (error) {
    return state;
  }
}

async function renderAbout() {
  await refreshAboutMetadata();
}

async function refreshAboutMetadata() {
  const about = await send({ type: 'KBB_GET_ABOUT' });
  const passkeysEnabled = about.pluginPasskeysEnabled === true;
  elements.aboutVersion.textContent = about.version || 'Unknown';
  elements.aboutPluginVersion.textContent = about.pluginVersion || 'Unavailable';
  elements.aboutBrowserId.textContent = about.browserId || 'Unknown';
  elements.repositoryLink.href = about.repositoryUrl || '#';
  elements.releasesLink.href = about.releasesUrl || '#';
  if (bridgePasskeysEnabled !== passkeysEnabled) {
    bridgePasskeysEnabled = passkeysEnabled;
    if (trustedBrowserClients.length && !elements.clientsPanel.classList.contains('hidden')) {
      renderClients(trustedBrowserClients);
    }
  } else {
    bridgePasskeysEnabled = passkeysEnabled;
  }
  renderPasskeySection(about);
  return about;
}

async function togglePasskeys() {
  const enabled = elements.passkeyToggle.checked;
  try {
    const result = await send({ type: 'KBB_SET_PASSKEYS_ENABLED', enabled });
    elements.passkeyToggle.checked = result.passkeysEnabled === true;
    elements.passkeyStatus.textContent = result.passkeysEnabled ? 'Passkeys are active' : 'Passkeys disabled';
  } catch (error) {
    elements.passkeyToggle.checked = !enabled;
    elements.passkeyStatus.textContent = 'Failed: ' + (error.message || 'unknown error');
  }
}

function renderPasskeySection(about) {
  if (!elements.passkeySection) return;
  if (!about.pluginFeatures || !about.pluginFeatures.passkeys) {
    elements.passkeySection.style.display = 'none';
    return;
  }
  elements.passkeySection.style.display = '';
  elements.passkeyToggle.checked = currentState.passkeysEnabled === true;
  const status = about.pluginPasskeysStatus;
  if (status === 'enabled') {
    elements.passkeyStatus.textContent = 'Passkeys are active';
  } else if (status === 'prototype_disabled') {
    elements.passkeyStatus.textContent = 'Backend ready — enable above to activate WebAuthn';
  } else {
    elements.passkeyStatus.textContent = 'Passkeys are disabled';
  }
}

async function showAbout() {
  await refreshAboutMetadata();
  document.querySelector('.about')?.scrollIntoView({ behavior: 'smooth' });
}

async function checkUpdates() {
  const result = await send({ type: 'KBB_CHECK_UPDATES' });
  if (result.updateAvailable) {
    elements.releasesLink.href = result.releaseUrl || elements.releasesLink.href;
    setMessage(`Update ${result.latestVersion} is available. Open GitHub Releases to install it.`);
    return;
  }

  setMessage(`KeePass Browser Bridge ${result.currentVersion} is up to date.`);
}

function renderState(state) {
  currentState = state || {};
  elements.endpoint.value = state.endpoint || '';
  elements.autoFill.checked = Boolean(state.autoFillEnabled);
  elements.autoSubmit.checked = Boolean(state.autoSubmitEnabled);
  if (elements.passkeySection && elements.passkeySection.style.display !== 'none') {
    elements.passkeyToggle.checked = Boolean(state.passkeysEnabled);
  }
  const lockSpan = elements.lockBridge?.querySelector('span');
  if (lockSpan) {
    lockSpan.textContent = state.locked ? 'Unlock' : 'Lock';
  } else {
    elements.lockBridge.textContent = state.locked ? 'Unlock' : 'Lock';
  }
  const pairingActive = !state.paired && Boolean(state.pairingSessionId);
  elements.pairingPanel.classList.toggle('hidden', !pairingActive);
  if (!pairingActive) {
    clearPairingTimers();
    elements.pairingCode.value = '';
    elements.pairingTimer.textContent = '';
  } else {
    schedulePairingTimers(state);
  }
  if (state.locked) {
    setStatus('Locked', 'error');
  } else {
    setStatus(state.paired ? 'Paired' : 'Unpaired', state.paired ? 'paired' : '');
  }
  renderStateNotice(state, pairingActive);
  syncCredentialActionAvailability();
  syncPairingCodeState();
  if (!credentialActionsEnabled()) {
    clearRenderedCredentials();
  }
  if (!manageClientActionsEnabled()) {
    clearRenderedClients();
  }
  if (pairingActive) {
    elements.pairingCode.focus();
  }
}

function schedulePairingTimers(state) {
  clearPairingTimers();
  const expiresAt = Number(state && state.pairingExpiresAt ? state.pairingExpiresAt : 0);
  if (!expiresAt) {
    elements.pairingTimer.textContent = '';
    return;
  }

  updatePairingCountdown(expiresAt);
  pairingCountdownTimer = setInterval(() => {
    updatePairingCountdown(expiresAt);
  }, 1000);

  const delay = Math.max(0, expiresAt - Date.now());
  pairingExpiryTimer = setTimeout(() => {
    expirePairingSession();
  }, delay);
}

function updatePairingCountdown(expiresAt) {
  elements.pairingTimer.textContent = formatPairingTimeRemaining(expiresAt);
}

function clearPairingTimers() {
  if (pairingExpiryTimer) {
    clearTimeout(pairingExpiryTimer);
    pairingExpiryTimer = null;
  }

  if (pairingCountdownTimer) {
    clearInterval(pairingCountdownTimer);
    pairingCountdownTimer = null;
  }
}

function renderStateNotice(state, pairingActive) {
  let text = '';
  let warning = false;
  if (state.locked) {
    text = 'Unlock KeePass Bridge to find, fill, create, or update logins.';
    warning = true;
  } else if (pairingActive) {
    text = 'Enter the six digit code shown in KeePass to finish pairing.';
  } else if (state.paired && !hasClientPermission('write')) {
    text = 'Read-only access: this browser can find logins, but cannot create or update KeePass entries.';
  } else if (state.paired) {
    text = 'Ready to find, fill, create, and update KeePass logins.';
  } else {
    text = 'Pair this browser with KeePass to query and fill logins.';
  }

  elements.stateNotice.textContent = text;
  elements.stateNotice.classList.toggle('warning', warning);
}

function syncCredentialActionAvailability() {
  const enabled = credentialActionsEnabled();
  elements.queryLogins.disabled = !enabled;
  elements.newLogin.disabled = !enabled || !hasClientPermission('write');
  elements.toggleSiteAutoFill.disabled = !enabled;
  elements.toggleSiteAutoSubmit.disabled = !enabled;
  elements.listClients.disabled = !manageClientActionsEnabled();
}

function credentialActionsEnabled() {
  return Boolean(currentState && currentState.paired && !currentState.locked);
}

function manageClientActionsEnabled() {
  return credentialActionsEnabled() && hasClientPermission('manageClients');
}

function ensureCredentialActionsEnabled() {
  if (!credentialActionsEnabled()) {
    throw new Error('Unlock KeePass Bridge to use logins.');
  }
}

function ensureWriteActionsEnabled() {
  if (!hasClientPermission('write')) {
    throw new Error('This browser is read-only. Enable Write permission to create or update KeePass entries.');
  }
}

function ensureManageClientActionsEnabled() {
  if (!manageClientActionsEnabled()) {
    throw new Error('Manage browser permission is required to manage trusted browsers.');
  }
}

async function failClosedManageClientAccess(error) {
  const message = error && error.message ? error.message : String(error || '');
  if (!/permission|not allowed/i.test(message)) {
    return;
  }

  const hydrated = await hydrateStatePermissions(currentState);
  const permissions = normalizeClientPermissions(hydrated && hydrated.permissions)
    .filter((permission) => permission !== 'manageClients');
  renderState({
    ...hydrated,
    permissions
  });
}

function clearRenderedCredentials() {
  currentEntries = [];
  visibleEntries = [];
  elements.loginSearch.value = '';
  elements.loginSearch.classList.add('hidden');
  elements.results.textContent = '';
}

function clearRenderedClients() {
  trustedBrowserClients = [];
  elements.clientsPanel.classList.add('hidden');
  elements.clientsPanel.textContent = '';
}

function hasClientPermission(permission) {
  if (!currentState || !Array.isArray(currentState.permissions) || !currentState.permissions.length) {
    return false;
  }

  return currentState.permissions.includes(permission);
}

function syncPairingCodeState() {
  const code = String(elements.pairingCode.value || '').trim();
  const pairingActive = !elements.pairingPanel.classList.contains('hidden');
  elements.completePair.disabled = !pairingActive || !/^\d{6}$/.test(code);
}

function formatPairingTimeRemaining(expiresAt) {
  const remainingSeconds = Math.max(0, Math.ceil((Number(expiresAt || 0) - Date.now()) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  return `Code expires in ${minutes}:${seconds}`;
}

async function renderResults(entries) {
  elements.results.textContent = '';
  currentEntries = sortCredentialEntries(entries || []);
  updateSearchVisibility();
  const showPasswords = await shouldShowPasswordsInPopup();
  visibleEntries = filterEntries(currentEntries, elements.loginSearch.value);

  if (!currentEntries.length) {
    renderNoLoginsEmptyState();
    return;
  }

  if (currentEntries.length && !visibleEntries.length) {
    renderFilteredEmptyState();
    return;
  }

  const avatarColors = ['#176b87', '#b42318', '#067647', '#b54708', '#6941c6', '#363f72', '#c01048', '#175cd3'];
  const maxUsage = Math.max(...visibleEntries.map((e) => Number(e.UsageCount || 0)), 0);

  for (const entry of visibleEntries) {
    const item = document.createElement('article');
    item.className = 'login';

    const header = document.createElement('div');
    header.className = 'login-header';

    const colorIndex = (entry.Title || '').length % avatarColors.length;
    const avatar = document.createElement('div');
    avatar.className = 'login-avatar';
    avatar.style.backgroundColor = avatarColors[colorIndex];
    avatar.textContent = (entry.Title || '?')[0].toUpperCase();

    const info = document.createElement('div');
    info.className = 'login-info';

    const titleRow = document.createElement('div');
    titleRow.className = 'login-title-row';

    const title = document.createElement('div');
    title.className = 'login-title';
    title.textContent = entry.Title || '(Untitled)';

    titleRow.append(title);

    if (entry.UsageCount > 0) {
      const rank = document.createElement('span');
      rank.className = 'login-rank';
      rank.textContent = entry.UsageCount >= maxUsage && maxUsage > 0 ? 'Most used' : 'Frequent';
      titleRow.append(rank);
    }

    const username = document.createElement('div');
    username.className = 'login-username';
    username.textContent = entry.UserName || '';

    const meta = document.createElement('div');
    meta.className = 'login-meta';
    meta.textContent = [entry.Group, entry.Url].filter(Boolean).join(' - ');

    info.append(titleRow, username);
    header.append(avatar, info);

    const secret = document.createElement('div');
    secret.className = 'login-secret';
    secret.textContent = showPasswords && entry.Password ? `Password: ${entry.Password}` : '';

    const actions = document.createElement('div');
    actions.className = 'login-actions';

    const fill = document.createElement('button');
    fill.type = 'button';
    fill.className = 'fill-login-btn';
    fill.textContent = '✓ Fill';
    fill.addEventListener('click', () => runAction(() => fillLogin(entry)));

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'secondary';
    edit.textContent = '✎ Edit';
    edit.disabled = !hasClientPermission('write');
    edit.addEventListener('click', () => showEditForm(item, entry));

    actions.append(fill, edit);
    if (entry.UserName) {
      actions.append(createFieldFillButton('User Field', entry, 'username'));
    }
    if (entry.Password) {
      actions.append(createFieldFillButton('Pass Field', entry, 'password'));
    }
    if (entry.OneTimePassword) {
      actions.append(createFieldFillButton('OTP Field', entry, 'otp'));
    }
    item.append(header, meta);
    if (secret.textContent) {
      item.append(secret);
    }
    item.append(actions);

    const copyActions = document.createElement('div');
    copyActions.className = 'copy-actions';
    if (entry.UserName) {
      copyActions.appendChild(createCopyButton('Copy User', 'username', entry.UserName));
    }
    if (entry.Password) {
      copyActions.appendChild(createCopyButton('Copy Pass', 'password', entry.Password));
    }
    if (entry.OneTimePassword) {
      copyActions.appendChild(createCopyButton('Copy OTP', 'OTP', entry.OneTimePassword));
    }
    if (copyActions.children.length) {
      item.append(copyActions);
    }

    // Add custom fields display
    if (entry.CustomFields && entry.CustomFields.length > 0) {
      const customFieldsDiv = document.createElement('div');
      customFieldsDiv.className = 'custom-fields';
      
      for (const field of entry.CustomFields) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'custom-field';
        fieldDiv.innerHTML = `
          <span class="field-name">${escapeHtml(field.Name)}:</span>
          <span class="field-value">${field.IsProtected ? '••••••••' : escapeHtml(field.Value)}</span>
        `;

        if (!field.IsProtected) {
          const fillBtn = document.createElement('button');
          fillBtn.type = 'button';
          fillBtn.className = 'field-fill-btn';
          fillBtn.title = `Fill focused field with ${field.Name}`;
          fillBtn.textContent = `Fill ${field.Name}`;
          fillBtn.addEventListener('click', () => runAction(() => fillLogin(entry, 'custom', field.Name)));
          fieldDiv.append(fillBtn);

          const copyBtn = document.createElement('button');
          copyBtn.type = 'button';
          copyBtn.className = 'copy-btn';
          copyBtn.title = 'Copy to clipboard';
          copyBtn.textContent = '📋';
          copyBtn.addEventListener('click', () => runAction(() => copyToClipboard(field.Name, field.Value)));
          fieldDiv.append(copyBtn);
        }
        
        customFieldsDiv.appendChild(fieldDiv);
      }
      
      item.appendChild(customFieldsDiv);
    }

    elements.results.append(item);
  }
}

function renderFilteredEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'login-empty login-empty-actionable';

  const title = document.createElement('div');
  title.className = 'login-empty-title';
  title.textContent = 'No matching logins in this list.';

  const hint = document.createElement('div');
  hint.className = 'login-empty-hint';
  hint.textContent = 'Clear the search to show all matching KeePass entries.';

  const clear = document.createElement('button');
  clear.id = 'clearLoginSearch';
  clear.type = 'button';
  clear.className = 'secondary';
  clear.textContent = 'Clear Search';
  clear.addEventListener('click', () => runAction(clearLoginSearch));

  empty.append(title, hint, clear);
  elements.results.append(empty);
}

function renderNoLoginsEmptyState() {
  const empty = document.createElement('div');
  empty.className = 'login-empty login-empty-actionable';

  const title = document.createElement('div');
  title.className = 'login-empty-title';
  title.textContent = 'No KeePass logins found for this page.';

  const hint = document.createElement('div');
  hint.className = 'login-empty-hint';
  hint.textContent = 'Create a new entry or adjust URL matching in settings.';

  const create = document.createElement('button');
  create.id = 'emptyCreateLogin';
  create.type = 'button';
  create.textContent = '+ New Login';
  create.addEventListener('click', () => runAction(beginCreateLogin));

  empty.append(title, hint, create);
  elements.results.append(empty);
}

async function clearLoginSearch() {
  elements.loginSearch.value = '';
  await renderResults(currentEntries);
  setMessage(`${currentEntries.length} login(s) found.`);
  elements.loginSearch.focus();
}

async function shouldShowPasswordsInPopup() {
  const settings = await chrome.storage.local.get(['showPasswordsInPopup']);
  return settings.showPasswordsInPopup === true;
}

function createCopyButton(text, label, value) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary';
  button.textContent = text;
  button.addEventListener('click', () => runAction(() => copyToClipboard(label, value)));
  return button;
}

function createFieldFillButton(text, entry, fieldRole) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary';
  button.textContent = text;
  button.addEventListener('click', () => runAction(() => fillLogin(entry, fieldRole)));
  return button;
}

function renderClients(clients) {
  elements.clientsPanel.textContent = '';

  for (const client of clients) {
    const item = document.createElement('article');
    item.className = 'client';

    const name = document.createElement('div');
    name.className = 'client-title';
    name.textContent = client.ClientName || 'Browser';

    const meta = document.createElement('div');
    meta.className = 'client-meta';
    meta.textContent = [
      client.Current ? 'This browser' : '',
      client.ExtensionOrigin || '',
      `Created: ${formatDate(client.CreatedUtcMs)}`,
      `Last used: ${formatDate(client.LastUsedUtcMs)}`,
      formatClientPermissions(client.Permissions)
    ].filter(Boolean).join(' - ');

    const permissions = createClientPermissionControls(client);

    const revoke = document.createElement('button');
    revoke.type = 'button';
    revoke.className = 'secondary';
    revoke.textContent = client.Current ? '✕ Revoke This Browser' : '✕ Revoke';
    revoke.disabled = !manageClientActionsEnabled();
    revoke.addEventListener('click', () => runAction(() => revokeClient(client)));

    item.append(name, meta, permissions, revoke);
    elements.clientsPanel.append(item);
  }

  if (!clients.length) {
    const empty = document.createElement('div');
    empty.className = 'client-meta';
    empty.textContent = 'No trusted browsers.';
    elements.clientsPanel.append(empty);
  }
}

function createClientPermissionControls(client) {
  const wrapper = document.createElement('div');
  wrapper.className = 'client-permissions';

  for (const definition of getPermissionDefinitions()) {
    const label = document.createElement('label');
    label.className = 'client-permission';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.permission = definition.value;
    checkbox.checked = normalizeClientPermissions(client.Permissions).includes(definition.value);
    checkbox.disabled = definition.value === 'read' || !manageClientActionsEnabled();
    checkbox.addEventListener('change', () => runAction(() =>
      updateClientPermissions(client, definition.value, checkbox.checked)
    ));

    const text = document.createElement('span');
    text.textContent = definition.label;

    label.append(checkbox, text);
    wrapper.append(label);
  }

  return wrapper;
}

function formatClientPermissions(permissions) {
  const labels = Object.fromEntries(getPermissionDefinitions().map((definition) => [definition.value, definition.label]));
  const values = normalizeClientPermissions(permissions);
  return values
    .map((permission) => labels[permission])
    .filter(Boolean)
    .join(', ');
}

function normalizeClientPermissions(permissions) {
  const allowed = getPermissionDefinitions().map((definition) => definition.value);
  const normalized = ['read'];
  for (const permission of Array.isArray(permissions) ? permissions : []) {
    if (allowed.includes(permission) && !normalized.includes(permission)) {
      normalized.push(permission);
    }
  }

  return normalized;
}

function getPermissionDefinitions() {
  const definitions = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'manageClients', label: 'Manage browsers' }
  ];
  if (bridgePasskeysEnabled) {
    definitions.push(
      { value: 'passkeyRead', label: 'Passkey read' },
      { value: 'passkeyWrite', label: 'Passkey write' }
    );
  }
  return definitions;
}

function formatDate(ms) {
  const value = Number(ms || 0);
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleString();
}

function sortCredentialEntries(entries) {
  return (entries || [])
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const usageDelta = Number(right.entry.UsageCount || 0) - Number(left.entry.UsageCount || 0);
      if (usageDelta !== 0) return usageDelta;

      const lastUsedDelta = Number(right.entry.LastUsed || 0) - Number(left.entry.LastUsed || 0);
      if (lastUsedDelta !== 0) return lastUsedDelta;

      return left.index - right.index;
    })
    .map((item) => item.entry);
}

function updateSearchVisibility() {
  const show = currentEntries.length > 1;
  elements.loginSearch.classList.toggle('hidden', !show);
  if (!show) {
    elements.loginSearch.value = '';
  }
}

function filterEntries(entries, query) {
  const words = String(query || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return entries || [];

  return (entries || []).filter((entry) => {
    const text = credentialSearchText(entry);
    return words.every((word) => text.indexOf(word) !== -1);
  });
}

function credentialSearchText(entry) {
  const customText = (entry.CustomFields || [])
    .map((field) => {
      if (!field) return '';
      return [field.Name || '', field.IsProtected ? '' : field.Value || ''].join(' ');
    })
    .join(' ');
  return [
    entry.Title || '',
    entry.Group || '',
    entry.UserName || '',
    entry.Url || '',
    customText
  ].join(' ').toLowerCase();
}

function showCreateForm(url, pageCredential) {
  elements.results.textContent = '';
  visibleEntries = [];
  elements.loginSearch.classList.add('hidden');
  elements.loginSearch.value = '';
  const form = document.createElement('form');
  form.className = 'create-form edit-form';
  form.innerHTML = `
    <label>Title<input name="title" type="text"></label>
    <label>Group<input name="group" type="text" spellcheck="false" placeholder="Accounts/Work"></label>
    <label>Username<input name="userName" type="text" autocomplete="username"></label>
    <label>URL<input name="url" type="url" spellcheck="false"></label>
    <label>Password
      <div class="password-row">
        <input name="password" type="password" autocomplete="new-password">
        <button type="button" class="secondary" data-action="generate-password">Generate</button>
        <button type="button" class="secondary" data-action="toggle-password-visibility">Show</button>
      </div>
    </label>
    <label>TOTP secret<input name="otp" type="password" spellcheck="false" autocomplete="off" placeholder="Base32 or otpauth:// URI"></label>
    <div class="custom-fields" data-custom-fields>
      <div class="field-row-heading">
        <span>Custom fields</span>
        <button type="button" class="secondary" data-action="add-custom-field">Add field</button>
      </div>
    </div>
    <div class="login-actions">
      <button type="submit">✓ Save</button>
      <button type="button" class="secondary" data-action="cancel">✕ Cancel</button>
    </div>
  `;

  form.querySelector('[name="title"]').value = titleFromUrl(url);
  form.querySelector('[name="url"]').value = url || '';
  if (pageCredential) {
    form.querySelector('[name="userName"]').value = pageCredential.userName || '';
    form.querySelector('[name="password"]').value = pageCredential.password || '';
  }
  form.querySelector('[data-action="generate-password"]').addEventListener('click', () => {
    const passwordInput = form.querySelector('[name="password"]');
    passwordInput.value = generatePassword(20);
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    passwordInput.focus();
    setMessage('Generated a new password. Save to create the KeePass entry.');
  });
  initializeCustomFields(form, []);
  wirePasswordVisibilityToggle(form);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runAction(() => createLogin(form));
  });
  form.querySelector('[data-action="cancel"]').addEventListener('click', () => {
    runAction(async () => {
      await renderResults(currentEntries);
      setMessage(currentEntries.length ? `${currentEntries.length} login(s) found.` : 'No matching logins found.');
    });
  });
  elements.results.append(form);
}

function titleFromUrl(url) {
  try {
    return new URL(url).hostname || 'New Login';
  } catch (error) {
    return 'New Login';
  }
}

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch (error) {
    return '';
  }
}

function normalizeSiteOverrides(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((rule) => ({
      host: normalizeOverrideHost(rule && rule.host),
      autoFillEnabled: rule ? rule.autoFillEnabled : undefined,
      autoSubmitEnabled: rule ? rule.autoSubmitEnabled : undefined
    }))
    .filter((rule) => rule.host);
}

function findBestSiteOverride(overrides, host, ignoredIndex) {
  let bestRule = null;
  let bestRuleHostLength = -1;
  for (let index = 0; index < overrides.length; index += 1) {
    if (index === ignoredIndex) {
      continue;
    }

    const rule = overrides[index];
    const ruleHost = normalizeOverrideHost(rule && rule.host);
    if (!hostMatchesSiteOverride(host, ruleHost) || ruleHost.length <= bestRuleHostLength) {
      continue;
    }

    bestRule = rule;
    bestRuleHostLength = ruleHost.length;
  }

  return bestRule;
}

function hostMatchesSiteOverride(host, ruleHost) {
  const normalizedHost = normalizeOverrideHost(host);
  const normalizedRuleHost = normalizeOverrideHost(ruleHost);
  if (!normalizedHost || !normalizedRuleHost) {
    return false;
  }

  return normalizedHost === normalizedRuleHost || normalizedHost.endsWith(`.${normalizedRuleHost}`);
}

function normalizeOverrideHost(value) {
  const trimmed = String(value || '').trim().toLowerCase();
  if (!trimmed) {
    return '';
  }

  let host;
  try {
    const parsed = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    host = parsed.hostname;
  } catch (error) {
    host = trimmed;
  }

  host = host.replace(/^\.+|\.+$/g, '');
  return isValidSiteOverrideHost(host) ? host : '';
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

function showEditForm(item, entry) {
  if (!hasClientPermission('write')) {
    setMessage('This browser is read-only. Enable Write permission to create or update KeePass entries.', true);
    return;
  }

  const existing = item.querySelector('.edit-form');
  if (existing) {
    existing.remove();
    return;
  }

  const form = document.createElement('form');
  form.className = 'edit-form';
  form.innerHTML = `
    <label>Title<input name="title" type="text"></label>
    <label>Group<input name="group" type="text" spellcheck="false" placeholder="Accounts/Work"></label>
    <label>Username<input name="userName" type="text" autocomplete="username"></label>
    <label>URL<input name="url" type="url" spellcheck="false"></label>
    <label>Password
      <div class="password-row">
        <input name="password" type="password" autocomplete="current-password">
        <button type="button" class="secondary" data-action="generate-password">Generate</button>
        <button type="button" class="secondary" data-action="toggle-password-visibility">Show</button>
      </div>
    </label>
    <label>TOTP secret<input name="otp" type="password" spellcheck="false" autocomplete="off" placeholder="Leave blank to keep existing"></label>
    <label><input name="clearOtp" type="checkbox"> Clear TOTP secret</label>
    <div class="custom-fields" data-custom-fields>
      <div class="field-row-heading">
        <span>Custom fields</span>
        <button type="button" class="secondary" data-action="add-custom-field">Add field</button>
      </div>
    </div>
    <div class="login-actions">
      <button type="submit">✓ Save</button>
      <button type="button" class="secondary" data-action="cancel">✕ Cancel</button>
    </div>
  `;

  form.querySelector('[name="title"]').value = entry.Title || '';
  form.querySelector('[name="group"]').value = entry.Group || '';
  form.querySelector('[name="userName"]').value = entry.UserName || '';
  form.querySelector('[name="url"]').value = entry.Url || '';
  form.querySelector('[name="password"]').value = entry.Password || '';
  initializeCustomFields(form, editableCustomFields(entry));
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runAction(() => updateLogin(entry, form));
  });
  form.querySelector('[data-action="generate-password"]').addEventListener('click', () => {
    const passwordInput = form.querySelector('[name="password"]');
    passwordInput.value = generatePassword(20);
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    passwordInput.focus();
    setMessage('Generated a new password. Save to update KeePass.');
  });
  wirePasswordVisibilityToggle(form);
  form.querySelector('[data-action="cancel"]').addEventListener('click', () => form.remove());
  item.append(form);
}

function editableCustomFields(entry) {
  const fields = entry && Array.isArray(entry.CustomFields) ? entry.CustomFields : [];
  return fields.filter((field) => field && !field.IsProtected && field.Name && field.Value);
}

function initializeCustomFields(form, fields) {
  const container = form.querySelector('[data-custom-fields]');
  if (!container) return;
  const values = fields && fields.length ? fields : [{ Name: '', Value: '' }];
  for (const field of values) {
    appendCustomFieldRow(container, field);
  }

  const add = form.querySelector('[data-action="add-custom-field"]');
  if (add) {
    add.addEventListener('click', () => appendCustomFieldRow(container, { Name: '', Value: '' }));
  }
}

function appendCustomFieldRow(container, field) {
  const row = document.createElement('div');
  row.className = 'custom-field-row';
  row.innerHTML = `
    <label>Field<input name="customFieldName" type="text" spellcheck="false" placeholder="Tenant"></label>
    <label>Value<input name="customFieldValue" type="text" spellcheck="false" placeholder="production"></label>
    <button type="button" class="secondary" data-action="remove-custom-field" title="Remove custom field">Remove</button>
  `;
  row.querySelector('[name="customFieldName"]').value = field ? field.Name || '' : '';
  row.querySelector('[name="customFieldValue"]').value = field ? field.Value || '' : '';
  row.querySelector('[data-action="remove-custom-field"]').addEventListener('click', () => {
    const rows = container.querySelectorAll('.custom-field-row');
    if (rows.length <= 1) {
      row.querySelector('[name="customFieldName"]').value = '';
      row.querySelector('[name="customFieldValue"]').value = '';
      return;
    }
    row.remove();
  });
  container.append(row);
}

function wirePasswordVisibilityToggle(form) {
  const passwordInput = form.querySelector('[name="password"]');
  const toggle = form.querySelector('[data-action="toggle-password-visibility"]');
  if (!passwordInput || !toggle) return;

  toggle.addEventListener('click', () => {
    const visible = passwordInput.type === 'text';
    passwordInput.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Show' : 'Hide';
    passwordInput.focus();
  });
}

function generatePassword(length) {
  const targetLength = Math.max(12, Number(length || 20));
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+';
  const bytes = new Uint8Array(targetLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
}

async function runAction(action) {
  setBusy(true);
  clearMessage();

  try {
    await action();
  } catch (error) {
    setStatus('Error', 'error');
    setMessage(error && error.message ? error.message : String(error), true);
  } finally {
    setBusy(false);
  }
}

function setBusy(isBusy) {
  for (const button of document.querySelectorAll('button')) {
    button.disabled = isBusy;
  }
  if (!isBusy) {
    syncCredentialActionAvailability();
    syncPairingCodeState();
  }
}

function setStatus(text, kind) {
  elements.statusBadge.textContent = text;
  elements.statusBadge.classList.toggle('paired', kind === 'paired');
  elements.statusBadge.classList.toggle('error', kind === 'error');
}

function setMessage(text, isError) {
  elements.message.textContent = text;
  elements.message.classList.toggle('error', Boolean(isError));
}

function clearMessage() {
  setMessage('', false);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function send(message) {
  return chrome.runtime.sendMessage(message).then((result) => {
    if (!result || !result.ok) {
      throw new Error(result && result.error ? result.error : 'Extension request failed.');
    }

    return result.response;
  });
}
