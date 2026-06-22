<template>
  <div class="kbb-divider" role="separator" :aria-label="label || 'divider'" :data-testid="'divider'">
    <span v-if="label" class="kbb-divider__label">{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
});
</script>

<style scoped>
.kbb-divider { display: flex; align-items: center; height: 1px; background: var(--color-border); margin: var(--space-3) 0; }
.kbb-divider__label { padding: 0 var(--space-2); font-size: var(--text-xs); color: var(--color-text-muted); background: var(--color-surface); white-space: nowrap; }
</style>
