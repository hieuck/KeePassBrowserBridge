<template>
  <div class="popup">
    <PopupHeader
      :theme="theme"
      @toggle-theme="cycleTheme"
    />
    <SearchBar
      v-model="searchQuery"
      placeholder="Search vault..."
    />
    <FilterBar
      :groups="groups"
      :model-value="activeGroup"
      @update:model-value="(v) => activeGroup = v"
    />
    <main class="vault-list" id="results">
      <template v-if="loading">
        <div v-for="i in 3" :key="i" class="skeleton-card" />
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
    </main>
    <BottomToolbar
      :can-write="canWrite && !state.locked"
      @new-login="startNew"
      @settings="openSettings"
      @clients="openClients"
      @lock="lock"
    />
    <StatusBar
      :state="state"
      :theme="theme"
      @toggle-theme="cycleTheme"
      @unlock="unlock"
      @lock="lock"
    />
    <NewLoginForm
      v-if="formMode === 'new'"
      @save="createLogin"
      @cancel="formMode = null"
    />
    <EditForm
      v-else-if="formMode === 'edit' && editingEntry"
      :entry="editingEntry"
      @save="saveEdit"
      @cancel="formMode = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useBridge } from '../composables/useBridge.js';
import { useTheme } from '../composables/useTheme.js';
import { useToast } from '../composables/useToast.js';
import { getSettings } from '../../shared/storage.js';
import PopupHeader from './PopupHeader.vue';
import SearchBar from './SearchBar.vue';
import FilterBar from '../components/FilterBar.vue';
import CredentialCard from './CredentialCard.vue';
import EmptyState from './EmptyState.vue';
import BottomToolbar from './BottomToolbar.vue';
import StatusBar from './StatusBar.vue';
import NewLoginForm from './NewLoginForm.vue';
import EditForm from './EditForm.vue';

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

const canWrite = computed(() => permissions.value.includes('write'));

const groups = computed(() => {
  const set = new Set(currentEntries.value.map(e => e.Group).filter(Boolean));
  return ['All', ...Array.from(set).sort()];
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
  formMode.value = 'edit';
  detailEntry.value = null;
}

function startNew() {
  formMode.value = 'new';
  detailEntry.value = null;
}

async function saveEdit(updates) {
  try {
    await bridge.updateLogin({ ...editingEntry.value, ...updates });
    showToast('Updated', { variant: 'success' });
    formMode.value = null;
    await refreshState();
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  }
}

async function createLogin(login) {
  try {
    await bridge.createLogin(login);
    showToast('Created', { variant: 'success' });
    formMode.value = null;
    await refreshState();
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  }
}

function openSettings() {
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.openOptionsPage();
  }
}

function openClients() {
  // Placeholder; show clients modal in future
}

function lock() {
  bridge.setLocked(true).then(() => {
    state.value.locked = true;
  });
}

function unlock() {
  bridge.setLocked(false).then(() => {
    state.value.locked = false;
  });
}

function onEmptyAction() {
  if (emptyStateVariant.value === 'empty') startNew();
}

async function refreshState() {
  loading.value = true;
  try {
    const settings = await getSettings();
    state.value = { paired: !!settings.clientId, locked: !!settings.locked };
    permissions.value = settings.permissions || ['read'];
    if (state.value.paired && !state.value.locked) {
      const result = await bridge.queryLogins();
      currentEntries.value = result.entries || [];
      currentUrl.value = result.url || '';
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
  refreshState();
});
</script>

<style scoped>
.popup { display: flex; flex-direction: column; min-height: 500px; max-height: 600px; }
.vault-list { flex: 1; overflow-y: auto; }
.skeleton-card { height: 64px; margin: var(--space-2) var(--space-3); background: var(--color-bg); border-radius: var(--radius-md); animation: kbb-pulse 1.5s ease-in-out infinite; }
@keyframes kbb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
</style>
