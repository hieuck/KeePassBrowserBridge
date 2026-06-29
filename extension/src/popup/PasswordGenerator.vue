<template>
  <div class="generator">
    <div class="generator__header">
      <span>Generated password</span>
      <button type="button" class="generator__close-btn" @click="$emit('close')" aria-label="Close generator">
        <CloseOutlined />
      </button>
    </div>
    <div class="generator__result">
      <input class="generator__input" :value="password" readonly @focus="$event.target.select()" />
      <button type="button" class="generator__refresh-btn" @click="regenerate">
        <ReloadOutlined /> Refresh
      </button>
    </div>
    <div class="generator__options">
      <div class="generator__option">
        <label>Length: <strong>{{ length }}</strong></label>
        <input type="range" class="generator__slider" :min="8" :max="64" v-model="length" />
      </div>
      <label class="generator__checkbox">
        <input type="checkbox" v-model="useSymbols" />
        <span>Include symbols</span>
      </label>
      <label class="generator__checkbox">
        <input type="checkbox" v-model="excludeAmbiguous" />
        <span>Exclude ambiguous (1,l,I,0,O)</span>
      </label>
    </div>
    <div class="generator__actions">
      <button type="button" class="generator__copy-btn" @click="copy">
        <CopyOutlined /> Copy password
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { CloseOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons-vue';
import { generatePassword } from '../../shared/password-generator.js';

const emit = defineEmits(['close', 'select']);

const length = ref(20);
const useSymbols = ref(true);
const excludeAmbiguous = ref(false);

function generate() {
  return generatePassword(length.value, {
    useSymbols: useSymbols.value,
    excludeAmbiguous: excludeAmbiguous.value,
  });
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
.generator { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.generator__header { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); font-weight: 600; }
.generator__close-btn { background: transparent; border: none; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.generator__close-btn:hover { background: var(--color-bg); color: var(--color-text); }
.generator__result { display: flex; gap: var(--space-2); }
.generator__input { flex: 1; padding: 6px 10px; font-size: var(--text-sm); font-family: var(--font-mono); border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); color: var(--color-text); outline: none; }
.generator__refresh-btn { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: var(--text-sm); font-family: inherit; cursor: pointer; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: transparent; color: var(--color-text-secondary); transition: all var(--transition-fast); }
.generator__refresh-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.generator__options { display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--text-sm); }
.generator__option { display: flex; flex-direction: column; gap: 4px; }
.generator__slider { width: 100%; accent-color: var(--color-accent); }
.generator__checkbox { display: flex; align-items: center; gap: var(--space-2); cursor: pointer; font-size: var(--text-sm); }
.generator__checkbox input { accent-color: var(--color-accent); }
.generator__actions { margin-top: var(--space-1); }
.generator__copy-btn { width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: var(--space-1); padding: 8px 16px; font-size: var(--text-sm); font-family: inherit; cursor: pointer; border: none; border-radius: var(--radius-md); background: var(--color-accent); color: #fff; font-weight: 500; transition: opacity var(--transition-fast); }
.generator__copy-btn:hover { opacity: 0.85; }
</style>
