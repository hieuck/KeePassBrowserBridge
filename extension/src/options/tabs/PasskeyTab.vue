<template>
  <div>
    <SectionCard title="Passkey support" description="Enable WebAuthn passkey support via the KeePass plugin.">
      <a-form-item label="Enable passkeys">
        <a-switch :checked="!!settings.passkeysEnabled" @change="v => updateSetting('passkeysEnabled', v)" />
        <span style="margin-left: 8px; color: var(--color-text-secondary);">Allow this extension to handle WebAuthn/passkey flows</span>
      </a-form-item>
    </SectionCard>
    <SectionCard title="Status" description="Current passkey configuration from KeePass plugin.">
      <a-tag :color="passkeyAvailable ? 'green' : 'default'">
        {{ passkeyAvailable ? 'Plugin supports passkeys' : 'Plugin does not support passkeys' }}
      </a-tag>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SectionCard from '../SectionCard.vue';
import { useBridge } from '../../composables/useBridge.js';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);
const bridge = useBridge();

const passkeyAvailable = ref(false);

function updateSetting(key, value) {
  emit('save', { [key]: value });
}

onMounted(async () => {
  try {
    const about = await bridge.getAbout();
    passkeyAvailable.value = !!about.pluginPasskeysEnabled;
  } catch (e) {
    console.error('Failed to query passkey status:', e);
    passkeyAvailable.value = false;
  }
});
</script>
