<template>
  <div>
    <SectionCard title="Bridge endpoint" description="The local address where KeePass plugin listens for requests.">
      <BaseInput
        :model-value="settings.endpoint || 'http://127.0.0.1:19455/bridge'"
        @update:model-value="(v) => updateSetting('endpoint', v)"
        label="Endpoint URL"
        placeholder="http://127.0.0.1:19455/bridge"
      />
    </SectionCard>
    <SectionCard title="Connection status" description="Test the connection to the KeePass plugin.">
      <div class="bridge-status">
        <BaseBadge :variant="isConnected ? 'success' : 'danger'">
          {{ isConnected ? 'Connected' : 'Not connected' }}
        </BaseBadge>
        <BaseButton variant="secondary" size="sm" @click="testConnection">Test connection</BaseButton>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SectionCard from '../SectionCard.vue';
import BaseInput from '../../components/BaseInput.vue';
import BaseButton from '../../components/BaseButton.vue';
import BaseBadge from '../../components/BaseBadge.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

const isConnected = computed(() => Boolean(props.settings.clientId && props.settings.sharedSecret));

function updateSetting(key, value) {
  emit('save', { [key]: value });
}

function testConnection() {
  // Placeholder; real implementation would call KBB_HELLO
}
</script>

<style scoped>
.bridge-status { display: flex; align-items: center; gap: var(--space-3); }
</style>
