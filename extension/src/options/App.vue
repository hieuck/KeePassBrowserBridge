<template>
  <a-config-provider :theme="antdThemeConfig">
  <div class="options-page">
    <header class="options-page__header">
      <div class="options-page__brand">
        <KeyOutlined :style="{ fontSize: '20px' }" class="options-page__logo" />
        <span>KeePass Bridge</span>
        <span class="options-page__version">v2.0.0</span>
      </div>
      <a-button @click="cycleTheme" :aria-label="`Theme: ${theme}`">
        <template #icon>
          <component :is="themeIconComponent" />
        </template>
      </a-button>
    </header>
    <div class="options-page__body">
      <Sidebar :active="activeTab" :tabs="tabs" @select="activeTab = $event" />
      <main class="options-page__content">
        <component :is="activeComponent" :settings="settings" @save="onSettingChange" @reset="reset" />
      </main>
    </div>
    <footer v-if="hasChanges" class="options-page__footer">
      <div class="options-page__footer-info">
        <SafetyOutlined :style="{ fontSize: '14px' }" />
        <span>Unsaved changes</span>
      </div>
      <div class="options-page__footer-actions">
        <a-button @click="reset">Reset</a-button>
        <a-button type="primary" @click="save" :loading="saving">Save changes</a-button>
      </div>
    </footer>
  </div>
  </a-config-provider>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import {
  BulbOutlined,
  HighlightOutlined,
  DesktopOutlined,
  KeyOutlined,
  SafetyOutlined,
} from '@ant-design/icons-vue';
import Sidebar from './Sidebar.vue';

const components = {
  general: defineAsyncComponent(() => import('./tabs/GeneralTab.vue')),
  bridge: defineAsyncComponent(() => import('./tabs/BridgeTab.vue')),
  autofill: defineAsyncComponent(() => import('./tabs/AutoFillTab.vue')),
  sites: defineAsyncComponent(() => import('./tabs/SitesTab.vue')),
  clients: defineAsyncComponent(() => import('./tabs/ClientsTab.vue')),
  passkey: defineAsyncComponent(() => import('./tabs/PasskeyTab.vue')),
  about: defineAsyncComponent(() => import('./tabs/AboutTab.vue')),
};
import { useTheme } from '../composables/useTheme.js';
import { useToast } from '../composables/useToast.js';
import { useBridge } from '../composables/useBridge.js';
import { theme as antdTheme } from 'ant-design-vue';
import { getSettings, setSettings } from '../../shared/storage.js';

const { theme: appTheme, resolved: resolvedTheme, setTheme } = useTheme();
const antdThemeConfig = computed(() => ({
  algorithm: resolvedTheme.value === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: '#2563eb',
    colorBgContainer: resolvedTheme.value === 'dark' ? '#1e293b' : '#ffffff',
    colorText: resolvedTheme.value === 'dark' ? '#f1f5f9' : '#0f172a',
    colorTextSecondary: resolvedTheme.value === 'dark' ? '#cbd5e1' : '#475569',
    borderRadius: 6,
  },
}));
const { show: showToast } = useToast();
const bridge = useBridge();

const activeTab = ref('general');
const settings = ref({});
const originalSettings = ref({});
const saving = ref(false);
const hasChanges = computed(() => JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value));

const tabs = [
  { id: 'general', label: 'General' },
  { id: 'bridge', label: 'Bridge' },
  { id: 'autofill', label: 'Auto-fill' },
  { id: 'sites', label: 'Sites' },
  { id: 'clients', label: 'Clients' },
  { id: 'passkey', label: 'Passkeys' },
  { id: 'about', label: 'About' },
];

const activeComponent = computed(() => components[activeTab.value]);

const themeIconMap = { light: BulbOutlined, dark: HighlightOutlined, system: DesktopOutlined };
const themeIconComponent = computed(() => themeIconMap[theme.value] || SunOutlined);

function cycleTheme() {
  setTheme(theme.value === 'light' ? 'dark' : theme.value === 'dark' ? 'system' : 'light');
}

async function loadSettings() {
  settings.value = await getSettings();
  originalSettings.value = { ...settings.value };
}

function onSettingChange(changes) {
  if (changes && typeof changes === 'object') {
    settings.value = { ...settings.value, ...changes };
  }
}

async function save() {
  saving.value = true;
  try {
    const prevPasskeys = originalSettings.value.passkeysEnabled;
    const nextPasskeys = settings.value.passkeysEnabled;
    await setSettings(settings.value);
    originalSettings.value = { ...settings.value };
    if (prevPasskeys !== nextPasskeys) {
      if (nextPasskeys && typeof chrome !== 'undefined' && chrome.permissions) {
        try {
          await chrome.permissions.request({
            permissions: ['webAuthenticationProxy', 'webNavigation']
          });
        } catch (e) {
          console.error('Passkey permission request failed:', e);
        }
      }
      bridge.setPasskeysEnabled(nextPasskeys).catch((e) => {
        console.error('Passkey toggle failed:', e);
      });
    }
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
.options-page__body { display: flex; flex: 1; min-height: 0; }
.options-page__content { flex: 1; overflow-y: auto; padding: var(--space-5); }
.options-page__footer { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-5); border-top: 1px solid var(--color-border); background: var(--color-surface); }
.options-page__footer-info { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-sm); color: var(--color-text-secondary); }
.options-page__footer-actions { display: flex; gap: var(--space-2); }
</style>
