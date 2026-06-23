<template>
  <a-input-search
    v-model:value="modelValue"
    :placeholder="placeholder"
    :aria-label="placeholder"
    allow-clear
    class="search-bar"
  />
</template>

<script setup>
const modelValue = defineModel({ type: String, default: '' });
defineProps({ placeholder: { type: String, default: 'Search...' } });
</script>

<style scoped>
.search-bar { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
</style>
