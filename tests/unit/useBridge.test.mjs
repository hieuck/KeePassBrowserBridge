import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useBridge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    chrome.runtime.lastError = undefined;
    chrome.runtime.sendMessage.mockReset();
  });

  it('should return an object with bridge methods', async () => {
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    expect(bridge).toBeDefined();
    expect(typeof bridge.call).toBe('function');
    expect(typeof bridge.queryLogins).toBe('function');
    expect(typeof bridge.queryForUrl).toBe('function');
    expect(typeof bridge.getState).toBe('function');
    expect(typeof bridge.hello).toBe('function');
    expect(typeof bridge.setLocked).toBe('function');
    expect(typeof bridge.pairBegin).toBe('function');
    expect(typeof bridge.pairComplete).toBe('function');
    expect(typeof bridge.listClients).toBe('function');
  });

  it('should resolve on successful chrome.runtime.sendMessage', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: true, response: { id: '123' } });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    const result = await bridge.queryLogins();
    expect(result).toEqual({ id: '123' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_QUERY_LOGINS' },
      expect.any(Function),
    );
  });

  it('should reject on chrome.runtime.lastError', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      chrome.runtime.lastError = { message: 'Connection failed' };
      cb();
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    await expect(bridge.queryLogins()).rejects.toThrow('Connection failed');
  });

  it('should reject on error response', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: false, error: 'Permission denied' });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    await expect(bridge.pairBegin()).rejects.toThrow('Permission denied');
  });

  it('should reject when chrome.runtime is unavailable', async () => {
    const orig = global.chrome.runtime;
    delete global.chrome.runtime;
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    await expect(bridge.hello()).rejects.toThrow('chrome.runtime not available');
    global.chrome.runtime = orig;
  });

  it('should pass payload to chrome.runtime.sendMessage', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: true, response: null });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    await bridge.setLocked(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_SET_LOCKED', locked: true },
      expect.any(Function),
    );
  });

  it('should pass clientId to revokeClient', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: true, response: null });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    await bridge.revokeClient('client-1');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_REVOKE_CLIENT', clientId: 'client-1' },
      expect.any(Function),
    );
  });

  it('should pass url to queryForUrl', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: true, response: [] });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    await bridge.queryForUrl('https://example.com');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_QUERY_FOR_URL', url: 'https://example.com' },
      expect.any(Function),
    );
  });

  it('should call getState, getAbout, and hello with correct types', async () => {
    chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      cb({ ok: true, response: msg.type });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    expect(await bridge.getState()).toBe('KBB_GET_STATE');
    expect(await bridge.getAbout()).toBe('KBB_GET_ABOUT');
    expect(await bridge.hello()).toBe('KBB_HELLO');
  });

  it('should pass enabled to setAutoFill and setAutoSubmit', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: true, response: null });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    await bridge.setAutoFill(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_SET_AUTO_FILL', enabled: true },
      expect.any(Function),
    );
    await bridge.setAutoSubmit(false);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_SET_AUTO_SUBMIT', enabled: false },
      expect.any(Function),
    );
  });

  it('should pass login payload to createLogin and updateLogin', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: true, response: null });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    const login = { name: 'Example', username: 'user@example.com' };
    await bridge.createLogin(login);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_CREATE_LOGIN', login },
      expect.any(Function),
    );
    await bridge.updateLogin(login);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_UPDATE_LOGIN', login },
      expect.any(Function),
    );
  });

  it('should pass credential and role to fillLogin', async () => {
    chrome.runtime.sendMessage.mockImplementation((_msg, cb) => {
      cb({ ok: true, response: null });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    const credential = { name: 'Example' };
    await bridge.fillLogin(credential, 'username', 'custom-field');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_FILL_LOGIN', credential, fieldRole: 'username', customFieldName: 'custom-field' },
      expect.any(Function),
    );
  });

  it('should call pairCancel, listClients, and setPasskeysEnabled', async () => {
    chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      cb({ ok: true, response: msg.type });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    expect(await bridge.pairCancel()).toBe('KBB_PAIR_CANCEL');
    expect(await bridge.listClients()).toBe('KBB_LIST_CLIENTS');
    await bridge.setPasskeysEnabled(true);
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_SET_PASSKEYS_ENABLED', enabled: true },
      expect.any(Function),
    );
  });

  it('should call lockDatabase, listGroups, getDatabaseInfo, and performAutoType', async () => {
    chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
      cb({ ok: true, response: msg.type });
    });
    const { useBridge } = await import('../../extension/src/composables/useBridge.js');
    const bridge = useBridge();
    expect(await bridge.lockDatabase()).toBe('KBB_LOCK_DATABASE');
    expect(await bridge.listGroups()).toBe('KBB_LIST_GROUPS');
    expect(await bridge.getDatabaseInfo()).toBe('KBB_GET_DATABASE_INFO');
    expect(await bridge.performAutoType('search-term')).toBe('KBB_AUTOTYPE');
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { type: 'KBB_AUTOTYPE', search: 'search-term' },
      expect.any(Function),
    );
  });
});
