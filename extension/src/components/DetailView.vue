<template>
  <div class="detail-view" :data-testid="'detail-view'">
    <BaseButton variant="primary" block :leading-icon="'check'" @click="$emit('fill', entry, 'form')">
      Fill form
    </BaseButton>
    <div v-if="entry.UserName || entry.Password || entry.OneTimePassword" class="detail-view__fields">
      <div v-if="entry.UserName" class="detail-view__field">
        <span class="detail-view__field-label">Username</span>
        <span class="detail-view__field-value">{{ entry.UserName }}</span>
        <button type="button" class="detail-view__icon-btn" aria-label="Copy username" @click="$emit('copy', 'username', entry.UserName)">
          <Icon name="copy" :size="14" />
        </button>
      </div>
      <div v-if="entry.Password" class="detail-view__field">
        <span class="detail-view__field-label">Password</span>
        <span class="detail-view__field-value">{{ showPassword ? entry.Password : '••••••••' }}</span>
        <button type="button" class="detail-view__icon-btn" :aria-label="showPassword ? 'Hide password' : 'Show password'" @click="showPassword = !showPassword">
          <Icon :name="showPassword ? 'eye-off' : 'eye'" :size="14" />
        </button>
        <button type="button" class="detail-view__icon-btn" aria-label="Copy password" @click="$emit('copy', 'password', entry.Password)">
          <Icon name="copy" :size="14" />
        </button>
      </div>
      <div v-if="entry.OneTimePassword" class="detail-view__field">
        <span class="detail-view__field-label">OTP</span>
        <span class="detail-view__field-value">{{ entry.OneTimePassword }}</span>
        <button type="button" class="detail-view__icon-btn" aria-label="Copy OTP" @click="$emit('copy', 'otp', entry.OneTimePassword)">
          <Icon name="copy" :size="14" />
        </button>
      </div>
    </div>
    <div v-if="customFieldRows.length" class="detail-view__custom">
      <div class="detail-view__custom-header">Custom fields ({{ customFieldRows.length }})</div>
      <div v-for="row in customFieldRows" :key="row.Name" class="detail-view__field">
        <span class="detail-view__field-label">{{ row.Name }}</span>
        <span class="detail-view__field-value">{{ row.IsProtected ? '••••••••' : row.Value }}</span>
        <button v-if="!row.IsProtected" type="button" class="detail-view__icon-btn" :aria-label="`Copy ${row.Name}`" @click="$emit('copy', row.Name, row.Value)">
          <Icon name="copy" :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import Icon from './Icon.vue';
import BaseButton from './BaseButton.vue';

const props = defineProps({
  entry: { type: Object, required: true },
});

const emit = defineEmits(['fill', 'copy']);
const showPassword = ref(false);

const customFieldRows = computed(() => {
  return (props.entry.CustomFields || []).filter(f => f && !f.IsProtected && f.Name);
});
</script>

<style scoped>
.detail-view { display: flex; flex-direction: column; gap: var(--space-3); }
.detail-view__fields, .detail-view__custom { display: flex; flex-direction: column; gap: var(--space-1); }
.detail-view__field { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2); background: var(--color-bg); border-radius: var(--radius-sm); }
.detail-view__field-label { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); min-width: 60px; flex-shrink: 0; }
.detail-view__field-value { flex: 1; min-width: 0; font-size: var(--text-sm); color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-mono); }
.detail-view__icon-btn { background: transparent; border: none; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); flex-shrink: 0; transition: background var(--transition-fast), color var(--transition-fast); }
.detail-view__icon-btn:hover { background: var(--color-surface); color: var(--color-accent); }
.detail-view__custom-header { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: var(--space-1); }
</style>
