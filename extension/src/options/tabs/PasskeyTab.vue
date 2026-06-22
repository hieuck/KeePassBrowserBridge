<template>
  <div>
    <SectionCard title="Passkey support" description="Enable WebAuthn passkey support via the KeePass plugin.">
      <BaseToggle
        :model-value="!!settings.passkeysEnabled"
        @update:model-value="(v) => updateSetting('passkeysEnabled', v)"
        label="Enable passkeys"
        description="Allow this extension to handle WebAuthn/passkey flows"
      />
    </SectionCard>
    <SectionCard title="Status" description="Current passkey configuration from KeePass plugin.">
      <div class="passkey-status">
        <BaseBadge :variant="passkeyAvailable ? 'success' : 'neutral'">
          {{ passkeyAvailable ? 'Plugin supports passkeys' : 'Plugin does not support passkeys' }}
        </BaseBadge>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import SectionCard from '../SectionCard.vue';
import BaseToggle from '../../components/BaseToggle.vue';
import BaseBadge from '../../components/BaseBadge.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

const passkeyAvailable = ref(false);

function updateSetting(key, value) {
  emit('save', { [key]: value });
}

onMounted(() => {
  // Placeholder; load from KBB_HELLO pluginPasskeysEnabled
});
</script>

<style scoped>
.passkey-status { display: flex; align-items: center; gap: var(--space-2); }
</style>
