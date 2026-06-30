import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FooterBar from '../../extension/src/popup/FooterBar.vue';

describe('FooterBar', () => {
  it('should render all action buttons', () => {
    const wrapper = mount(FooterBar);
    expect(wrapper.text()).toContain('New');
    expect(wrapper.text()).toContain('Settings');
    expect(wrapper.text()).toContain('Lock');
    expect(wrapper.text()).toContain('Theme');
  });

  it('should disable new button when canWrite is false', () => {
    const wrapper = mount(FooterBar, { props: { canWrite: false } });
    const buttons = wrapper.findAll('button');
    const newBtn = buttons.find(b => b.text().includes('New'));
    expect(newBtn?.attributes('disabled')).toBeDefined();
  });

  it('should enable new button when canWrite is true', () => {
    const wrapper = mount(FooterBar, { props: { canWrite: true } });
    const buttons = wrapper.findAll('button');
    const newBtn = buttons.find(b => b.text().includes('New'));
    expect(newBtn?.attributes('disabled')).toBeUndefined();
  });

  it('should show paired status', () => {
    const wrapper = mount(FooterBar, { props: { state: { paired: true, locked: false } } });
    expect(wrapper.text()).toContain('Paired');
  });

  it('should show locked status', () => {
    const wrapper = mount(FooterBar, { props: { state: { paired: true, locked: true } } });
    expect(wrapper.text()).toContain('Locked');
  });

  it('should show unpaired status', () => {
    const wrapper = mount(FooterBar, { props: { state: { paired: false, locked: false } } });
    expect(wrapper.text()).toContain('Not paired');
  });

  it('should emit new-login when New is clicked', async () => {
    const wrapper = mount(FooterBar, { props: { canWrite: true } });
    const buttons = wrapper.findAll('button');
    const newBtn = buttons.find(b => b.text().includes('New'));
    await newBtn?.trigger('click');
    expect(wrapper.emitted('new-login')).toBeTruthy();
  });

  it('should emit lock when Lock is clicked', async () => {
    const wrapper = mount(FooterBar, { props: { state: { paired: true, locked: false } } });
    const buttons = wrapper.findAll('button');
    const lockBtn = buttons.find(b => b.text().includes('Lock'));
    await lockBtn?.trigger('click');
    expect(wrapper.emitted('lock')).toBeTruthy();
  });

  it('should emit unlock when Unlock is clicked', async () => {
    const wrapper = mount(FooterBar, { props: { state: { paired: true, locked: true } } });
    const buttons = wrapper.findAll('button');
    const unlockBtn = buttons.find(b => b.text().includes('Unlock'));
    await unlockBtn?.trigger('click');
    expect(wrapper.emitted('unlock')).toBeTruthy();
  });

  it('should emit toggle-theme when Theme is clicked', async () => {
    const wrapper = mount(FooterBar);
    const buttons = wrapper.findAll('button');
    const themeBtn = buttons.find(b => b.text().includes('Theme'));
    await themeBtn?.trigger('click');
    expect(wrapper.emitted('toggle-theme')).toBeTruthy();
  });
});
