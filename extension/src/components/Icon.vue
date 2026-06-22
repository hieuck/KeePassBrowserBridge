<template>
  <span
    class="kbb-icon"
    :class="{ 'kbb-icon-spin': spin }"
    v-html="svg"
    :aria-hidden="true"
  />
</template>

<script setup>
import { computed } from 'vue';
import { ICONS } from '../../icons.js';

const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 },
  spin: { type: Boolean, default: false },
});

const svg = computed(() => {
  const raw = ICONS[props.name] || '';
  return raw
    .replace('width="16"', `width="${props.size}"`)
    .replace('height="16"', `height="${props.size}"`);
});
</script>

<style scoped>
.kbb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 0;
  flex-shrink: 0;
}
.kbb-icon-spin {
  animation: kbb-spin 1s linear infinite;
}
@keyframes kbb-spin {
  to { transform: rotate(360deg); }
}
</style>
