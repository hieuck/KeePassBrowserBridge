<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="kbb-modal-overlay"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="onBackdropClick"
    >
      <div class="kbb-modal" :style="{ maxWidth }">
        <header v-if="title || $slots.header" class="kbb-modal__header">
          <slot name="header">
            <h2 :id="titleId" class="kbb-modal__title">{{ title }}</h2>
          </slot>
          <button
            v-if="dismissible"
            type="button"
            class="kbb-modal__close"
            aria-label="Close dialog"
            @click="close"
          >
            <Icon name="close" :size="16" />
          </button>
        </header>
        <div class="kbb-modal__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="kbb-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, useId, watch } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  title: { type: String, default: '' },
  maxWidth: { type: String, default: '480px' },
  dismissible: { type: Boolean, default: true },
  closeOnBackdrop: { type: Boolean, default: true },
  closeOnEsc: { type: Boolean, default: true },
});
const emit = defineEmits(['update:modelValue', 'close']);
const titleId = useId();

function close() {
  if (!props.dismissible) return;
  emit('update:modelValue', false);
  emit('close');
}

function onBackdropClick() {
  if (props.closeOnBackdrop) close();
}

function onKeyDown(event) {
  if (event.key === 'Escape' && props.closeOnEsc && props.modelValue) {
    event.preventDefault();
    close();
  }
}

watch(() => props.modelValue, (open) => {
  if (typeof document === 'undefined') return;
  document.body.style.overflow = open ? 'hidden' : '';
});

onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('keydown', onKeyDown);
  }
});

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onKeyDown);
    document.body.style.overflow = '';
  }
});
</script>

<style scoped>
.kbb-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
  animation: kbb-fade-in 200ms ease;
}
.kbb-modal {
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-height: calc(100vh - var(--space-8));
  display: flex;
  flex-direction: column;
  animation: kbb-slide-up 200ms ease;
}
.kbb-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.kbb-modal__title {
  font-size: var(--text-lg);
  font-weight: 600;
  margin: 0;
}
.kbb-modal__close {
  background: transparent;
  border: none;
  padding: var(--space-1);
  border-radius: var(--radius-sm);
  cursor: pointer;
  color: var(--color-text-secondary);
  display: inline-flex;
}
.kbb-modal__close:hover {
  background: var(--color-bg);
  color: var(--color-text);
}
.kbb-modal__body {
  padding: var(--space-5);
  overflow-y: auto;
  flex: 1;
}
.kbb-modal__footer {
  padding: var(--space-4) var(--space-5);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}
@keyframes kbb-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes kbb-slide-up {
  from { transform: translateY(8px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .kbb-modal-overlay,
  .kbb-modal {
    animation: none;
  }
}
</style>
