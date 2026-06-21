<template>
  <div>
    <div class="settings-section">
      <h2>About</h2>

      <div class="about-grid">
        <span>Extension</span>
        <strong id="aboutVersion">{{ version }}</strong>
        <span>Plugin</span>
        <strong id="aboutPluginVersion">{{ pluginVersion }}</strong>
        <span>Browser ID</span>
        <code id="aboutBrowserId">{{ browserId }}</code>
        <span>Project</span>
        <a id="repositoryLink" :href="repositoryUrl" target="_blank" rel="noreferrer">Repository</a>
        <span>Updates</span>
        <a id="releasesLink" :href="releasesUrl" target="_blank" rel="noreferrer">GitHub Releases</a>
      </div>

      <div class="about-actions">
        <button id="checkUpdates" type="button" class="btn-secondary" @click="checkUpdates">Check updates</button>
        <p class="settings-hint">Manual installs are updated from GitHub Releases. Store builds update through the browser's extension store.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { send } from '../utils.js';

export default {
  emits: ['show-message'],
  data() {
    return {
      version: '...',
      pluginVersion: 'Unavailable',
      browserId: 'Unknown',
      repositoryUrl: '#',
      releasesUrl: '#'
    };
  },
  mounted() {
    this.loadAbout();
  },
  methods: {
    async loadAbout() {
      try {
        const about = await send({ type: 'KBB_GET_ABOUT' });
        this.version = about.version || 'Unknown';
        this.pluginVersion = about.pluginVersion || 'Unavailable';
        this.browserId = about.browserId || 'Unknown';
        this.repositoryUrl = about.repositoryUrl || '#';
        this.releasesUrl = about.releasesUrl || '#';
      } catch (err) {
        this.$emit('show-message', err && err.message ? err.message : String(err), 'error');
      }
    },
    async checkUpdates() {
      try {
        const result = await send({ type: 'KBB_CHECK_UPDATES' });
        if (result.updateAvailable) {
          this.releasesUrl = result.releaseUrl || this.releasesUrl;
          this.$emit('show-message',
            `Update ${result.latestVersion} is available. Open GitHub Releases to install it.`,
            'success'
          );
          return;
        }
        this.$emit('show-message',
          `KeePass Browser Bridge ${result.currentVersion} is up to date.`,
          'success'
        );
      } catch (err) {
        this.$emit('show-message', err && err.message ? err.message : String(err), 'error');
      }
    }
  }
};
</script>
