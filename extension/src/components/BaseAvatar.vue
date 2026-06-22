<template>
  <span
    class="kbb-avatar"
    :class="`kbb-avatar--${size}`"
    :style="{ backgroundColor: imageLoaded && src ? 'transparent' : backgroundColor }"
    data-testid="avatar"
  >
    <img
      v-if="src"
      :src="src"
      alt=""
      @load="imageLoaded = true"
      @error="imageLoaded = false"
    />
    <span v-if="!src || !imageLoaded" class="kbb-avatar__letter">{{ initial }}</span>
  </span>
</template>

<script setup>
import { computed, ref } from 'vue';

const PALETTE = [
  'var(--color-accent)',
  'var(--color-danger)',
  'var(--color-success)',
  'var(--color-warning)',
  '#7c3aed',
  '#0891b2',
  '#be185d',
  '#65a30d',
];

const props = defineProps({
  name: { type: String, default: '' },
  url: { type: String, default: '' },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v),
  },
});

const initial = computed(() => (props.name || '?')[0].toUpperCase());
const colorIndex = computed(() => (props.name || '').length % PALETTE.length);
const backgroundColor = computed(() => PALETTE[colorIndex.value]);

const src = computed(() => {
  if (!props.url) return '';
  try {
    const u = new URL(props.url);
    if (!u.hostname) return '';
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(u.hostname)}&sz=64`;
  } catch {
    return '';
  }
});

const imageLoaded = ref(true);
</script>

<style scoped>
.kbb-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: white;
  font-weight: 700;
  font-size: var(--text-base);
  background-size: cover;
  background-position: center;
  flex-shrink: 0;
  overflow: hidden;
}
.kbb-avatar--sm {
  width: 24px;
  height: 24px;
  font-size: var(--text-xs);
  border-radius: var(--radius-sm);
}
.kbb-avatar--md {
  width: 32px;
  height: 32px;
}
.kbb-avatar--lg {
  width: 40px;
  height: 40px;
  font-size: var(--text-md);
}
.kbb-avatar__letter {
  line-height: 1;
}
.kbb-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
