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

  it('should show URL validation error for invalid URL', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const urlInput = wrapper.find('.form__input--url');
    await urlInput.setValue('not-a-url');
    expect(wrapper.find('.form__error').text()).toContain('Invalid URL format');
  });

  it('should mark dirty when custom fields change', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const customInputs = wrapper.findAll('.form__custom-row .form__input');
    const valueInput = customInputs.find(i => i.attributes('placeholder') === 'Value');
    await valueInput?.setValue('changed');
    expect(wrapper.find('.form__dirty-dot').exists()).toBe(true);
  });

  it('should toggle password visibility', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const passwordInput = wrapper.findAll('.form__input')
      .find(i => i.attributes('type') === 'password');
    expect(passwordInput).toBeDefined();
    const toggleBtn = wrapper.find('.form__toggle-btn');
    await toggleBtn.trigger('click');
    const textInput = wrapper.findAll('.form__input')
      .find(i => i.attributes('type') === 'text' && i.element.value === 'p@ss');
    expect(textInput).toBeDefined();
  });

  it('should save on Ctrl+S keydown when valid and dirty', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('Updated');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', ctrlKey: true, bubbles: true }));
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0].Title).toBe('Updated');
  });

  it('should cancel on Escape keydown when dirty and confirmed', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('Updated');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('should not cancel on Escape when dirty and not confirmed', async () => {
    global.confirm = vi.fn(() => false);
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('Updated');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(wrapper.emitted('cancel')).toBeFalsy();
  });

  it('should not cancel on cancel click when dirty and not confirmed', async () => {
    global.confirm = vi.fn(() => false);
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const titleInput = wrapper.find('.form__input');
    await titleInput.setValue('Updated');
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancel');
    await cancelBtn?.trigger('click');
    expect(wrapper.emitted('cancel')).toBeFalsy();
  });

  it('should filter out empty custom fields on save', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    await wrapper.find('.form__add-btn').trigger('click');
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save changes');
    await saveBtn?.trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
    expect(wrapper.emitted('save')[0][0].CustomFields).toEqual([{ Name: 'note', Value: 'hello', IsProtected: false }]);
  });

  it('should update username field', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const inputs = wrapper.findAll('.form__input');
    const usernameInput = inputs.find(i => i.element.value === 'admin');
    await usernameInput?.setValue('newuser');
    expect(wrapper.vm.form.UserName).toBe('newuser');
  });

  it('should update password field', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const inputs = wrapper.findAll('.form__input');
    const passwordInput = inputs.find(i => i.attributes('type') === 'password' && i.element.value === 'p@ss');
    await passwordInput?.setValue('newpass');
    expect(wrapper.vm.form.Password).toBe('newpass');
  });

  it('should update group field', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const inputs = wrapper.findAll('.form__input');
    const groupInput = inputs.find(i => i.element.value === 'Root');
    await groupInput?.setValue('Work');
    expect(wrapper.vm.form.Group).toBe('Work');
  });

  it('should update custom field name', async () => {
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    const nameInput = wrapper.findAll('.form__custom-row .form__input')
      .find(i => i.attributes('placeholder') === 'Name');
    await nameInput?.setValue('renamed');
    expect(wrapper.vm.form.CustomFields[0].Name).toBe('renamed');
  });

  it('should remove keydown listener on unmount', () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const wrapper = mount(EditForm, { props: { entry: mockEntry }, ...mountOptions });
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
