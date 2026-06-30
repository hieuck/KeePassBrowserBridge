import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { defineComponent, h } from 'vue';

vi.mock('@ant-design/icons-vue', () => {
  const icon = defineComponent({ render: () => h('span', { class: 'mock-icon' }) });
  return { PlusOutlined: icon, DeleteOutlined: icon };
});

import EditForm from '../../extension/src/popup/EditForm.vue';

const mockEntry = {
  Title: 'Test Site',
  Url: 'https://test.com',
  UserName: 'admin',
  Password: 'p@ss',
  Group: 'Root',
  CustomFields: [{ Name: 'note', Value: 'hello', IsProtected: false }],
};

const mountOptions = {};

describe('EditForm', () => {
  beforeEach(() => {
    global.confirm = vi.fn(() => true);
  });

  it('should render entry values in form fields', () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    expect(titleInput.element.value).toBe('Test Site');
  });

  it('should show unsaved changes dot when form is dirty', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('Changed');
    expect(wrapper.find('.form__dirty-dot').exists()).toBe(true);
  });

  it('should hide unsaved changes dot when form is clean', () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    expect(wrapper.find('.form__dirty-dot').exists()).toBe(false);
  });

  it('should disable save when form has validation errors', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('');
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save changes');
    expect(saveBtn?.attributes('disabled')).toBeDefined();
  });

  it('should enable save when form is valid and dirty', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('New Title');
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save changes');
    expect(saveBtn?.attributes('disabled')).toBeUndefined();
  });

  it('should emit save with updated data', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('Updated');
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save changes');
    await saveBtn?.trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
    const saved = wrapper.emitted('save')[0][0];
    expect(saved.Title).toBe('Updated');
    expect(saved.ReplaceCustomFields).toBe(true);
  });

  it('should emit cancel on close button click', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    await wrapper.find('.form__close-btn').trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('should add custom field', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    await wrapper.find('.form__add-btn').trigger('click');
    const customRows = wrapper.findAll('.form__custom-row');
    expect(customRows.length).toBe(2);
  });

  it('should remove custom field', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    await wrapper.find('.form__remove-btn').trigger('click');
    const customRows = wrapper.findAll('.form__custom-row');
    expect(customRows.length).toBe(0);
  });
});
