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
});
