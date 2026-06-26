<template>
  <div>
    <SectionCard title="KeePass Browser Bridge" description="Bridge between KeePass and your browser.">
      <a-descriptions :column="1" size="small">
        <a-descriptions-item label="Version">{{ version }}</a-descriptions-item>
        <a-descriptions-item label="GitHub"><a :href="repoUrl" target="_blank">{{ repoUrl }}</a></a-descriptions-item>
        <a-descriptions-item label="Plugin version">{{ pluginVersion }}</a-descriptions-item>
      </a-descriptions>
    </SectionCard>
    <SectionCard title="Settings" description="Export or import your extension settings.">
      <a-space>
        <a-button :loading="exporting" @click="exportSettings">Export Settings</a-button>
        <a-button @click="triggerImport">Import Settings</a-button>
        <input ref="fileInput" type="file" accept=".json" style="display:none" @change="onFileSelected" />
      </a-space>
    </SectionCard>
    <SectionCard title="Logs" description="Export logs for debugging.">
      <a-button @click="exportLogs">Export logs</a-button>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SectionCard from '../SectionCard.vue';
import { getSettings, setSettings } from '../../../shared/storage.js';
import { useToast } from '../../composables/useToast.js';

const { show: showToast } = useToast();

const version = __APP_VERSION__;
const pluginVersion = __APP_VERSION__;
const repoUrl = 'https://github.com/hieuck/KeePassBrowserBridge';

const exporting = ref(false);
const fileInput = ref(null);

function triggerImport() {
  fileInput.value?.click();
}

async function exportSettings() {
  exporting.value = true;
  try {
    const settings = await getSettings();
    const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keepass-bridge-settings-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Settings exported', { variant: 'success' });
  } catch (error) {
    showToast(error.message, { variant: 'error' });
  } finally {
    exporting.value = false;
  }
}

async function onFileSelected(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== 'object') throw new Error('Invalid settings file');
    await setSettings(data);
    showToast('Settings imported — reloading...', { variant: 'success' });
    setTimeout(() => location.reload(), 1500);
  } catch (error) {
    showToast(error instanceof SyntaxError ? 'Invalid JSON file' : error.message, { variant: 'error' });
  } finally {
    event.target.value = '';
  }
}

function exportLogs() {
  // Placeholder; real implementation would download a log file
}
</script>
