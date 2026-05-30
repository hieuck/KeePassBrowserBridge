// Quick Test Runner for KeePassBrowserBridge
// Run this in browser console to test extension functionality

window.__kbbQuickTest = {
  results: [],

  test: function(name, fn) {
    try {
      const result = fn();
      this.results.push({ name, passed: true, result });
      console.log(`✅ ${name}: PASSED`);
    } catch (error) {
      this.results.push({ name, passed: false, error: error.message });
      console.log(`❌ ${name}: FAILED - ${error.message}`);
    }
  },

  runAll: function() {
    console.log('=== KeePassBrowserBridge Quick Test Suite ===\n');
    this.results = [];

    // Test 1: Extension loaded
    this.test('Extension loaded', () => {
      return typeof window.__kbbGroupOrganization !== 'undefined';
    });

    // Test 2: Theme toggle exists
    this.test('Theme toggle exists', () => {
      return document.getElementById('themeToggle') !== null;
    });

    // Test 3: Status badge exists
    this.test('Status badge exists', () => {
      return document.getElementById('statusBadge') !== null;
    });

    // Test 4: Endpoint input exists
    this.test('Endpoint input exists', () => {
      return document.getElementById('endpoint') !== null;
    });

    // Test 5: Query button exists
    this.test('Query button exists', () => {
      return document.getElementById('queryLogins') !== null;
    });

    // Test 6: Auto-fill checkbox exists
    this.test('Auto-fill checkbox exists', () => {
      return document.getElementById('autoFill') !== null;
    });

    // Test 7: Settings panel exists
    this.test('Settings panel exists', () => {
      return document.getElementById('autoSubmit') !== null;
    });

    // Test 8: Results container exists
    this.test('Results container exists', () => {
      return document.getElementById('results') !== null;
    });

    // Print summary
    setTimeout(() => {
      const passed = this.results.filter(r => r.passed).length;
      const total = this.results.length;
      console.log(`\n=== Test Summary: ${passed}/${total} passed ===`);
      
      if (passed === total) {
        console.log('🎉 All tests passed!');
      } else {
        console.log('⚠️ Some tests failed. Check details above.');
      }
    }, 100);
  }
};

// Run tests
window.__kbbQuickTest.runAll();
