// KeePass Browser Bridge - Popup Diagnostic Script
// Chạy trong Chrome DevTools Console khi mở popup
// Paste toàn bộ script này vào Console của popup window

(async function() {
  console.log('=== KBB Popup Diagnostic ===');
  
  // 1. Check chrome API availability
  console.log('\n1. Chrome API:');
  console.log('  chrome:', typeof chrome);
  console.log('  chrome.runtime:', typeof chrome?.runtime);
  console.log('  chrome.storage:', typeof chrome?.storage);
  console.log('  chrome.storage.local:', typeof chrome?.storage?.local);
  
  // 2. Read storage
  console.log('\n2. Storage data:');
  try {
    const data = await new Promise((resolve) => {
      chrome.storage.local.get(null, resolve);
    });
    console.log('  Full storage:', JSON.stringify(data, null, 2));
    console.log('  clientId:', data.clientId || '(empty)');
    console.log('  paired:', !!(data.clientId && data.sharedSecret));
  } catch (e) {
    console.log('  ERROR reading storage:', e.message);
  }
  
  // 3. Test bridge communication
  console.log('\n3. Bridge communication:');
  try {
    const state = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'KBB_GET_STATE' }, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!response?.ok) reject(new Error(response?.error || 'Unknown'));
        else resolve(response.response);
      });
    });
    console.log('  Bridge state:', JSON.stringify(state, null, 2));
  } catch (e) {
    console.log('  Bridge error:', e.message);
  }
  
  // 4. Test queryLogins
  console.log('\n4. Query logins:');
  try {
    const result = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'KBB_QUERY_LOGINS' }, (response) => {
        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
        else if (!response?.ok) reject(new Error(response?.error || 'Unknown'));
        else resolve(response.response);
      });
    });
    console.log('  Entries:', result?.entries?.length || 0);
    console.log('  URL:', result?.url);
    if (result?.entries?.length > 0) {
      console.log('  First entry:', JSON.stringify(result.entries[0], null, 2));
    }
  } catch (e) {
    console.log('  Error:', e.message);
  }
  
  // 5. Check Vue app state
  console.log('\n5. Vue app state:');
  try {
    const app = document.querySelector('#app')?.__vue_app__;
    if (app?._instance) {
      const s = app._instance.setupState || app._instance.proxy;
      console.log('  paired:', s?.state?.paired);
      console.log('  locked:', s?.state?.locked);
      console.log('  showPairDialog:', s?.showPairDialog);
      console.log('  loading:', s?.loading);
      console.log('  currentEntries:', s?.currentEntries?.length);
      console.log('  visibleEntries:', s?.visibleEntries?.length);
      console.log('  activeGroup:', s?.activeGroup);
      console.log('  formMode:', s?.formMode);
      console.log('  searchQuery:', s?.searchQuery);
    } else {
      console.log('  Vue app not found');
    }
  } catch (e) {
    console.log('  Error:', e.message);
  }
  
  // 6. DOM check
  console.log('\n6. DOM:');
  console.log('  credential-cards:', document.querySelectorAll('.credential-card').length);
  console.log('  pair-overlay:', !!document.querySelector('.pair-overlay'));
  console.log('  empty-state:', !!document.querySelector('.empty-state'));
  console.log('  vault-list children:', document.querySelector('.vault-list')?.children?.length || 0);
  console.log('  filter-chips:', document.querySelectorAll('.filter-bar__chip').length);
  
  console.log('\n=== End Diagnostic ===');
})();
