import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SearchBar from '../../extension/src/popup/SearchBar.vue';

describe('SearchBar', () => {
  it('should render with default placeholder', () => {
    const wrapper = mount(SearchBar);
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Search...');
  });

  it('should render with custom placeholder', () => {
    const wrapper = mount(SearchBar, { props: { placeholder: 'Find entries...' } });
    const input = wrapper.find('input');
    expect(input.attributes('placeholder')).toBe('Find entries...');
  });

  it('should bind modelValue to input value', () => {
    const wrapper = mount(SearchBar, { props: { modelValue: 'hello' } });
    const input = wrapper.find('input');
    expect(input.element.value).toBe('hello');
  });

  it('should emit update:modelValue on input change', async () => {
    const wrapper = mount(SearchBar, { props: { modelValue: '' } });
    const input = wrapper.find('input');
    await input.setValue('test');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['test']);
  });

  it('should show clear button when value is present', () => {
    const wrapper = mount(SearchBar, { props: { modelValue: 'searching' } });
    expect(wrapper.find('.search-bar__clear').exists()).toBe(true);
  });

  it('should hide clear button when value is empty', () => {
    const wrapper = mount(SearchBar, { props: { modelValue: '' } });
    expect(wrapper.find('.search-bar__clear').exists()).toBe(false);
  });

  it('should clear value when clear button is clicked', async () => {
    const wrapper = mount(SearchBar, { props: { modelValue: 'text' } });
    await wrapper.find('.search-bar__clear').trigger('click');
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['']);
  });
});
