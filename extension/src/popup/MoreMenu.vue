<template>
  <a-menu class="more-menu" @click="onClick">
    <a-menu-item key="copy-username">
      <UserOutlined /> Copy username
    </a-menu-item>
    <a-menu-item key="copy-password">
      <CopyOutlined /> Copy password
    </a-menu-item>
    <a-menu-divider />
    <a-menu-item key="delete" danger>
      <DeleteOutlined /> Delete
    </a-menu-item>
  </a-menu>
</template>

<script setup>
import { UserOutlined, CopyOutlined, DeleteOutlined } from '@ant-design/icons-vue';

defineProps({ entry: { type: Object, required: true } });
const emit = defineEmits(['action']);

function onClick({ key }) {
  if (key === 'copy-username') emit('action', { event: 'copy', args: ['username', ''] });
  if (key === 'copy-password') emit('action', { event: 'copy', args: ['password', ''] });
  if (key === 'delete') emit('action', { event: 'delete' });
}
</script>

<style scoped>
.more-menu { border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow-md); min-width: 160px; }
</style>
