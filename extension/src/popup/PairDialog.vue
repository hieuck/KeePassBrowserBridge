<template>
  <div class="pair-overlay">
    <div class="pair-dialog">
      <LockOutlined :style="{ fontSize: '32px', color: 'var(--color-accent)', marginBottom: '12px' }" />
      <h3 class="pair-title">Connect to KeePass</h3>
      <p class="pair-desc">
        <template v-if="pairingActive">Enter the pairing code shown in KeePass.</template>
        <template v-else>Open KeePass and use <strong>Tools → KeePass Browser Bridge → Start Pairing</strong> to get a pairing code.</template>
      </p>

      <div v-if="pairingActive" class="pair-code-input">
        <input
          v-model="code"
          placeholder="Enter 6-digit pairing code"
          maxlength="6"
          class="pair-input"
          @keyup.enter="submitCode"
        />
        <p v-if="expiresAt" class="pair-expiry">Expires in {{ timeLeft }} seconds</p>
      </div>

      <div class="pair-actions">
        <button v-if="pairingActive" type="button" class="pair-btn pair-btn--primary" :disabled="code.length < 6" @click="submitCode">
          <CheckOutlined />
          Complete Pairing
        </button>
        <button v-else type="button" class="pair-btn pair-btn--primary" @click="startPairing">
          <LinkOutlined />
          Start Pairing
        </button>
        <button type="button" class="pair-btn" @click="$emit('close')">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import { LockOutlined, CheckOutlined, LinkOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  pairingActive: { type: Boolean, default: false },
  expiresAt: { type: Number, default: 0 },
});
const emit = defineEmits(['pair-begin', 'pair-complete', 'close']);

const code = ref('');
const loading = ref(false);
const timeLeft = ref(0);
let timer = null;

watch(() => props.expiresAt, (val) => {
  updateTimeLeft();
  clearInterval(timer);
  if (val > 0) timer = setInterval(updateTimeLeft, 1000);
});

function updateTimeLeft() {
  timeLeft.value = Math.max(0, Math.floor((props.expiresAt - Date.now()) / 1000));
}

async function startPairing() {
  loading.value = true;
  try { emit('pair-begin'); } finally { loading.value = false; }
}

async function submitCode() {
  if (code.value.length < 6) return;
  loading.value = true;
  try { emit('pair-complete', code.value); } finally { loading.value = false; }
}

onUnmounted(() => clearInterval(timer));
</script>

<style scoped>
.pair-overlay {
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg);
  padding: var(--space-4) var(--space-4) var(--space-6);
}
.pair-dialog {
  text-align: center;
  max-width: 320px;
  display: flex; flex-direction: column; align-items: center; gap: var(--space-3);
}
.pair-title { font-size: var(--text-h2); font-weight: 700; color: var(--color-text); margin: 0; }
.pair-desc { font-size: var(--text-sm); color: var(--color-text-secondary); margin: 0; line-height: 1.5; }
.pair-code-input { width: 100%; }
.pair-input {
  width: 100%; padding: 10px; font-size: 20px; font-family: inherit;
  text-align: center; letter-spacing: 4px;
  border: 1px solid var(--color-border); border-radius: var(--radius-md);
  background: var(--color-bg); color: var(--color-text); outline: none;
  transition: border-color var(--transition-fast); box-sizing: border-box;
}
.pair-input:focus { border-color: var(--color-accent); }
.pair-expiry { font-size: var(--text-xs); color: var(--color-danger); margin: var(--space-1) 0 0; }
.pair-actions { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
.pair-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 14px; font-size: var(--text-sm); font-family: inherit;
  cursor: pointer; border: 1px solid var(--color-border);
  border-radius: var(--radius-md); background: transparent; color: var(--color-text);
  transition: all var(--transition-fast);
}
.pair-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.pair-btn--primary { border: none; background: var(--color-accent); color: #fff; font-weight: 500; }
.pair-btn--primary:hover:not(:disabled) { opacity: 0.85; color: #fff; }
:root[data-theme="dark"] .pair-btn--primary { background: #2563eb; }
.pair-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
