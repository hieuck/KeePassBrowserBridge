<template>
  <div>
    <SectionCard title="KeePass Browser Bridge" description="Bridge between KeePass and your browser.">
      <div class="about-row">
        <span class="about-label">Version</span>
        <span class="about-value">{{ version }}</span>
      </div>
      <div class="about-row">
        <span class="about-label">GitHub</span>
        <a class="about-value about-value--link" :href="repoUrl" target="_blank" rel="noopener">{{ repoUrl }}</a>
      </div>
      <div class="about-row">
        <span class="about-label">Plugin version</span>
        <span class="about-value">{{ pluginVersion }}</span>
      </div>
    </SectionCard>
    <SectionCard title="Settings" description="Export or import your extension settings.">
      <div class="about-actions">
        <BaseButton variant="primary" :loading="exporting" leading-icon="download" @click="exportSettings">
          Export Settings
        </BaseButton>
        <BaseButton variant="secondary" leading-icon="upload" @click="triggerImport">
          Import Settings
        </BaseButton>
        <input ref="fileInput" type="file" accept=".json" style="display: none" @change="onFileSelected" />
      </div>
    </SectionCard>
    <SectionCard title="Logs" description="Export logs for debugging.">
      <BaseButton variant="secondary" @click="exportLogs">Export logs</BaseButton>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import SectionCard from '../SectionCard.vue';
import BaseButton from '../../components/BaseButton.vue';
import { getSettings, setSettings } from '../../../shared/storage.js';
import { useToast } from '../../composables/useToast.js';

const { show: showToast } = useToast();

const version = '2.0.0';
const pluginVersion = '2.0.0';
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

<style scoped>
.about-row { display: flex; gap: var(--space-3); padding: var(--space-1) 0; font-size: var(--text-sm); }
.about-label { width: 140px; color: var(--color-text-secondary); font-weight: 600; }
.about-value { flex: 1; color: var(--color-text); }
.about-value--link { color: var(--color-accent); text-decoration: none; word-break: break-all; }
.about-value--link:hover { text-decoration: underline; }
.about-actions { display: flex; gap: var(--space-2); flex-wrap: wrap; }
</style>
