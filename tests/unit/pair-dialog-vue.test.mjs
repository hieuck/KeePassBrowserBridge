import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import PairDialog from '../../extension/src/popup/PairDialog.vue';

describe('PairDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should show start pairing when not active', () => {
    const wrapper = mount(PairDialog);
    expect(wrapper.text()).toContain('Start Pairing');
    expect(wrapper.text()).not.toContain('Complete Pairing');
  });

  it('should show code input when pairing is active', () => {
    const wrapper = mount(PairDialog, { props: { pairingActive: true } });
    expect(wrapper.text()).toContain('Complete Pairing');
    expect(wrapper.find('.pair-input').exists()).toBe(true);
  });

  it('should disable complete button when code is less than 6 digits', () => {
    const wrapper = mount(PairDialog, { props: { pairingActive: true } });
    const completeBtn = wrapper.find('.pair-btn--primary');
    expect(completeBtn.attributes('disabled')).toBeDefined();
  });

  it('should enable complete button when code is 6 digits', async () => {
    const wrapper = mount(PairDialog, { props: { pairingActive: true } });
    const input = wrapper.find('.pair-input');
    await input.setValue('123456');
    const completeBtn = wrapper.find('.pair-btn--primary');
    expect(completeBtn.attributes('disabled')).toBeUndefined();
  });

  it('should emit pair-begin on start button click', async () => {
    const wrapper = mount(PairDialog);
    await wrapper.find('.pair-btn--primary').trigger('click');
    expect(wrapper.emitted('pair-begin')).toBeTruthy();
  });

  it('should emit pair-complete with code on submit', async () => {
    const wrapper = mount(PairDialog, { props: { pairingActive: true } });
    const input = wrapper.find('.pair-input');
    await input.setValue('654321');
    await wrapper.find('.pair-btn--primary').trigger('click');
    expect(wrapper.emitted('pair-complete')).toBeTruthy();
    expect(wrapper.emitted('pair-complete')[0]).toEqual(['654321']);
  });

  it('should emit close on cancel button click', async () => {
    const wrapper = mount(PairDialog);
    const buttons = wrapper.findAll('.pair-btn');
    const cancelBtn = buttons.find(b => b.text().includes('Cancel'));
    await cancelBtn.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should not pair-complete with short code', async () => {
    const wrapper = mount(PairDialog, { props: { pairingActive: true } });
    const input = wrapper.find('.pair-input');
    await input.setValue('123');
    await wrapper.find('.pair-btn--primary').trigger('click');
    expect(wrapper.emitted('pair-complete')).toBeFalsy();
  });

  it('should show expiry time when expiresAt is provided', () => {
    const future = Date.now() + 120000;
    const wrapper = mount(PairDialog, { props: { pairingActive: true, expiresAt: future } });
    expect(wrapper.text()).toContain('Expires in');
  });

  it('should submit code on Enter key', async () => {
    const wrapper = mount(PairDialog, { props: { pairingActive: true } });
    const input = wrapper.find('.pair-input');
    await input.setValue('654321');
    await input.trigger('keyup.enter');
    expect(wrapper.emitted('pair-complete')).toBeTruthy();
    expect(wrapper.emitted('pair-complete')[0]).toEqual(['654321']);
  });

  it('should start pairing timer updates when expiresAt changes', async () => {
    const wrapper = mount(PairDialog, { props: { pairingActive: true } });
    expect(wrapper.find('.pair-expiry').exists()).toBe(false);
    const future = Date.now() + 120000;
    await wrapper.setProps({ expiresAt: future });
    expect(wrapper.find('.pair-expiry').exists()).toBe(true);
  });

  it('should show 0 seconds when expired', async () => {
    const past = Date.now() - 1000;
    const wrapper = mount(PairDialog, { props: { pairingActive: true, expiresAt: past } });
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Expires in 0 seconds');
  });
});
