<template>
  <div class="generator">
    <div class="generator__header">
      <span>Generated password</span>
      <button type="button" class="generator__close" aria-label="Close generator" @click="$emit('close')">
        <Icon name="close" :size="14" />
      </button>
    </div>
    <div class="generator__result">
      <input type="text" readonly :value="password" class="generator__input" ref="inputEl" @focus="$event.target.select()" />
      <BaseButton variant="secondary" size="sm" @click="regenerate" :leading-icon="'key'">Refresh</BaseButton>
    </div>
    <div class="generator__options">
      <label class="generator__label">
        <span>Length: {{ length }}</span>
        <input type="range" :min="8" :max="64" v-model.number="length" />
      </label>
      <label class="generator__label">
        <input type="checkbox" v-model="useSymbols" /> Include symbols
      </label>
    </div>
    <div class="generator__actions">
      <BaseButton variant="primary" block :leading-icon="'copy'" @click="copy">Copy password</BaseButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Icon from '../components/Icon.vue';
import BaseButton from '../components/BaseButton.vue';

const emit = defineEmits(['close', 'select']);

const length = ref(20);
const useSymbols = ref(true);

const charset = computed(() => {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  return lower + upper + digits + (useSymbols.value ? symbols : '');
});

function generate() {
  const chars = charset.value;
  let result = '';
  const arr = new Uint32Array(length.value);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length.value; i++) {
    result += chars[arr[i] % chars.length];
  }
  return result;
}

const password = ref('');

function regenerate() {
  password.value = generate();
}

regenerate();

async function copy() {
  try {
    await navigator.clipboard.writeText(password.value);
    emit('select', password.value);
  } catch (e) {
    // ignore
  }
}
</script>

<style scoped>
.generator { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); margin: var(--space-2) var(--space-3); }
.generator__header { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); font-weight: 600; }
.generator__close { background: transparent; border: none; cursor: pointer; color: var(--color-text-secondary); }
.generator__result { display: flex; gap: var(--space-2); }
.generator__input { flex: 1; padding: var(--space-2); border: 1px solid var(--color-border); border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: var(--text-sm); background: var(--color-surface); }
.generator__options { display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--text-sm); }
.generator__label { display: flex; align-items: center; gap: var(--space-2); }
.generator__label input[type="range"] { flex: 1; }
</style>
