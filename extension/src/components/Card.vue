<template>
  <div class="kbb-card" :class="{ 'kbb-card--no-padding': noPadding }" :data-testid="'card'">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  noPadding: { type: Boolean, default: false },
});
</script>

<style scoped>
.kbb-card { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
.kbb-card--no-padding { padding: 0; }
</style>
