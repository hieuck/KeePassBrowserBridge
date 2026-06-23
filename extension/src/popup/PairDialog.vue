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
        <a-input
          v-model:value="code"
          placeholder="Enter 6-digit pairing code"
          :maxlength="6"
          size="large"
          style="text-align: center; font-size: 20px; letter-spacing: 4px;"
          @keyup.enter="submitCode"
        />
        <p v-if="expiresAt" class="pair-expiry">Expires in {{ timeLeft }} seconds</p>
      </div>

      <div class="pair-actions">
        <a-button v-if="pairingActive" type="primary" :disabled="code.length < 6" :loading="loading" @click="submitCode">
          <template #icon><CheckOutlined /></template>
          Complete Pairing
        </a-button>
        <a-button v-else type="primary" @click="startPairing" :loading="loading">
          <template #icon><LinkOutlined /></template>
          Start Pairing
        </a-button>
        <a-button @click="$emit('close')">Cancel</a-button>
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
.pair-expiry { font-size: var(--text-xs); color: var(--color-danger); margin: var(--space-1) 0 0; }
.pair-actions { display: flex; gap: var(--space-2); margin-top: var(--space-2); }
</style>
