<template>
  <div class="kbb-stack" :style="{ gap: `var(--space-${gap})` }" :data-testid="'stack'">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  gap: { type: Number, default: 3 },
});
</script>

<style scoped>
.kbb-stack { display: flex; flex-direction: column; }
</style>
