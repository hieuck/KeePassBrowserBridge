<template>
  <a-menu
    :selectedKeys="[active]"
    mode="inline"
    @click="onClick"
    style="width: 200px; height: 100%; border-right: 1px solid var(--color-border);"
  >
    <a-menu-item v-for="item in menuItems" :key="item.key">
      <template #icon>
        <component :is="item.icon" />
      </template>
      {{ item.label }}
    </a-menu-item>
  </a-menu>
</template>

<script setup>
import { computed } from 'vue';
import {
  UserOutlined,
  GlobalOutlined,
  CheckOutlined,
  TeamOutlined,
  UserAddOutlined,
  SafetyCertificateOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons-vue';

const props = defineProps({ active: { type: String, required: true }, tabs: { type: Array, required: true } });
const emit = defineEmits(['select']);

const iconMap = {
  general: UserOutlined, bridge: GlobalOutlined, autofill: CheckOutlined,
  sites: TeamOutlined, clients: UserAddOutlined,   passkey: SafetyCertificateOutlined, about: InfoCircleOutlined,
};

const menuItems = computed(() =>
  props.tabs.map(tab => ({ key: tab.id, icon: iconMap[tab.id] || InfoCircleOutlined, label: tab.label }))
);

function onClick({ key }) { emit('select', key); }
</script>
