<template>
  <div>
    <SectionCard title="Trusted browsers" description="Browsers authorized to access your KeePass database.">
      <div v-if="clients.length === 0" class="clients-empty">
        <p>No trusted clients configured.</p>
      </div>
      <div v-else class="clients-list">
        <div v-for="client in clients" :key="client.id" class="clients-row">
          <div class="clients-row__name">{{ client.name }}</div>
          <div class="clients-row__perms">{{ (client.permissions || []).join(', ') }}</div>
          <div class="clients-row__last">{{ formatDate(client.lastUsed) }}</div>
          <button type="button" class="clients-row__remove" @click="revokeClient(client.id)">
            <Icon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import SectionCard from '../SectionCard.vue';
import Icon from '../../components/Icon.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

const clients = ref([]);

function formatDate(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleDateString();
}

function revokeClient(id) {
  // Placeholder; real implementation would call KBB_REVOKE_CLIENT
  clients.value = clients.value.filter(c => c.id !== id);
}

onMounted(() => {
  // Placeholder; load from background via KBB_LIST_CLIENTS
});
</script>

<style scoped>
.clients-empty { color: var(--color-text-secondary); font-size: var(--text-sm); }
.clients-list { display: flex; flex-direction: column; gap: var(--space-2); }
.clients-row { display: grid; grid-template-columns: 1fr 2fr 1fr auto; align-items: center; gap: var(--space-3); padding: var(--space-2) var(--space-3); background: var(--color-bg); border-radius: var(--radius-md); }
.clients-row__name { font-weight: 500; font-size: var(--text-sm); }
.clients-row__perms { font-size: var(--text-xs); color: var(--color-text-secondary); }
.clients-row__last { font-size: var(--text-xs); color: var(--color-text-muted); }
.clients-row__remove { background: transparent; border: none; color: var(--color-danger); cursor: pointer; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; border-radius: var(--radius-sm); }
.clients-row__remove:hover { background: var(--color-danger-subtle); }
</style>
