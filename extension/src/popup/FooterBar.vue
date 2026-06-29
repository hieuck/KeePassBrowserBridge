<template>
  <footer class="footer-bar">
    <div class="footer-bar__left">
      <button type="button" :disabled="!canWrite" @click="$emit('new-login')" aria-label="Add new login" class="footer-bar__btn">
        <PlusOutlined /><span class="footer-bar__label">New</span>
      </button>
      <button type="button" @click="$emit('settings')" aria-label="Settings" class="footer-bar__btn">
        <SettingOutlined /><span class="footer-bar__label">Settings</span>
      </button>
      <button type="button" @click="$emit('clients')" aria-label="Clients" class="footer-bar__btn">
        <UserAddOutlined /><span class="footer-bar__label">Clients</span>
      </button>
    </div>
    <div class="footer-bar__center">
      <span class="footer-bar__status" :class="`footer-bar__status--${statusClass}`">{{ statusText }}</span>
    </div>
    <div class="footer-bar__right">
      <button type="button" @click="state.locked ? $emit('unlock') : $emit('lock')" :aria-label="state.locked ? 'Unlock KeePass' : 'Lock KeePass'" class="footer-bar__btn">
        <component :is="state.locked ? UnlockOutlined : LockOutlined" /><span class="footer-bar__label">{{ state.locked ? 'Unlock' : 'Lock' }}</span>
      </button>
      <button type="button" :aria-label="`Theme: ${theme}`" @click="$emit('toggle-theme')" class="footer-bar__btn">
        <component :is="themeIconComponent" /><span class="footer-bar__label">Theme</span>
      </button>
    </div>
  </footer>
</template>

<script setup>
import { computed } from 'vue';
import { PlusOutlined, SettingOutlined, UserAddOutlined, LockOutlined, UnlockOutlined, BulbOutlined, StarOutlined, DesktopOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  canWrite: { type: Boolean, default: false },
  state: { type: Object, default: () => ({ paired: false, locked: false }) },
  theme: { type: String, default: 'system' },
});
defineEmits(['new-login', 'settings', 'clients', 'lock', 'unlock', 'toggle-theme']);

const themeIconComponent = computed(() => {
  const map = { light: BulbOutlined, dark: StarOutlined, system: DesktopOutlined };
  return map[props.theme] || BulbOutlined;
});

const statusText = computed(() => {
  if (!props.state.paired) return 'Not paired';
  if (props.state.locked) return 'Locked';
  return 'Paired';
});

const statusClass = computed(() => {
  if (!props.state.paired) return 'default';
  if (props.state.locked) return 'warning';
  return 'success';
});
</script>

<style scoped>
.footer-bar {
  display: flex; align-items: center; gap: var(--space-1);
  padding: var(--space-2) var(--space-3);
  border-top: 1px solid var(--color-border);
  background: var(--color-bg);
  min-height: 48px;
}
.footer-bar__left, .footer-bar__right {
  display: flex; align-items: center; gap: var(--space-1);
}
.footer-bar__center {
  flex: 1; text-align: center;
}
.footer-bar__btn {
  display: inline-flex; flex-direction: column; align-items: center; gap: 2px;
  min-width: 44px; min-height: 44px;
  padding: 4px 8px; font-size: var(--text-lg);
  background: transparent; border: none; cursor: pointer;
  color: var(--color-text-secondary); font-family: inherit;
  border-radius: var(--radius-md); transition: all var(--transition-fast);
}
.footer-bar__btn:hover { color: var(--color-accent); background: var(--color-accent-subtle); }
.footer-bar__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.footer-bar__btn:disabled:hover { color: var(--color-text-secondary); background: transparent; }
.footer-bar__label { font-size: 9px; line-height: 1; text-transform: uppercase; letter-spacing: 0.04em; }
.footer-bar__status {
  display: inline-block; padding: 2px var(--space-2);
  font-size: var(--text-xs); font-weight: 600;
  border-radius: var(--radius-full); text-transform: uppercase; letter-spacing: 0.04em;
}
.footer-bar__status--default { background: var(--color-bg); color: var(--color-text-secondary); }
.footer-bar__status--success { background: var(--color-success-subtle); color: var(--color-success); }
.footer-bar__status--warning { background: var(--color-warning-subtle); color: var(--color-warning); }
</style>
