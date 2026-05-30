// tests/setup.js
// Global test setup for Vitest

import { vi } from 'vitest';

// Mock chrome API
global.chrome = {
  runtime: {
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  contextMenus: {
    create: vi.fn(),
    onClicked: {
      addListener: vi.fn(),
    },
  },
};

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
    readText: vi.fn(() => Promise.resolve('')),
  },
});

// Mock PublicKeyCredential for biometric tests
global.PublicKeyCredential = {
  isUserVerifyingPlatformAuthenticatorAvailable: vi.fn(() => Promise.resolve(true)),
};

// Setup DOM environment
document.body.innerHTML = '';

await import('../extension/groupOrganization.js');
await import('../extension/multiDatabase.js');
await import('../extension/multiPageLogin.js');
await import('../extension/enhancedSecurity_part1.js');
await import('../extension/enhancedSecurity_part2.js');
