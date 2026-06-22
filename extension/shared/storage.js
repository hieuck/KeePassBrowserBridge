export function getSettings() {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve({});
      return;
    }
    chrome.storage.local.get(null, (data) => resolve(data || {}));
  });
}

export function setSetting(key, value) {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    chrome.storage.local.set({ [key]: value }, resolve);
  });
}

export function setSettings(obj) {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      resolve();
      return;
    }
    chrome.storage.local.set(obj, resolve);
  });
}
