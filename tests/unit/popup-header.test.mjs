import { describe, it, expect, beforeAll } from 'vitest';
import { mount } from '@vue/test-utils';
import PopupHeader from '../../extension/src/popup/PopupHeader.vue';

describe('PopupHeader', () => {
  let wrapper;
  beforeAll(() => {
    wrapper = mount(PopupHeader);
  });

  it('should render the KeePass Bridge title', () => {
    expect(wrapper.text()).toContain('KeePass Bridge');
  });

  it('should render a header element', () => {
    expect(wrapper.find('header').exists()).toBe(true);
  });

  it('should have the popup-header class', () => {
    expect(wrapper.classes()).toContain('popup-header');
  });
});
