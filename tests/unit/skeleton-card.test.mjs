import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import SkeletonCard from '../../extension/src/popup/SkeletonCard.vue';

describe('SkeletonCard', () => {
  it('should render the skeleton card container', () => {
    const wrapper = mount(SkeletonCard);
    expect(wrapper.find('.skeleton-card').exists()).toBe(true);
  });

  it('should have aria-hidden true', () => {
    const wrapper = mount(SkeletonCard);
    expect(wrapper.attributes('aria-hidden')).toBe('true');
  });

  it('should render avatar skeleton', () => {
    const wrapper = mount(SkeletonCard);
    expect(wrapper.find('.skeleton-card__avatar').exists()).toBe(true);
  });

  it('should render title and subtitle skeleton lines', () => {
    const wrapper = mount(SkeletonCard);
    expect(wrapper.find('.skeleton-card__line--title').exists()).toBe(true);
    expect(wrapper.find('.skeleton-card__line--subtitle').exists()).toBe(true);
  });
});
