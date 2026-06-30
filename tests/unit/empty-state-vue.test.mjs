import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EmptyState from '../../extension/src/popup/EmptyState.vue';

describe('EmptyState', () => {
  it('should render default empty state with no-logins message', () => {
    const wrapper = mount(EmptyState);
    expect(wrapper.text()).toContain('No logins yet');
    expect(wrapper.text()).toContain('Add your first login');
  });

  it('should render search variant with query', () => {
    const wrapper = mount(EmptyState, { props: { variant: 'search', query: 'test' } });
    expect(wrapper.text()).toContain('No results for "test"');
    expect(wrapper.text()).toContain('Try a different search term');
  });

  it('should render filter variant without action button', () => {
    const wrapper = mount(EmptyState, { props: { variant: 'filter' } });
    expect(wrapper.text()).toContain('No matches in this group');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('should render unpaired variant', () => {
    const wrapper = mount(EmptyState, { props: { variant: 'unpaired' } });
    expect(wrapper.text()).toContain('KeePass is not connected');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('should render locked variant', () => {
    const wrapper = mount(EmptyState, { props: { variant: 'locked' } });
    expect(wrapper.text()).toContain('KeePass is locked');
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('should emit action when action button is clicked', async () => {
    const wrapper = mount(EmptyState, { props: { variant: 'empty' } });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('action')).toBeTruthy();
    expect(wrapper.emitted('action').length).toBe(1);
  });

  it('should not display description for filter variant', () => {
    const wrapper = mount(EmptyState, { props: { variant: 'filter' } });
    const desc = wrapper.find('.empty-state__description');
    expect(desc.exists()).toBe(true);
    expect(desc.text()).toContain('Select a different group');
  });
});
