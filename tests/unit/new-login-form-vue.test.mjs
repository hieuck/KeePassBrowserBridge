import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import NewLoginForm from '../../extension/src/popup/NewLoginForm.vue';

const mockGroups = [
  { Name: 'Root', Children: [{ Name: 'Personal', Children: [] }, { Name: 'Work', Children: [] }] },
  { Name: 'Finance', Children: [] },
];

describe('NewLoginForm', () => {
  it('should render form fields', () => {
    const wrapper = mount(NewLoginForm);
    expect(wrapper.find('#new-title').exists()).toBe(true);
    expect(wrapper.find('#new-url').exists()).toBe(true);
    expect(wrapper.find('#new-username').exists()).toBe(true);
    expect(wrapper.find('#new-password').exists()).toBe(true);
    expect(wrapper.find('#new-group').exists()).toBe(true);
  });

  it('should disable save by default', () => {
    const wrapper = mount(NewLoginForm);
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save');
    expect(saveBtn?.attributes('disabled')).toBeDefined();
  });

  it('should enable save when form is valid', async () => {
    const wrapper = mount(NewLoginForm);
    await wrapper.find('#new-title').setValue('My Site');
    await wrapper.find('#new-url').setValue('https://example.com');
    await wrapper.find('#new-username').setValue('user');
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save');
    expect(saveBtn?.attributes('disabled')).toBeUndefined();
  });

  it('should require http/https URL prefix', async () => {
    const wrapper = mount(NewLoginForm);
    await wrapper.find('#new-title').setValue('Test');
    await wrapper.find('#new-url').setValue('example.com');
    await wrapper.find('#new-username').setValue('user');
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save');
    expect(saveBtn?.attributes('disabled')).toBeDefined();
  });

  it('should emit save with form data on valid submit', async () => {
    const wrapper = mount(NewLoginForm);
    await wrapper.find('#new-title').setValue('My App');
    await wrapper.find('#new-url').setValue('https://app.com');
    await wrapper.find('#new-username').setValue('admin');
    await wrapper.find('#new-password').setValue('secret');
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save');
    await saveBtn?.trigger('click');
    expect(wrapper.emitted('save')).toBeTruthy();
    const saved = wrapper.emitted('save')[0][0];
    expect(saved.Title).toBe('My App');
    expect(saved.Url).toBe('https://app.com');
    expect(saved.UserName).toBe('admin');
    expect(saved.Password).toBe('secret');
  });

  it('should emit cancel on cancel button click', async () => {
    const wrapper = mount(NewLoginForm);
    const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancel');
    await cancelBtn?.trigger('click');
    expect(wrapper.emitted('cancel')).toBeTruthy();
  });

  it('should render group options from tree', () => {
    const wrapper = mount(NewLoginForm, { props: { groups: mockGroups } });
    const options = wrapper.findAll('option');
    expect(options.length).toBeGreaterThan(1);
    expect(wrapper.text()).toContain('Root');
    expect(wrapper.text()).toContain('Root\\Personal');
    expect(wrapper.text()).toContain('Finance');
  });
});
