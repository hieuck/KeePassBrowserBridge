<template>
  <footer class="status-bar">
    <button id="lockBridge" class="lock-btn" :title="lockTitle" @click="$emit('toggle-lock')">
      <span class="lock-icon">{{ locked ? '🔓' : '🔒' }}</span>
      <span class="lock-status">{{ locked ? 'Unlock' : 'Lock' }}</span>
    </button>
    <span id="statusBadge" class="vault-status" :class="statusClass">{{ statusText }}</span>
    <div class="status-actions">
      <button id="showSettings" class="btn-icon" type="button" title="Settings" @click="$emit('toggle-settings')">⚙</button>
      <button id="showAbout" class="btn-icon" type="button" title="About" @click="$emit('toggle-about')">ℹ</button>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  locked: { type: Boolean, default: false },
  statusText: { type: String, default: 'Checking' },
  statusKind: { type: String, default: '' }
});

defineEmits(['toggle-lock', 'toggle-settings', 'toggle-about']);

const lockTitle = computed(() => props.locked ? 'Unlock vault' : 'Lock vault');

const statusClass = computed(() => ({
  paired: props.statusKind === 'paired',
  error: props.statusKind === 'error'
}));
</script>
