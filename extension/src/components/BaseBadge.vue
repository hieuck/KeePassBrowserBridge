<template>
  <span class="kbb-badge" :class="`kbb-badge--${variant}`">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'success', 'warning', 'danger', 'accent'].includes(v),
  },
});
</script>

<style scoped>
.kbb-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px var(--space-2);
  font-size: var(--text-xs);
  font-weight: 600;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  line-height: 1.4;
}
.kbb-badge--neutral {
  background: var(--color-bg);
  color: var(--color-text-secondary);
}
.kbb-badge--success {
  background: var(--color-success-subtle);
  color: var(--color-success);
}
.kbb-badge--warning {
  background: var(--color-warning-subtle);
  color: var(--color-warning);
}
.kbb-badge--danger {
  background: var(--color-danger-subtle);
  color: var(--color-danger);
}
.kbb-badge--accent {
  background: var(--color-accent-subtle);
  color: var(--color-accent);
}
</style>
