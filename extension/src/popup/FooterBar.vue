<template>
  <footer class="footer-bar">
    <div class="footer-bar__left">
      <a-button type="text" size="small" :disabled="!canWrite" @click="$emit('new-login')" aria-label="Add new login" class="footer-bar__btn">
        <template #icon><PlusOutlined /></template>
        <span class="footer-bar__label">New</span>
      </a-button>
      <a-button type="text" size="small" @click="$emit('settings')" aria-label="Settings" class="footer-bar__btn">
        <template #icon><SettingOutlined /></template>
        <span class="footer-bar__label">Settings</span>
      </a-button>
      <a-button type="text" size="small" @click="$emit('clients')" aria-label="Clients" class="footer-bar__btn">
        <template #icon><UserAddOutlined /></template>
        <span class="footer-bar__label">Clients</span>
      </a-button>
    </div>
    <div class="footer-bar__center">
      <a-tag :color="statusColor">{{ statusText }}</a-tag>
    </div>
    <div class="footer-bar__right">
      <a-button :type="state.locked ? 'text' : 'text'" :danger="state.locked" size="small" @click="state.locked ? $emit('unlock') : $emit('lock')" :aria-label="state.locked ? 'Unlock KeePass' : 'Lock KeePass'" class="footer-bar__btn">
        <template #icon><component :is="state.locked ? UnlockOutlined : LockOutlined" /></template>
        <span class="footer-bar__label">{{ state.locked ? 'Unlock' : 'Lock' }}</span>
      </a-button>
      <a-button type="text" size="small" :aria-label="`Theme: ${theme}`" @click="$emit('toggle-theme')" class="footer-bar__btn">
        <template #icon><component :is="themeIconComponent" /></template>
        <span class="footer-bar__label">Theme</span>
      </a-button>
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

const statusColor = computed(() => {
  if (!props.state.paired) return 'default';
  if (props.state.locked) return 'orange';
  return 'green';
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
}
.footer-bar__btn {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 44px;
  min-height: 44px;
  height: auto !important;
  padding: 4px 8px !important;
}
.footer-bar__label { font-size: 9px; line-height: 1; text-transform: uppercase; letter-spacing: 0.04em; }
</style>
