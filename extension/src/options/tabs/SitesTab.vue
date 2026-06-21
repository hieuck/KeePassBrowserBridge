<template>
  <div>
    <div class="settings-section">
      <h2>Site Overrides</h2>

      <div class="setting-group">
        <label for="siteOverrideHost">Host</label>
        <div class="site-override-editor">
          <input id="siteOverrideHost" type="text" placeholder="example.com" autocomplete="off" v-model="newHost">
          <button id="addSiteOverride" type="button" class="btn-secondary" @click="addOverride">Add</button>
        </div>
        <p class="settings-hint">Override auto-fill behavior for a host and its subdomains.</p>
      </div>

      <div class="setting-group">
        <label class="toggle-row" for="siteOverrideAutoFill">
          <span class="toggle-label">
            <span class="toggle-label-text">Allow auto-fill on this host</span>
          </span>
          <span class="toggle-switch">
            <input id="siteOverrideAutoFill" type="checkbox" v-model="newAutoFill">
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </span>
        </label>
        <label class="toggle-row" for="siteOverrideAutoSubmit">
          <span class="toggle-label">
            <span class="toggle-label-text">Auto-submit on this host</span>
          </span>
          <span class="toggle-switch">
            <input id="siteOverrideAutoSubmit" type="checkbox" v-model="newAutoSubmit">
            <span class="toggle-track"><span class="toggle-thumb"></span></span>
          </span>
        </label>
      </div>

      <div id="siteOverrideList" class="site-override-list" aria-live="polite">
        <p v-if="!siteOverrides.length" class="site-override-empty">No site overrides configured.</p>
        <div
          v-for="rule in siteOverrides"
          :key="rule.host"
          class="site-override-row"
          :data-host="rule.host"
        >
          <div>
            <span class="site-override-host">{{ rule.host }}</span>
            <span class="site-override-meta">
              {{ rule.autoFillEnabled ? 'auto-fill allowed' : 'auto-fill disabled' }}
              /
              {{ rule.autoSubmitEnabled ? 'auto-submit enabled' : 'auto-submit disabled' }}
            </span>
          </div>
          <button
            type="button"
            class="secondary"
            data-action="remove-site-override"
            @click="removeOverride(rule.host)"
          >Remove</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h2>URL Matching</h2>

      <label class="toggle-row" for="strictUrlMatching">
        <span class="toggle-label">
          <span class="toggle-label-text">Strict URL matching</span>
          <span class="toggle-hint">Only match exact domain. Disable to match subdomains</span>
        </span>
        <span class="toggle-switch">
          <input id="strictUrlMatching" type="checkbox"
            :checked="strictUrlMatching" @change="$emit('update:strict-url-matching', $event.target.checked)">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>

      <label class="toggle-row" for="regexUrlMatching">
        <span class="toggle-label">
          <span class="toggle-label-text">Regex URL matching</span>
          <span class="toggle-hint">Allow regular expressions in entry URLs for advanced matching</span>
        </span>
        <span class="toggle-switch">
          <input id="regexUrlMatching" type="checkbox"
            :checked="regexUrlMatching" @change="$emit('update:regex-url-matching', $event.target.checked)">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>
    </div>
  </div>
</template>

<script>
import { normalizeHost, normalizeSiteOverrides } from '../utils.js';

export default {
  props: {
    siteOverrides: { type: Array, default: () => [] },
    strictUrlMatching: Boolean,
    regexUrlMatching: Boolean
  },
  emits: [
    'update:site-overrides',
    'update:strict-url-matching',
    'update:regex-url-matching',
    'show-message'
  ],
  data() {
    return {
      newHost: '',
      newAutoFill: true,
      newAutoSubmit: false
    };
  },
  methods: {
    addOverride() {
      const host = normalizeHost(this.newHost);
      if (!host) {
        this.$emit('show-message', 'Enter a valid host.', 'error');
        return;
      }
      const rules = [...this.siteOverrides];
      const nextRule = { host, autoFillEnabled: this.newAutoFill, autoSubmitEnabled: this.newAutoSubmit };
      const idx = rules.findIndex((r) => r.host === host);
      if (idx >= 0) {
        rules[idx] = nextRule;
      } else {
        rules.push(nextRule);
      }
      this.$emit('update:site-overrides', rules);
      this.newHost = '';
      this.newAutoFill = true;
      this.newAutoSubmit = false;
    },
    removeOverride(host) {
      this.$emit('update:site-overrides', this.siteOverrides.filter((r) => r.host !== host));
    }
  }
};
</script>
