<template>
  <article
    class="credential-card"
    :class="{ 'credential-card--expanded': expanded }"
    @click="onCardClick"
    @keydown.enter="onCardClick"
    @keydown.space.prevent="onCardClick"
    tabindex="0"
    role="button"
    :aria-expanded="expanded"
    :data-testid="'credential-card'"
  >
    <BaseAvatar :name="entry.Title" :url="entry.Url" size="md" class="credential-card__avatar" />
    <div class="credential-card__info">
      <div class="credential-card__title">{{ entry.Title || '(Untitled)' }}</div>
      <div v-if="entry.UserName" class="credential-card__subtitle">{{ entry.UserName }}</div>
      <div v-if="metaText" class="credential-card__meta">
        <BaseBadge v-if="entry.UsageCount > 0" variant="accent">&#9733; {{ entry.UsageCount }}x</BaseBadge>
        <span v-if="entry.LastUsed">{{ formatRelativeTime(entry.LastUsed) }}</span>
      </div>
    </div>
    <button type="button" class="credential-card__chevron" :aria-label="expanded ? 'Collapse' : 'Expand'" tabindex="-1" @click.stop="$emit('toggle', entry)">
      <Icon name="chevron-down" :size="16" :style="{ transform: expanded ? 'rotate(180deg)' : 'none' }" />
    </button>

    <div v-if="expanded" class="credential-card__detail" @click.stop>
      <DetailView
        :entry="entry"
        @fill="(...args) => $emit('fill', ...args)"
        @copy="(...args) => $emit('copy', ...args)"
      />
      <div class="credential-card__actions">
        <BaseButton v-if="canEdit" variant="secondary" size="sm" :leading-icon="'edit'" @click="$emit('edit', entry)">
          Edit
        </BaseButton>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue';
import Icon from '../components/Icon.vue';
import BaseAvatar from '../components/BaseAvatar.vue';
import BaseBadge from '../components/BaseBadge.vue';
import BaseButton from '../components/BaseButton.vue';
import DetailView from '../components/DetailView.vue';
import { formatRelativeTime } from '../../shared/formatters.js';

const props = defineProps({
  entry: { type: Object, required: true },
  expanded: { type: Boolean, default: false },
  canEdit: { type: Boolean, default: false },
});
const emit = defineEmits(['toggle', 'fill', 'copy', 'edit']);

const metaText = computed(() => {
  return [props.entry.Group, props.entry.Url].filter(Boolean).join(' · ');
});

function onCardClick(event) {
  if (event.target.closest('button, input, select, textarea, a, [role="menuitem"]')) return;
  emit('toggle', props.entry);
}
</script>

<style scoped>
.credential-card { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); margin: var(--space-1) var(--space-3); cursor: pointer; transition: border-color var(--transition-fast), box-shadow var(--transition-fast), transform var(--transition-fast); outline: none; box-shadow: var(--shadow-sm); }
.credential-card:hover { border-color: var(--color-border-strong); box-shadow: var(--shadow-md); transform: translateY(-1px); }
.credential-card:focus-visible { box-shadow: 0 0 0 2px var(--color-accent-subtle); border-color: var(--color-accent); }
.credential-card--expanded { flex-direction: column; align-items: stretch; cursor: default; transform: none; box-shadow: var(--shadow-md); }
.credential-card__avatar { flex-shrink: 0; }
.credential-card__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.credential-card__title { font-size: var(--text-h3); font-weight: 600; color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.credential-card__subtitle { font-size: var(--text-sm); color: var(--color-text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.credential-card__meta { display: flex; align-items: center; gap: var(--space-2); font-size: var(--text-xs); color: var(--color-text-muted); flex-wrap: wrap; }
.credential-card__chevron { background: transparent; border: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); flex-shrink: 0; align-self: flex-start; margin-top: var(--space-1); transition: color var(--transition-fast), background var(--transition-fast); border-radius: var(--radius-sm); }
.credential-card__chevron:hover { background: var(--color-bg); color: var(--color-text); }
.credential-card__detail { margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border); display: flex; flex-direction: column; gap: var(--space-3); }
.credential-card__fields, .credential-card__custom { display: flex; flex-direction: column; gap: var(--space-1); }
.credential-card__field { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: var(--color-bg); border-radius: var(--radius-md); transition: background var(--transition-fast); }
.credential-card__field:hover { background: var(--color-surface); }
.credential-card__field-label { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); min-width: 60px; flex-shrink: 0; }
.credential-card__field-value { flex: 1; min-width: 0; font-size: var(--text-sm); color: var(--color-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-family: var(--font-mono); }
.credential-card__icon-btn { background: transparent; border: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); flex-shrink: 0; transition: background var(--transition-fast), color var(--transition-fast); }
.credential-card__icon-btn:hover { background: var(--color-surface); color: var(--color-accent); }
.credential-card__custom-header { font-size: var(--text-xs); font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: var(--space-1); }
.credential-card__actions { display: flex; gap: var(--space-2); }
</style>
