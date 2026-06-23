<template>
  <div class="status-bar" :class="statusClass">
    <button v-if="!state.locked" type="button" class="status-bar__lock-btn" @click="$emit('lock')">
      <Icon name="lock" :size="14" /> Lock
    </button>
    <button v-else type="button" class="status-bar__lock-btn status-bar__lock-btn--unlock" @click="$emit('unlock')">
      <Icon name="lock-open" :size="14" /> Unlock
    </button>
    <span class="status-bar__status">{{ statusText }}</span>
    <button type="button" class="status-bar__theme-btn" :aria-label="`Theme: ${theme}`" @click="$emit('toggle-theme')">
      <Icon :name="themeIcon" :size="14" />
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';

const props = defineProps({
  state: { type: Object, required: true },
  theme: { type: String, required: true },
});
defineEmits(['lock', 'unlock', 'toggle-theme']);

const themeIcon = computed(() => ({ light: 'globe', dark: 'lock', system: 'eye' })[props.theme] || 'globe');

const statusText = computed(() => {
  if (!props.state.paired) return 'Not paired';
  if (props.state.locked) return 'Locked';
  return 'Paired';
});

const statusClass = computed(() => ({
  'status-bar--locked': props.state.locked,
  'status-bar--unpaired': !props.state.paired,
}));
</script>

<style scoped>
.status-bar { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-top: 1px solid var(--color-border); background: var(--color-surface); font-size: var(--text-xs); color: var(--color-text-secondary); }
.status-bar__lock-btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); background: transparent; border: none; border-radius: var(--radius-sm); font-size: var(--text-xs); color: var(--color-text-secondary); cursor: pointer; font-family: inherit; transition: background var(--transition-fast), color var(--transition-fast); }
.status-bar__lock-btn:hover { background: var(--color-bg); color: var(--color-text); }
.status-bar__lock-btn--unlock { color: var(--color-danger); border-color: var(--color-danger); }
.status-bar__lock-btn--unlock:hover { background: var(--color-danger-subtle); }
.status-bar__status { flex: 1; text-align: center; }
.status-bar--locked .status-bar__status { color: var(--color-danger); font-weight: 600; }
.status-bar--unpaired .status-bar__status { color: var(--color-text-muted); }
.status-bar__theme-btn { background: transparent; border: none; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.status-bar__theme-btn:hover { background: var(--color-bg); color: var(--color-text); }
</style>
