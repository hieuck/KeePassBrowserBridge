<template>
  <header class="popup-header">
    <div class="popup-header__brand">
      <Icon name="key" :size="20" class="popup-header__logo" />
      <span class="popup-header__title">KeePass Bridge</span>
    </div>
    <button type="button" class="popup-header__icon-btn" :aria-label="`Theme: ${theme}`" @click="$emit('toggle-theme')">
      <Icon :name="themeIcon" :size="16" />
    </button>
  </header>
</template>

<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';

const props = defineProps({ theme: { type: String, required: true } });
defineEmits(['toggle-theme']);

const themeIcon = computed(() => ({ light: 'globe', dark: 'lock', system: 'eye' })[props.theme] || 'globe');
</script>

<style scoped>
.popup-header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-surface); position: relative; z-index: 1; }
.popup-header__icon-btn { box-shadow: none; }
.popup-header__brand { display: flex; align-items: center; gap: var(--space-2); }
.popup-header__logo { color: var(--color-accent); }
.popup-header__title { font-size: var(--text-md); font-weight: 700; color: var(--color-text); }
.popup-header__icon-btn { background: transparent; border: none; width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-md); cursor: pointer; color: var(--color-text-secondary); transition: background var(--transition-fast); }
.popup-header__icon-btn:hover { background: var(--color-bg); color: var(--color-text); }
.popup-header__icon-btn:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }
</style>
