<template>
  <div class="app" :data-theme="theme">
    <PopupHeader :theme="theme" @toggle-theme="toggleTheme" />
    <SearchBar v-model="searchQuery" @clear="clearLoginSearch" @escape="clearLoginSearch" />
    <FilterBar :groups="groups" v-model="activeGroup" />
    <div id="stateNotice" class="state-notice" :class="{ warning: stateNoticeWarning }" aria-live="polite">{{ stateNoticeText }}</div>
    <div id="currentUrl" class="url" :class="{ hidden: !currentUrlText }">{{ currentUrlText }}</div>

    <SettingsPanel
      :visible="settingsVisible"
      :endpoint="endpoint"
      :auto-fill-enabled="autoFillEnabled"
      :auto-submit-enabled="autoSubmitEnabled"
      :locked="locked"
      :paired="paired"
      :pairing-active="pairingActive"
      :pairing-code="pairingCode"
      :pairing-timer-text="pairingTimerText"
      :clients="clients"
      :clients-visible="clientsVisible"
      :manage-clients-enabled="manageClientsEnabled"
      :bridge-passkeys="bridgePasskeysEnabled"
      @update:endpoint="endpoint = $event"
      @save-endpoint="saveEndpoint"
      @check-status="checkStatus"
      @begin-pair="beginPair"
      @paste-pairing-code="pastePairingCode"
      @complete-pair="completePair"
      @cancel-pair="cancelPair"
      @update:auto-fill="setAutoFill"
      @update:auto-submit="setAutoSubmit"
      @update:pairing-code="pairingCode = $event"
      @list-clients="listClients"
      @revoke-client="revokeClient"
      @update-client-permission="updateClientPermission"
      @toggle-site-auto-fill="toggleSiteAutoFill"
      @toggle-site-auto-submit="toggleSiteAutoSubmit"
    />

    <PasskeySection
      v-if="passkeyAvailable"
      :enabled="passkeysEnabled"
      :status="passkeyStatusText"
      @toggle="togglePasskeys"
    />

    <AboutPanel
      :visible="aboutVisible"
      :version="aboutVersion"
      :plugin-version="aboutPluginVersion"
      :browser-id="aboutBrowserId"
      :repository-url="repositoryUrl"
      :releases-url="releasesUrl"
      @check-updates="checkUpdates"
    />

    <div class="action-bar">
      <button id="queryLogins" class="btn-primary" type="button" :disabled="!credentialActionsEnabled" @click="queryLogins">Find Logins</button>
      <button id="newLogin" class="btn-secondary" type="button" :disabled="!credentialActionsEnabled || !hasWritePermission" @click="beginCreateLogin">+ New Login</button>
      <button id="generatePassword" class="btn-secondary" type="button" @click="toggleGenerator">🔑</button>
    </div>

    <div v-if="showLoading" class="loading-overlay"><div class="loading-spinner"></div></div>

    <div class="vault-list" id="results">
      <template v-if="formMode">
        <div ref="formSlotEl"></div>
      </template>
      <template v-else-if="!currentEntries.length && !formMode">
        <EmptyState @create-login="beginCreateLogin" />
      </template>
      <template v-else-if="!filteredEntries.length && searchQuery">
        <div class="login-empty">
          <div class="login-empty-title">No matching logins in this list.</div>
          <div class="login-empty-hint">Clear the search to show all matching KeePass entries.</div>
          <button type="button" @click="clearLoginSearch">Clear Search</button>
        </div>
      </template>
      <template v-else-if="!filteredEntries.length">
        <div class="login-empty">
          <div class="login-empty-title">No logins in this group.</div>
          <div class="login-empty-hint">Try selecting a different group.</div>
        </div>
      </template>
      <template v-else>
        <template v-for="(groupEntries, groupName) in groupedEntries" :key="groupName">
          <div class="folder-header">{{ groupName }}</div>
          <div class="credential-group">
            <CredentialCard
              v-for="(entry, i) in groupEntries"
              :key="entry.EntryId || i"
              :entry="entry"
              :entry-index="currentEntries.indexOf(entry)"
              :can-edit="hasWritePermission"
              :max-usage="maxUsage"
              @fill="fillLogin"
              @copy="copyToClipboard"
              @select="showDetailView"
              @edit="showEditForm"
            />
          </div>
        </template>
      </template>
    </div>

    <DetailView
      :entry="detailEntry"
      @back="hideDetailView"
      @fill="fillLoginFromDetail"
      @copy="copyToClipboard"
    />

    <PasswordGenerator
      :visible="generatorVisible"
      :password="generatedPassword"
      :length="genLength"
      :use-upper="genUseUpper"
      :use-lower="genUseLower"
      :use-digits="genUseDigits"
      :use-symbols="genUseSymbols"
      @close="hideGenerator"
      @refresh="refreshGeneratedPassword"
      @copy="copyGeneratedPassword"
      @fill-password="fillGeneratedPassword"
      @update:length="genLength = $event; refreshGeneratedPassword()"
      @update:useUpper="genUseUpper = $event; refreshGeneratedPassword()"
      @update:useLower="genUseLower = $event; refreshGeneratedPassword()"
      @update:useDigits="genUseDigits = $event; refreshGeneratedPassword()"
      @update:useSymbols="genUseSymbols = $event; refreshGeneratedPassword()"
    />

    <StatusBar
      :locked="locked"
      :status-text="statusText"
      :status-kind="statusKind"
      @toggle-lock="toggleLocked"
      @toggle-settings="toggleSettingsPanel"
      @toggle-about="toggleAboutPanel"
    />

    <div id="message" class="message" :class="{ error: messageIsError }">{{ messageText }}</div>
    <Toast :message="toastMessage" :type="toastType" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, provide } from 'vue';
import PopupHeader from '../components/PopupHeader.vue';
import SearchBar from '../components/SearchBar.vue';
import FilterBar from '../components/FilterBar.vue';
import StatusBar from '../components/StatusBar.vue';
import CredentialCard from '../components/CredentialCard.vue';
import DetailView from '../components/DetailView.vue';
import PasswordGenerator from '../components/PasswordGenerator.vue';
import Toast from '../components/Toast.vue';
import EmptyState from '../components/EmptyState.vue';
import SettingsPanel from '../components/SettingsPanel.vue';
import PasskeySection from '../components/PasskeySection.vue';
import AboutPanel from '../components/AboutPanel.vue';

const DEFAULT_CLIPBOARD_CLEAR_DELAY_SECONDS = 30;
const MAX_CLIPBOARD_CLEAR_DELAY_SECONDS = 300;

const theme = ref('light');
const settingsVisible = ref(false);
const aboutVisible = ref(false);
const generatorVisible = ref(false);
const showLoading = ref(false);

const searchQuery = ref('');
const activeGroup = ref('All');
const currentUrlText = ref('');
const currentEntries = ref([]);
const visibleEntries = ref([]);
const filteredEntries = ref([]);
const detailEntry = ref(null);
const paired = ref(false);
const locked = ref(false);
const pairingActive = ref(false);
const pairingSessionId = ref('');
const pairingExpiresAt = ref(0);
const pairingCode = ref('');
const pairingTimerText = ref('');
const endpoint = ref('');
const autoFillEnabled = ref(false);
const autoSubmitEnabled = ref(false);
const permissions = ref([]);
const trusted = ref(false);
const clients = ref([]);
const clientsVisible = ref(false);
const bridgePasskeysEnabled = ref(false);
const passkeysEnabled = ref(false);
const passkeyAvailable = ref(false);
const passkeyStatusText = ref('');
const statusText = ref('Checking');
const statusKind = ref('');
const messageText = ref('');
const messageIsError = ref(false);
const toastMessage = ref('');
const toastType = ref('success');
const formMode = ref(false);
const formSlotEl = ref(null);
const aboutVersion = ref('');
const aboutPluginVersion = ref('');
const aboutBrowserId = ref('');
const repositoryUrl = ref('#');
const releasesUrl = ref('#');

const genLength = ref(20);
const genUseUpper = ref(true);
const genUseLower = ref(true);
const genUseDigits = ref(true);
const genUseSymbols = ref(false);
const generatedPassword = ref('');

let pairingExpiryTimer = null;
let pairingCountdownTimer = null;

const stateNoticeText = ref('');
const stateNoticeWarning = ref(false);

const credentialActionsEnabled = computed(() => paired.value && !locked.value);
const hasWritePermission = computed(() => permissions.value.includes('write'));
const manageClientsEnabled = computed(() => credentialActionsEnabled.value && permissions.value.includes('manageClients'));

const groups = computed(() => [...new Set(currentEntries.value.map(e => e.Group).filter(Boolean))]);

const maxUsage = computed(() => Math.max(...filteredEntries.value.map(e => Number(e.UsageCount || 0)), 0));

const groupedEntries = computed(() => {
  const grouped = {};
  for (const entry of filteredEntries.value) {
    const group = entry.Group || 'Other';
    if (!grouped[group]) grouped[group] = [];
    grouped[group].push(entry);
  }
  const sorted = {};
  for (const key of Object.keys(grouped).sort()) {
    sorted[key] = grouped[key];
  }
  return sorted;
});

onMounted(() => {
  detectAndApplyTheme();
  document.addEventListener('keydown', handleKeyboardShortcuts);

  const resultsEl = document.getElementById('results');
  if (resultsEl) {
    resultsEl.addEventListener('click', (e) => {
      if (e.target.closest('button, input, select, textarea, a')) return;
      const item = e.target.closest('.credential-item');
      if (!item) return;
      const idx = parseInt(item.dataset.entryIdx, 10);
      if (!isNaN(idx) && idx >= 0 && idx < currentEntries.value.length) {
        detailEntry.value = currentEntries.value[idx];
      }
    });
  }

  refreshState();
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyboardShortcuts);
  clearPairingTimers();
});

watch([searchQuery, activeGroup, currentEntries], () => {
  if (!formMode.value) applyFilters();
}, { deep: true });

watch(searchQuery, (val) => {
  if (!formMode.value && currentEntries.value.length && val) {
    setMessage(`${filteredEntries.value.length} of ${currentEntries.value.length} login(s) shown.`);
  }
});

function applyFilters() {
  const words = searchQuery.value.toLowerCase().split(/\s+/).filter(Boolean);
  let filtered = currentEntries.value;
  if (words.length) {
    filtered = filtered.filter(entry => {
      const text = credentialSearchText(entry);
      return words.every(w => text.includes(w));
    });
  }
  visibleEntries.value = filtered;
  if (activeGroup.value === 'All') {
    filteredEntries.value = filtered;
  } else {
    filteredEntries.value = filtered.filter(e => e.Group === activeGroup.value);
  }
}

function credentialSearchText(entry) {
  const customText = (entry.CustomFields || [])
    .map(f => { if (!f) return ''; return [f.Name || '', f.IsProtected ? '' : f.Value || ''].join(' '); })
    .join(' ');
  return [entry.Title || '', entry.Group || '', entry.UserName || '', entry.Url || '', customText].join(' ').toLowerCase();
}

function detectAndApplyTheme() {
  const saved = localStorage.getItem('kbbTheme');
  if (saved === 'light' || saved === 'dark') {
    theme.value = saved;
    applyThemeAttr(saved);
    return;
  }
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const t = mql.matches ? 'dark' : 'light';
  theme.value = t;
  applyThemeAttr(t);
  mql.addEventListener('change', (e) => {
    if (!localStorage.getItem('kbbTheme')) {
      const nt = e.matches ? 'dark' : 'light';
      theme.value = nt;
      applyThemeAttr(nt);
    }
  });
}

function applyThemeAttr(t) {
  document.documentElement.setAttribute('data-theme', t);
}

function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark';
  theme.value = next;
  localStorage.setItem('kbbTheme', next);
  applyThemeAttr(next);
}

async function send(message) {
  const result = await chrome.runtime.sendMessage(message);
  if (!result || !result.ok) {
    throw new Error(result && result.error ? result.error : 'Extension request failed.');
  }
  return result.response;
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
  document.querySelectorAll('button').forEach(b => b.disabled = isBusy);
}

async function refreshState() {
  const state = await send({ type: 'KBB_GET_STATE' });
  await hydrateAndRenderState(state);
  setMessage(state.paired ? 'Ready to query KeePass.' : 'Pair this browser with KeePass.');
}

async function hydrateAndRenderState(state) {
  if (!state) return;
  endpoint.value = state.endpoint || '';
  autoFillEnabled.value = Boolean(state.autoFillEnabled);
  autoSubmitEnabled.value = Boolean(state.autoSubmitEnabled);
  locked.value = Boolean(state.locked);
  paired.value = Boolean(state.paired);
  passkeysEnabled.value = Boolean(state.passkeysEnabled);

  pairingActive.value = !state.paired && Boolean(state.pairingSessionId);
  pairingSessionId.value = state.pairingSessionId || '';
  pairingExpiresAt.value = Number(state.pairingExpiresAt || 0);

  if (!pairingActive.value) {
    clearPairingTimers();
    pairingCode.value = '';
    pairingTimerText.value = '';
  } else {
    schedulePairingTimers();
  }

  if (state.locked) {
    setStatus('Locked', 'error');
  } else {
    setStatus(state.paired ? 'Paired' : 'Unpaired', state.paired ? 'paired' : '');
  }

  if (state.paired && !state.locked) {
    try {
      const about = await send({ type: 'KBB_GET_ABOUT' });
      bridgePasskeysEnabled.value = about.pluginPasskeysEnabled === true;
    } catch (_) {}
    try {
      const status = await send({ type: 'KBB_STATUS' });
      trusted.value = status.Trusted === true;
      permissions.value = normalizePermissions(status.Permissions);
    } catch (_) {}
  } else {
    permissions.value = [];
  }

  updateStateNotice();
  syncCredentialActionAvailability();

  if (!credentialActionsEnabled.value) {
    clearRenderedCredentials();
  }
  if (!manageClientsEnabled.value) {
    clientsVisible.value = false;
    clients.value = [];
  }
}

function updateStateNotice() {
  if (locked.value) {
    stateNoticeText.value = 'Unlock KeePass Bridge to find, fill, create, or update logins.';
    stateNoticeWarning.value = true;
  } else if (pairingActive.value) {
    stateNoticeText.value = 'Enter the six digit code shown in KeePass to finish pairing.';
    stateNoticeWarning.value = false;
  } else if (paired.value && !hasWritePermission.value) {
    stateNoticeText.value = 'Read-only access: this browser can find logins, but cannot create or update KeePass entries.';
    stateNoticeWarning.value = false;
  } else if (paired.value) {
    stateNoticeText.value = 'Ready to find, fill, create, and update KeePass logins.';
    stateNoticeWarning.value = false;
  } else {
    stateNoticeText.value = 'Pair this browser with KeePass to query and fill logins.';
    stateNoticeWarning.value = false;
  }
}

function syncCredentialActionAvailability() {
  const enabled = credentialActionsEnabled.value;
}

function clearRenderedCredentials() {
  currentEntries.value = [];
  visibleEntries.value = [];
  filteredEntries.value = [];
  searchQuery.value = '';
}

function setStatus(text, kind) {
  statusText.value = text;
  statusKind.value = kind || '';
}

function setMessage(text, isError) {
  messageText.value = text || '';
  messageIsError.value = Boolean(isError);
  if (!isError && text) {
    toastMessage.value = '';
    setTimeout(() => { toastMessage.value = text; toastType.value = 'success'; }, 0);
  }
}

function clearMessage() {
  messageText.value = '';
  messageIsError.value = false;
}

function normalizePermissions(p) {
  const allowed = ['read', 'write', 'manageClients', 'passkeyRead', 'passkeyWrite'];
  const normalized = ['read'];
  for (const perm of Array.isArray(p) ? p : []) {
    if (allowed.includes(perm) && !normalized.includes(perm)) normalized.push(perm);
  }
  return normalized;
}

function schedulePairingTimers() {
  clearPairingTimers();
  const expiresAt = pairingExpiresAt.value;
  if (!expiresAt) return;
  updatePairingCountdown(expiresAt);
  pairingCountdownTimer = setInterval(() => updatePairingCountdown(expiresAt), 1000);
  const delay = Math.max(0, expiresAt - Date.now());
  pairingExpiryTimer = setTimeout(() => expirePairingSession(), delay);
  nextTick(() => {
    const el = document.getElementById('pairingCode');
    if (el) el.focus();
  });
}

function updatePairingCountdown(expiresAt) {
  const remainingSeconds = Math.max(0, Math.ceil((Number(expiresAt || 0) - Date.now()) / 1000));
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');
  pairingTimerText.value = `Code expires in ${minutes}:${seconds}`;
}

function clearPairingTimers() {
  if (pairingExpiryTimer) { clearTimeout(pairingExpiryTimer); pairingExpiryTimer = null; }
  if (pairingCountdownTimer) { clearInterval(pairingCountdownTimer); pairingCountdownTimer = null; }
}

async function expirePairingSession() {
  clearPairingTimers();
  const state = await send({ type: 'KBB_PAIR_CANCEL' });
  pairingCode.value = '';
  await hydrateAndRenderState(state);
  setMessage('Pairing code expired. Start pairing again.');
}

async function toggleSettingsPanel() {
  settingsVisible.value = !settingsVisible.value;
  if (!settingsVisible.value) {
    clientsVisible.value = false;
  }
}

async function toggleAboutPanel() {
  aboutVisible.value = !aboutVisible.value;
  if (aboutVisible.value) {
    settingsVisible.value = false;
    await refreshAboutMetadata();
  }
}

async function saveEndpoint() {
  const state = await send({ type: 'KBB_SAVE_ENDPOINT', endpoint: endpoint.value });
  await hydrateAndRenderState(state);
  setMessage('Endpoint saved.');
}

async function checkStatus() {
  showLoading.value = true;
  try {
    await send({ type: 'KBB_HELLO' });
    const state = await send({ type: 'KBB_GET_STATE' });
    if (state.locked) {
      await hydrateAndRenderState(state);
      setMessage('KeePass bridge is reachable. Unlock KeePass Bridge to use logins.');
      return;
    }
    if (state.paired) {
      const status = await send({ type: 'KBB_STATUS' });
      state.permissions = normalizePermissions(status.Permissions);
      state.trusted = status.Trusted === true;
      await hydrateAndRenderState(state);
      setStatus('Paired', 'paired');
      setMessage('KeePass bridge is reachable.');
    } else {
      await hydrateAndRenderState(state);
      setStatus('Ready', '');
      setMessage('KeePass bridge is reachable. Pair this browser to query logins.');
    }
  } finally {
    showLoading.value = false;
  }
}

async function beginPair() {
  const state = await send({ type: 'KBB_PAIR_BEGIN' });
  pairingCode.value = '';
  await hydrateAndRenderState(state);
  setMessage('Enter the pairing code shown in KeePass.');
}

async function pastePairingCode() {
  if (!navigator.clipboard || !navigator.clipboard.readText) {
    throw new Error('Clipboard read is not available. Paste the pairing code manually.');
  }
  const text = await navigator.clipboard.readText();
  const digits = String(text || '').replace(/\D/g, '');
  if (digits.length !== 6) {
    throw new Error('Clipboard does not contain a six digit pairing code.');
  }
  pairingCode.value = digits;
  await completePair();
}

async function completePair() {
  const state = await send({ type: 'KBB_PAIR_COMPLETE', pairingCode: pairingCode.value });
  pairingCode.value = '';
  await hydrateAndRenderState(state);
  setMessage('Browser paired with KeePass.');
}

async function cancelPair() {
  clearPairingTimers();
  const state = await send({ type: 'KBB_PAIR_CANCEL' });
  pairingCode.value = '';
  await hydrateAndRenderState(state);
  setMessage(state.paired ? 'Ready to query KeePass.' : 'Pairing cancelled.');
}

async function setAutoFill(val) {
  const state = await send({ type: 'KBB_SET_AUTO_FILL', enabled: val });
  await hydrateAndRenderState(state);
  setMessage(val ? 'Auto-fill enabled for single matching logins.' : 'Auto-fill disabled.');
}

async function setAutoSubmit(val) {
  const state = await send({ type: 'KBB_SET_AUTO_SUBMIT', enabled: val });
  await hydrateAndRenderState(state);
  setMessage(val ? 'Auto-submit form after filling enabled.' : 'Auto-submit disabled.');
}

async function toggleLocked() {
  const state = await send({ type: 'KBB_SET_LOCKED', locked: !locked.value });
  await hydrateAndRenderState(state);
  setMessage(state.locked ? 'KeePass Bridge is locked.' : 'KeePass Bridge is unlocked.');
}

async function queryLogins() {
  showLoading.value = true;
  try {
    const state = await send({ type: 'KBB_GET_STATE' });
    await hydrateAndRenderState(state);
    if (state.locked) {
      setMessage('Unlock KeePass Bridge before querying logins.', true);
      return;
    }
    if (!credentialActionsEnabled.value) {
      setMessage('Pair this browser with KeePass before querying logins.', true);
      return;
    }
    const result = await send({ type: 'KBB_QUERY_LOGINS' });
    currentUrlText.value = result.url || '';
    currentEntries.value = sortEntries(result.entries || []);
    searchQuery.value = '';
    activeGroup.value = 'All';
    setMessage(result.entries && result.entries.length ? `${result.entries.length} login(s) found.` : 'No matching logins found.');
  } finally {
    showLoading.value = false;
  }
}

function sortEntries(entries) {
  return (entries || []).map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const usage = Number(b.e.UsageCount || 0) - Number(a.e.UsageCount || 0);
      if (usage !== 0) return usage;
      const lastUsed = Number(b.e.LastUsed || 0) - Number(a.e.LastUsed || 0);
      if (lastUsed !== 0) return lastUsed;
      return a.i - b.i;
    })
    .map(item => item.e);
}

async function clearLoginSearch() {
  searchQuery.value = '';
  setMessage(`${currentEntries.value.length} login(s) found.`);
}

async function beginCreateLogin() {
  showLoading.value = true;
  try {
    const state = await send({ type: 'KBB_GET_STATE' });
    await hydrateAndRenderState(state);
    if (state.locked) {
      setMessage('Unlock KeePass Bridge before creating logins.', true);
      return;
    }
    if (!hasWritePermission.value) {
      setMessage('This browser is read-only. Enable Write permission to create KeePass entries.', true);
      return;
    }
    const result = await send({ type: 'KBB_QUERY_LOGINS' });
    const pageCred = await collectPageCredential();
    const url = result.url || '';
    currentUrlText.value = url;
    showCreateForm(url, pageCred);
    setMessage('Create a new KeePass login for this page.');
  } finally {
    showLoading.value = false;
  }
}

async function collectPageCredential() {
  try {
    const result = await send({ type: 'KBB_COLLECT_PAGE_CREDENTIAL' });
    return result && result.collected ? result.credential : null;
  } catch (_) { return null; }
}

async function fillLogin(credential, fieldRole, customFieldName) {
  if (!credentialActionsEnabled.value) throw new Error('Unlock KeePass Bridge to use logins.');
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

function fieldRoleLabel(role, name) {
  if (role === 'username') return 'Username';
  if (role === 'password') return 'Password';
  if (role === 'otp') return 'OTP';
  if (role === 'custom') return name || 'Custom field';
  return 'Value';
}

async function copyToClipboard(label, text) {
  if (!credentialActionsEnabled.value) throw new Error('Unlock KeePass Bridge to use logins.');
  if (!text) throw new Error(`${label} is empty.`);
  const settings = await chrome.storage.local.get(['clipboardClearDelay']);
  const seconds = Number(settings.clipboardClearDelay);
  const clearAfterMs = (Number.isFinite(seconds) && seconds >= 0 && seconds <= MAX_CLIPBOARD_CLEAR_DELAY_SECONDS) ? seconds * 1000 : DEFAULT_CLIPBOARD_CLEAR_DELAY_SECONDS * 1000;
  const result = await send({ type: 'KBB_COPY_TO_CLIPBOARD', text, clearAfterMs });
  if (!result || result.success === false) {
    throw new Error(result && result.error ? result.error : `${label} could not be copied.`);
  }
  setMessage(`Copied ${label} to clipboard.`);
}

async function fillLoginFromDetail(entry) {
  await fillLogin(entry);
  hideDetailView();
}

function hideDetailView() {
  detailEntry.value = null;
}

function toggleGenerator() {
  generatorVisible.value = !generatorVisible.value;
  if (generatorVisible.value) refreshGeneratedPassword();
}

function hideGenerator() {
  generatorVisible.value = false;
}

function generatePassword(length = 20, useUpper = true, useLower = true, useDigits = true, useSymbols = false) {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+~|}{[]:;?><,./-=';
  let chars = '';
  if (useUpper) chars += upper;
  if (useLower) chars += lower;
  if (useDigits) chars += digits;
  if (useSymbols) chars += symbols;
  if (!chars) chars = lower + digits;
  let password = '';
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

function refreshGeneratedPassword() {
  let len = genLength.value || 20;
  if (len < 8) len = 8;
  if (len > 64) len = 64;
  genLength.value = len;
  generatedPassword.value = generatePassword(len, genUseUpper.value, genUseLower.value, genUseDigits.value, genUseSymbols.value);
}

async function copyGeneratedPassword() {
  await navigator.clipboard.writeText(generatedPassword.value);
  setMessage('Password copied');
}

async function fillGeneratedPassword() {
  await runAction(async () => {
    await send({
      type: 'KBB_FILL_LOGIN',
      credential: { Password: generatedPassword.value },
      fieldRole: 'password'
    });
    setMessage('Password filled into focused field.');
    hideGenerator();
  });
}

async function listClients() {
  if (!manageClientsEnabled.value) throw new Error('Manage browser permission is required to manage trusted browsers.');
  const about = await refreshAboutMetadata();
  bridgePasskeysEnabled.value = about.pluginPasskeysEnabled === true;
  const result = await send({ type: 'KBB_LIST_CLIENTS' });
  clients.value = Array.isArray(result.Clients) ? result.Clients : [];
  clientsVisible.value = true;
  setMessage(clients.value.length ? `${clients.value.length} trusted browser(s).` : 'No trusted browsers found.');
}

async function revokeClient(client) {
  const clientName = client && client.ClientName ? client.ClientName : 'Browser';
  if (!window.confirm(`Revoke browser "${clientName}"?\n\nIt will need to pair again before accessing KeePass.`)) {
    setMessage('Revoke cancelled.');
    return;
  }
  const result = await send({ type: 'KBB_REVOKE_CLIENT', clientId: client.ClientId });
  if (!result || !result.Revoked) throw new Error('Browser was not revoked.');
  if (client.Current) {
    const state = await send({ type: 'KBB_GET_STATE' });
    await hydrateAndRenderState(state);
    clientsVisible.value = false;
    clients.value = [];
    setMessage('This browser was revoked. Pair again to use KeePass.');
    return;
  }
  await listClients();
  setMessage('Browser revoked.');
}

async function updateClientPermission(client, permission, enabled) {
  const nextPermissions = normalizePermissions(client.Permissions);
  const idx = nextPermissions.indexOf(permission);
  if (enabled && idx < 0) nextPermissions.push(permission);
  else if (!enabled && idx >= 0) nextPermissions.splice(idx, 1);
  const result = await send({
    type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
    clientId: client.ClientId,
    permissions: nextPermissions
  });
  if (!result || !result.Updated) throw new Error('Browser permissions were not updated.');
  const stored = clients.value.find(c => c.ClientId === client.ClientId);
  if (stored) {
    stored.Permissions = normalizePermissions(result.Permissions || nextPermissions);
    if (stored.Current) {
      permissions.value = stored.Permissions;
      if (!permissions.value.includes('manageClients')) {
        clientsVisible.value = false;
      }
    }
  }
  setMessage(stored && stored.Current && !stored.Permissions.includes('manageClients')
    ? 'Browser permissions updated. Manage browsers permission was removed for this browser.'
    : 'Browser permissions updated.');
}

async function toggleSiteAutoFill() {
  const context = await getCurrentSiteOverrideContext();
  const { host, overrides, exactIndex, effective, inherited } = context;
  const isDisabled = effective && effective.autoFillEnabled === false;
  if (isDisabled) {
    const inheritedKeepsDisabled = inherited && inherited.autoFillEnabled === false;
    if (exactIndex >= 0 && !inheritedKeepsDisabled) {
      overrides.splice(exactIndex, 1);
    } else {
      const next = { host, autoFillEnabled: true, autoSubmitEnabled: Boolean(effective && effective.autoSubmitEnabled === true) };
      if (exactIndex >= 0) overrides[exactIndex] = next; else overrides.push(next);
    }
    await chrome.storage.local.set({ siteOverrides: overrides });
    setMessage(`Auto-fill enabled for ${host}.`);
    return;
  }
  const next = { host, autoFillEnabled: false, autoSubmitEnabled: Boolean(effective && effective.autoSubmitEnabled === true) };
  if (exactIndex >= 0) overrides[exactIndex] = next; else overrides.push(next);
  await chrome.storage.local.set({ siteOverrides: overrides });
  setMessage(`Auto-fill disabled for ${host}.`);
}

async function toggleSiteAutoSubmit() {
  const context = await getCurrentSiteOverrideContext();
  const { host, overrides, exactIndex, exact, effective, inherited } = context;
  const isEnabled = effective && effective.autoSubmitEnabled === true;
  if (isEnabled) {
    const inheritedKeepsEnabled = inherited && inherited.autoSubmitEnabled === true;
    if (exactIndex >= 0 && !inheritedKeepsEnabled) {
      if (exact.autoFillEnabled === false) {
        overrides[exactIndex] = { host, autoFillEnabled: false, autoSubmitEnabled: false };
      } else {
        overrides.splice(exactIndex, 1);
      }
    } else {
      const next = { host, autoFillEnabled: effective && effective.autoFillEnabled === false ? false : true, autoSubmitEnabled: false };
      if (exactIndex >= 0) overrides[exactIndex] = next; else overrides.push(next);
    }
    await chrome.storage.local.set({ siteOverrides: overrides });
    setMessage(`Auto-submit disabled for ${host}.`);
    return;
  }
  const next = { host, autoFillEnabled: effective && effective.autoFillEnabled === false ? false : true, autoSubmitEnabled: true };
  if (exactIndex >= 0) overrides[exactIndex] = next; else overrides.push(next);
  await chrome.storage.local.set({ siteOverrides: overrides });
  setMessage(`Auto-submit enabled for ${host}.`);
}

async function getCurrentSiteOverrideContext() {
  const result = await send({ type: 'KBB_QUERY_LOGINS' });
  const url = result.url || currentUrlText.value || '';
  const host = hostFromUrl(url);
  if (!host) throw new Error('Current page URL is not available.');
  currentUrlText.value = url;
  const settings = await chrome.storage.local.get(['siteOverrides']);
  const overrides = normalizeOverrides(settings.siteOverrides);
  const exactIndex = overrides.findIndex(r => r.host === host);
  const exact = exactIndex >= 0 ? overrides[exactIndex] : null;
  const effective = findBestOverride(overrides, host);
  const inherited = findBestOverride(overrides, host, exactIndex);
  return { host, overrides, exactIndex, exact, effective, inherited };
}

function normalizeOverrides(value) {
  if (!Array.isArray(value)) return [];
  return value.map(r => ({ host: normalizeHost(r && r.host), autoFillEnabled: r ? r.autoFillEnabled : undefined, autoSubmitEnabled: r ? r.autoSubmitEnabled : undefined })).filter(r => r.host);
}

function findBestOverride(overrides, host, ignoredIndex) {
  let best = null, bestLen = -1;
  for (let i = 0; i < overrides.length; i++) {
    if (i === ignoredIndex) continue;
    const rh = normalizeHost(overrides[i] && overrides[i].host);
    if (!hostMatch(host, rh) || rh.length <= bestLen) continue;
    best = overrides[i];
    bestLen = rh.length;
  }
  return best;
}

function hostMatch(host, ruleHost) {
  const nh = normalizeHost(host);
  const nrh = normalizeHost(ruleHost);
  if (!nh || !nrh) return false;
  return nh === nrh || nh.endsWith(`.${nrh}`);
}

function normalizeHost(value) {
  const trimmed = String(value || '').trim().toLowerCase();
  if (!trimmed) return '';
  try {
    const parsed = trimmed.includes('://') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    return parsed.hostname.replace(/^\.+|\.+$/g, '');
  } catch { return trimmed.replace(/^\.+|\.+$/g, ''); }
}

function hostFromUrl(url) {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ''; }
}

async function togglePasskeys() {
  const enabled = !passkeysEnabled.value;
  try {
    const result = await send({ type: 'KBB_SET_PASSKEYS_ENABLED', enabled });
    passkeysEnabled.value = result.passkeysEnabled === true;
    passkeyStatusText.value = result.passkeysEnabled ? 'Passkeys are active' : 'Passkeys disabled';
  } catch (error) {
    passkeysEnabled.value = !enabled;
    passkeyStatusText.value = 'Failed: ' + (error.message || 'unknown error');
  }
}

async function checkUpdates() {
  const result = await send({ type: 'KBB_CHECK_UPDATES' });
  if (result.updateAvailable) {
    releasesUrl.value = result.releaseUrl || releasesUrl.value;
    setMessage(`Update ${result.latestVersion} is available. Open GitHub Releases to install it.`);
    return;
  }
  setMessage(`KeePass Browser Bridge ${result.currentVersion} is up to date.`);
}

async function refreshAboutMetadata() {
  const about = await send({ type: 'KBB_GET_ABOUT' });
  aboutVersion.value = about.version || 'Unknown';
  aboutPluginVersion.value = about.pluginVersion || 'Unavailable';
  aboutBrowserId.value = about.browserId || 'Unknown';
  repositoryUrl.value = about.repositoryUrl || '#';
  releasesUrl.value = about.releasesUrl || '#';
  passkeyAvailable.value = about.pluginFeatures && about.pluginFeatures.passkeys;
  if (passkeyAvailable.value) {
    passkeysEnabled.value = Boolean(about.passkeysEnabled);
    const ps = about.pluginPasskeysStatus;
    if (ps === 'enabled') passkeyStatusText.value = 'Passkeys are active';
    else if (ps === 'prototype_disabled') passkeyStatusText.value = 'Backend ready — enable above to activate WebAuthn';
    else passkeyStatusText.value = 'Passkeys are disabled';
  }
  return about;
}

function showCreateForm(url, pageCredential) {
  formMode.value = true;
  detailEntry.value = null;

  nextTick(() => {
    const container = formSlotEl.value;
    if (!container) return;
    container.innerHTML = '';

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
      <div class="edit-actions">
        <button type="submit">✓ Save</button>
        <button type="button" class="secondary" data-action="cancel">✕ Cancel</button>
      </div>
    `;

    try { form.querySelector('[name="title"]').value = new URL(url).hostname || 'New Login'; } catch { form.querySelector('[name="title"]').value = 'New Login'; }
    form.querySelector('[name="url"]').value = url || '';
    if (pageCredential) {
      form.querySelector('[name="userName"]').value = pageCredential.userName || '';
      form.querySelector('[name="password"]').value = pageCredential.password || '';
    }

    form.querySelector('[data-action="generate-password"]').addEventListener('click', () => {
      const pw = form.querySelector('[name="password"]');
      pw.value = generatePassword(20);
      pw.dispatchEvent(new Event('input', { bubbles: true }));
      pw.dispatchEvent(new Event('change', { bubbles: true }));
      pw.focus();
      setMessage('Generated a new password. Save to create the KeePass entry.');
    });

    initCustomFields(form, []);
    wirePasswordToggle(form);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      runAction(() => createLogin(form));
    });

    form.querySelector('[data-action="cancel"]').addEventListener('click', () => {
      runAction(async () => {
        formMode.value = false;
        await queryLogins();
      });
    });

    container.append(form);
  });
}

function initCustomFields(form, fields) {
  const container = form.querySelector('[data-custom-fields]');
  if (!container) return;
  const values = fields && fields.length ? fields : [{ Name: '', Value: '' }];
  for (const f of values) appendCustomFieldRow(container, f);
  const add = form.querySelector('[data-action="add-custom-field"]');
  if (add) add.addEventListener('click', () => appendCustomFieldRow(container, { Name: '', Value: '' }));
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

function wirePasswordToggle(form) {
  const pw = form.querySelector('[name="password"]');
  const toggle = form.querySelector('[data-action="toggle-password-visibility"]');
  if (!pw || !toggle) return;
  toggle.addEventListener('click', () => {
    const visible = pw.type === 'text';
    pw.type = visible ? 'password' : 'text';
    toggle.textContent = visible ? 'Show' : 'Hide';
    pw.focus();
  });
}

async function createLogin(form) {
  const login = {
    Title: form.querySelector('[name="title"]').value,
    Group: form.querySelector('[name="group"]').value,
    Url: form.querySelector('[name="url"]').value,
    UserName: form.querySelector('[name="userName"]').value,
    Password: form.querySelector('[name="password"]').value
  };
  const otp = String(form.querySelector('[name="otp"]')?.value || '').trim();
  if (otp) login.Otp = otp;
  const customFields = Array.from(form.querySelectorAll('.custom-field-row'))
    .map(r => ({ Name: String(r.querySelector('[name="customFieldName"]')?.value || '').trim(), Value: String(r.querySelector('[name="customFieldValue"]')?.value || '').trim(), IsProtected: false }))
    .filter(f => f.Name && f.Value);
  const seen = new Set();
  for (const f of customFields) {
    const key = f.Name.toLowerCase();
    if (seen.has(key)) throw new Error(`Custom field "${f.Name}" is duplicated.`);
    seen.add(key);
  }
  if (customFields.length) login.CustomFields = customFields;
  const result = await send({ type: 'KBB_CREATE_LOGIN', login });
  if (!result || !result.Success) throw new Error(result && result.Error ? result.Error : 'KeePass entry could not be created.');
  const entry = mergeCreatedEntry(login, result.Entry);
  formMode.value = false;
  currentEntries.value = sortEntries([entry].concat(currentEntries.value || []));
  setMessage('Entry created.');
}

function mergeCreatedEntry(login, resultEntry) {
  const entry = resultEntry || {};
  return Object.assign({}, entry, {
    Title: entry.Title || login.Title,
    Group: entry.Group || login.Group,
    Url: entry.Url || login.Url,
    UserName: entry.UserName || login.UserName,
    Password: login.Password,
    CustomFields: entry.CustomFields || []
  });
}

function editableCustomFields(entry) {
  const fields = entry && Array.isArray(entry.CustomFields) ? entry.CustomFields : [];
  return fields.filter(f => f && !f.IsProtected && f.Name && f.Value);
}

async function updateLogin(entry, form) {
  const login = {
    EntryId: entry.EntryId,
    Title: form.querySelector('[name="title"]').value,
    Group: form.querySelector('[name="group"]').value,
    Url: form.querySelector('[name="url"]').value,
    UserName: form.querySelector('[name="userName"]').value,
    Password: form.querySelector('[name="password"]').value,
    ClearOtp: form.querySelector('[name="clearOtp"]').checked
  };
  if (!login.ClearOtp) {
    const otp = String(form.querySelector('[name="otp"]')?.value || '').trim();
    if (otp) login.Otp = otp;
  }
  login.ReplaceCustomFields = true;
  const customFields = Array.from(form.querySelectorAll('.custom-field-row'))
    .map(r => ({ Name: String(r.querySelector('[name="customFieldName"]')?.value || '').trim(), Value: String(r.querySelector('[name="customFieldValue"]')?.value || '').trim(), IsProtected: false }))
    .filter(f => f.Name && f.Value);
  const seen = new Set();
  for (const f of customFields) {
    const key = f.Name.toLowerCase();
    if (seen.has(key)) throw new Error(`Custom field "${f.Name}" is duplicated.`);
    seen.add(key);
  }
  if (customFields.length) login.CustomFields = customFields;
  const result = await send({ type: 'KBB_UPDATE_LOGIN', login });
  if (!result || !result.Success) throw new Error(result && result.Error ? result.Error : 'KeePass entry could not be updated.');
  Object.assign(entry, result.Entry || {}, {
    Title: login.Title,
    Group: login.Group,
    Url: login.Url,
    UserName: login.UserName,
    Password: login.Password,
    CustomFields: result.Entry && result.Entry.CustomFields ? result.Entry.CustomFields : entry.CustomFields
  });
  formMode.value = false;
  await queryLogins();
  setMessage('Entry updated.');
}

function showEditForm(entry) {
  if (!hasWritePermission.value) {
    setMessage('This browser is read-only. Enable Write permission to create or update KeePass entries.', true);
    return;
  }

  formMode.value = true;
  detailEntry.value = null;

  nextTick(() => {
    const container = formSlotEl.value;
    if (!container) return;
    container.innerHTML = '';

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
      <div class="edit-actions">
        <button type="submit">✓ Save</button>
        <button type="button" class="secondary" data-action="cancel">✕ Cancel</button>
      </div>
    `;

    form.querySelector('[name="title"]').value = entry.Title || '';
    form.querySelector('[name="group"]').value = entry.Group || '';
    form.querySelector('[name="userName"]').value = entry.UserName || '';
    form.querySelector('[name="url"]').value = entry.Url || '';
    form.querySelector('[name="password"]').value = entry.Password || '';
    initCustomFields(form, editableCustomFields(entry));
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
    wirePasswordToggle(form);
    form.querySelector('[data-action="cancel"]').addEventListener('click', () => { formMode.value = false; });
    container.append(form);
  });
}

function handleKeyboardShortcuts(event) {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
  if (event.key === 'Enter') {
    if (pairingActive.value) {
      event.preventDefault();
      if (pairingCode.value && /^\d{6}$/.test(pairingCode.value)) runAction(completePair);
      return;
    }
    if (credentialActionsEnabled.value && filteredEntries.value.length > 0) {
      event.preventDefault();
      runAction(() => fillLogin(filteredEntries.value[0]));
    }
  }
  if (event.key === 'Escape') {
    if (pairingActive.value) { event.preventDefault(); runAction(cancelPair); return; }
  }
  if ((event.ctrlKey || event.metaKey) && (event.key === 'f' || event.key === 'F')) {
    event.preventDefault();
    runAction(queryLogins);
  }
  if ((event.ctrlKey || event.metaKey) && (event.key === 'p' || event.key === 'P')) {
    event.preventDefault();
    runAction(beginPair);
  }
}
</script>
