'use strict';

const DEFAULT_SETTINGS = {
  theme: 'system',
  autoFillEnabled: true,
  autoSubmitEnabled: false,
  autoFillDelay: 1200,
  strictUrlMatching: false,
  regexUrlMatching: false,
  showPasswordsInPopup: false,
  notificationsEnabled: true,
  autoLockTimeoutMinutes: 0,
  clipboardClearDelay: 30,
  debugMode: false,
  siteOverrides: []
};

const DEFAULT_ENDPOINT = 'http://127.0.0.1:19455/bridge';

const SENSITIVE_SETTING_KEYS = [
  'clientId',
  'sharedSecret',
  'pairingSessionId',
  'pairingStartedAt',
  'locked',
  'lastCredentialActivityAt'
];

let siteOverrides = [];
let trustedBrowserClients = [];
let bridgePasskeysEnabled = false;

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  bridgeEndpoint: document.getElementById('bridgeEndpoint'),
  bridgeStatus: document.getElementById('bridgeStatus'),
  checkBridgeStatus: document.getElementById('checkBridgeStatus'),
  theme: document.getElementById('theme'),
  autoFillEnabled: document.getElementById('autoFillEnabled'),
  autoSubmitEnabled: document.getElementById('autoSubmitEnabled'),
  autoFillDelay: document.getElementById('autoFillDelay'),
  strictUrlMatching: document.getElementById('strictUrlMatching'),
  regexUrlMatching: document.getElementById('regexUrlMatching'),
  showPasswordsInPopup: document.getElementById('showPasswordsInPopup'),
  notificationsEnabled: document.getElementById('notificationsEnabled'),
  autoLockTimeoutMinutes: document.getElementById('autoLockTimeoutMinutes'),
  clipboardClearDelay: document.getElementById('clipboardClearDelay'),
  debugMode: document.getElementById('debugMode'),
  refreshTrustedBrowsers: document.getElementById('refreshTrustedBrowsers'),
  trustedBrowserList: document.getElementById('trustedBrowserList'),
  siteOverrideHost: document.getElementById('siteOverrideHost'),
  siteOverrideAutoFill: document.getElementById('siteOverrideAutoFill'),
  siteOverrideAutoSubmit: document.getElementById('siteOverrideAutoSubmit'),
  addSiteOverride: document.getElementById('addSiteOverride'),
  siteOverrideList: document.getElementById('siteOverrideList'),
  exportSettings: document.getElementById('exportSettings'),
  importSettings: document.getElementById('importSettings'),
  importFile: document.getElementById('importFile'),
  resetSettings: document.getElementById('resetSettings'),
  aboutVersion: document.getElementById('aboutVersion'),
  aboutPluginVersion: document.getElementById('aboutPluginVersion'),
  aboutBrowserId: document.getElementById('aboutBrowserId'),
  repositoryLink: document.getElementById('repositoryLink'),
  releasesLink: document.getElementById('releasesLink'),
  checkUpdates: document.getElementById('checkUpdates'),
  saveSettings: document.getElementById('saveSettings'),
  message: document.getElementById('message')
};

document.addEventListener('DOMContentLoaded', init);

function init() {
  detectAndApplyTheme();
  elements.themeToggle.addEventListener('click', toggleTheme);
  elements.saveSettings.addEventListener('click', saveSettings);
  elements.exportSettings.addEventListener('click', exportSettings);
  elements.importSettings.addEventListener('click', () => elements.importFile.click());
  elements.importFile.addEventListener('change', importSettings);
  elements.resetSettings.addEventListener('click', resetSettings);
  elements.addSiteOverride.addEventListener('click', addSiteOverride);
  elements.checkBridgeStatus.addEventListener('click', () => runAction(checkBridgeStatus));
  elements.refreshTrustedBrowsers.addEventListener('click', () => runAction(listTrustedBrowsers));
  elements.checkUpdates.addEventListener('click', () => runAction(checkUpdates));
  
  loadSettings();
  runAction(renderAbout);
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

function loadSettings() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    elements.bridgeEndpoint.value = settings.endpoint || DEFAULT_ENDPOINT;
    elements.theme.value = settings.theme || 'system';
    elements.autoFillEnabled.checked = settings.autoFillEnabled;
    elements.autoSubmitEnabled.checked = settings.autoSubmitEnabled;
    elements.autoFillDelay.value = settings.autoFillDelay;
    elements.strictUrlMatching.checked = settings.strictUrlMatching;
    elements.regexUrlMatching.checked = settings.regexUrlMatching;
    elements.showPasswordsInPopup.checked = settings.showPasswordsInPopup;
    elements.notificationsEnabled.checked = settings.notificationsEnabled;
    elements.autoLockTimeoutMinutes.value = settings.autoLockTimeoutMinutes;
    elements.clipboardClearDelay.value = settings.clipboardClearDelay;
    elements.debugMode.checked = settings.debugMode;
    siteOverrides = normalizeSiteOverrides(settings.siteOverrides);
    renderSiteOverrides();
  });
}

function saveSettings() {
  let settings;
  try {
    settings = {
      endpoint: normalizeBridgeEndpoint(elements.bridgeEndpoint.value),
      theme: elements.theme.value,
      autoFillEnabled: elements.autoFillEnabled.checked,
      autoSubmitEnabled: elements.autoSubmitEnabled.checked,
      autoFillDelay: parseInt(elements.autoFillDelay.value, 10),
      strictUrlMatching: elements.strictUrlMatching.checked,
      regexUrlMatching: elements.regexUrlMatching.checked,
      showPasswordsInPopup: elements.showPasswordsInPopup.checked,
      notificationsEnabled: elements.notificationsEnabled.checked,
      autoLockTimeoutMinutes: normalizeIntegerSetting(
        elements.autoLockTimeoutMinutes.value,
        0,
        1440,
        'Auto-lock timeout must be between 0 and 1440 minutes.'
      ),
      clipboardClearDelay: normalizeIntegerSetting(
        elements.clipboardClearDelay.value,
        0,
        300,
        'Clipboard clear delay must be between 0 and 300 seconds.'
      ),
      debugMode: elements.debugMode.checked,
      siteOverrides: normalizeSiteOverrides(siteOverrides)
    };
  } catch (error) {
    showMessage(error && error.message ? error.message : String(error), 'error');
    return;
  }

  chrome.storage.local.set(settings, () => {
    showMessage('Settings saved successfully!', 'success');
    
    if (settings.theme !== 'system') {
      applyTheme(settings.theme);
    }
  });
}

function normalizeBridgeEndpoint(endpoint) {
  const value = String(endpoint || '').trim();
  if (!value) {
    return DEFAULT_ENDPOINT;
  }

  const url = new URL(value);
  if (url.protocol !== 'http:' || url.hostname !== '127.0.0.1') {
    throw new Error('Bridge endpoint must be an http://127.0.0.1 URL.');
  }

  return url.toString();
}

function normalizeIntegerSetting(value, min, max, errorMessage) {
  const trimmed = String(value || '').trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(errorMessage);
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    throw new Error(errorMessage);
  }

  return parsed;
}

async function checkBridgeStatus() {
  setBridgeStatus('Checking', '');
  try {
    await send({ type: 'KBB_HELLO' });
    setBridgeStatus('Reachable', 'success');
    showMessage('KeePass bridge is reachable.', 'success');
  } catch (error) {
    setBridgeStatus('Unavailable', 'error');
    throw new Error(`KeePass bridge is unavailable: ${error && error.message ? error.message : String(error)}`);
  }
}

function setBridgeStatus(text, kind) {
  elements.bridgeStatus.textContent = text;
  elements.bridgeStatus.classList.toggle('success', kind === 'success');
  elements.bridgeStatus.classList.toggle('error', kind === 'error');
}

function addSiteOverride() {
  const host = normalizeHost(elements.siteOverrideHost.value);
  if (!host) {
    showMessage('Enter a valid host.', 'error');
    elements.siteOverrideHost.focus();
    return;
  }

  const nextRule = {
    host,
    autoFillEnabled: elements.siteOverrideAutoFill.checked,
    autoSubmitEnabled: elements.siteOverrideAutoSubmit.checked
  };

  const existingIndex = siteOverrides.findIndex((rule) => rule.host === host);
  if (existingIndex >= 0) {
    siteOverrides[existingIndex] = nextRule;
  } else {
    siteOverrides.push(nextRule);
  }

  elements.siteOverrideHost.value = '';
  elements.siteOverrideAutoFill.checked = true;
  elements.siteOverrideAutoSubmit.checked = false;
  renderSiteOverrides();
}

function removeSiteOverride(host) {
  siteOverrides = siteOverrides.filter((rule) => rule.host !== host);
  renderSiteOverrides();
}

function renderSiteOverrides() {
  elements.siteOverrideList.textContent = '';
  if (!siteOverrides.length) {
    const empty = document.createElement('p');
    empty.className = 'site-override-empty';
    empty.textContent = 'No site overrides configured.';
    elements.siteOverrideList.appendChild(empty);
    return;
  }

  for (const rule of siteOverrides) {
    const row = document.createElement('div');
    row.className = 'site-override-row';
    row.dataset.host = rule.host;

    const details = document.createElement('div');
    const host = document.createElement('span');
    host.className = 'site-override-host';
    host.textContent = rule.host;

    const meta = document.createElement('span');
    meta.className = 'site-override-meta';
    meta.textContent = [
      rule.autoFillEnabled ? 'auto-fill allowed' : 'auto-fill disabled',
      rule.autoSubmitEnabled ? 'auto-submit enabled' : 'auto-submit disabled'
    ].join(' / ');

    details.append(host, meta);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'secondary';
    removeButton.dataset.action = 'remove-site-override';
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', () => removeSiteOverride(rule.host));

    row.append(details, removeButton);
    elements.siteOverrideList.appendChild(row);
  }
}

async function listTrustedBrowsers() {
  await refreshAboutMetadata();
  const result = await send({ type: 'KBB_LIST_CLIENTS' });
  trustedBrowserClients = Array.isArray(result.Clients) ? result.Clients : [];
  renderTrustedBrowsers(trustedBrowserClients);
  showMessage(result.Clients && result.Clients.length
    ? `${result.Clients.length} trusted browser(s).`
    : 'No trusted browsers found.', 'success');
}

async function revokeTrustedBrowser(client) {
  const clientId = client && client.ClientId ? client.ClientId : '';
  const name = client && client.ClientName ? client.ClientName : 'Browser';
  const confirmed = confirm(
    `Revoke browser "${name}"?\n\nIt will need to pair again before accessing KeePass.`
  );
  if (!confirmed) {
    showMessage('Revoke cancelled.', 'success');
    return;
  }

  const result = await send({ type: 'KBB_REVOKE_CLIENT', clientId });
  if (!result || !result.Revoked) {
    throw new Error('Browser was not revoked.');
  }

  await listTrustedBrowsers();
  showMessage(client && client.Current ? 'This browser was revoked. Pair again to use KeePass.' : 'Browser revoked.', 'success');
}

async function updateTrustedBrowserPermissions(client, permission, enabled) {
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
  if (stored) {
    stored.Permissions = normalizeClientPermissions(result.Permissions || normalized);
  }
  renderTrustedBrowsers(trustedBrowserClients);
  showMessage('Browser permissions updated.', 'success');
}

function renderTrustedBrowsers(clients) {
  elements.trustedBrowserList.textContent = '';
  if (!clients.length) {
    const empty = document.createElement('p');
    empty.className = 'trusted-browser-empty';
    empty.textContent = 'No trusted browsers.';
    elements.trustedBrowserList.appendChild(empty);
    return;
  }

  for (const client of clients) {
    const row = document.createElement('div');
    row.className = 'trusted-browser-row';
    row.dataset.clientId = client.ClientId || '';

    const details = document.createElement('div');
    const name = document.createElement('span');
    name.className = 'trusted-browser-name';
    name.textContent = client.ClientName || 'Browser';

    const meta = document.createElement('span');
    meta.className = 'trusted-browser-meta';
    meta.textContent = [
      client.Current ? 'This browser' : '',
      client.ExtensionOrigin || '',
      `Created: ${formatDate(client.CreatedUtcMs)}`,
      `Last used: ${formatDate(client.LastUsedUtcMs)}`,
      formatClientPermissions(client.Permissions)
    ].filter(Boolean).join(' / ');

    const permissions = createPermissionControls(client);
    details.append(name, meta, permissions);

    const revoke = document.createElement('button');
    revoke.type = 'button';
    revoke.className = 'secondary';
    revoke.dataset.action = 'revoke-client';
    revoke.textContent = client.Current ? 'Revoke This Browser' : 'Revoke';
    revoke.addEventListener('click', () => runAction(() => revokeTrustedBrowser(client)));

    row.append(details, revoke);
    elements.trustedBrowserList.appendChild(row);
  }
}

function createPermissionControls(client) {
  const wrapper = document.createElement('div');
  wrapper.className = 'trusted-browser-permissions';

  for (const definition of getPermissionDefinitions()) {
    const label = document.createElement('label');
    label.className = 'trusted-browser-permission';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.dataset.permission = definition.value;
    checkbox.checked = normalizeClientPermissions(client.Permissions).includes(definition.value);
    checkbox.disabled = definition.value === 'read';
    checkbox.addEventListener('change', () => runAction(() =>
      updateTrustedBrowserPermissions(client, definition.value, checkbox.checked)
    ));

    const text = document.createElement('span');
    text.textContent = definition.label;

    label.append(checkbox, text);
    wrapper.appendChild(label);
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

function normalizeSiteOverrides(rules) {
  if (!Array.isArray(rules)) {
    return [];
  }

  const normalized = [];
  for (const rule of rules) {
    const host = normalizeHost(rule && rule.host);
    if (!host || normalized.some((existing) => existing.host === host)) {
      continue;
    }

    normalized.push({
      host,
      autoFillEnabled: rule.autoFillEnabled !== false,
      autoSubmitEnabled: rule.autoSubmitEnabled === true
    });
  }

  return normalized;
}

function normalizeHost(value) {
  const trimmed = String(value || '').trim().toLowerCase();
  if (!trimmed) {
    return '';
  }

  try {
    const parsed = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return parsed.hostname.replace(/^\.+|\.+$/g, '');
  } catch (error) {
    return trimmed.replace(/^\.+|\.+$/g, '');
  }
}

function formatDate(ms) {
  const value = Number(ms || 0);
  if (!value) return 'Unknown date';
  return new Date(value).toLocaleString();
}

function exportSettings() {
  chrome.storage.local.get(null, (allSettings) => {
    const dataStr = JSON.stringify(sanitizePortableSettings(allSettings), null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kbb-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showMessage('Settings exported successfully!', 'success');
  });
}

function importSettings(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const settings = sanitizePortableSettings(JSON.parse(e.target.result), { validateEndpoint: true });
      chrome.storage.local.set(settings, () => {
        loadSettings();
        showMessage('Settings imported successfully!', 'success');
      });
    } catch (error) {
      showMessage(`Failed to import settings: ${error && error.message ? error.message : 'Invalid JSON file'}`, 'error');
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  elements.importFile.value = '';
}

function sanitizePortableSettings(settings, options = {}) {
  const sanitized = { ...(settings || {}) };
  for (const key of SENSITIVE_SETTING_KEYS) {
    delete sanitized[key];
  }

  if (options.validateEndpoint && Object.prototype.hasOwnProperty.call(sanitized, 'endpoint')) {
    sanitized.endpoint = normalizeBridgeEndpoint(sanitized.endpoint);
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, 'autoLockTimeoutMinutes')) {
    sanitized.autoLockTimeoutMinutes = normalizeIntegerSetting(
      sanitized.autoLockTimeoutMinutes,
      0,
      1440,
      'Auto-lock timeout must be between 0 and 1440 minutes.'
    );
  }

  if (Object.prototype.hasOwnProperty.call(sanitized, 'clipboardClearDelay')) {
    sanitized.clipboardClearDelay = normalizeIntegerSetting(
      sanitized.clipboardClearDelay,
      0,
      300,
      'Clipboard clear delay must be between 0 and 300 seconds.'
    );
  }

  return sanitized;
}

function resetSettings() {
  if (!confirm('Are you sure you want to reset all settings to their default values?')) {
    return;
  }

  chrome.storage.local.set(DEFAULT_SETTINGS, () => {
    loadSettings();
    showMessage('Settings reset to defaults!', 'success');
  });
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
    if (trustedBrowserClients.length) {
      renderTrustedBrowsers(trustedBrowserClients);
    }
  } else {
    bridgePasskeysEnabled = passkeysEnabled;
  }
  return about;
}

async function checkUpdates() {
  const result = await send({ type: 'KBB_CHECK_UPDATES' });
  if (result.updateAvailable) {
    elements.releasesLink.href = result.releaseUrl || elements.releasesLink.href;
    showMessage(`Update ${result.latestVersion} is available. Open GitHub Releases to install it.`, 'success');
    return;
  }

  showMessage(`KeePass Browser Bridge ${result.currentVersion} is up to date.`, 'success');
}

async function runAction(action) {
  try {
    await action();
  } catch (error) {
    showMessage(error && error.message ? error.message : String(error), 'error');
  }
}

function send(message) {
  return chrome.runtime.sendMessage(message).then((result) => {
    if (!result || !result.ok) {
      throw new Error(result && result.error ? result.error : 'Extension request failed.');
    }

    return result.response;
  });
}

function showMessage(text, type) {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`;
  
  setTimeout(() => {
    elements.message.textContent = '';
    elements.message.className = 'message';
  }, 3000);
}
