<template>
  <footer class="footer-bar">
    <div class="footer-bar__left">
      <button type="button" class="footer-bar__btn" :disabled="!canWrite" @click="$emit('new-login')" aria-label="Add new login">
        <Icon name="plus" :size="16" />
        <span class="footer-bar__label">New</span>
      </button>
      <button type="button" class="footer-bar__btn" @click="$emit('settings')" aria-label="Settings">
        <Icon name="globe" :size="16" />
        <span class="footer-bar__label">Settings</span>
      </button>
      <button type="button" class="footer-bar__btn" @click="$emit('clients')" aria-label="Clients">
        <Icon name="user-plus" :size="16" />
        <span class="footer-bar__label">Clients</span>
      </button>
    </div>
    <div class="footer-bar__center">
      <span class="footer-bar__status">{{ statusText }}</span>
    </div>
    <div class="footer-bar__right">
      <button type="button" class="footer-bar__btn footer-bar__btn--lock" :class="{ 'footer-bar__btn--unlock': state.locked }" @click="state.locked ? $emit('unlock') : $emit('lock')" :aria-label="state.locked ? 'Unlock KeePass' : 'Lock KeePass'">
        <Icon :name="state.locked ? 'lock-open' : 'lock'" :size="16" />
        <span class="footer-bar__label">{{ state.locked ? 'Unlock' : 'Lock' }}</span>
      </button>
      <button type="button" class="footer-bar__btn" :aria-label="`Theme: ${theme}`" @click="$emit('toggle-theme')">
        <Icon :name="themeIcon" :size="16" />
        <span class="footer-bar__label">Theme</span>
      </button>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';

const props = defineProps({
  canWrite: { type: Boolean, default: false },
  state: { type: Object, default: () => ({ paired: false, locked: false }) },
  theme: { type: String, default: 'system' },
});
defineEmits(['new-login', 'settings', 'clients', 'lock', 'unlock', 'toggle-theme']);

const themeIcon = computed(() => ({ light: 'sun', dark: 'moon', system: 'monitor' })[props.theme] || 'sun');

const statusText = computed(() => {
  if (!props.state.paired) return 'Not paired';
  if (props.state.locked) return 'Locked';
  return 'Paired';
});
</script>

<style scoped>
.footer-bar {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  min-height: 48px;
}
.footer-bar__left, .footer-bar__right {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}
.footer-bar__center {
  flex: 1;
  text-align: center;
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
.footer-bar__btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-width: 44px;
  min-height: 44px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  color: var(--color-text-secondary);
  font-family: inherit;
  transition: background var(--transition-fast), color var(--transition-fast);
}
.footer-bar__btn:hover:not(:disabled) { background: var(--color-accent-subtle); color: var(--color-accent); }
.footer-bar__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.footer-bar__btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
.footer-bar__btn:active:not(:disabled) { transform: scale(0.97); }
.footer-bar__btn--unlock { color: var(--color-danger); }
.footer-bar__btn--unlock:hover { background: var(--color-danger-subtle); }
.footer-bar__label { font-size: 9px; line-height: 1; text-transform: uppercase; letter-spacing: 0.04em; }
</style>
