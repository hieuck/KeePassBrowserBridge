<template>
  <div class="app" :data-theme="currentTheme">
    <header class="options-header">
      <div class="logo">
        <span class="logo-icon">🔑</span>
        <span class="logo-text">KeePass Bridge</span>
      </div>
      <span class="header-subtitle">Settings</span>
      <button id="themeToggle" type="button" class="btn-icon" aria-label="Toggle theme" title="Toggle dark/light mode" @click="toggleTheme">
        <span class="theme-icon">{{ currentTheme === 'dark' ? '☀️' : '🌙' }}</span>
      </button>
    </header>

    <nav class="tab-nav pill-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="pill-tab"
        :class="{ active: activeTab === tab.id }"
        :data-tab="tab.id"
        @click="activeTab = tab.id"
      >{{ tab.label }}</button>
    </nav>

    <div class="tab-content">
      <section v-show="activeTab === 'general'" class="tab-panel" :class="{ active: activeTab === 'general' }">
        <GeneralTab
          :endpoint="settings.endpoint"
          :theme="settings.theme"
          :auto-fill-enabled="settings.autoFillEnabled"
          :auto-submit-enabled="settings.autoSubmitEnabled"
          :auto-fill-delay="settings.autoFillDelay"
          :bridge-status-text="bridgeStatusText"
          :bridge-status-class="bridgeStatusClass"
          @update:endpoint="settings.endpoint = $event"
          @update:theme="settings.theme = $event"
          @update:auto-fill-enabled="settings.autoFillEnabled = $event"
          @update:auto-submit-enabled="settings.autoSubmitEnabled = $event"
          @update:auto-fill-delay="settings.autoFillDelay = $event"
          @check-status="checkBridgeStatus"
          @show-message="showMessage"
        />
      </section>
      <section v-show="activeTab === 'sites'" class="tab-panel" :class="{ active: activeTab === 'sites' }">
        <SitesTab
          :site-overrides="settings.siteOverrides"
          :strict-url-matching="settings.strictUrlMatching"
          :regex-url-matching="settings.regexUrlMatching"
          @update:site-overrides="settings.siteOverrides = $event"
          @update:strict-url-matching="settings.strictUrlMatching = $event"
          @update:regex-url-matching="settings.regexUrlMatching = $event"
          @show-message="showMessage"
        />
      </section>
      <section v-show="activeTab === 'clients'" class="tab-panel" :class="{ active: activeTab === 'clients' }">
        <ClientsTab
          :show-passwords-in-popup="settings.showPasswordsInPopup"
          :notifications-enabled="settings.notificationsEnabled"
          :auto-lock-timeout-minutes="settings.autoLockTimeoutMinutes"
          :clipboard-clear-delay="settings.clipboardClearDelay"
          :debug-mode="settings.debugMode"
          @update:show-passwords-in-popup="settings.showPasswordsInPopup = $event"
          @update:notifications-enabled="settings.notificationsEnabled = $event"
          @update:auto-lock-timeout-minutes="settings.autoLockTimeoutMinutes = $event"
          @update:clipboard-clear-delay="settings.clipboardClearDelay = $event"
          @update:debug-mode="settings.debugMode = $event"
          @show-message="showMessage"
        />
      </section>
      <section v-show="activeTab === 'about'" class="tab-panel" :class="{ active: activeTab === 'about' }">
        <AboutTab
          @show-message="showMessage"
        />
      </section>
    </div>

    <footer class="footer">
      <button id="saveSettings" type="button" class="btn-primary" @click="saveSettings">Save Settings</button>
      <span id="message" class="message" :class="messageType">{{ messageText }}</span>
    </footer>
  </div>
</template>

<script>
import GeneralTab from './tabs/GeneralTab.vue';
import SitesTab from './tabs/SitesTab.vue';
import ClientsTab from './tabs/ClientsTab.vue';
import AboutTab from './tabs/AboutTab.vue';
import {
  DEFAULT_SETTINGS,
  DEFAULT_ENDPOINT,
  send,
  normalizeBridgeEndpoint,
  normalizeIntegerSetting,
  normalizeSiteOverrides
} from './utils.js';

export default {
  components: { GeneralTab, SitesTab, ClientsTab, AboutTab },
  data() {
    return {
      activeTab: 'general',
      tabs: [
        { id: 'general', label: 'General' },
        { id: 'sites', label: 'Sites' },
        { id: 'clients', label: 'Clients' },
        { id: 'about', label: 'About' }
      ],
      currentTheme: 'light',
      bridgeStatusText: 'Not checked',
      bridgeStatusClass: '',
      messageText: '',
      messageType: '',
      messageClearTimer: null,
      settings: {
        endpoint: DEFAULT_ENDPOINT,
        ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
      }
    };
  },
  mounted() {
    this.detectAndApplyTheme();
    this.loadSettings();
  },
  methods: {
    detectAndApplyTheme() {
      const saved = localStorage.getItem('kbbTheme');
      if (saved === 'light' || saved === 'dark') {
        this.applyTheme(saved);
        return;
      }
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      this.applyTheme(mql.matches ? 'dark' : 'light');
      mql.addEventListener('change', (e) => {
        if (!localStorage.getItem('kbbTheme')) {
          this.applyTheme(e.matches ? 'dark' : 'light');
        }
      });
    },
    applyTheme(theme) {
      this.currentTheme = theme;
      document.documentElement.setAttribute('data-theme', theme);
    },
    toggleTheme() {
      const next = (this.currentTheme || 'light') === 'dark' ? 'light' : 'dark';
      localStorage.setItem('kbbTheme', next);
      this.applyTheme(next);
    },
    loadSettings() {
      chrome.storage.local.get(DEFAULT_SETTINGS, (stored) => {
        this.settings.endpoint = stored.endpoint || DEFAULT_ENDPOINT;
        this.settings.theme = stored.theme || 'system';
        this.settings.autoFillEnabled = stored.autoFillEnabled;
        this.settings.autoSubmitEnabled = stored.autoSubmitEnabled;
        this.settings.autoFillDelay = stored.autoFillDelay;
        this.settings.strictUrlMatching = stored.strictUrlMatching;
        this.settings.regexUrlMatching = stored.regexUrlMatching;
        this.settings.showPasswordsInPopup = stored.showPasswordsInPopup;
        this.settings.notificationsEnabled = stored.notificationsEnabled;
        this.settings.autoLockTimeoutMinutes = stored.autoLockTimeoutMinutes;
        this.settings.clipboardClearDelay = stored.clipboardClearDelay;
        this.settings.debugMode = stored.debugMode;
        this.settings.siteOverrides = normalizeSiteOverrides(stored.siteOverrides);
      });
    },
    saveSettings() {
      let s;
      try {
        s = {
          endpoint: normalizeBridgeEndpoint(this.settings.endpoint),
          theme: this.settings.theme,
          autoFillEnabled: this.settings.autoFillEnabled,
          autoSubmitEnabled: this.settings.autoSubmitEnabled,
          autoFillDelay: normalizeIntegerSetting(
            String(this.settings.autoFillDelay), 0, 5000,
            'Auto-fill delay must be between 0 and 5000 milliseconds.'
          ),
          strictUrlMatching: this.settings.strictUrlMatching,
          regexUrlMatching: this.settings.regexUrlMatching,
          showPasswordsInPopup: this.settings.showPasswordsInPopup,
          notificationsEnabled: this.settings.notificationsEnabled,
          autoLockTimeoutMinutes: normalizeIntegerSetting(
            String(this.settings.autoLockTimeoutMinutes), 0, 1440,
            'Auto-lock timeout must be between 0 and 1440 minutes.'
          ),
          clipboardClearDelay: normalizeIntegerSetting(
            String(this.settings.clipboardClearDelay), 0, 300,
            'Clipboard clear delay must be between 0 and 300 seconds.'
          ),
          debugMode: this.settings.debugMode,
          siteOverrides: normalizeSiteOverrides(this.settings.siteOverrides)
        };
      } catch (err) {
        this.showMessage(err && err.message ? err.message : String(err), 'error');
        return;
      }
      chrome.storage.local.set(s, () => {
        this.showMessage('Settings saved successfully!', 'success');
        if (s.theme !== 'system') {
          this.applyTheme(s.theme);
        }
      });
    },
    async checkBridgeStatus() {
      this.bridgeStatusText = 'Checking';
      this.bridgeStatusClass = '';
      try {
        await send({ type: 'KBB_HELLO' });
        this.bridgeStatusText = 'Reachable';
        this.bridgeStatusClass = 'success';
        this.showMessage('KeePass bridge is reachable.', 'success');
      } catch (err) {
        this.bridgeStatusText = 'Unavailable';
        this.bridgeStatusClass = 'error';
        this.showMessage(
          `KeePass bridge is unavailable: ${err && err.message ? err.message : String(err)}`,
          'error'
        );
      }
    },
    showMessage(text, type) {
      this.messageText = text;
      this.messageType = type || '';
      if (this.messageClearTimer) {
        clearTimeout(this.messageClearTimer);
      }
      this.messageClearTimer = setTimeout(() => {
        this.messageText = '';
        this.messageType = '';
        this.messageClearTimer = null;
      }, 3000);
    }
  }
};
</script>
