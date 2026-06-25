<template>
  <div class="generator">
    <div class="generator__header">
      <span>Generated password</span>
      <a-button type="text" size="small" @click="$emit('close')" aria-label="Close generator">
        <template #icon><CloseOutlined /></template>
      </a-button>
    </div>
    <div class="generator__result">
      <a-input :value="password" readonly ref="inputEl" @focus="$event.target.select()" />
      <a-button size="small" @click="regenerate">
        <template #icon><ReloadOutlined /></template>
        Refresh
      </a-button>
    </div>
    <div class="generator__options">
      <a-space direction="vertical" size="small" style="width: 100%">
        <div class="generator__label"><span>Length: {{ length }}</span><a-slider :min="8" :max="64" v-model:value="length" style="flex:1" /></div>
        <a-checkbox v-model:checked="useSymbols">Include symbols</a-checkbox>
        <a-checkbox v-model:checked="excludeAmbiguous">Exclude ambiguous (1,l,I,0,O)</a-checkbox>
      </a-space>
    </div>
    <div class="generator__actions">
      <a-button type="primary" block @click="copy">
        <template #icon><CopyOutlined /></template>
        Copy password
      </a-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { CloseOutlined, ReloadOutlined, CopyOutlined } from '@ant-design/icons-vue';

const emit = defineEmits(['close', 'select']);

const length = ref(20);
const useSymbols = ref(true);
const excludeAmbiguous = ref(false);

const charset = computed(() => {
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  const ambiguous = '1lI0O';
  let result = lower + upper + digits + (useSymbols.value ? symbols : '');
  if (excludeAmbiguous.value) {
    for (const c of ambiguous) {
      result = result.replaceAll(c, '');
    }
  }
  return result;
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
.generator { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3); background: var(--color-bg); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.generator__header { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); font-weight: 600; }
.generator__result { display: flex; gap: var(--space-2); }
.generator__options { display: flex; flex-direction: column; gap: var(--space-2); font-size: var(--text-sm); }
.generator__label { display: flex; align-items: center; gap: var(--space-2); }
</style>
