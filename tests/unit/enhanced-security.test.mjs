// Enhanced Security Features Tests

describe('EnhancedSecurity', () => {
  
  beforeEach(() => {
    window.__kbbEnhancedSecurity.isLocked = false;
    window.__kbbEnhancedSecurity.lastActivityTime = Date.now();
  });

  describe('Biometric Authentication', () => {
    test('should check biometric availability', async () => {
      const available = await window.__kbbEnhancedSecurity.checkBiometricAvailability();
      expect(typeof available).toBe('boolean');
    });

    test('should report biometric status', () => {
      const status = window.__kbbEnhancedSecurity.biometricAvailable;
      expect(typeof status).toBe('boolean');
    });
  });

  describe('Lock/Unlock', () => {
    test('should lock extension', () => {
      window.__kbbEnhancedSecurity.lock();
      expect(window.__kbbEnhancedSecurity.isExtensionLocked()).toBe(true);
    });

    test('should unlock extension', () => {
      window.__kbbEnhancedSecurity.lock();
      window.__kbbEnhancedSecurity.unlock();
      expect(window.__kbbEnhancedSecurity.isExtensionLocked()).toBe(false);
    });

    test('should update last activity on unlock', () => {
      const oldTime = window.__kbbEnhancedSecurity.lastActivityTime;
      window.__kbbEnhancedSecurity.lock();
      window.__kbbEnhancedSecurity.unlock();
      expect(window.__kbbEnhancedSecurity.lastActivityTime).toBeGreaterThan(oldTime);
    });
  });

  describe('Activity Monitoring', () => {
    test('should record activity', () => {
      const oldTime = window.__kbbEnhancedSecurity.lastActivityTime;
      window.__kbbEnhancedSecurity.recordActivity();
      expect(window.__kbbEnhancedSecurity.lastActivityTime).toBeGreaterThanOrEqual(oldTime);
    });

    test('should unlock on activity when locked', () => {
      window.__kbbEnhancedSecurity.lock();
      window.__kbbEnhancedSecurity.recordActivity();
      expect(window.__kbbEnhancedSecurity.isExtensionLocked()).toBe(false);
    });
  });

  describe('Auto-lock Timeout', () => {
    test('should set auto-lock timeout', () => {
      window.__kbbEnhancedSecurity.setAutoLockTimeout(10);
      expect(window.__kbbEnhancedSecurity.autoLockTimeout).toBe(10 * 60 * 1000);
    });

    test('should trigger auto-lock after timeout', () => {
      window.__kbbEnhancedSecurity.setAutoLockTimeout(0.001); // 1 second for testing
      window.__kbbEnhancedSecurity.lastActivityTime = Date.now() - 2000;
      window.__kbbEnhancedSecurity.checkAutoLock();
      expect(window.__kbbEnhancedSecurity.isExtensionLocked()).toBe(true);
    });
  });
});

describe('SecureClipboard', () => {
  
  describe('Copy with Auto-clear', () => {
    test('should copy text to clipboard', async () => {
      const result = await window.__kbbSecureClipboard.copyWithAutoClear('test');
      expect(typeof result).toBe('boolean');
    });

    test('should set auto-clear timer', async () => {
      const initialSize = window.__kbbSecureClipboard.clipboardTimers.size;
      await window.__kbbSecureClipboard.copyWithAutoClear('test', 1000);
      expect(window.__kbbSecureClipboard.clipboardTimers.size).toBeGreaterThan(initialSize);
    });
  });

  describe('Clipboard Management', () => {
    test('should clear clipboard', async () => {
      const result = await window.__kbbSecureClipboard.clearClipboard();
      expect(typeof result).toBe('boolean');
    });

    test('should set default clear timeout', () => {
      window.__kbbSecureClipboard.setDefaultClearTimeout(60000);
      expect(window.__kbbSecureClipboard.defaultClearTimeout).toBe(60000);
    });
  });
});

describe('ScreenshotProtection', () => {
  
  test('should enable protection', () => {
    window.__kbbScreenshotProtection.enableProtection();
    expect(window.__kbbScreenshotProtection.isProtectionEnabled()).toBe(true);
  });

  test('should disable protection', () => {
    window.__kbbScreenshotProtection.enableProtection();
    window.__kbbScreenshotProtection.disableProtection();
    expect(window.__kbbScreenshotProtection.isProtectionEnabled()).toBe(false);
  });

  test('should prevent text selection when protected', () => {
    window.__kbbScreenshotProtection.enableProtection();
    expect(document.body.style.userSelect).toBe('none');
  });

  test('should restore text selection when unprotected', () => {
    window.__kbbScreenshotProtection.enableProtection();
    window.__kbbScreenshotProtection.disableProtection();
    expect(document.body.style.userSelect).toBe('auto');
  });
});
