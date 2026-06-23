<template>
  <div class="empty-state" :class="`empty-state--${variant}`">
    <a-empty :image="Empty.PRESENTED_IMAGE_SIMPLE">
      <template #description>
        <h3 class="empty-state__title">{{ title }}</h3>
        <p v-if="description" class="empty-state__description">{{ description }}</p>
        <a-button v-if="action" type="primary" size="small" @click="$emit('action')">
          {{ actionLabel }}
        </a-button>
      </template>
    </a-empty>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Empty } from 'ant-design-vue';

const props = defineProps({
  variant: { type: String, default: 'empty' },
  query: { type: String, default: '' },
});
defineEmits(['action']);

const title = computed(() => {
  if (props.variant === 'search') return `No results for "${props.query}"`;
  if (props.variant === 'filter') return 'No matches in this group';
  if (props.variant === 'unpaired') return 'KeePass is not connected';
  if (props.variant === 'locked') return 'KeePass is locked';
  return 'No logins yet';
});

const description = computed(() => {
  if (props.variant === 'unpaired') return 'Open KeePass and start pairing to connect.';
  if (props.variant === 'locked') return 'Unlock KeePass from the popup to access your logins.';
  if (props.variant === 'empty') return 'Add your first login to get started.';
  if (props.variant === 'search') return 'Try a different search term.';
  return 'Select a different group or clear the filter.';
});

const action = computed(() => props.variant === 'empty');
const actionLabel = computed(() => '+ Add your first login');
</script>

<style scoped>
.empty-state { text-align: center; padding: var(--space-6) var(--space-4) var(--space-8); color: var(--color-text-secondary); }
.empty-state__title { font-size: var(--text-h2); font-weight: 600; color: var(--color-text); margin: 0 0 var(--space-1); }
.empty-state__description { font-size: var(--text-sm); color: var(--color-text-secondary); margin: var(--space-2) auto var(--space-4); line-height: var(--line-loose); max-width: 260px; }
</style>
