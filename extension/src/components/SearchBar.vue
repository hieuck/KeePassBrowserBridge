<template>
  <div class="search-wrapper">
    <span class="search-icon">🔍</span>
    <input
      id="loginSearch"
      class="search-input"
      type="search"
      :placeholder="placeholder"
      spellcheck="false"
      :aria-label="ariaLabel"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      @keydown.escape="onEscape"
    />
    <button
      id="clearLoginSearch"
      class="search-clear"
      :class="{ hidden: !modelValue }"
      type="button"
      @click="$emit('clear')"
    >&times;</button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Search vault...' },
  ariaLabel: { type: String, default: 'Search credentials' }
});

const emit = defineEmits(['update:modelValue', 'clear', 'escape']);

function onEscape() {
  if (props.modelValue) {
    emit('escape');
  }
}
</script>
