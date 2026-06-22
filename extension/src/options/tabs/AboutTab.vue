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
    <SectionCard title="Logs" description="Export logs for debugging.">
      <BaseButton variant="secondary" @click="exportLogs">Export logs</BaseButton>
    </SectionCard>
  </div>
</template>

<script setup>
import SectionCard from '../SectionCard.vue';
import BaseButton from '../../components/BaseButton.vue';

const version = '2.0.0';
const pluginVersion = '2.0.0';
const repoUrl = 'https://github.com/hieuck/KeePassBrowserBridge';

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
</style>
