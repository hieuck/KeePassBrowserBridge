import { onMounted, onUnmounted, ref } from 'vue';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap() {
  const container = ref(null);
  let previouslyFocused = null;

  function onKeyDown(event) {
    if (event.key !== 'Tab' || !container.value) return;
    const focusables = Array.from(container.value.querySelectorAll(FOCUSABLE));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  onMounted(() => {
    if (typeof document === 'undefined') return;
    previouslyFocused = document.activeElement;
    document.addEventListener('keydown', onKeyDown);
  });

  onUnmounted(() => {
    if (typeof document === 'undefined') return;
    document.removeEventListener('keydown', onKeyDown);
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
  });

  return { container };
}
