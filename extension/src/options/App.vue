<template>
  <div class="options-page">
    <header class="options-page__header">
      <div class="options-page__brand">
        <Icon name="key" :size="20" class="options-page__logo" />
        <span>KeePass Bridge</span>
        <span class="options-page__version">v2.0.0</span>
      </div>
      <button type="button" class="options-page__theme-btn" :aria-label="`Theme: ${theme}`" @click="cycleTheme">
        <Icon :name="themeIcon" :size="16" />
      </button>
    </header>
    <div class="options-page__body">
      <Sidebar :active="activeTab" :tabs="tabs" @select="activeTab = $event" />
      <main class="options-page__content">
        <component :is="activeComponent" :settings="settings" @save="save" @reset="reset" />
      </main>
    </div>
    <footer v-if="hasChanges" class="options-page__footer">
      <div class="options-page__footer-info">
        <Icon name="shield-check" :size="14" />
        <span>Unsaved changes</span>
      </div>
      <div class="options-page__footer-actions">
        <BaseButton variant="ghost" @click="reset">Reset</BaseButton>
        <BaseButton variant="primary" @click="save" :loading="saving">Save changes</BaseButton>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import Icon from '../components/Icon.vue';
import BaseButton from '../components/BaseButton.vue';
import Sidebar from './Sidebar.vue';
import GeneralTab from './tabs/GeneralTab.vue';
import BridgeTab from './tabs/BridgeTab.vue';
import AutoFillTab from './tabs/AutoFillTab.vue';
import SitesTab from './tabs/SitesTab.vue';
import ClientsTab from './tabs/ClientsTab.vue';
import PasskeyTab from './tabs/PasskeyTab.vue';
import AboutTab from './tabs/AboutTab.vue';
import { useTheme } from '../composables/useTheme.js';
import { useToast } from '../composables/useToast.js';
import { getSettings, setSettings } from '../../shared/storage.js';

const { theme, setTheme } = useTheme();
const { show: showToast } = useToast();

const activeTab = ref('general');
const settings = ref({});
const originalSettings = ref({});
const saving = ref(false);
const hasChanges = computed(() => JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value));

const tabs = [
  { id: 'general', label: 'General', icon: 'user' },
  { id: 'bridge', label: 'Bridge', icon: 'globe' },
  { id: 'autofill', label: 'Auto-fill', icon: 'check' },
  { id: 'sites', label: 'Sites', icon: 'globe' },
  { id: 'clients', label: 'Clients', icon: 'user-plus' },
  { id: 'passkey', label: 'Passkeys', icon: 'shield' },
  { id: 'about', label: 'About', icon: 'shield-check' },
];

const components = {
  general: GeneralTab,
  bridge: BridgeTab,
  autofill: AutoFillTab,
  sites: SitesTab,
  clients: ClientsTab,
  passkey: PasskeyTab,
  about: AboutTab,
};

const activeComponent = computed(() => components[activeTab.value]);

const themeIcon = computed(() => ({ light: 'sun', dark: 'moon', system: 'monitor' })[theme.value] || 'sun');

function cycleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : theme.value === 'dark' ? 'system' : 'light');
}

async function loadSettings() {
  settings.value = await getSettings();
  originalSettings.value = { ...settings.value };
}

async function save() {
  saving.value = true;
  try {
    await setSettings(settings.value);
    originalSettings.value = { ...settings.value };
    showToast('Settings saved', { variant: 'success' });
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  } finally {
    saving.value = false;
  }
}

function reset() {
  settings.value = { ...originalSettings.value };
}

onMounted(() => { loadSettings(); });
</script>

<style scoped>
.options-page { display: flex; flex-direction: column; height: 100vh; background: var(--color-bg); }
.options-page__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-5); border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
.options-page__brand { display: flex; align-items: center; gap: var(--space-2); font-weight: 700; font-size: var(--text-md); }
.options-page__logo { color: var(--color-accent); }
.options-page__version { color: var(--color-text-muted); font-weight: 400; font-size: var(--text-xs); }
.options-page__theme-btn { background: transparent; border: none; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); cursor: pointer; color: var(--color-text-secondary); transition: background var(--transition-fast), color var(--transition-fast); }
.options-page__theme-btn:hover { background: var(--color-bg); color: var(--color-text); }
.options-page__body { display: flex; flex: 1; min-height: 0; }
.options-page__content { flex: 1; overflow-y: auto; padding: var(--space-5); }
.options-page__footer { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-5); border-top: 1px solid var(--color-border); background: var(--color-surface); }
.options-page__footer-info { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-secondary); }
.options-page__footer-actions { display: flex; gap: var(--space-2); }
</style>
