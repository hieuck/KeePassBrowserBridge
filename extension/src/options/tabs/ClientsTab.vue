<template>
  <div>
    <div class="settings-section">
      <h2>Security</h2>

      <label class="toggle-row" for="showPasswordsInPopup">
        <span class="toggle-label">
          <span class="toggle-label-text">Show passwords in popup</span>
          <span class="toggle-hint">Display passwords in credential list (less secure)</span>
        </span>
        <span class="toggle-switch">
          <input id="showPasswordsInPopup" type="checkbox"
            :checked="showPasswordsInPopup" @change="$emit('update:show-passwords-in-popup', $event.target.checked)">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>

      <label class="toggle-row" for="notificationsEnabled">
        <span class="toggle-label">
          <span class="toggle-label-text">Desktop notifications</span>
          <span class="toggle-hint">Show feedback after filling, saving, or updating entries</span>
        </span>
        <span class="toggle-switch">
          <input id="notificationsEnabled" type="checkbox"
            :checked="notificationsEnabled" @change="$emit('update:notifications-enabled', $event.target.checked)">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>

      <div class="setting-group">
        <label for="autoLockTimeoutMinutes">Auto-lock after inactivity</label>
        <div class="input-suffix">
          <input id="autoLockTimeoutMinutes" type="number" min="0" max="1440" step="1"
            :value="autoLockTimeoutMinutes" @input="$emit('update:auto-lock-timeout-minutes', $event.target.value)">
          <span class="suffix-text">min</span>
        </div>
        <p class="settings-hint">Lock access after this many inactive minutes. 0 to disable.</p>
      </div>

      <div class="setting-group">
        <label for="clipboardClearDelay">Clear clipboard after</label>
        <div class="input-suffix">
          <input id="clipboardClearDelay" type="number" min="0" max="300" step="5"
            :value="clipboardClearDelay" @input="$emit('update:clipboard-clear-delay', $event.target.value)">
          <span class="suffix-text">sec</span>
        </div>
        <p class="settings-hint">Clear copied passwords from clipboard. 0 to disable.</p>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-heading-row">
        <h2>Trusted Browsers</h2>
        <button id="refreshTrustedBrowsers" type="button" class="btn-secondary" @click="refreshBrowsers">Refresh</button>
      </div>
      <p class="settings-hint">Browsers paired with KeePass can query and fill entries. Revoke any browser you no longer use.</p>
      <div id="trustedBrowserList" class="trusted-browser-list" aria-live="polite">
        <p v-if="!trustedClients.length" class="trusted-browser-empty">{{ trustedClients === null ? '' : 'No trusted browsers.' }}</p>
        <div
          v-for="client in trustedClients"
          :key="client.ClientId"
          class="trusted-browser-row"
          :data-client-id="client.ClientId"
        >
          <div>
            <span class="trusted-browser-name">{{ client.ClientName || 'Browser' }}</span>
            <span class="trusted-browser-meta">
              {{ client.Current ? 'This browser' : '' }}
              {{ client.Current && client.ExtensionOrigin ? ' / ' : '' }}
              {{ client.ExtensionOrigin || '' }}
              {{ (client.Current || client.ExtensionOrigin) ? ' / ' : '' }}
              Created: {{ formatDate(client.CreatedUtcMs) }}
              / Last used: {{ formatDate(client.LastUsedUtcMs) }}
              / {{ formatClientPermissions(client.Permissions) }}
            </span>
            <div class="trusted-browser-permissions">
              <label
                v-for="def in permissionDefs"
                :key="def.value"
                class="trusted-browser-permission"
              >
                <input
                  type="checkbox"
                  :data-permission="def.value"
                  :checked="normalizeClientPermissions(client.Permissions).includes(def.value)"
                  :disabled="def.value === 'read' || !manageEnabled"
                  @change="updatePermission(client, def.value, $event.target.checked)"
                >
                <span>{{ def.label }}</span>
              </label>
            </div>
          </div>
          <button
            type="button"
            class="secondary"
            data-action="revoke-client"
            :disabled="!manageEnabled"
            @click="revokeClient(client)"
          >{{ client.Current ? 'Revoke This Browser' : 'Revoke' }}</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2>Advanced</h2>

      <label class="toggle-row" for="debugMode">
        <span class="toggle-label">
          <span class="toggle-label-text">Debug mode</span>
          <span class="toggle-hint">Enable verbose logging to browser console</span>
        </span>
        <span class="toggle-switch">
          <input id="debugMode" type="checkbox"
            :checked="debugMode" @change="$emit('update:debug-mode', $event.target.checked)">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>

      <div class="setting-group">
        <div class="button-row">
          <button id="exportSettings" type="button" class="btn-secondary" @click="exportSettings">Export Settings</button>
          <button id="importSettings" type="button" class="btn-secondary" @click="triggerImport">Import Settings</button>
        </div>
        <input id="importFile" type="file" accept=".json" style="display: none" ref="importInput" @change="importSettings">
        <p class="settings-hint">Backup and restore your settings.</p>
      </div>

      <div class="setting-group">
        <button id="resetSettings" type="button" class="btn-danger" @click="resetSettings">Reset to Defaults</button>
        <p class="settings-hint">Restore all settings to their default values.</p>
      </div>
    </div>

    <div id="passkeySection" class="settings-section" :style="passkeyVisible ? {} : { display: 'none' }">
      <h2>Passkey Support</h2>
      <label class="toggle-row" for="passkeyToggle">
        <span class="toggle-label">
          <span class="toggle-label-text">Passkeys (Experimental)</span>
        </span>
        <span class="toggle-switch">
          <input id="passkeyToggle" type="checkbox"
            :checked="bridgePasskeysEnabled"
            @change="togglePasskeys">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>
      <p id="passkeyStatus" class="settings-hint">{{ passkeyStatusText }}</p>
    </div>
  </div>
</template>

<script>
import {
  send,
  normalizeClientPermissions,
  formatClientPermissions,
  getPermissionDefinitions,
  formatDate,
  sanitizePortableSettings,
  DEFAULT_SETTINGS,
  normalizeSiteOverrides
} from '../utils.js';

export default {
  props: {
    showPasswordsInPopup: Boolean,
    notificationsEnabled: Boolean,
    autoLockTimeoutMinutes: [String, Number],
    clipboardClearDelay: [String, Number],
    debugMode: Boolean
  },
  emits: [
    'update:show-passwords-in-popup', 'update:notifications-enabled',
    'update:auto-lock-timeout-minutes', 'update:clipboard-clear-delay',
    'update:debug-mode',
    'show-message'
  ],
  data() {
    return {
      trustedClients: [],
      manageEnabled: true,
      bridgePasskeysEnabled: false,
      passkeysEnabled: false,
      passkeyVisible: false,
      passkeyStatusText: ''
    };
  },
  mounted() {
    this.refreshAboutMetadata().catch(() => {});
  },
  computed: {
    permissionDefs() {
      return getPermissionDefinitions(this.bridgePasskeysEnabled);
    }
  },
  methods: {
    formatDate,
    normalizeClientPermissions,
    formatClientPermissions,

    async refreshBrowsers() {
      try {
        await this.refreshAboutMetadata();
        const result = await send({ type: 'KBB_LIST_CLIENTS' });
        this.trustedClients = Array.isArray(result.Clients) ? result.Clients : [];
        this.manageEnabled = true;
        this.$emit('show-message',
          result.Clients && result.Clients.length
            ? `${result.Clients.length} trusted browser(s).`
            : 'No trusted browsers found.',
          'success'
        );
      } catch (err) {
        this.failClosed(err);
        this.$emit('show-message', err && err.message ? err.message : String(err), 'error');
      }
    },

    failClosed(err) {
      const msg = err && err.message ? err.message : String(err || '');
      if (!/permission|not allowed/i.test(msg)) return;
      this.trustedClients = [];
      this.manageEnabled = false;
    },

    async revokeClient(client) {
      const name = client && client.ClientName ? client.ClientName : 'Browser';
      if (!confirm(`Revoke browser "${name}"?\n\nIt will need to pair again before accessing KeePass.`)) {
        this.$emit('show-message', 'Revoke cancelled.', 'success');
        return;
      }
      const result = await send({ type: 'KBB_REVOKE_CLIENT', clientId: client.ClientId });
      if (!result || !result.Revoked) throw new Error('Browser was not revoked.');
      if (client && client.Current) {
        this.trustedClients = [];
        this.manageEnabled = false;
        this.$emit('show-message', 'This browser was revoked. Pair again to use KeePass.', 'success');
        return;
      }
      await this.refreshBrowsers();
      this.$emit('show-message', 'Browser revoked.', 'success');
    },

    async updatePermission(client, permission, enabled) {
      const nextPermissions = normalizeClientPermissions(client.Permissions);
      const idx = nextPermissions.indexOf(permission);
      if (enabled && idx < 0) {
        nextPermissions.push(permission);
      } else if (!enabled && idx >= 0) {
        nextPermissions.splice(idx, 1);
      }
      const result = await send({
        type: 'KBB_UPDATE_CLIENT_PERMISSIONS',
        clientId: client.ClientId,
        permissions: nextPermissions
      });
      if (!result || !result.Updated) throw new Error('Browser permissions were not updated.');
      const stored = this.trustedClients.find((c) => c.ClientId === client.ClientId);
      if (stored) {
        stored.Permissions = normalizeClientPermissions(result.Permissions || nextPermissions);
        if (stored.Current && !stored.Permissions.includes('manageClients')) {
          this.manageEnabled = false;
        }
      }
      this.$emit('show-message',
        this.manageEnabled
          ? 'Browser permissions updated.'
          : 'Browser permissions updated. Manage browsers permission was removed for this browser.',
        'success'
      );
    },

    async togglePasskeys() {
      const enabled = !this.bridgePasskeysEnabled;
      try {
        const result = await send({ type: 'KBB_SET_PASSKEYS_ENABLED', enabled });
        this.bridgePasskeysEnabled = result.passkeysEnabled === true;
        this.passkeyStatusText = result.passkeysEnabled ? 'Passkeys are active' : 'Passkeys disabled';
      } catch (err) {
        this.passkeyStatusText = 'Failed: ' + (err.message || 'unknown error');
      }
    },

    async refreshAboutMetadata() {
      const about = await send({ type: 'KBB_GET_ABOUT' });
      const pkEnabled = about.pluginPasskeysEnabled === true;
      this.bridgePasskeysEnabled = pkEnabled;
      this.passkeyVisible = about.pluginFeatures && about.pluginFeatures.passkeys;
      if (this.passkeyVisible) {
        const status = about.pluginPasskeysStatus;
        if (status === 'enabled') this.passkeyStatusText = 'Passkeys are active';
        else if (status === 'prototype_disabled') this.passkeyStatusText = 'Backend ready — enable in the extension popup to activate WebAuthn.';
        else this.passkeyStatusText = 'Passkeys are disabled';
      }
      return about;
    },

    exportSettings() {
      chrome.storage.local.get(null, (all) => {
        const dataStr = JSON.stringify(sanitizePortableSettings(all), null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kbb-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        this.$emit('show-message', 'Settings exported successfully!', 'success');
      });
    },

    triggerImport() {
      this.$refs.importInput.click();
    },

    importSettings(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const settings = sanitizePortableSettings(parsed, { validateEndpoint: true });
          chrome.storage.local.set(settings, () => {
            this.$emit('show-message', 'Settings imported successfully!', 'success');
            this.$parent.loadSettings();
          });
        } catch (err) {
          this.$emit('show-message',
            `Failed to import settings: ${err && err.message ? err.message : 'Invalid JSON file'}`,
            'error'
          );
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    },

    resetSettings() {
      if (!confirm('Are you sure you want to reset all settings to their default values?')) return;
      chrome.storage.local.set(DEFAULT_SETTINGS, () => {
        this.$parent.loadSettings();
        this.$emit('show-message', 'Settings reset to defaults!', 'success');
      });
    }
  }
};
</script>
