// Extension Test Script
// Run this in the extension's background page or popup

console.log('=== KeePassBrowserBridge Extension Test ===');

// Test 1: Check background script
console.log('Test 1: Background script state');
chrome.runtime.sendMessage({ type: 'KBB_GET_STATE' }, (response) => {
  console.log('State:', response);
  
  // Test 2: Check if paired
  if (response.paired) {
    console.log('Test 2: Extension is paired');
    
    // Test 3: Query logins
    console.log('Test 3: Query logins for GitHub');
    chrome.runtime.sendMessage({ 
      type: 'KBB_QUERY_LOGINS', 
      url: 'https://github.com/login' 
    }, (result) => {
      console.log('Logins:', result);
    });
  } else {
    console.log('Test 2: Extension is NOT paired');
    
    // Test 4: Begin pairing
    console.log('Test 4: Begin pairing');
    chrome.runtime.sendMessage({ type: 'KBB_PAIR_BEGIN' }, (response) => {
      console.log('Pairing response:', response);
    });
  }
});

// Test 5: Check context menu
console.log('Test 5: Context menu items');
chrome.contextMenus.getAll((menus) => {
  console.log('Context menus:', menus);
});

// Test 6: Check storage
console.log('Test 6: Storage');
chrome.storage.local.get(['endpoint', 'clientId', 'autoFillEnabled'], (result) => {
  console.log('Storage:', result);
});

console.log('=== Tests completed ===');
