<template>
  <section id="aboutPanel" class="settings-section about-section" :class="{ hidden: !visible }">
    <div class="about-header">
      <div>
        <div class="about-title">About</div>
        <div class="about-meta">Version <span id="aboutVersion">{{ version }}</span></div>
      </div>
      <button id="checkUpdates" class="secondary" type="button" @click="$emit('check-updates')">Check updates</button>
    </div>
    <div class="about-grid">
      <span>Plugin</span>
      <code id="aboutPluginVersion">{{ pluginVersion }}</code>
      <span>Browser ID</span>
      <code id="aboutBrowserId">{{ browserId }}</code>
      <a id="repositoryLink" :href="repositoryUrl" target="_blank" rel="noreferrer">Repository</a>
      <a id="releasesLink" :href="releasesUrl" target="_blank" rel="noreferrer">GitHub Releases</a>
    </div>
  </section>
</template>

<script setup>
defineProps({
  visible: { type: Boolean, default: false },
  version: { type: String, default: '...' },
  pluginVersion: { type: String, default: '...' },
  browserId: { type: String, default: '' },
  repositoryUrl: { type: String, default: '#' },
  releasesUrl: { type: String, default: '#' }
});
defineEmits(['check-updates']);
</script>
