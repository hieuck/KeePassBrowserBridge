import { ref, watch, onUnmounted } from 'vue';

const STORAGE_KEY = 'kbb-theme';

function getInitialTheme() {
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['light', 'dark', 'system'].includes(stored)) return stored;
  }
  return 'system';
}

const theme = ref(getInitialTheme());
const resolved = ref('light');

function detectResolved() {
  if (theme.value === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }
  return theme.value;
}

function applyTheme() {
  if (typeof document === 'undefined') return;
  resolved.value = detectResolved();
  document.documentElement.setAttribute('data-theme', resolved.value);
}

if (typeof window !== 'undefined') {
  applyTheme();
}

export function useTheme() {
  const stopWatch = watch(theme, () => {
    applyTheme();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme.value);
    }
  });

  let mqCleanup = null;
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      if (theme.value === 'system') applyTheme();
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
      mqCleanup = () => mq.removeEventListener('change', handler);
    }
  }

  onUnmounted(() => {
    stopWatch();
    if (mqCleanup) mqCleanup();
  });

  function setTheme(value) {
    if (['light', 'dark', 'system'].includes(value)) {
      theme.value = value;
    }
  }
  return { theme, resolved, setTheme };
}
