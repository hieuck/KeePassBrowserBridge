<template>
  <div>
    <div class="settings-section">
      <h2>Bridge</h2>
      <div class="setting-group">
        <label for="bridgeEndpoint">Bridge Endpoint</label>
        <input id="bridgeEndpoint" type="url" placeholder="http://127.0.0.1:19455/bridge"
          :value="endpoint" @input="$emit('update:endpoint', $event.target.value)">
        <div class="bridge-status-row">
          <span id="bridgeStatus" class="status-pill" :class="bridgeStatusClass">{{ bridgeStatusText }}</span>
          <button id="checkBridgeStatus" type="button" class="btn-secondary" @click="$emit('check-status')">Check bridge</button>
        </div>
        <p class="settings-hint">The local address where KeePass plugin listens for requests.</p>
      </div>
    </div>

    <div class="settings-section">
      <h2>Auto-fill</h2>

      <label class="toggle-row" for="autoFillEnabled">
        <span class="toggle-label">
          <span class="toggle-label-text">Auto-fill</span>
          <span class="toggle-hint">Automatically fill when exactly one login matches</span>
        </span>
        <span class="toggle-switch">
          <input id="autoFillEnabled" type="checkbox"
            :checked="autoFillEnabled" @change="$emit('update:auto-fill-enabled', $event.target.checked)">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>

      <label class="toggle-row" for="autoSubmitEnabled">
        <span class="toggle-label">
          <span class="toggle-label-text">Auto-submit form</span>
          <span class="toggle-hint">Submit form after filling credentials</span>
        </span>
        <span class="toggle-switch">
          <input id="autoSubmitEnabled" type="checkbox"
            :checked="autoSubmitEnabled" @change="$emit('update:auto-submit-enabled', $event.target.checked)">
          <span class="toggle-track"><span class="toggle-thumb"></span></span>
        </span>
      </label>

      <div class="setting-group">
        <label for="autoFillDelay">Auto-fill delay</label>
        <div class="input-suffix">
          <input id="autoFillDelay" type="number" min="0" max="5000" step="100"
            :value="autoFillDelay" @input="$emit('update:auto-fill-delay', $event.target.value)">
          <span class="suffix-text">ms</span>
        </div>
        <p class="settings-hint">Delay before auto-filling. Increase if pages load slowly.</p>
      </div>
    </div>

    <div class="settings-section">
      <h2>Appearance</h2>
      <div class="setting-group">
        <label for="theme">Theme</label>
        <select id="theme" :value="theme" @change="$emit('update:theme', $event.target.value)">
          <option value="system">System (Recommended)</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    endpoint: String,
    theme: String,
    autoFillEnabled: Boolean,
    autoSubmitEnabled: Boolean,
    autoFillDelay: [String, Number],
    bridgeStatusText: { type: String, default: 'Not checked' },
    bridgeStatusClass: { type: String, default: '' }
  },
  emits: [
    'update:endpoint', 'update:theme',
    'update:auto-fill-enabled', 'update:auto-submit-enabled',
    'update:auto-fill-delay',
    'check-status', 'show-message'
  ]
};
</script>
