import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DetailView from '../../extension/src/components/DetailView.vue';

describe('DetailView', () => {
  it('should render username and password fields', () => {
    const wrapper = mount(DetailView, {
      props: {
        entry: {
          UserName: 'user@example.com',
          Password: 'secret123',
        },
      },
    });
    expect(wrapper.text()).toContain('user@example.com');
    expect(wrapper.text()).toContain('Password');
    expect(wrapper.text()).toContain('••••••••');
  });

  it('should emit fill event with form role when fill button is clicked', async () => {
    const entry = { UserName: 'user@example.com', Password: 'secret123' };
    const wrapper = mount(DetailView, { props: { entry } });
    await wrapper.find('.detail-view__fill-btn').trigger('click');
    expect(wrapper.emitted('fill')).toBeTruthy();
    expect(wrapper.emitted('fill')[0]).toEqual([entry, 'form']);
  });

  it('should emit copy event with username when copy username button is clicked', async () => {
    const entry = { UserName: 'user@example.com', Password: 'secret123' };
    const wrapper = mount(DetailView, { props: { entry } });
    const buttons = wrapper.findAll('.detail-view__icon-btn');
    const copyUserBtn = buttons.find(b => b.attributes('aria-label') === 'Copy username');
    await copyUserBtn?.trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
    expect(wrapper.emitted('copy')[0]).toEqual(['username', 'user@example.com']);
  });

  it('should toggle password visibility when show/hide button is clicked', async () => {
    const wrapper = mount(DetailView, {
      props: { entry: { UserName: 'user@example.com', Password: 'secret123' } },
    });
    const toggleBtn = wrapper.findAll('.detail-view__icon-btn')
      .find(b => b.attributes('aria-label')?.startsWith('Show password') || b.attributes('aria-label')?.startsWith('Hide password'));
    expect(wrapper.text()).toContain('••••••••');
    await toggleBtn?.trigger('click');
    expect(wrapper.text()).toContain('secret123');
    await toggleBtn?.trigger('click');
    expect(wrapper.text()).toContain('••••••••');
  });

  it('should emit copy event with password when copy password button is clicked', async () => {
    const entry = { UserName: 'user@example.com', Password: 'secret123' };
    const wrapper = mount(DetailView, { props: { entry } });
    const buttons = wrapper.findAll('.detail-view__icon-btn');
    const copyPassBtn = buttons.find(b => b.attributes('aria-label') === 'Copy password');
    await copyPassBtn?.trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
    expect(wrapper.emitted('copy')[0]).toEqual(['password', 'secret123']);
  });

  it('should render OTP field and emit copy on OTP copy click', async () => {
    const entry = { UserName: 'user@example.com', OneTimePassword: '123456' };
    const wrapper = mount(DetailView, { props: { entry } });
    expect(wrapper.text()).toContain('OTP');
    expect(wrapper.text()).toContain('123456');
    const buttons = wrapper.findAll('.detail-view__icon-btn');
    const copyOtpBtn = buttons.find(b => b.attributes('aria-label') === 'Copy OTP');
    await copyOtpBtn?.trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
    expect(wrapper.emitted('copy')[0]).toEqual(['otp', '123456']);
  });

  it('should render custom fields and emit copy on custom field copy click', async () => {
    const entry = {
      UserName: 'user@example.com',
      CustomFields: [
        { Name: 'PIN', Value: '9876', IsProtected: false },
        { Name: 'ProtectedField', Value: 'secret', IsProtected: true },
        { Name: '', Value: 'ignored', IsProtected: false },
      ],
    };
    const wrapper = mount(DetailView, { props: { entry } });
    expect(wrapper.text()).toContain('Custom fields (1)');
    expect(wrapper.text()).toContain('PIN');
    expect(wrapper.text()).toContain('9876');
    expect(wrapper.text()).not.toContain('ProtectedField');
    expect(wrapper.text()).not.toContain('ignored');
    const buttons = wrapper.findAll('.detail-view__icon-btn');
    const copyPinBtn = buttons.find(b => b.attributes('aria-label') === 'Copy PIN');
    await copyPinBtn?.trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
    expect(wrapper.emitted('copy')[0]).toEqual(['PIN', '9876']);
  });

  it('should not render fields section when entry has no sensitive data', () => {
    const wrapper = mount(DetailView, { props: { entry: { UserName: '' } } });
    expect(wrapper.find('.detail-view__fields').exists()).toBe(false);
  });
});
