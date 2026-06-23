<template>
  <a-card :title="title" :style="{ marginBottom: '16px', background: 'var(--color-surface)' }">
    <template #extra v-if="$slots.extra"><slot name="extra" /></template>
    <p v-if="description" style="color: var(--color-text-secondary); font-size: 13px; margin-bottom: 16px;">{{ description }}</p>
    <slot />
  </a-card>
</template>

<script setup>
defineProps({ title: { type: String, default: '' }, description: { type: String, default: '' } });
</script>
