<template>
  <div>
    <SectionCard title="Auto-fill" description="Automatically fill forms when only one login matches.">
      <BaseToggle
        :model-value="!!settings.autoFillEnabled"
        @update:model-value="(v) => updateSetting('autoFillEnabled', v)"
        label="Enable auto-fill"
        description="Fill credentials when exactly one login matches the page URL"
      />
      <BaseToggle
        :model-value="!!settings.autoSubmitEnabled"
        @update:model-value="(v) => updateSetting('autoSubmitEnabled', v)"
        label="Auto-submit form"
        description="Submit form after filling credentials"
      />
    </SectionCard>
    <SectionCard title="Fill delay" description="How long to wait before filling credentials.">
      <BaseInput
        :model-value="settings.autoFillDelayMs || 1200"
        @update:model-value="(v) => updateSetting('autoFillDelayMs', v)"
        type="number"
        label="Delay (ms)"
        description="Increase if pages load slowly"
      />
    </SectionCard>
  </div>
</template>

<script setup>
import SectionCard from '../SectionCard.vue';
import BaseInput from '../../components/BaseInput.vue';
import BaseToggle from '../../components/BaseToggle.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

function updateSetting(key, value) {
  emit('save', { [key]: value });
}
</script>
