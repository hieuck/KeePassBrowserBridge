import { ref } from 'vue';

const toasts = ref([]);
let counter = 0;

export function useToast() {
  function show(message, options = {}) {
    const id = ++counter;
    const toast = { id, message, ...options };
    toasts.value = [...toasts.value, toast];
    if (options.duration !== 0) {
      const duration = options.duration || 4000;
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }

  function dismiss(id) {
    toasts.value = toasts.value.filter(t => t.id !== id);
  }

  return { toasts, show, dismiss };
}
