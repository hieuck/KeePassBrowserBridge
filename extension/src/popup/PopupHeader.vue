<template>
  <header class="popup-header">
    <div class="popup-header__brand">
      <KeyOutlined class="popup-header__logo" />
      <span class="popup-header__title">KeePass Bridge</span>
    </div>
  </header>
</template>

<script setup>
import { KeyOutlined } from '@ant-design/icons-vue';
</script>

<style scoped>
.popup-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
.popup-header__brand { display: flex; align-items: center; gap: var(--space-2); }
.popup-header__logo { color: var(--color-accent); font-size: 20px; }
.popup-header__title { font-size: var(--text-h2); font-weight: 700; color: var(--color-text); letter-spacing: -0.01em; }
</style>
