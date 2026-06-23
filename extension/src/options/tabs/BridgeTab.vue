<template>
  <div>
    <SectionCard title="Bridge endpoint" description="The local address where KeePass plugin listens.">
      <a-form-item label="Endpoint URL">
        <a-input :value="settings.endpoint || 'http://127.0.0.1:19455/bridge'" @change="e => update('endpoint', e.target.value)" style="width: 320px" />
      </a-form-item>
    </SectionCard>
    <SectionCard title="Connection status" description="Test the connection to the KeePass plugin.">
      <a-space>
        <a-tag :color="isConnected ? 'green' : 'red'">{{ isConnected ? 'Connected' : 'Not connected' }}</a-tag>
        <a-button size="small" @click="testConnection">Test connection</a-button>
      </a-space>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import SectionCard from '../SectionCard.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

const isConnected = computed(() => Boolean(props.settings.clientId && props.settings.sharedSecret));

function update(key, value) { emit('save', { [key]: value }); }

function testConnection() {
  // Placeholder; real implementation would call KBB_HELLO
}
</script>
