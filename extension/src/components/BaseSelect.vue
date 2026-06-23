<template>
  <div class="kbb-select" :class="{ 'kbb-select--open': isOpen, 'kbb-select--error': error }" ref="rootRef" :data-testid="testId">
    <button
      type="button"
      class="kbb-select__trigger"
      :class="{ 'kbb-select__trigger--placeholder': !modelValue }"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
      :aria-labelledby="labelId"
      :aria-describedby="describedBy"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span class="kbb-select__value">{{ displayText }}</span>
      <Icon name="chevron-down" :size="14" class="kbb-select__arrow" />
    </button>
    <ul
      v-if="isOpen"
      class="kbb-select__dropdown"
      role="listbox"
      :aria-labelledby="labelId"
      ref="listRef"
      @keydown="onKeydown"
    >
      <li
        v-for="opt in options"
        :key="opt.value"
        class="kbb-select__option"
        :class="{ 'kbb-select__option--selected': opt.value === modelValue, 'kbb-select__option--focused': focusedIndex === options.indexOf(opt) }"
        role="option"
        :aria-selected="opt.value === modelValue"
        @click="select(opt.value)"
        @mouseenter="focusedIndex = options.indexOf(opt)"
      >
        {{ opt.label }}
      </li>
    </ul>
    <p v-if="error" class="kbb-select__error" :id="describedBy">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import Icon from './Icon.vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  label: { type: String, default: '' },
  description: { type: String, default: '' },
  error: { type: String, default: '' },
  placeholder: { type: String, default: 'Select...' },
  id: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue']);
const isOpen = ref(false);
const focusedIndex = ref(0);
const rootRef = ref(null);
const listRef = ref(null);
const uid = ref('');

const testId = computed(() => props.label ? `select-${String(props.label).toLowerCase().replace(/\s+/g, '-')}` : 'select');
const labelId = computed(() => `${uid.value}-label`);
const describedBy = computed(() => props.error ? `${uid.value}-error` : undefined);

const displayText = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue);
  return found ? found.label : props.placeholder;
});

function toggle() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    focusedIndex.value = Math.max(0, props.options.findIndex(o => o.value === props.modelValue));
    nextTick(() => { if (listRef.value) listRef.value.focus(); });
  }
}

function select(val) {
  emit('update:modelValue', val);
  isOpen.value = false;
}

function onTriggerKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
    e.preventDefault();
    isOpen.value = true;
    focusedIndex.value = 0;
  }
}

function onKeydown(e) {
  if (!isOpen.value) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); focusedIndex.value = Math.min(focusedIndex.value + 1, props.options.length - 1); }
  if (e.key === 'ArrowUp') { e.preventDefault(); focusedIndex.value = Math.max(focusedIndex.value - 1, 0); }
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (props.options[focusedIndex.value]) select(props.options[focusedIndex.value].value); }
  if (e.key === 'Escape') { e.preventDefault(); isOpen.value = false; }
}

function onClickOutside(e) {
  if (rootRef.value && !rootRef.value.contains(e.target)) isOpen.value = false;
}

onMounted(() => { uid.value = 'kbb-select-' + Math.random().toString(36).slice(2, 8); document.addEventListener('mousedown', onClickOutside); });
onUnmounted(() => { document.removeEventListener('mousedown', onClickOutside); });
</script>

<style scoped>
.kbb-select { position: relative; }
.kbb-select__trigger { display: flex; align-items: center; justify-content: space-between; width: 100%; padding: 6px 10px; background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); font: inherit; font-size: var(--text-base); color: var(--color-text); cursor: pointer; text-align: left; gap: var(--space-2); }
.kbb-select__trigger:hover { border-color: var(--color-border-strong); }
.kbb-select__trigger:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
.kbb-select__trigger--placeholder { color: var(--color-text-muted); }
.kbb-select--error .kbb-select__trigger { border-color: var(--color-danger); }
.kbb-select__arrow { transition: transform var(--transition-fast); }
.kbb-select--open .kbb-select__arrow { transform: rotate(180deg); }
.kbb-select__dropdown { position: absolute; z-index: var(--z-dropdown, 100); top: 100%; left: 0; right: 0; margin-top: 4px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); max-height: 200px; overflow-y: auto; list-style: none; padding: 4px; margin: 4px 0 0; }
.kbb-select__option { padding: 6px 10px; border-radius: var(--radius-sm); cursor: pointer; font-size: var(--text-base); color: var(--color-text); }
.kbb-select__option:hover, .kbb-select__option--focused { background: var(--color-accent-subtle); }
.kbb-select__option--selected { font-weight: 600; color: var(--color-accent); }
.kbb-select__option[aria-selected="true"] { background: var(--color-accent-subtle); font-weight: 600; }
.kbb-select__error { font-size: var(--text-xs); color: var(--color-danger); margin-top: var(--space-1); }
</style>
