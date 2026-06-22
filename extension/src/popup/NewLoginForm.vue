<template>
  <form class="form" @submit.prevent="onSave">
    <header class="form__header">
      <h2>New login</h2>
      <button type="button" class="form__close" aria-label="Close form" @click="$emit('cancel')">
        <Icon name="close" :size="16" />
      </button>
    </header>
    <div class="form__body">
      <BaseInput v-model="form.Title" label="Title" placeholder="e.g. Facebook" required />
      <BaseInput v-model="form.Url" label="URL" type="url" placeholder="https://example.com" />
      <BaseInput v-model="form.UserName" label="Username" />
      <BaseInput v-model="form.Password" label="Password" type="password" show-toggle />
      <BaseInput v-model="form.Group" label="Folder" placeholder="Optional" />
    </div>
    <footer class="form__footer">
      <BaseButton variant="ghost" @click="$emit('cancel')">Cancel</BaseButton>
      <BaseButton variant="primary" type="submit" :disabled="!canSave">Save</BaseButton>
    </footer>
  </form>
</template>

<script setup>
import { reactive, computed } from 'vue';
import Icon from '../components/Icon.vue';
import BaseInput from '../components/BaseInput.vue';
import BaseButton from '../components/BaseButton.vue';

const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  Title: '',
  Url: '',
  UserName: '',
  Password: '',
  Group: '',
});

const canSave = computed(() => Boolean(form.Title.trim()));

function onSave() {
  if (!canSave.value) return;
  emit('save', { ...form });
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; background: var(--color-surface); border-top: 1px solid var(--color-border); }
.form__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
.form__header h2 { margin: 0; font-size: var(--text-md); font-weight: 600; }
.form__close { background: transparent; border: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.form__close:hover { background: var(--color-bg); color: var(--color-text); }
.form__body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); max-height: 400px; overflow-y: auto; }
.form__footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); }
</style>
