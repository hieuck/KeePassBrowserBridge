<template>
  <label class="kbb-toggle" :class="{ 'kbb-toggle--disabled': disabled }">
    <span class="kbb-toggle__labels">
      <span v-if="label" class="kbb-toggle__label">{{ label }}</span>
      <span v-if="description" class="kbb-toggle__description">{{ description }}</span>
    </span>
    <button
      type="button"
      role="switch"
      class="kbb-toggle__switch"
      :class="{ 'kbb-toggle__switch--on': modelValue }"
      :aria-checked="modelValue"
      :aria-label="ariaLabel || label"
      :data-testid="`toggle-${slugifiedLabel}`"
      :disabled="disabled"
      @click="toggle"
    >
      <span class="kbb-toggle__thumb" />
    </button>
  </label>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);
const slugifiedLabel = computed(() => (props.label || '').toLowerCase().replace(/\s+/g, '-') || 'toggle');

function toggle() {
  if (props.disabled) return;
  emit('update:modelValue', !props.modelValue);
}
</script>

<style scoped>
.kbb-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.kbb-toggle:hover:not(.kbb-toggle--disabled) {
  background: var(--color-bg);
}
.kbb-toggle--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.kbb-toggle__labels {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
  min-width: 0;
}
.kbb-toggle__label {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text);
}
.kbb-toggle__description {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}
.kbb-toggle__switch {
  position: relative;
  width: 36px;
  height: 20px;
  background: var(--color-border);
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: background var(--transition-fast);
  flex-shrink: 0;
  padding: 0;
}
.kbb-toggle__switch:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.kbb-toggle__switch:disabled {
  cursor: not-allowed;
}
.kbb-toggle__switch--on {
  background: var(--color-accent);
}
.kbb-toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}
.kbb-toggle__switch--on .kbb-toggle__thumb {
  transform: translateX(16px);
}
@media (prefers-reduced-motion: reduce) {
  .kbb-toggle__switch,
  .kbb-toggle__thumb {
    transition: none;
  }
}
</style>
