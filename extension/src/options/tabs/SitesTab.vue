<template>
  <div>
    <SectionCard title="Per-site rules" description="Override auto-fill behavior for a host and its subdomains.">
      <div v-if="rules.length === 0" class="sites-empty">
        <p>No site-specific rules. Auto-fill behavior follows the global settings.</p>
      </div>
      <div v-else class="sites-list">
        <div v-for="rule in rules" :key="rule.host" class="sites-rule">
          <div class="sites-rule__host">{{ rule.host }}</div>
          <BaseToggle
            :model-value="rule.enabled"
            @update:model-value="(v) => updateRule(rule.host, v)"
            label="Auto-fill"
          />
          <button type="button" class="sites-rule__remove" @click="removeRule(rule.host)">
            <Icon name="trash" :size="14" />
          </button>
        </div>
      </div>
      <div class="sites-add">
        <BaseInput v-model="newHost" placeholder="example.com" />
        <BaseButton variant="primary" size="sm" @click="addRule">Add</BaseButton>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SectionCard from '../SectionCard.vue';
import BaseInput from '../../components/BaseInput.vue';
import BaseButton from '../../components/BaseButton.vue';
import BaseToggle from '../../components/BaseToggle.vue';
import Icon from '../../components/Icon.vue';

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
.sites-rule__remove { background: transparent; border: none; color: var(--color-danger); cursor: pointer; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); }
.sites-rule__remove:hover { background: var(--color-danger-subtle); }
.sites-add { display: flex; gap: var(--space-2); }
</style>
