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
          <a-button size="small" danger type="text" @click="revokeClient(client.id)">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </div>
      </div>
    </SectionCard>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { DeleteOutlined } from '@ant-design/icons-vue';
import SectionCard from '../SectionCard.vue';

const props = defineProps({ settings: { type: Object, required: true } });
const emit = defineEmits(['save', 'reset']);

const clients = ref([]);

function formatDate(timestamp) {
  if (!timestamp) return 'Never';
  return new Date(timestamp).toLocaleDateString();
}

function revokeClient(id) {
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
</style>
