<template>
  <Teleport to="body">
    <div class="kbb-toast-stack" role="region" aria-label="Notifications">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="kbb-toast"
        :class="`kbb-toast--${t.variant || 'info'}`"
        role="status"
        :aria-live="t.variant === 'error' ? 'assertive' : 'polite'"
      >
        <Icon :name="variantIcon(t.variant)" :size="16" />
        <span class="kbb-toast__message">{{ t.message }}</span>
        <button
          v-if="t.action"
          type="button"
          class="kbb-toast__action"
          @click="onAction(t)"
        >
          {{ t.action.label }}
        </button>
        <button
          v-if="t.dismissible !== false"
          type="button"
          class="kbb-toast__close"
          :aria-label="`Dismiss notification: ${t.message}`"
          @click="dismiss(t.id)"
        >
          <Icon name="close" :size="14" />
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  duration: { type: Number, default: 4000 },
});

const toasts = ref([]);
let counter = 0;
const timers = new Map();

function variantIcon(variant) {
  return (
    {
      success: 'check',
      error: 'close',
      warning: 'shield',
      info: 'shield-check',
    }[variant || 'info'] || 'shield-check'
  );
}

function dismiss(id) {
  toasts.value = toasts.value.filter((t) => t.id !== id);
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
}

function onAction(t) {
  if (t.action && typeof t.action.onClick === 'function') {
    t.action.onClick();
  }
  dismiss(t.id);
}

function show(toast) {
  const id = ++counter;
  const t = { id, ...toast };
  toasts.value = [...toasts.value, t];
  if (props.duration > 0) {
    const timer = setTimeout(() => dismiss(id), props.duration);
    timers.set(id, timer);
  }
  return id;
}

defineExpose({ show, dismiss });

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.__kbbToast = { show, dismiss };
  }
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    delete window.__kbbToast;
  }
  for (const timer of timers.values()) clearTimeout(timer);
  timers.clear();
});
</script>

<style scoped>
.kbb-toast-stack {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  z-index: var(--z-toast);
  max-width: 360px;
  pointer-events: none;
}
.kbb-toast {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-text);
  color: white;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  font-size: var(--text-sm);
  animation: kbb-toast-in 200ms ease;
  pointer-events: auto;
}
.kbb-toast--success {
  background: var(--color-success);
}
.kbb-toast--error {
  background: var(--color-danger);
}
.kbb-toast--warning {
  background: var(--color-warning);
}
.kbb-toast--info {
  background: var(--color-text);
}
.kbb-toast__message {
  flex: 1;
  min-width: 0;
}
.kbb-toast__action {
  background: transparent;
  border: 1px solid currentColor;
  color: inherit;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-xs);
  font-weight: 600;
}
.kbb-toast__close {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: var(--space-1);
  display: inline-flex;
  border-radius: var(--radius-sm);
}
.kbb-toast__close:hover {
  background: rgba(255, 255, 255, 0.15);
}
@keyframes kbb-toast-in {
  from { transform: translateY(-8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .kbb-toast {
    animation: none;
  }
}
</style>
