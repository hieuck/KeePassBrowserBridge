import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import FilterBar from '../../extension/src/components/FilterBar.vue';

describe('FilterBar', () => {
  const mockGroups = [
    { id: 'all', label: 'All' },
    { id: '1', label: 'Social' },
    { id: '2', label: 'Finance', count: 12 },
    { id: '3', label: 'Work' },
    { id: '4', label: 'Personal' },
    { id: '5', label: 'Shopping' },
  ];

  it('should render initial groups up to 5', () => {
    const wrapper = mount(FilterBar, { props: { groups: mockGroups } });
    expect(wrapper.text()).toContain('All');
    expect(wrapper.text()).toContain('Social');
    expect(wrapper.text()).toContain('Finance');
    expect(wrapper.text()).toContain('Work');
    expect(wrapper.text()).toContain('Personal');
    expect(wrapper.text()).toContain('12');
  });

  it('should not render overflow when 5 or fewer groups', () => {
    const wrapper = mount(FilterBar, { props: { groups: mockGroups.slice(0, 5) } });
    expect(wrapper.find('.filter-bar__more').exists()).toBe(false);
  });

  it('should render overflow button when more than 5 groups', () => {
    const wrapper = mount(FilterBar, { props: { groups: mockGroups } });
    expect(wrapper.find('.filter-bar__more').exists()).toBe(true);
    expect(wrapper.find('.filter-bar__more').text()).toContain('+1');
  });

  it('should highlight active group chip', () => {
    const wrapper = mount(FilterBar, { props: { groups: mockGroups, modelValue: '2' } });
    const activeChip = wrapper.find('.filter-bar__chip--active');
    expect(activeChip.exists()).toBe(true);
    expect(activeChip.text()).toContain('Finance');
  });

  it('should emit update:modelValue on chip click', async () => {
    const wrapper = mount(FilterBar, { props: { groups: mockGroups } });
    const chips = wrapper.findAll('.filter-bar__chip');
    await chips[1].trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')[0]).toEqual(['1']);
  });

  it('should toggle overflow dropdown on click', async () => {
    const wrapper = mount(FilterBar, { props: { groups: mockGroups } });
    const more = wrapper.find('.filter-bar__more');
    expect(more.attributes('aria-expanded')).toBe('false');
    await more.trigger('click');
    const dropdown = wrapper.find('.filter-bar__dropdown');
    expect(dropdown.exists()).toBe(true);
    expect(wrapper.find('.filter-bar__more').attributes('aria-expanded')).toBe('true');
  });

  it('should close overflow dropdown after selecting', async () => {
    const wrapper = mount(FilterBar, { props: { groups: mockGroups } });
    await wrapper.find('.filter-bar__more').trigger('click');
    const dropdownChips = wrapper.findAll('.filter-bar__dropdown .filter-bar__chip');
    await dropdownChips[0].trigger('click');
    expect(wrapper.find('.filter-bar__dropdown').exists()).toBe(false);
  });
});
