import { ref, watch } from 'vue';

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
  watch(theme, () => {
    applyTheme();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme.value);
    }
  }, { immediate: false });

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) {
      mq.addEventListener('change', () => {
        if (theme.value === 'system') applyTheme();
      });
    }
  }
}

export function useTheme() {
  function setTheme(value) {
    if (['light', 'dark', 'system'].includes(value)) {
      theme.value = value;
    }
  }
  return { theme, resolved, setTheme };
}
