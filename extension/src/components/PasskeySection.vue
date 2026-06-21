<template>
  <section class="settings-section passkey-section" v-if="available" :style="{ display: available ? '' : 'none' }">
    <div class="section-header">Passkey Support</div>
    <label class="toggle">
      <input id="passkeyToggle" type="checkbox" :checked="enabled" @change="$emit('toggle')">
      <span>Enable WebAuthn passkeys</span>
    </label>
    <div id="passkeyStatus" class="status-text">{{ status }}</div>
  </section>
</template>

<script setup>
defineProps({
  available: { type: Boolean, default: false },
  enabled: { type: Boolean, default: false },
  status: { type: String, default: '' }
});
defineEmits(['toggle']);
</script>
