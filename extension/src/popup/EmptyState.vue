<template>
  <div class="empty-state" :class="`empty-state--${variant}`">
    <div class="empty-state__icon">
      <Icon :name="icon" :size="40" />
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <BaseButton v-if="action" variant="primary" size="sm" @click="$emit('action')">
      {{ actionLabel }}
    </BaseButton>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';
import BaseButton from '../components/BaseButton.vue';

const props = defineProps({
  variant: { type: String, default: 'empty' },
  query: { type: String, default: '' },
});
defineEmits(['action']);

const icon = computed(() => {
  if (props.variant === 'search') return 'search';
  if (props.variant === 'filter') return 'filter';
  return 'key';
});

const title = computed(() => {
  if (props.variant === 'search') return `No results for "${props.query}"`;
  if (props.variant === 'filter') return 'No matches in this group';
  return 'No logins yet';
});

const description = computed(() => {
  if (props.variant === 'empty') return 'Add your first login to get started.';
  if (props.variant === 'search') return 'Try a different search term.';
  return 'Select a different group or clear the filter.';
});

const action = computed(() => props.variant === 'empty');
const actionLabel = computed(() => '+ Add your first login');
</script>

<style scoped>
.empty-state { text-align: center; padding: var(--space-10) var(--space-4); color: var(--color-text-secondary); }
.empty-state__icon { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; margin: 0 auto var(--space-3); background: var(--color-accent-subtle); border-radius: 50%; color: var(--color-accent); }
.empty-state__title { font-size: var(--text-lg); font-weight: 600; color: var(--color-text); margin: 0 0 var(--space-1); }
.empty-state__description { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0 0 var(--space-4); line-height: 1.5; }
</style>
