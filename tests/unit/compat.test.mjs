import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = (() => {
  try { return fileURLToPath(import.meta.url); }
  catch { return path.join(process.cwd(), 'tests', 'unit', 'compat.test.mjs'); }
})();
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const compatSource = fs.readFileSync(path.join(projectRoot, 'extension', 'compat.js'), 'utf8');

describe('compat.js - detectBrowser', () => {
  it('should detect chrome from user agent containing Chrome', () => {
    assert.ok(compatSource.includes("return 'chrome'"), 'Chrome detection branch missing');
    assert.ok(compatSource.indexOf('Chrome') < compatSource.indexOf('Brave'),
      'Chrome check should come BEFORE Brave check in UA matching order');
  });

  it('should detect firefox from user agent containing Firefox', () => {
    assert.ok(compatSource.includes("return 'firefox'"), 'Firefox detection branch missing');
    // Check that UA-based detection checks start with Edge, then Firefox, then Chrome
    const edgeCheck = compatSource.indexOf("ua.indexOf('Edg')");
    const firefoxCheck = compatSource.indexOf("ua.indexOf('Firefox')");
    const chromeCheck = compatSource.indexOf("ua.indexOf('Chrome')");
    assert.ok(edgeCheck >= 0, 'Edge UA check not found');
    assert.ok(firefoxCheck >= 0, 'Firefox UA check not found');
    assert.ok(chromeCheck >= 0, 'Chrome UA check not found');
    assert.ok(edgeCheck < firefoxCheck, 'Edge UA check must come before Firefox');
    assert.ok(firefoxCheck < chromeCheck, 'Firefox UA check must come before Chrome');
  });

  it('should detect edge from user agent containing Edg', () => {
    assert.ok(compatSource.includes("return 'edge'"), 'Edge detection branch missing');
    const edgeCheck = compatSource.indexOf("ua.indexOf('Edg')");
    const chromeCheck = compatSource.indexOf("ua.indexOf('Chrome')");
    assert.ok(edgeCheck >= 0, 'Edge UA check not found');
    assert.ok(chromeCheck >= 0, 'Chrome UA check not found');
    assert.ok(edgeCheck < chromeCheck, 'Edge (Edg) UA check must come BEFORE Chrome UA check');
  });

  it('should detect brave from user agent containing Brave', () => {
    assert.ok(compatSource.includes("return 'brave'"), 'Brave detection branch missing');
  });

  it('should handle unknown browser', () => {
    assert.ok(compatSource.includes("return 'unknown'"), 'Unknown browser fallback missing');
  });
});

describe('compat.js - sendMessage', () => {
  it('should handle chrome runtime sendMessage with callback', () => {
    assert.ok(compatSource.includes('chrome?.runtime?.sendMessage'),
      'Missing chrome.runtime.sendMessage path');
    assert.ok(compatSource.includes('chrome?.runtime?.lastError'),
      'Missing chrome.runtime.lastError handling');
  });

  it('should handle browser.runtime.lastError (Firefox callback mode)', () => {
    assert.ok(compatSource.includes('browser?.runtime?.lastError'),
      'Missing browser.runtime.lastError handling for Firefox');
  });
});

describe('compat.js - executeScript', () => {
  it('should call executeScript with correct arguments for chrome.scripting API', () => {
    // chrome.scripting.executeScript takes { target: { tabId }, ...options }
    assert.ok(compatSource.includes('chrome?.scripting?.executeScript'),
      'Missing chrome.scripting.executeScript path');
    // Must pass { target: { tabId }, ... } not separate args
    assert.ok(compatSource.includes('target: { tabId }'),
      'executeScript must pass { target: { tabId }, ... } for chrome.scripting API');
  });

  it('should handle browser.tabs.executeScript (Firefox fallback)', () => {
    assert.ok(compatSource.includes('browser?.tabs?.executeScript'),
      'Missing browser.tabs.executeScript Firefox path');
  });
});

describe('compat.js - getStorage', () => {
  it('should prefer chrome.storage.local', () => {
    assert.ok(compatSource.indexOf('chrome.storage.local') < compatSource.indexOf('browser.storage.local'),
      'Chrome storage should be checked first');
  });

  it('should fall back to browser.storage.local for Firefox', () => {
    assert.ok(compatSource.includes('browser.storage.local'),
      'Missing browser.storage.local Firefox fallback');
  });

  it('should return null when no storage available', () => {
    assert.ok(compatSource.includes('return null'),
      'Missing null return when no storage available');
  });
});

describe('compat.js - getExtensionUrl', () => {
  it('should prefer chrome.runtime.getURL', () => {
    assert.ok(compatSource.includes('chrome?.runtime?.getURL'),
      'Missing chrome.runtime.getURL path');
  });

  it('should fall back to browser.runtime.getURL for Firefox', () => {
    assert.ok(compatSource.includes('browser?.runtime?.getURL'),
      'Missing browser.runtime.getURL Firefox fallback');
  });

  it('should return path as-is when no runtime API available', () => {
    assert.ok(compatSource.includes('return path'),
      'Missing path fallback when no runtime API');
  });
});

describe('compat.js - onMessage', () => {
  it('should check that listener exists before calling addListener', () => {
    assert.ok(compatSource.includes('if (listener)'),
      'Missing null check for onMessage listener — crashes when neither chrome nor browser runtime exists');
  });
});

describe('compat.js - getCurrentTab', () => {
  it('should use chrome.tabs.query or browser.tabs.query', () => {
    assert.ok(compatSource.includes('chrome?.tabs?.query'),
      'Missing chrome.tabs.query path');
    assert.ok(compatSource.includes('browser?.tabs?.query'),
      'Missing browser.tabs.query Firefox fallback');
  });

  it('should handle empty tabs result', () => {
    assert.ok(compatSource.includes('null'),
      'Missing null return when tabs query returns empty');
  });
});

describe('compat.js - copyToClipboard', () => {
  it('should try navigator.clipboard.writeText first', () => {
    assert.ok(compatSource.includes('navigator.clipboard.writeText'),
      'Missing Clipboard API path');
  });

  it('should fall back to document.execCommand(copy)', () => {
    assert.ok(compatSource.includes("execCommand('copy')") || compatSource.includes('execCommand("copy")'),
      'Missing execCommand fallback for older browsers');
  });

  it('should handle errors gracefully', () => {
    assert.ok(compatSource.includes('return false'),
      'Missing graceful error handling (return false)');
  });
});

describe('compat.js - supportsFeature', () => {
  it('should define feature support for all browsers', () => {
    assert.ok(compatSource.includes('clipboardWrite'), 'Missing clipboardWrite feature');
    assert.ok(compatSource.includes('contextMenu'), 'Missing contextMenu feature');
    assert.ok(compatSource.includes('serviceWorker'), 'Missing serviceWorker feature');
    assert.ok(compatSource.includes('persistentBackground'), 'Missing persistentBackground feature');
  });
});

describe('compat.js - getBrowserName', () => {
  it('should return display names for all known browsers', () => {
    assert.ok(compatSource.includes('Google Chrome'), 'Missing Chrome display name');
    assert.ok(compatSource.includes('Mozilla Firefox'), 'Missing Firefox display name');
    assert.ok(compatSource.includes('Microsoft Edge'), 'Missing Edge display name');
    assert.ok(compatSource.includes('Brave Browser'), 'Missing Brave display name');
    assert.ok(compatSource.includes('Unknown Browser'), 'Missing unknown browser fallback');
  });
});
