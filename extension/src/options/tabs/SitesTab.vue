<template>
  <div>
    <SectionCard title="Per-site rules" description="Override auto-fill behavior for a host and its subdomains.">
      <div v-if="rules.length === 0" class="sites-empty">
        <p>No site-specific rules. Auto-fill behavior follows the global settings.</p>
      </div>
      <div v-else class="sites-list">
        <div v-for="rule in rules" :key="rule.host" class="sites-rule">
          <div class="sites-rule__host">{{ rule.host }}</div>
          <a-switch :checked="rule.enabled" @change="v => updateRule(rule.host, v)" />
          <a-button size="small" danger type="text" @click="removeRule(rule.host)">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </div>
      </div>
      <div class="sites-add">
        <a-input v-model:value="newHost" placeholder="example.com" style="width: 200px" />
        <a-button type="primary" size="small" @click="addRule">Add</a-button>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { DeleteOutlined } from '@ant-design/icons-vue';
import SectionCard from '../SectionCard.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

const newHost = ref('');

const rules = computed(() => {
  const sites = props.settings.siteRules || {};
  return Object.entries(sites).map(([host, enabled]) => ({ host, enabled }));
});

function updateRule(host, enabled) {
  const updated = { ...(props.settings.siteRules || {}), [host]: enabled };
  emit('save', { siteRules: updated });
}

function removeRule(host) {
  const updated = { ...(props.settings.siteRules || {}) };
  delete updated[host];
  emit('save', { siteRules: updated });
}

function addRule() {
  const host = newHost.value.trim();
  if (!host) return;
  const updated = { ...(props.settings.siteRules || {}), [host]: true };
  emit('save', { siteRules: updated });
  newHost.value = '';
}
</script>

<style scoped>
.sites-empty { color: var(--color-text-secondary); font-size: var(--text-sm); }
.sites-list { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); }
.sites-rule { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); background: var(--color-bg); border-radius: var(--radius-md); }
.sites-rule__host { flex: 1; font-family: var(--font-mono); font-size: var(--text-sm); }
.sites-add { display: flex; gap: var(--space-2); }
</style>
