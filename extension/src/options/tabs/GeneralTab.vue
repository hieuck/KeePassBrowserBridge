<template>
  <div>
    <SectionCard title="Appearance" description="Customize how the extension looks.">
      <a-form-item label="Theme">
        <a-select :value="settings.themePreference || 'system'" @change="v => update('themePreference', v)" style="width: 200px" aria-label="Theme">
          <a-select-option value="light">Light</a-select-option>
          <a-select-option value="dark">Dark</a-select-option>
          <a-select-option value="system">System</a-select-option>
        </a-select>
      </a-form-item>
    </SectionCard>
    <SectionCard title="Auto-lock" description="Lock the bridge after a period of inactivity.">
      <a-form-item label="Auto-lock timeout (minutes)">
        <a-input-number :value="settings.autoLockTimeoutMinutes || 0" @change="v => update('autoLockTimeoutMinutes', v)" :min="0" style="width: 120px" aria-label="Auto-lock timeout (minutes)" />
        <span style="margin-left: 8px; color: var(--color-text-secondary);">0 = never lock automatically</span>
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
