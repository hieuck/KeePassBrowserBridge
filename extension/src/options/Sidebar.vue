<template>
  <nav class="options-sidebar" aria-label="Settings navigation" role="tablist">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="options-sidebar__tab"
      :class="{ 'options-sidebar__tab--active': active === tab.id }"
      :aria-current="active === tab.id ? 'page' : undefined"
      :aria-selected="active === tab.id ? 'true' : 'false'"
      role="tab"
      @click="$emit('select', tab.id)"
    >
      <Icon :name="tab.icon" :size="16" />
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import Icon from '../components/Icon.vue';

defineProps({
  active: { type: String, required: true },
  tabs: { type: Array, required: true },
});
defineEmits(['select']);
</script>

<style scoped>
.options-sidebar { width: 200px; background: var(--color-surface); border-right: 1px solid var(--color-border); padding: var(--space-3); display: flex; flex-direction: column; gap: var(--space-1); overflow-y: auto; flex-shrink: 0; }
.options-sidebar__tab { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: transparent; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: var(--text-sm); font-weight: 500; color: var(--color-text-secondary); text-align: left; font-family: inherit; transition: background var(--transition-fast), color var(--transition-fast); min-height: 36px; }
.options-sidebar__tab:hover { background: var(--color-bg); color: var(--color-text); }
.options-sidebar__tab--active { background: var(--color-accent-subtle); color: var(--color-accent); font-weight: 600; box-shadow: inset 3px 0 0 var(--color-accent); }
.options-sidebar__tab:focus-visible { outline: 2px solid var(--color-accent); outline-offset: -2px; }
</style>
