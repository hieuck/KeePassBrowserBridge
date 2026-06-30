<template>
  <div class="popup">
    <PopupHeader />
    <SearchBar
      v-model="searchQuery"
      placeholder="Search vault..."
    />
    <FilterBar
      v-if="groups.length > 0"
      :groups="groups"
      :model-value="activeGroup"
      @update:model-value="(v) => activeGroup = v"
    />
    <main class="vault-list" id="results" role="region" aria-label="Credentials" aria-live="polite" :aria-busy="loading ? 'true' : 'false'">
      <PairDialog
        v-if="showPairDialog"
        :pairing-active="!!pairingSessionId"
        :expires-at="pairingExpiresAt"
        @pair-begin="startPairing"
        @pair-complete="completePairing"
        @close="showPairDialog = false"
      />
      <div v-show="!showPairDialog && formMode === 'new'">
        <NewLoginForm
          :groups="groupsData"
          @save="createLogin"
          @cancel="formMode = null"
        />
      </div>
      <div v-if="!showPairDialog && formMode === 'edit' && editingEntry">
        <EditForm
          :entry="editingEntry"
          @save="saveEdit"
          @cancel="formMode = null"
        />
      </div>
      <div v-show="!showPairDialog && formMode === null">
        <template v-if="loading">
          <SkeletonCard v-for="i in 3" :key="i" />
        </template>
        <template v-else-if="visibleEntries.length === 0">
          <EmptyState
            :variant="emptyStateVariant"
            :query="searchQuery"
            @action="onEmptyAction"
          />
        </template>
        <template v-else>
          <CredentialCard
            v-for="(entry, idx) in visibleEntries"
            :key="entry.Uuid || entry.EntryId"
            :entry="entry"
            :entry-index="idx"
            :can-edit="canWrite && !state.locked"
            :expanded="detailEntry === entry"
            @toggle="toggleDetail"
            @fill="fillEntry"
            @copy="copyField"
            @edit="startEdit"
          />
        </template>
      </div>
    </main>
    <FooterBar
      :can-write="canWrite && !state.locked"
      :state="state"
      :theme="theme"
      @new-login="startNew"
      @settings="openSettings"
      @clients="openClients"
      @lock="lock"
      @unlock="unlock"
      @toggle-theme="cycleTheme"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useBridge } from '../composables/useBridge.js';
import { useTheme } from '../composables/useTheme.js';
import { useToast } from '../composables/useToast.js';
import { getSettings } from '../../shared/storage.js';
import PopupHeader from './PopupHeader.vue';
import SearchBar from './SearchBar.vue';
import FilterBar from '../components/FilterBar.vue';
import CredentialCard from './CredentialCard.vue';
import EmptyState from './EmptyState.vue';
import FooterBar from './FooterBar.vue';
import NewLoginForm from './NewLoginForm.vue';
import EditForm from './EditForm.vue';
import SkeletonCard from './SkeletonCard.vue';
import PairDialog from './PairDialog.vue';

const bridge = useBridge();
const { theme, setTheme } = useTheme();
const { show: showToast } = useToast();

const state = ref({ paired: false, locked: false });
const permissions = ref([]);
const searchQuery = ref('');
const activeGroup = ref('All');
const currentEntries = ref([]);
const detailEntry = ref(null);
const formMode = ref(null);
const editingEntry = ref(null);
const loading = ref(false);
const currentUrl = ref('');
const showPairDialog = ref(false);
const pairingSessionId = ref('');
const pairingExpiresAt = ref(0);
const groupsData = ref([]);
const themeReady = ref(false);

const canWrite = computed(() => permissions.value.includes('write'));

const groups = computed(() => {
  const set = new Set(currentEntries.value.map(e => e.Group).filter(Boolean));
  return ['All', ...Array.from(set).sort()].map(name => ({ id: name, label: name }));
});

const visibleEntries = computed(() => {
  const q = searchQuery.value.toLowerCase().trim();
  let entries = currentEntries.value;
  if (activeGroup.value !== 'All') {
    entries = entries.filter(e => e.Group === activeGroup.value);
  }
  if (q) {
    const words = q.split(/\s+/);
    entries = entries.filter(e => {
      const text = [e.Title, e.UserName, e.Url, e.Group, ...(e.CustomFields || []).map(f => `${f.Name} ${f.Value}`)]
        .filter(Boolean).join(' ').toLowerCase();
      return words.every(w => text.includes(w));
    });
  }
  return entries.sort((a, b) => (b.UsageCount || 0) - (a.UsageCount || 0));
});

const emptyStateVariant = computed(() => {
  if (!state.value.paired) return 'unpaired';
  if (state.value.locked) return 'locked';
  if (searchQuery.value) return 'search';
  if (currentEntries.value.length === 0) return 'empty';
  return 'filter';
});

function cycleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : theme.value === 'dark' ? 'system' : 'light');
}

function toggleDetail(entry) {
  detailEntry.value = detailEntry.value === entry ? null : entry;
}

async function fillEntry(entry, fieldRole, customFieldName) {
  try {
    await bridge.fillLogin(entry, fieldRole, customFieldName);
    showToast(`Filled ${entry.Title}`, { variant: 'success' });
    window.close();
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  }
}

async function copyField(fieldName, value) {
  try {
    await navigator.clipboard.writeText(value);
    showToast(`Copied ${fieldName}`, { variant: 'success', duration: 2000 });
  } catch (error) {
    showToast('Copy failed', { variant: 'error' });
  }
}

function startEdit(entry) {
  editingEntry.value = entry;
  detailEntry.value = null;
  formMode.value = 'edit';
}

function startNew() {
  formMode.value = 'new';
  detailEntry.value = null;
}

async function saveEdit(updates) {
  try {
    const payload = { ...editingEntry.value, ...updates };
    if (!payload.EntryId && editingEntry.value.Uuid) {
      payload.EntryId = editingEntry.value.Uuid;
    }
    const result = await bridge.updateLogin(payload);
    if (result && result.Success === false) {
      showToast(result.Error || 'Update failed', { variant: 'error' });
      return;
    }
    showToast('Updated', { variant: 'success' });
    formMode.value = null;
    await refreshState();
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  }
}

async function createLogin(login) {
  try {
    const result = await bridge.createLogin(login);
    if (result && result.Success === false) {
      showToast(result.Error || 'Create failed', { variant: 'error' });
      return;
    }
    showToast('Created', { variant: 'success' });
    formMode.value = null;
    await refreshState();
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  }
}

function openSettings() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    }
  } catch (e) {
    showToast(e.message, { variant: 'error' });
  }
}

function openClients() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.openOptionsPage();
    }
  } catch (e) {
    showToast(e.message, { variant: 'error' });
  }
}

function lock() {
  bridge.lockDatabase().then(() => {
    state.value.locked = true;
    showToast('KeePass locked', { variant: 'info', duration: 2000 });
  }).catch(() => {
    bridge.setLocked(true).then(() => {
      state.value.locked = true;
      showToast('KeePass locked (local)', { variant: 'info', duration: 2000 });
    }).catch((e) => {
      showToast(e.message, { variant: 'error' });
    });
  });
}

function unlock() {
  bridge.setLocked(false).then(() => {
    state.value.locked = false;
    showToast('KeePass unlocked', { variant: 'success', duration: 2000 });
  });
}

function onEmptyAction() {
  if (emptyStateVariant.value === 'empty') startNew();
}

async function startPairing() {
  try {
    const result = await bridge.pairBegin();
    showToast('Pairing session started', { variant: 'info' });
    await refreshState();
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  }
}

async function completePairing(code) {
  try {
    await bridge.pairComplete(code);
    showToast('Paired successfully!', { variant: 'success' });
    showPairDialog.value = false;
    await refreshState();
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  }
}

async function refreshState() {
  loading.value = true;
  try {
    // Read from chrome.storage.local (popup context)
    const settings = await getSettings();
    state.value = { paired: !!settings.clientId, locked: !!settings.locked };
    permissions.value = settings.permissions || (settings.clientId ? ['read', 'write', 'manageClients'] : ['read']);

    // Also get bridge state for pairing session info
    try {
      const bridgeState = await bridge.getState();
      pairingSessionId.value = bridgeState.pairingSessionId || '';
      pairingExpiresAt.value = bridgeState.pairingExpiresAt || 0;
    } catch {
      pairingSessionId.value = '';
      pairingExpiresAt.value = 0;
    }

    // Show pair dialog only if not paired
    if (!state.value.paired) showPairDialog.value = true;

    if (state.value.paired && !state.value.locked) {
      const result = await bridge.queryLogins();
      currentEntries.value = result.entries || [];
      currentUrl.value = result.url || '';
      // Load groups in background
      bridge.listGroups().then((groups) => {
        groupsData.value = groups && groups.Root && groups.Root.Children ? groups.Root.Children : [];
      }).catch(() => {});
    } else {
      currentEntries.value = [];
    }
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  nextTick(() => {
    themeReady.value = true;
  });
  refreshState();
});
</script>

<style scoped>
.popup {
  display: flex;
  flex-direction: column;
  min-height: 500px;
  max-height: 600px;
  background: var(--color-bg);
  width: 100%;
  overflow: hidden;
  gap: 0;
}
.vault-list {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-1) 0 var(--space-2);
}
.vault-list::-webkit-scrollbar { width: 4px; }
.vault-list::-webkit-scrollbar-track { background: transparent; }
.vault-list::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
</style>
