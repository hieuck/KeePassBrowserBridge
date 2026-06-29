<template>
  <div class="search-bar-wrap">
    <SearchOutlined class="search-bar__icon" />
    <input
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="placeholder"
      :aria-label="placeholder"
      class="search-bar__input"
    />
    <button v-if="modelValue" type="button" class="search-bar__clear" @click="$emit('update:modelValue', '')" aria-label="Clear search">
      <CloseOutlined />
    </button>
  </div>
</template>

<script setup>
import { SearchOutlined, CloseOutlined } from '@ant-design/icons-vue';
const modelValue = defineModel({ type: String, default: '' });
defineProps({ placeholder: { type: String, default: 'Search...' } });
</script>

<style scoped>
.search-bar-wrap {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
}
.search-bar__icon { color: var(--color-text-muted); font-size: var(--text-base); flex-shrink: 0; }
.search-bar__input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: var(--text-base); font-family: inherit; color: var(--color-text);
  padding: 0;
}
.search-bar__input::placeholder { color: var(--color-text-muted); }
.search-bar__clear {
  display: inline-flex; align-items: center; justify-content: center;
  background: transparent; border: none; cursor: pointer;
  color: var(--color-text-muted); padding: 2px;
  border-radius: var(--radius-sm); width: 20px; height: 20px;
}
.search-bar__clear:hover { color: var(--color-text-secondary); background: var(--color-bg); }
</style>
