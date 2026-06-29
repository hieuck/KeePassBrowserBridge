<template>
  <div class="empty-state" :class="`empty-state--${variant}`">
    <div class="empty-state__icon" aria-hidden="true">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="22" stroke="currentColor" stroke-width="1.5" />
        <path d="M16 24h16M24 16v16" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>
    </div>
    <h3 class="empty-state__title">{{ title }}</h3>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
    <button v-if="action" type="button" class="empty-state__action" @click="$emit('action')">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
.empty-state__icon { margin-bottom: var(--space-3); color: var(--color-text-secondary); }
.empty-state__title { font-size: var(--text-h2); font-weight: 600; color: var(--color-text); margin: 0 0 var(--space-1); }
.empty-state__description { font-size: var(--text-sm); color: var(--color-text-secondary); margin: var(--space-2) auto var(--space-4); line-height: var(--line-loose); max-width: 260px; }
.empty-state__action { display: inline-block; padding: 6px 16px; font-size: var(--text-sm); font-family: inherit; cursor: pointer; border: none; border-radius: var(--radius-md); background: var(--color-accent); color: #fff; font-weight: 500; transition: opacity var(--transition-fast); }
.empty-state__action:hover { opacity: 0.85; }
:root[data-theme="dark"] .empty-state__action { background: #2563eb; }
</style>
