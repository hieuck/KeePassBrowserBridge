<template>
  <button
    :type="type"
    class="kbb-btn"
    :class="[
      `kbb-btn--${variant}`,
      `kbb-btn--${size}`,
      { 'kbb-btn--block': block, 'kbb-btn--loading': loading }
    ]"
    :disabled="disabled || loading"
    :aria-disabled="disabled || loading"
    :aria-busy="loading"
    :data-testid="`btn-${variant}`"
    @click="onClick"
  >
    <Icon v-if="loading" name="key" :size="iconSize" spin class="kbb-btn__spinner" />
    <Icon v-else-if="leadingIcon" :name="leadingIcon" :size="iconSize" />
    <span class="kbb-btn__label"><slot /></span>
    <Icon v-if="trailingIcon && !loading" :name="trailingIcon" :size="iconSize" />
  </button>
</template>

<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  variant: { type: String, default: 'secondary', validator: (v) => ['primary', 'secondary', 'ghost', 'danger'].includes(v) },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  leadingIcon: { type: String, default: '' },
  trailingIcon: { type: String, default: '' },
});

const emit = defineEmits(['click']);

const iconSize = computed(() => {
  if (props.size === 'sm') return 12;
  if (props.size === 'lg') return 18;
  return 14;
});

function onClick(event) {
  if (props.disabled || props.loading) {
    event.preventDefault();
    return;
  }
  emit('click', event);
}
</script>

<style scoped>
.kbb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  font-family: var(--font-sans);
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), transform var(--transition-fast);
  user-select: none;
  white-space: nowrap;
  text-decoration: none;
  line-height: 1;
}
.kbb-btn:active:not(:disabled) {
  transform: scale(0.97);
}
.kbb-btn:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
.kbb-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.kbb-btn--sm { height: 28px; padding: 0 var(--space-3); font-size: var(--text-sm); }
.kbb-btn--md { height: 36px; padding: 0 var(--space-4); font-size: var(--text-base); }
.kbb-btn--lg { height: 44px; padding: 0 var(--space-5); font-size: var(--text-md); }
.kbb-btn--block { width: 100%; }
.kbb-btn--primary { background: var(--color-accent); color: white; border-color: var(--color-accent); }
.kbb-btn--primary:hover:not(:disabled) { background: var(--color-accent-hover); border-color: var(--color-accent-hover); }
.kbb-btn--secondary { background: var(--color-surface); color: var(--color-text); border-color: var(--color-border); }
.kbb-btn--secondary:hover:not(:disabled) { border-color: var(--color-text-secondary); }
.kbb-btn--ghost { background: transparent; color: var(--color-text); border-color: transparent; }
.kbb-btn--ghost:hover:not(:disabled) { background: var(--color-bg); }
.kbb-btn--danger { background: transparent; color: var(--color-danger); border-color: var(--color-danger); }
.kbb-btn--danger:hover:not(:disabled) { background: var(--color-danger); color: white; }
.kbb-btn--loading { cursor: wait; }
.kbb-btn__spinner { animation: kbb-spin 1s linear infinite; }
@media (prefers-reduced-motion: reduce) {
  .kbb-btn--loading .kbb-btn__spinner,
  .kbb-btn__spinner { animation: none; }
  .kbb-btn:active:not(:disabled) { transform: none; }
}
@keyframes kbb-spin { to { transform: rotate(360deg); } }
</style>
