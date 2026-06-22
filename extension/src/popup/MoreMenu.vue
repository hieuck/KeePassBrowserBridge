<template>
  <div class="more-menu" ref="menuEl">
    <button class="more-menu__item" @click="$emit('action', { event: 'copy', args: ['username', entry.UserName] })">
      <Icon name="user" :size="14" /> Copy username
    </button>
    <button class="more-menu__item" @click="$emit('action', { event: 'copy', args: ['password', entry.Password] })">
      <Icon name="copy" :size="14" /> Copy password
    </button>
    <button class="more-menu__item more-menu__item--danger" @click="$emit('action', { event: 'delete' })">
      <Icon name="trash" :size="14" /> Delete
    </button>
  </div>
</template>

<script setup>
import Icon from '../components/Icon.vue';

defineProps({ entry: { type: Object, required: true } });
defineEmits(['action']);
</script>

<style scoped>
.more-menu { display: flex; flex-direction: column; background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); overflow: hidden; }
.more-menu__item { display: flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); background: transparent; border: none; font-size: var(--text-sm); color: var(--color-text); cursor: pointer; text-align: left; font-family: inherit; }
.more-menu__item:hover { background: var(--color-bg); }
.more-menu__item--danger { color: var(--color-danger); }
.more-menu__item--danger:hover { background: var(--color-danger-subtle); }
</style>
