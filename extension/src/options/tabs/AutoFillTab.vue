<template>
  <div>
    <SectionCard title="Auto-fill" description="Automatically fill forms when only one login matches.">
      <a-form-item label="Enable auto-fill">
        <a-switch :checked="!!settings.autoFillEnabled" @change="v => update('autoFillEnabled', v)" />
        <span style="margin-left: 8px; color: var(--color-text-secondary);">Fill credentials when exactly one login matches</span>
      </a-form-item>
      <a-form-item label="Auto-submit form">
        <a-switch :checked="!!settings.autoSubmitEnabled" @change="v => update('autoSubmitEnabled', v)" />
      </a-form-item>
    </SectionCard>
    <SectionCard title="Fill delay" description="How long to wait before filling credentials.">
      <a-form-item label="Delay (ms)">
        <a-input-number :value="settings.autoFillDelay || 1200" @change="v => update('autoFillDelay', v)" :min="200" :max="5000" :step="100" style="width: 120px" />
      </a-form-item>
    </SectionCard>
  </div>
</template>

<script setup>
import SectionCard from '../SectionCard.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

function update(key, value) { emit('save', { [key]: value }); }
</script>
