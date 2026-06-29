<template>
  <div class="form">
    <header class="form__header">
      <h2>New login</h2>
      <button type="button" class="form__close-btn" aria-label="Close form" @click="$emit('cancel')">
        <CloseOutlined />
      </button>
    </header>
    <form class="form__body" @submit.prevent="onSave">
      <div class="form__field">
        <label class="form__label" for="new-title">Title</label>
        <input id="new-title" v-model="form.Title" placeholder="e.g. Facebook" class="form__input" required />
      </div>
      <div class="form__field">
        <label class="form__label" for="new-url">URL</label>
        <input id="new-url" v-model="form.Url" type="url" placeholder="https://example.com" class="form__input" required />
      </div>
      <div class="form__field">
        <label class="form__label" for="new-username">Username</label>
        <input id="new-username" v-model="form.UserName" class="form__input" />
      </div>
      <div class="form__field">
        <label class="form__label" for="new-password">Password</label>
        <input id="new-password" v-model="form.Password" type="password" class="form__input" />
      </div>
      <div class="form__field">
        <label class="form__label" for="new-group">Folder</label>
        <select id="new-group" v-model="form.Group" class="form__input form__select">
          <option value="" disabled>Select folder</option>
          <option v-for="opt in flatOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </form>
    <footer class="form__footer">
      <button type="button" class="form__cancel-btn" @click="$emit('cancel')">Cancel</button>
      <button type="button" class="form__save-btn" :disabled="!canSave" @click="onSave">Save</button>
    </footer>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue';
import { CloseOutlined } from '@ant-design/icons-vue';

const props = defineProps({
  groups: { type: Array, default: () => [] },
});
const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  Title: '',
  Url: '',
  UserName: '',
  Password: '',
  Group: '',
});

function flattenTree(nodes, parentPath = '') {
  const result = [];
  for (const node of (nodes || [])) {
    const path = parentPath ? parentPath + '\\' + node.Name : node.Name;
    result.push({ value: path, label: path });
    if (node.Children && node.Children.length > 0) {
      result.push(...flattenTree(node.Children, path));
    }
  }
  return result;
}

const flatOptions = computed(() => flattenTree(props.groups));

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
.form__close-btn { background: transparent; border: none; width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.form__close-btn:hover { background: var(--color-bg); color: var(--color-text); }
.form__body { padding: var(--space-4); max-height: 400px; overflow-y: auto; }
.form__field { display: flex; flex-direction: column; gap: 4px; margin-bottom: var(--space-3); }
.form__label { font-size: var(--text-sm); font-weight: 500; color: var(--color-text-secondary); }
.form__input { padding: 6px 10px; font-size: var(--text-sm); font-family: inherit; border: 1px solid var(--color-border); border-radius: var(--radius-sm); background: var(--color-bg); color: var(--color-text); outline: none; transition: border-color var(--transition-fast); }
.form__input:focus { border-color: var(--color-accent); }
.form__select { cursor: pointer; }
.form__footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); }
.form__cancel-btn { padding: 4px 14px; font-size: var(--text-sm); font-family: inherit; cursor: pointer; border: 1px solid var(--color-border); border-radius: var(--radius-md); background: transparent; color: var(--color-text); transition: all var(--transition-fast); }
.form__cancel-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
.form__save-btn { padding: 4px 14px; font-size: var(--text-sm); font-family: inherit; cursor: pointer; border: none; border-radius: var(--radius-md); background: var(--color-accent); color: #fff; font-weight: 500; transition: opacity var(--transition-fast); }
.form__save-btn:hover:not(:disabled) { opacity: 0.85; }
.form__save-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
