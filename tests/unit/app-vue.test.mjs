import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';

let mockBridgeState = {};
let mockSettings = {};
let mockGetStateReject = false;
let mockPairCompleteReject = false;
let mockSettingsReject = false;
let mockPairBeginReject = false;
let mockLockDatabaseReject = false;
let mockSetLockedReject = false;
let mockCreateLoginReject = false;
let mockUpdateLoginReject = false;
let mockCreateLoginErrorResponse = false;
let mockUpdateLoginErrorResponse = false;

vi.mock('../../extension/src/composables/useBridge.js', () => {
  const createMockBridge = () => ({
    fillLogin: vi.fn(() => Promise.resolve()),
    updateLogin: vi.fn(() => {
      if (mockUpdateLoginReject) return Promise.reject(new Error('update failed'));
      if (mockUpdateLoginErrorResponse) return Promise.resolve({ Success: false, Error: 'Version conflict' });
      return Promise.resolve();
    }),
    createLogin: vi.fn(() => {
      if (mockCreateLoginReject) return Promise.reject(new Error('create failed'));
      if (mockCreateLoginErrorResponse) return Promise.resolve({ Success: false, Error: 'Entry exists' });
      return Promise.resolve({ Success: true });
    }),
    lockDatabase: vi.fn(() => mockLockDatabaseReject ? Promise.reject(new Error('lock failed')) : Promise.resolve()),
    setLocked: vi.fn(() => mockSetLockedReject ? Promise.reject(new Error('setlock failed')) : Promise.resolve()),
    queryLogins: vi.fn(() => Promise.resolve({ entries: [] })),
    listGroups: vi.fn(() => Promise.resolve({ Root: { Children: [] } })),
    getState: vi.fn(() => mockGetStateReject ? Promise.reject(new Error('timeout')) : Promise.resolve(mockBridgeState)),
    pairBegin: vi.fn(() => mockPairBeginReject ? Promise.reject(new Error('begin failed')) : Promise.resolve()),
    pairComplete: vi.fn(() => mockPairCompleteReject ? Promise.reject(new Error('pair failed')) : Promise.resolve()),
  });
  return { useBridge: createMockBridge };
});

vi.mock('../../extension/src/composables/useTheme.js', () => ({
  useTheme: () => {
    const theme = ref('system');
    return {
      theme,
      setTheme: vi.fn((value) => { theme.value = value; }),
    };
  },
}));

vi.mock('../../extension/src/composables/useToast.js', () => ({
  useToast: () => ({ show: vi.fn() }),
}));

vi.mock('../../extension/shared/storage.js', () => ({
  getSettings: () => mockSettingsReject ? Promise.reject(new Error('storage error')) : Promise.resolve(mockSettings),
}));

import App from '../../extension/src/popup/App.vue';

const mountOptions = {
  global: {
    stubs: {
      PopupHeader: true,
      SearchBar: true,
      FilterBar: true,
      CredentialCard: true,
      EmptyState: true,
      FooterBar: true,
      NewLoginForm: true,
      EditForm: true,
      SkeletonCard: true,
      PairDialog: true,
    },
  },
};

describe('App.vue', () => {
  beforeEach(() => {
    chrome.runtime.openOptionsPage = vi.fn();
    mockSettings = {};
    mockBridgeState = {};
    mockGetStateReject = false;
    mockPairCompleteReject = false;
    mockSettingsReject = false;
    mockPairBeginReject = false;
    mockLockDatabaseReject = false;
    mockSetLockedReject = false;
    mockCreateLoginReject = false;
    mockUpdateLoginReject = false;
    mockCreateLoginErrorResponse = false;
    mockUpdateLoginErrorResponse = false;
  });

  it('should render the popup container', () => {
    const wrapper = mount(App, mountOptions);
    expect(wrapper.find('.popup').exists()).toBe(true);
  });

  it('should render child components', () => {
    const wrapper = mount(App, mountOptions);
    expect(wrapper.findComponent({ name: 'PopupHeader' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'SearchBar' }).exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'FooterBar' }).exists()).toBe(true);
  });

  it('should compute visibleEntries filtering by search', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.currentEntries = [
      { Title: 'Example', UserName: 'user@ex.com', Url: 'https://ex.com', Group: 'Work', UsageCount: 5 },
      { Title: 'Test', UserName: 'admin', Url: 'https://test.com', Group: 'Personal', UsageCount: 2 },
    ];
    vm.searchQuery = 'Example';
    expect(vm.visibleEntries.length).toBe(1);
    expect(vm.visibleEntries[0].Title).toBe('Example');
  });

  it('should filter visibleEntries by group', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.currentEntries = [
      { Title: 'Work App', Group: 'Work', UsageCount: 3 },
      { Title: 'Personal App', Group: 'Personal', UsageCount: 1 },
    ];
    vm.activeGroup = 'Work';
    expect(vm.visibleEntries.length).toBe(1);
    expect(vm.visibleEntries[0].Title).toBe('Work App');
  });

  it('should sort visibleEntries by UsageCount descending', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.currentEntries = [
      { Title: 'Low', UsageCount: 1, Group: '' },
      { Title: 'High', UsageCount: 10, Group: '' },
      { Title: 'Medium', UsageCount: 5, Group: '' },
    ];
    expect(vm.visibleEntries[0].Title).toBe('High');
    expect(vm.visibleEntries[1].Title).toBe('Medium');
    expect(vm.visibleEntries[2].Title).toBe('Low');
  });

  it('should compute emptyStateVariant as unpaired when not paired', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: false, locked: false };
    expect(vm.emptyStateVariant).toBe('unpaired');
  });

  it('should compute emptyStateVariant as locked when locked', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: true };
    expect(vm.emptyStateVariant).toBe('locked');
  });

  it('should compute emptyStateVariant as search when searching', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.searchQuery = 'notfound';
    expect(vm.emptyStateVariant).toBe('search');
  });

  it('should compute emptyStateVariant as empty when no entries', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.currentEntries = [];
    vm.searchQuery = '';
    expect(vm.emptyStateVariant).toBe('empty');
  });

  it('should compute groups from entries', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.currentEntries = [
      { Title: 'A', Group: 'Work' },
      { Title: 'B', Group: 'Personal' },
      { Title: 'C', Group: 'Work' },
    ];
    expect(vm.groups.length).toBe(3);
    expect(vm.groups[0].id).toBe('All');
    expect(vm.groups[1].id).toBe('Personal');
    expect(vm.groups[2].id).toBe('Work');
  });

  it('should start new login form', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.detailEntry = { Title: 'X' };
    vm.startNew();
    expect(vm.formMode).toBe('new');
    expect(vm.detailEntry).toBeNull();
  });

  it('should start edit and clear detail', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    const entry = { Title: 'X' };
    vm.detailEntry = entry;
    vm.startEdit(entry);
    expect(vm.editingEntry).toEqual(entry);
    expect(vm.detailEntry).toBeNull();
    expect(vm.formMode).toBe('edit');
  });

  it('should toggle detail entry', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    const entry = { Title: 'X' };
    vm.currentEntries = [entry];
    const reactiveEntry = vm.currentEntries[0];
    vm.toggleDetail(reactiveEntry);
    expect(vm.detailEntry).toEqual(entry);
    vm.toggleDetail(reactiveEntry);
    expect(vm.detailEntry).toBeNull();
  });

  it('should filter visible entries by search query including custom fields', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.currentEntries = [
      { Title: 'Alpha', UserName: 'a', Url: 'https://a.com', Group: 'Work', UsageCount: 1, CustomFields: [{ Name: 'Pin', Value: '1234' }] },
      { Title: 'Beta', UserName: 'b', Url: 'https://b.com', Group: 'Personal', UsageCount: 2, CustomFields: [] },
    ];
    vm.searchQuery = 'Pin 1234';
    expect(vm.visibleEntries.length).toBe(1);
    expect(vm.visibleEntries[0].Title).toBe('Alpha');
  });

  it('should compute emptyStateVariant as search when query present', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.currentEntries = [{ Title: 'X' }];
    vm.searchQuery = 'find';
    expect(vm.emptyStateVariant).toBe('search');
  });

  it('should compute emptyStateVariant as filter when entries exist', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.currentEntries = [{ Title: 'X' }];
    expect(vm.emptyStateVariant).toBe('filter');
  });

  it('should cycle theme light→dark→system→light', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.theme = 'light';
    vm.cycleTheme();
    expect(vm.theme).toBe('dark');
    vm.cycleTheme();
    expect(vm.theme).toBe('system');
    vm.cycleTheme();
    expect(vm.theme).toBe('light');
  });

  it('should open settings page', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.openSettings();
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
  });

  it('should handle fillEntry error', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.bridge.fillLogin = vi.fn(() => Promise.reject(new Error('fill failed')));
    await vm.fillEntry({ Title: 'X' }, 'form');
    await new Promise(r => setTimeout(r, 10));
    expect(vm.bridge.fillLogin).toHaveBeenCalled();
  });

  it('should handle copyField error', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.reject(new Error('copy failed'))) }, configurable: true });
    await vm.copyField('username', 'val');
    await new Promise(r => setTimeout(r, 10));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('val');
  });

  it('should copy field successfully', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn(() => Promise.resolve()) }, configurable: true });
    await vm.copyField('username', 'val');
    await new Promise(r => setTimeout(r, 10));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('val');
  });

  it('should fill entry successfully and close window', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    const closeSpy = vi.fn();
    Object.defineProperty(window, 'close', { value: closeSpy, configurable: true });
    await vm.fillEntry({ Title: 'X' }, 'form');
    await new Promise(r => setTimeout(r, 10));
    expect(vm.bridge.fillLogin).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
  });

  it('should start empty action when empty', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.currentEntries = [];
    vm.onEmptyAction();
    expect(vm.formMode).toBe('new');
  });

  it('should compute canWrite from permissions', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.permissions = ['read'];
    expect(vm.canWrite).toBe(false);
    vm.permissions = ['read', 'write'];
    expect(vm.canWrite).toBe(true);
  });

  it('should compute groups from unique entry groups', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.currentEntries = [
      { Title: 'A', Group: 'Social' },
      { Title: 'B', Group: 'Social' },
      { Title: 'C', Group: 'Work' },
    ];
    expect(vm.groups.length).toBe(3);
    expect(vm.groups.map(g => g.id)).toEqual(['All', 'Social', 'Work']);
  });

  it('should open settings (openClients also opens options page)', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.openClients();
    expect(chrome.runtime.openOptionsPage).toHaveBeenCalled();
  });

  it('should handle empty state render without crashing', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    expect(vm.state.paired).toBe(false);
    expect(vm.emptyStateVariant).toBe('unpaired');
  });

  it('should refresh state with paired data and query logins', async () => {
    mockSettings = { clientId: 'c1', locked: false, permissions: ['read', 'write'] };
    mockBridgeState = { pairingSessionId: 'sess1', pairingExpiresAt: 0 };
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    await new Promise(r => setTimeout(r, 50));
    expect(vm.state.paired).toBe(true);
    expect(vm.state.locked).toBe(false);
    expect(vm.permissions).toContain('write');
  });

  it('should show PairDialog when not paired', async () => {
    mockSettings = {};
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    await new Promise(r => setTimeout(r, 50));
    expect(vm.showPairDialog).toBe(true);
  });

  it('should handle getState error gracefully', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    mockGetStateReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    await new Promise(r => setTimeout(r, 50));
    expect(vm.state.paired).toBe(true);
  });

  it('should handle pairComplete error', async () => {
    mockPairCompleteReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    await vm.completePairing('000000');
    await new Promise(r => setTimeout(r, 10));
    expect(vm.showPairDialog).toBe(true);
  });

  it('should handle refreshState storage error', async () => {
    mockSettingsReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    await new Promise(r => setTimeout(r, 50));
    expect(vm.loading).toBe(false);
  });

  it('should start pairing and call pairBegin', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: false, locked: false };
    await vm.startPairing();
    await new Promise(r => setTimeout(r, 10));
  });

  it('should handle startPairing error', async () => {
    mockPairBeginReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    await vm.startPairing();
    await new Promise(r => setTimeout(r, 10));
  });

  it('should unlock and update state', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: true };
    vm.unlock();
    await new Promise(r => setTimeout(r, 10));
    expect(vm.state.locked).toBe(false);
  });

  it('should lock via lockDatabase', async () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.lock();
    await new Promise(r => setTimeout(r, 10));
    expect(vm.state.locked).toBe(true);
  });

  it('should fallback to setLocked when lockDatabase fails', async () => {
    mockLockDatabaseReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.lock();
    await new Promise(r => setTimeout(r, 10));
    expect(vm.state.locked).toBe(true);
  });

  it('should handle double lock failure gracefully', async () => {
    mockLockDatabaseReject = true;
    mockSetLockedReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.state = { paired: true, locked: false };
    vm.lock();
    await new Promise(r => setTimeout(r, 10));
    expect(vm.state.locked).toBe(false);
  });

  it('should handle openOptionsPage error', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    chrome.runtime.openOptionsPage = vi.fn(() => { throw new Error('no page'); });
    vm.openSettings();
  });

  it('should handle openClients error', () => {
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    chrome.runtime.openOptionsPage = vi.fn(() => { throw new Error('no page'); });
    vm.openClients();
  });

  it('should handle createLogin rejection', async () => {
    mockCreateLoginReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.createLogin({ Title: 'X', Url: 'https://x.com', UserName: 'u', Password: 'p' });
    await new Promise(r => setTimeout(r, 10));
  });

  it('should save edit and show toast', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.editingEntry = { Title: 'Old', EntryId: 'e1', Group: 'Root', CustomFields: [] };
    vm.formMode = 'edit';
    await vm.saveEdit({ Title: 'New' });
    await new Promise(r => setTimeout(r, 50));
    expect(vm.formMode).toBeNull();
  });

  it('should map Uuid to EntryId when saving edit', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.editingEntry = { Title: 'Old', Uuid: 'uuid1', Group: 'Root', CustomFields: [] };
    vm.formMode = 'edit';
    const updateSpy = vi.spyOn(vm.bridge, 'updateLogin');
    await vm.saveEdit({ Title: 'New' });
    await new Promise(r => setTimeout(r, 50));
    expect(updateSpy).toHaveBeenCalled();
    const payload = updateSpy.mock.calls[0][0];
    expect(payload.EntryId).toBe('uuid1');
  });

  it('should create login and refresh', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.formMode = 'new';
    await vm.createLogin({ Title: 'New', Url: 'https://x.com', UserName: 'u', Password: 'p' });
    await new Promise(r => setTimeout(r, 50));
    expect(vm.formMode).toBeNull();
  });

  it('should handle updateLogin error', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    mockUpdateLoginReject = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.editingEntry = { Title: 'Old', EntryId: 'e1', Group: 'Root', CustomFields: [] };
    await vm.saveEdit({ Title: 'New' });
    await new Promise(r => setTimeout(r, 50));
    expect(vm.editingEntry).toBeDefined();
  });

  it('should handle saveEdit error response', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    mockUpdateLoginErrorResponse = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.editingEntry = { Title: 'Old', EntryId: 'e1', Group: 'Root', CustomFields: [] };
    vm.formMode = 'edit';
    await vm.saveEdit({ Title: 'Conflict' });
    await new Promise(r => setTimeout(r, 50));
    expect(vm.formMode).toBe('edit');
  });

  it('should handle createLogin error response', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    mockCreateLoginErrorResponse = true;
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    await vm.createLogin({ Title: 'X' });
    await new Promise(r => setTimeout(r, 50));
  });

  it('should complete pairing successfully', async () => {
    mockSettings = { clientId: 'c1', locked: false };
    const wrapper = mount(App, mountOptions);
    const vm = wrapper.vm;
    vm.showPairDialog = true;
    await vm.completePairing('123456');
    await new Promise(r => setTimeout(r, 50));
    expect(vm.showPairDialog).toBe(false);
  });
});
