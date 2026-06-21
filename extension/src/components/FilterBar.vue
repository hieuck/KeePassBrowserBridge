<template>
  <div
    id="filterBar"
    class="filter-bar"
    :class="{ hidden: groups.length <= 1 }"
  >
    <button
      class="filter-chip filter-chip-all"
      :class="{ active: modelValue === 'All' }"
      type="button"
      @click="$emit('update:modelValue', 'All')"
    >All</button>
    <div class="filter-chips" id="filterChips">
      <button
        v-for="g in displayGroups"
        :key="g.full"
        class="filter-chip"
        :class="{ active: modelValue === g.full }"
        :data-group="g.full"
        type="button"
        @click="$emit('update:modelValue', g.full)"
      >{{ g.short }}</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  groups: { type: Array, default: () => [] },
  modelValue: { type: String, default: 'All' }
});

defineEmits(['update:modelValue']);

const displayGroups = computed(() => {
  return props.groups.map(g => {
    const parts = g.split('/');
    return { full: g, short: parts[parts.length - 1] };
  }).sort((a, b) => a.short.localeCompare(b.short));
});
</script>
