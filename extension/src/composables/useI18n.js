function getMessage(key, substitutions) {
  if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
    return chrome.i18n.getMessage(key, substitutions) || key;
  }
  if (typeof browser !== 'undefined' && browser.i18n && browser.i18n.getMessage) {
    return browser.i18n.getMessage(key, substitutions) || key;
  }
  return key;
}

export function useI18n() {
  function t(key, substitutions) {
    return getMessage(key, substitutions);
  }
  return { t };
}

export const i18n = { t: getMessage };
