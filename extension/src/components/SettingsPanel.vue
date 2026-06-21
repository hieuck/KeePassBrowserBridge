<template>
  <section id="settingsPanel" class="settings-panel" :class="{ hidden: !visible }">
    <div class="settings-section">
      <label for="endpoint">Bridge endpoint</label>
      <div class="row">
        <input id="endpoint" type="url" spellcheck="false" :value="endpoint" @input="$emit('update:endpoint', $event.target.value)">
        <button id="saveEndpoint" type="button" @click="$emit('save-endpoint')">Save</button>
      </div>
    </div>

    <div class="settings-section">
      <div class="row">
        <button id="checkStatus" type="button" @click="$emit('check-status')">Check</button>
        <button id="beginPair" type="button" @click="$emit('begin-pair')">Pair</button>
      </div>
      <label class="toggle">
        <input id="autoFill" type="checkbox" :checked="autoFillEnabled" @change="$emit('update:auto-fill', $event.target.checked)">
        <span>Auto-fill when exactly one login matches</span>
      </label>
      <label class="toggle">
        <input id="autoSubmit" type="checkbox" :checked="autoSubmitEnabled" @change="$emit('update:auto-submit', $event.target.checked)">
        <span>Auto-submit form after filling</span>
      </label>
      <button id="listClients" class="secondary" type="button" @click="$emit('list-clients')">Trusted Browsers</button>
    </div>

    <div class="settings-section">
      <div class="row">
        <button id="toggleSiteAutoFill" class="secondary" type="button" @click="$emit('toggle-site-auto-fill')">Site Auto-fill</button>
        <button id="toggleSiteAutoSubmit" class="secondary" type="button" @click="$emit('toggle-site-auto-submit')">Site Auto-submit</button>
      </div>
    </div>

    <div id="clientsPanel" class="clients" :class="{ hidden: !clientsVisible }">
      <article v-for="client in clients" :key="client.ClientId + '-' + props.bridgePasskeys" class="client">
        <div class="client-title">{{ client.ClientName || 'Browser' }}</div>
        <div class="client-meta">{{ formatClientMeta(client) }}</div>
        <div class="client-permissions">
          <label v-for="def in permissionDefs" :key="def.value" class="client-permission">
            <input
              type="checkbox"
              :data-permission="def.value"
              :checked="(client.Permissions || []).includes(def.value)"
              :disabled="def.value === 'read' || !manageClientsEnabled"
              @change="$emit('update-client-permission', client, def.value, $event.target.checked)"
            >
            <span>{{ def.label }}</span>
          </label>
        </div>
        <button type="button" class="secondary" :disabled="!manageClientsEnabled" @click="$emit('revoke-client', client)">
          {{ client.Current ? '✕ Revoke This Browser' : '✕ Revoke' }}
        </button>
      </article>
      <div v-if="!clients.length" class="client-meta">No trusted browsers.</div>
    </div>

    <div id="pairingPanel" class="pairing" :class="{ hidden: !pairingActive }">
      <div id="pairingTimer" class="pairing-timer">{{ pairingTimerText }}</div>
      <div class="row">
        <input
          id="pairingCode"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]*"
          maxlength="6"
          placeholder="Pairing code"
          :value="pairingCode"
          @input="$emit('update:pairing-code', $event.target.value)"
          @keydown.enter="pairingCode && /^\d{6}$/.test(pairingCode) && $emit('complete-pair')"
          @keydown.escape="$emit('cancel-pair')"
        >
        <button id="pastePairingCode" class="secondary" type="button" @click="$emit('paste-pairing-code')">Paste & Pair</button>
        <button id="completePair" type="button" :disabled="!/^\d{6}$/.test(pairingCode)" @click="$emit('complete-pair')">Confirm</button>
        <button id="cancelPair" class="secondary" type="button" @click="$emit('cancel-pair')">Cancel</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  endpoint: { type: String, default: '' },
  autoFillEnabled: { type: Boolean, default: false },
  autoSubmitEnabled: { type: Boolean, default: false },
  locked: { type: Boolean, default: false },
  paired: { type: Boolean, default: false },
  pairingActive: { type: Boolean, default: false },
  pairingCode: { type: String, default: '' },
  pairingTimerText: { type: String, default: '' },
  clients: { type: Array, default: () => [] },
  clientsVisible: { type: Boolean, default: false },
  manageClientsEnabled: { type: Boolean, default: false },
  bridgePasskeys: { type: Boolean, default: false }
});

const emit = defineEmits([
  'update:endpoint', 'save-endpoint', 'check-status', 'begin-pair',
  'paste-pairing-code', 'complete-pair', 'cancel-pair',
  'update:auto-fill', 'update:auto-submit', 'update:pairing-code',
  'list-clients', 'revoke-client', 'update-client-permission',
  'toggle-site-auto-fill', 'toggle-site-auto-submit'
]);

const permissionDefs = computed(() => {
  const defs = [
    { value: 'read', label: 'Read' },
    { value: 'write', label: 'Write' },
    { value: 'manageClients', label: 'Manage browsers' }
  ];
  if (props.bridgePasskeys) {
    defs.push({ value: 'passkeyRead', label: 'Passkey read' }, { value: 'passkeyWrite', label: 'Passkey write' });
  }
  return defs;
});

function formatClientMeta(client) {
  return [
    client.Current ? 'This browser' : '',
    client.ExtensionOrigin || '',
    `Created: ${formatDate(client.CreatedUtcMs)}`,
    `Last used: ${formatDate(client.LastUsedUtcMs)}`,
    formatClientPerms(client.Permissions)
  ].filter(Boolean).join(' - ');
}

function formatClientPerms(permissions) {
  const labels = Object.fromEntries(permissionDefs.value.map(d => [d.value, d.label]));
  const vals = normalizePerms(permissions);
  return vals.map(p => labels[p]).filter(Boolean).join(', ');
}

function normalizePerms(permissions) {
  const allowed = permissionDefs.value.map(d => d.value);
  const normalized = ['read'];
  for (const p of Array.isArray(permissions) ? permissions : []) {
    if (allowed.includes(p) && !normalized.includes(p)) normalized.push(p);
  }
  return normalized;
}

function formatDate(ms) {
  const v = Number(ms || 0);
  if (!v) return 'Unknown date';
  return new Date(v).toLocaleString();
}
</script>
