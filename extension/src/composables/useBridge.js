import { ref } from 'vue';

export function useBridge() {
  async function call(type, payload = {}) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime) {
        reject(new Error('chrome.runtime not available'));
        return;
      }
      chrome.runtime.sendMessage({ type, ...payload }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response || !response.ok) {
          reject(new Error(response?.error || 'Unknown error'));
          return;
        }
        resolve(response.response);
      });
    });
  }

  return {
    call,
    queryLogins: () => call('KBB_QUERY_LOGINS'),
    queryForUrl: (url) => call('KBB_QUERY_FOR_URL', { url }),
    getState: () => call('KBB_GET_STATE'),
    getAbout: () => call('KBB_GET_ABOUT'),
    hello: () => call('KBB_HELLO'),
    setLocked: (locked) => call('KBB_SET_LOCKED', { locked }),
    setAutoFill: (enabled) => call('KBB_SET_AUTO_FILL', { enabled }),
    setAutoSubmit: (enabled) => call('KBB_SET_AUTO_SUBMIT', { enabled }),
    createLogin: (login) => call('KBB_CREATE_LOGIN', { login }),
    updateLogin: (login) => call('KBB_UPDATE_LOGIN', { login }),
    fillLogin: (credential, fieldRole, customFieldName) => call('KBB_FILL_LOGIN', { credential, fieldRole, customFieldName }),
    pairBegin: () => call('KBB_PAIR_BEGIN'),
    pairComplete: (pairingCode) => call('KBB_PAIR_COMPLETE', { pairingCode }),
    pairCancel: () => call('KBB_PAIR_CANCEL'),
    listClients: () => call('KBB_LIST_CLIENTS'),
    revokeClient: (clientId) => call('KBB_REVOKE_CLIENT', { clientId }),
    setPasskeysEnabled: (enabled) => call('KBB_SET_PASSKEYS_ENABLED', { enabled }),
    lockDatabase: () => call('KBB_LOCK_DATABASE'),
    listGroups: () => call('KBB_LIST_GROUPS'),
    getDatabaseInfo: () => call('KBB_GET_DATABASE_INFO'),
  };
}
