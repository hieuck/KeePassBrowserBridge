import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PasswordGenerator from '../../extension/src/popup/PasswordGenerator.vue';

describe('PasswordGenerator', () => {
  it('should render a generated password', () => {
    const wrapper = mount(PasswordGenerator);
    const input = wrapper.find('.generator__input');
    expect(input.element.value.length).toBeGreaterThanOrEqual(8);
  });

  it('should render controls: length slider, symbol toggle, ambiguous toggle', () => {
    const wrapper = mount(PasswordGenerator);
    expect(wrapper.find('.generator__slider').exists()).toBe(true);
    expect(wrapper.text()).toContain('Include symbols');
    expect(wrapper.text()).toContain('Exclude ambiguous');
  });

  it('should generate new password on refresh', async () => {
    const wrapper = mount(PasswordGenerator);
    const input = wrapper.find('.generator__input');
    const firstValue = input.element.value;
    await wrapper.find('.generator__refresh-btn').trigger('click');
    const secondValue = wrapper.find('.generator__input').element.value;
    expect(secondValue).not.toBe(firstValue);
  });

  it('should emit close on close button click', async () => {
    const wrapper = mount(PasswordGenerator);
    await wrapper.find('.generator__close-btn').trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should emit select with password on copy', async () => {
    const writeText = vi.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    const wrapper = mount(PasswordGenerator);
    await wrapper.find('.generator__copy-btn').trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0][0].length).toBeGreaterThanOrEqual(8);
  });

  it('should reflect slider changes', async () => {
    const wrapper = mount(PasswordGenerator);
    const slider = wrapper.find('.generator__slider');
    await slider.setValue(32);
    expect(wrapper.text()).toContain('32');
    await wrapper.find('.generator__refresh-btn').trigger('click');
    const pwLen = wrapper.find('.generator__input').element.value.length;
    expect(pwLen).toBe(32);
  });

  it('should handle copy failure gracefully', async () => {
    const writeText = vi.fn(() => Promise.reject(new Error('copy failed')));
    Object.assign(navigator, { clipboard: { writeText } });
    const wrapper = mount(PasswordGenerator);
    await wrapper.find('.generator__copy-btn').trigger('click');
    await new Promise(r => setTimeout(r, 10));
    expect(wrapper.emitted('select')).toBeFalsy();
  });

  it('should select input text on focus', async () => {
    const wrapper = mount(PasswordGenerator);
    const input = wrapper.find('.generator__input');
    const select = vi.spyOn(input.element, 'select');
    await input.trigger('focus');
    expect(select).toHaveBeenCalled();
  });
});
