<template>
  <div class="form">
    <header class="form__header">
      <h2>New login</h2>
      <a-button type="text" size="small" aria-label="Close form" @click="$emit('cancel')">
        <template #icon><CloseOutlined /></template>
      </a-button>
    </header>
    <a-form layout="vertical" :model="form" @finish="onSave" class="form__body">
      <a-form-item label="Title" name="Title" :rules="[{ required: true, message: 'Title is required' }]">
        <a-input v-model:value="form.Title" placeholder="e.g. Facebook" />
      </a-form-item>
      <a-form-item label="URL" name="Url" :rules="[{ required: true, message: 'URL is required' }, { pattern: /^https?:\/\//, message: 'URL must start with http:// or https://' }]">
        <a-input v-model:value="form.Url" type="url" placeholder="https://example.com" />
      </a-form-item>
      <a-form-item label="Username" name="UserName">
        <a-input v-model:value="form.UserName" />
      </a-form-item>
      <a-form-item label="Password" name="Password">
        <a-input-password v-model:value="form.Password" />
      </a-form-item>
      <a-form-item label="Folder" name="Group">
        <a-input v-model:value="form.Group" placeholder="Optional" />
      </a-form-item>
    </a-form>
    <footer class="form__footer">
      <a-button @click="$emit('cancel')">Cancel</a-button>
      <a-button type="primary" :disabled="!canSave" @click="onSave">Save</a-button>
    </footer>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { CloseOutlined } from '@ant-design/icons-vue';

const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  Title: '',
  Url: '',
  UserName: '',
  Password: '',
  Group: '',
});

const canSave = computed(() => {
  const titleOk = Boolean(form.Title.trim());
  const urlOk = Boolean(form.Url.trim()) && /^https?:\/\//.test(form.Url.trim());
  const hasCredential = Boolean(form.UserName.trim()) || Boolean(form.Password);
  return titleOk && urlOk && hasCredential;
});

function onSave() {
  if (!canSave.value) return;
  emit('save', { ...form });
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; background: var(--color-surface); border-top: 1px solid var(--color-border); }
.form__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
.form__header h2 { margin: 0; font-size: var(--text-md); font-weight: 600; }
.form__body { padding: var(--space-4); max-height: 400px; overflow-y: auto; }
.form__footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); }
</style>
