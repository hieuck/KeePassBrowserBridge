<template>
  <form class="form" @submit.prevent="onSave">
    <header class="form__header">
      <h2>Editing {{ entry.Title }}</h2>
      <button type="button" class="form__close" aria-label="Close form" @click="$emit('cancel')">
        <Icon name="close" :size="16" />
      </button>
    </header>
    <div class="form__body">
      <BaseInput v-model="form.Title" label="Title" required />
      <BaseInput v-model="form.Url" label="URL" type="url" />
      <BaseInput v-model="form.UserName" label="Username" />
      <BaseInput v-model="form.Password" label="Password" type="password" show-toggle />
      <BaseInput v-model="form.Group" label="Folder" />
      <div class="form__custom">
        <div class="form__custom-header">
          <span>Custom fields</span>
          <button type="button" class="form__add-custom" @click="addCustomField">
            <Icon name="plus" :size="14" /> Add field
          </button>
        </div>
        <div v-for="(field, idx) in form.CustomFields" :key="idx" class="form__custom-row">
          <BaseInput v-model="field.Name" placeholder="Name" />
          <BaseInput v-model="field.Value" placeholder="Value" type="password" show-toggle />
          <button type="button" class="form__remove-custom" aria-label="Remove field" @click="removeCustomField(idx)">
            <Icon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>
    <footer class="form__footer">
      <BaseButton variant="ghost" @click="$emit('cancel')">Cancel</BaseButton>
      <BaseButton variant="primary" type="submit" :disabled="!canSave">Save changes</BaseButton>
    </footer>
  </form>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import Icon from '../components/Icon.vue';
import BaseInput from '../components/BaseInput.vue';
import BaseButton from '../components/BaseButton.vue';

const props = defineProps({ entry: { type: Object, required: true } });
const emit = defineEmits(['save', 'cancel']);

const form = reactive({
  Title: props.entry.Title || '',
  Url: props.entry.Url || '',
  UserName: props.entry.UserName || '',
  Password: props.entry.Password || '',
  Group: props.entry.Group || '',
  CustomFields: JSON.parse(JSON.stringify(props.entry.CustomFields || [])),
});

const canSave = computed(() => Boolean(form.Title.trim()));

function addCustomField() {
  form.CustomFields.push({ Name: '', Value: '', IsProtected: false });
}

function removeCustomField(idx) {
  form.CustomFields.splice(idx, 1);
}

function onSave() {
  if (!canSave.value) return;
  emit('save', {
    Title: form.Title,
    Url: form.Url,
    UserName: form.UserName,
    Password: form.Password,
    Group: form.Group,
    CustomFields: form.CustomFields.filter(f => f.Name.trim()),
  });
}
</script>

<style scoped>
.form { display: flex; flex-direction: column; background: var(--color-surface); border-top: 1px solid var(--color-border); }
.form__header { display: flex; align-items: center; justify-content: space-between; padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border); }
.form__header h2 { margin: 0; font-size: var(--text-md); font-weight: 600; }
.form__close { background: transparent; border: none; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); border-radius: var(--radius-sm); }
.form__close:hover { background: var(--color-bg); color: var(--color-text); }
.form__body { padding: var(--space-4); display: flex; flex-direction: column; gap: var(--space-3); max-height: 400px; overflow-y: auto; }
.form__custom { display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2); padding-top: var(--space-3); border-top: 1px solid var(--color-border); }
.form__custom-header { display: flex; align-items: center; justify-content: space-between; font-size: var(--text-sm); font-weight: 600; }
.form__add-custom { display: inline-flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); background: transparent; border: 1px solid var(--color-border); border-radius: var(--radius-md); color: var(--color-text); font-size: var(--text-xs); cursor: pointer; }
.form__add-custom:hover { background: var(--color-bg); }
.form__custom-row { display: flex; gap: var(--space-2); align-items: center; }
.form__remove-custom { background: transparent; border: 1px solid var(--color-border); color: var(--color-danger); width: 36px; height: 36px; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; border-radius: var(--radius-md); flex-shrink: 0; }
.form__remove-custom:hover { background: var(--color-danger-subtle); }
.form__footer { display: flex; gap: var(--space-2); justify-content: flex-end; padding: var(--space-3) var(--space-4); border-top: 1px solid var(--color-border); }
</style>
