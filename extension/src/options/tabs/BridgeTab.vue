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
    <SectionCard v-if="isConnected" title="Unpair" description="Disconnect this browser from KeePass.">
      <a-popconfirm title="Are you sure you want to unpair this browser?" ok-text="Yes, unpair" cancel-text="Cancel" @confirm="unpair">
        <a-button danger>
          <template #icon><DisconnectOutlined /></template>
          Unpair this browser
        </a-button>
      </a-popconfirm>
    </SectionCard>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { DisconnectOutlined } from '@ant-design/icons-vue';
import SectionCard from '../SectionCard.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

const isConnected = computed(() => Boolean(props.settings.clientId && props.settings.sharedSecret));

function update(key, value) { emit('save', { [key]: value }); }

async function unpair() {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      await chrome.runtime.sendMessage({ type: 'KBB_SET_LOCKED', locked: true });
      await chrome.storage.local.remove(['clientId', 'sharedSecret', 'permissions']);
      window.location.reload();
    }
  } catch (e) {
    console.error('Unpair failed:', e);
  }
}

function testConnection() {
  // Placeholder
}
</script>
