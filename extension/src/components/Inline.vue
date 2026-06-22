<template>
  <div class="kbb-inline" :style="{ gap: `var(--space-${gap})`, alignItems: align }" :data-testid="'inline'">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  gap: { type: Number, default: 2 },
  align: { type: String, default: 'center' },
});
</script>

<style scoped>
.kbb-inline { display: flex; flex-direction: row; }
</style>
