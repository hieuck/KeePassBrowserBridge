'use strict';

const DEFAULT_SETTINGS = {
  theme: 'system',
  autoFillEnabled: true,
  autoSubmitEnabled: false,
  autoFillDelay: 1200,
  strictUrlMatching: false,
  regexUrlMatching: false,
  showPasswordsInPopup: false,
  clipboardClearDelay: 30,
  debugMode: false,
  siteOverrides: []
};

let siteOverrides = [];

const elements = {
  themeToggle: document.getElementById('themeToggle'),
  bridgeEndpoint: document.getElementById('bridgeEndpoint'),
  theme: document.getElementById('theme'),
  autoFillEnabled: document.getElementById('autoFillEnabled'),
  autoSubmitEnabled: document.getElementById('autoSubmitEnabled'),
  autoFillDelay: document.getElementById('autoFillDelay'),
  strictUrlMatching: document.getElementById('strictUrlMatching'),
  regexUrlMatching: document.getElementById('regexUrlMatching'),
  showPasswordsInPopup: document.getElementById('showPasswordsInPopup'),
  clipboardClearDelay: document.getElementById('clipboardClearDelay'),
  debugMode: document.getElementById('debugMode'),
  siteOverrideHost: document.getElementById('siteOverrideHost'),
  siteOverrideAutoFill: document.getElementById('siteOverrideAutoFill'),
  siteOverrideAutoSubmit: document.getElementById('siteOverrideAutoSubmit'),
  addSiteOverride: document.getElementById('addSiteOverride'),
  siteOverrideList: document.getElementById('siteOverrideList'),
  exportSettings: document.getElementById('exportSettings'),
  importSettings: document.getElementById('importSettings'),
  importFile: document.getElementById('importFile'),
  resetSettings: document.getElementById('resetSettings'),
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
  
  loadSettings();
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
    elements.bridgeEndpoint.value = settings.endpoint || 'http://127.0.0.1:19455/bridge';
    elements.theme.value = settings.theme || 'system';
    elements.autoFillEnabled.checked = settings.autoFillEnabled;
    elements.autoSubmitEnabled.checked = settings.autoSubmitEnabled;
    elements.autoFillDelay.value = settings.autoFillDelay;
    elements.strictUrlMatching.checked = settings.strictUrlMatching;
    elements.regexUrlMatching.checked = settings.regexUrlMatching;
    elements.showPasswordsInPopup.checked = settings.showPasswordsInPopup;
    elements.clipboardClearDelay.value = settings.clipboardClearDelay;
    elements.debugMode.checked = settings.debugMode;
    siteOverrides = normalizeSiteOverrides(settings.siteOverrides);
    renderSiteOverrides();
  });
}

function saveSettings() {
  const settings = {
    endpoint: elements.bridgeEndpoint.value,
    theme: elements.theme.value,
    autoFillEnabled: elements.autoFillEnabled.checked,
    autoSubmitEnabled: elements.autoSubmitEnabled.checked,
    autoFillDelay: parseInt(elements.autoFillDelay.value, 10),
    strictUrlMatching: elements.strictUrlMatching.checked,
    regexUrlMatching: elements.regexUrlMatching.checked,
    showPasswordsInPopup: elements.showPasswordsInPopup.checked,
    clipboardClearDelay: parseInt(elements.clipboardClearDelay.value, 10),
    debugMode: elements.debugMode.checked,
    siteOverrides: normalizeSiteOverrides(siteOverrides)
  };

  chrome.storage.local.set(settings, () => {
    showMessage('Settings saved successfully!', 'success');
    
    if (settings.theme !== 'system') {
      applyTheme(settings.theme);
    }
  });
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

function exportSettings() {
  chrome.storage.local.get(null, (allSettings) => {
    const dataStr = JSON.stringify(allSettings, null, 2);
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
      const settings = JSON.parse(e.target.result);
      chrome.storage.local.set(settings, () => {
        loadSettings();
        showMessage('Settings imported successfully!', 'success');
      });
    } catch (error) {
      showMessage('Failed to import settings: Invalid JSON file', 'error');
    }
  };
  reader.readAsText(file);
  
  // Reset file input
  elements.importFile.value = '';
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

function showMessage(text, type) {
  elements.message.textContent = text;
  elements.message.className = `message ${type}`;
  
  setTimeout(() => {
    elements.message.textContent = '';
    elements.message.className = 'message';
  }, 3000);
}
