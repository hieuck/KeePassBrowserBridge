import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CredentialCard from '../../extension/src/popup/CredentialCard.vue';

const mockEntry = {
  Title: 'Example Site',
  UserName: 'user@example.com',
  Password: 'secret123',
  Url: 'https://example.com',
  UsageCount: 5,
  LastUsed: Date.now() - 86400000,
  Group: 'Root',
  CustomFields: [],
};

const mockEntryNoUser = {
  Title: 'No User',
  Password: 'secret',
  Url: '',
};

describe('CredentialCard', () => {
  it('should render entry title and username', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.text()).toContain('Example Site');
    expect(wrapper.text()).toContain('user@example.com');
  });

  it('should show (Untitled) for entries without title', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: { UserName: 'test', Password: 'pass' } },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.text()).toContain('(Untitled)');
  });

  it('should not show username when not provided', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntryNoUser },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.find('.credential-card__subtitle').exists()).toBe(false);
  });

  it('should show usage count', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.text()).toContain('5x');
  });

  it('should have aria-expanded false by default', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.attributes('aria-expanded')).toBe('false');
  });

  it('should toggle expanded state on click', async () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    await wrapper.trigger('click');
    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')[0]).toEqual([mockEntry]);
  });

  it('should emit copy username on copy button click', async () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    const copyBtns = wrapper.findAll('.credential-card__icon-btn');
    const copyUserBtn = copyBtns.find(b => b.attributes('aria-label') === 'Copy username');
    await copyUserBtn?.trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
    expect(wrapper.emitted('copy')[0]).toEqual(['username', 'user@example.com']);
  });

  it('should emit copy password on copy password button click', async () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    const copyBtns = wrapper.findAll('.credential-card__icon-btn');
    const copyPassBtn = copyBtns.find(b => b.attributes('aria-label') === 'Copy password');
    await copyPassBtn?.trigger('click');
    expect(wrapper.emitted('copy')).toBeTruthy();
    expect(wrapper.emitted('copy')[0]).toEqual(['password', 'secret123']);
  });

  it('should show quick actions when not expanded', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.find('.credential-card__quick-actions').exists()).toBe(true);
  });

  it('should show edit button when canEdit is true and expanded', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry, expanded: true, canEdit: true },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.text()).toContain('Edit');
  });

  it('should not show edit button when canEdit is false and expanded', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry, expanded: true, canEdit: false },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.find('.credential-card__edit-btn').exists()).toBe(false);
  });

  it('should emit edit when edit button is clicked', async () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry, expanded: true, canEdit: true },
      global: { stubs: { DetailView: true } },
    });
    await wrapper.find('.credential-card__edit-btn').trigger('click');
    expect(wrapper.emitted('edit')).toBeTruthy();
    expect(wrapper.emitted('edit')[0]).toEqual([mockEntry]);
  });

  it('should show initials when entry has no URL', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: { Title: 'No Url', UserName: 'user', Password: 'pass' } },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.text()).toContain('N');
    expect(wrapper.find('.credential-card__favicon').exists()).toBe(false);
  });

  it('should hide meta section when entry has no group or url', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: { Title: 'No Meta', UserName: 'user', Password: 'pass' } },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.find('.credential-card__meta').exists()).toBe(false);
  });

  it('should not emit toggle when clicking a button inside the card', async () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    await wrapper.find('.credential-card__icon-btn').trigger('click');
    expect(wrapper.emitted('toggle')).toBeFalsy();
  });

  it('should emit toggle on Enter key', async () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    await wrapper.trigger('keydown.enter');
    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')[0]).toEqual([mockEntry]);
  });

  it('should emit toggle on Space key', async () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry },
      global: { stubs: { DetailView: true } },
    });
    await wrapper.trigger('keydown.space');
    expect(wrapper.emitted('toggle')).toBeTruthy();
    expect(wrapper.emitted('toggle')[0]).toEqual([mockEntry]);
  });

  it('should render expanded detail view', () => {
    const wrapper = mount(CredentialCard, {
      props: { entry: mockEntry, expanded: true },
      global: { stubs: { DetailView: true } },
    });
    expect(wrapper.find('.credential-card__detail').exists()).toBe(true);
    expect(wrapper.find('.credential-card__quick-actions').exists()).toBe(false);
  });
});
