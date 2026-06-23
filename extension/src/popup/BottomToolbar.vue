<template>
  <div class="bottom-toolbar">
    <button type="button" class="bottom-toolbar__btn bottom-toolbar__btn--primary" :disabled="!canWrite" @click="$emit('new-login')">
      <Icon name="plus" :size="14" />
      <span>New Login</span>
    </button>
    <button type="button" class="bottom-toolbar__btn" @click="$emit('settings')" aria-label="Settings">
      <Icon name="globe" :size="16" />
    </button>
    <button type="button" class="bottom-toolbar__btn" @click="$emit('clients')" aria-label="Clients">
      <Icon name="user-plus" :size="16" />
    </button>
    <button type="button" class="bottom-toolbar__btn" @click="$emit('lock')" aria-label="Lock">
      <Icon name="lock" :size="16" />
    </button>
  </div>
</template>

<script setup>
import Icon from '../components/Icon.vue';

defineProps({ canWrite: { type: Boolean, default: false } });
defineEmits(['new-login', 'settings', 'clients', 'lock']);
</script>

<style scoped>
.bottom-toolbar { display: flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-3); border-top: 1px solid var(--color-border); background: var(--color-surface); }
.bottom-toolbar__btn { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-2) var(--space-3); background: transparent; border: none; border-radius: var(--radius-md); font-size: var(--text-sm); font-weight: 500; color: var(--color-text-secondary); cursor: pointer; font-family: inherit; transition: background var(--transition-fast), color var(--transition-fast); }
.bottom-toolbar__btn:hover:not(:disabled) { background: var(--color-accent-subtle); color: var(--color-accent); }
.bottom-toolbar__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.bottom-toolbar__btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.bottom-toolbar__btn:active:not(:disabled) { transform: scale(0.97); }
.bottom-toolbar__btn--primary { color: var(--color-accent); font-weight: 600; }
</style>
