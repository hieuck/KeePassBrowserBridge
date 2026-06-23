<template>
  <div class="filter-bar" role="tablist" aria-label="Filter by group" :data-testid="'filter-bar'">
    <button
      v-for="group in visibleGroups"
      :key="group.id"
      type="button"
      class="filter-bar__chip"
      :class="{ 'filter-bar__chip--active': modelValue === group.id }"
      role="tab"
      :aria-selected="modelValue === group.id"
      :data-testid="`filter-chip-${(group.label || '').toLowerCase().replace(/\s+/g, '-')}`"
      @click="$emit('update:modelValue', group.id)"
    >
      <BaseBadge v-if="group.count !== undefined" variant="neutral" size="sm">{{ group.count }}</BaseBadge>
      {{ group.label }}
    </button>
    <div v-if="overflowGroups.length > 0" class="filter-bar__overflow" ref="overflowRef">
      <button type="button" class="filter-bar__more" :aria-expanded="showOverflow" @click="showOverflow = !showOverflow" aria-label="More groups">
        +{{ overflowGroups.length }}
      </button>
      <div v-if="showOverflow" class="filter-bar__dropdown">
        <button
          v-for="group in overflowGroups"
          :key="group.id"
          type="button"
          class="filter-bar__chip"
          :class="{ 'filter-bar__chip--active': modelValue === group.id }"
          role="tab"
          :aria-selected="modelValue === group.id"
          :data-testid="`filter-chip-${(group.label || '').toLowerCase().replace(/\s+/g, '-')}`"
          @click="selectOverflow(group.id)"
        >
          {{ group.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import BaseBadge from './BaseBadge.vue';

const props = defineProps({
  modelValue: { type: [String, Number], default: 'all' },
  groups: { type: Array, default: () => [] },
});

const emit = defineEmits(['update:modelValue']);
const showOverflow = ref(false);

const visibleGroups = computed(() => props.groups.slice(0, 5));
const overflowGroups = computed(() => props.groups.slice(5));

function selectOverflow(id) {
  emit('update:modelValue', id);
  showOverflow.value = false;
}
</script>

<style scoped>
.filter-bar { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); overflow-x: auto; flex-shrink: 0; }
.filter-bar__chip { display: inline-flex; align-items: center; gap: var(--space-1); padding: 4px 10px; border: 1px solid var(--color-border); border-radius: var(--radius-full); background: transparent; font-size: var(--text-sm); color: var(--color-text-secondary); cursor: pointer; white-space: nowrap; transition: all var(--transition-fast); font-family: inherit; }
.filter-bar__chip:hover { border-color: var(--color-accent); color: var(--color-accent); }
.filter-bar__chip--active { background: var(--color-accent-subtle); border-color: var(--color-accent); color: var(--color-accent); font-weight: 600; }
.filter-bar__chip:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 1px; }
.filter-bar__overflow { position: relative; }
.filter-bar__more { padding: 4px 10px; border: 1px dashed var(--color-border); border-radius: var(--radius-full); background: transparent; font-size: var(--text-sm); color: var(--color-text-muted); cursor: pointer; font-family: inherit; }
.filter-bar__more:hover { border-color: var(--color-accent); color: var(--color-accent); }
.filter-bar__dropdown { position: absolute; top: 100%; left: 0; margin-top: 4px; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); display: flex; flex-direction: column; padding: 4px; z-index: var(--z-dropdown, 100); min-width: 160px; }
</style>
