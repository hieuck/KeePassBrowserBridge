<template>
  <div>
    <SectionCard title="Appearance" description="Customize how the extension looks.">
      <BaseInput
        :model-value="settings.themePreference || 'system'"
        @update:model-value="(v) => updateSetting('themePreference', v)"
        label="Theme"
        description="Light, dark, or follow system"
      />
    </SectionCard>
    <SectionCard title="Auto-lock" description="Lock the bridge after a period of inactivity.">
      <BaseInput
        :model-value="settings.autoLockTimeoutMinutes || 0"
        @update:model-value="(v) => updateSetting('autoLockTimeoutMinutes', v)"
        type="number"
        label="Auto-lock timeout (minutes)"
        description="0 = never lock automatically"
      />
    </SectionCard>
  </div>
</template>

<script setup>
import SectionCard from '../SectionCard.vue';
import BaseInput from '../../components/BaseInput.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

function updateSetting(key, value) {
  emit('save', { [key]: value });
}
</script>
