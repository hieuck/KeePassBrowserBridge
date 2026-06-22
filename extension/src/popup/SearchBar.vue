<template>
  <div class="search-bar">
    <Icon name="search" :size="14" class="search-bar__icon" />
    <input
      v-model="modelValue"
      type="search"
      class="search-bar__input"
      :placeholder="placeholder"
      :aria-label="placeholder"
    />
    <button v-if="modelValue" type="button" class="search-bar__clear" :aria-label="`Clear ${placeholder}`" @click="modelValue = ''">
      <Icon name="close" :size="14" />
    </button>
  </div>
</template>

<script setup>
import Icon from '../components/Icon.vue';

const modelValue = defineModel({ type: String, default: '' });
defineProps({ placeholder: { type: String, default: 'Search...' } });
</script>

<style scoped>
.search-bar { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); background: var(--color-surface); }
.search-bar__icon { color: var(--color-text-secondary); }
.search-bar__input { flex: 1; border: none; outline: none; background: transparent; font: inherit; font-size: var(--text-md); color: var(--color-text); min-width: 0; }
.search-bar__input::placeholder { color: var(--color-text-muted); }
.search-bar__input:focus { outline: none; }
.search-bar__clear { background: transparent; border: none; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.search-bar__clear:hover { background: var(--color-bg); color: var(--color-text); }
</style>
