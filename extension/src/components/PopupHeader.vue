<template>
  <header class="popup-header">
    <div class="logo">
      <span class="logo-icon">🔑</span>
      <span class="logo-text">KeePass Bridge</span>
    </div>
    <div class="header-actions">
      <button id="themeToggle" class="btn-icon" type="button" aria-label="Toggle theme" :title="'Toggle dark/light mode'" @click="$emit('toggle-theme')">
        <span class="theme-icon">{{ theme === 'dark' ? '☀️' : '🌙' }}</span>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  theme: { type: String, default: 'light' }
});
defineEmits(['toggle-theme']);
</script>
