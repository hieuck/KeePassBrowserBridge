// Multi-Page Login Flow Detection Tests

describe('MultiPageLogin', () => {
  
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  describe('Flow Initialization', () => {
    test('should initialize login flow', () => {
      const url = 'https://example.com/login';
      window.__kbbMultiPageLogin.initializeFlow(url);
      
      const state = window.__kbbMultiPageLogin.getFlowState();
      expect(state).not.toBeNull();
      expect(state.isActive).toBe(true);
      expect(state.startUrl).toBe(url);
      expect(state.steps.length).toBe(1);
    });

    test('should generate unique session ID', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      const state1 = window.__kbbMultiPageLogin.getFlowState();
      
      sessionStorage.clear();
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      const state2 = window.__kbbMultiPageLogin.getFlowState();
      
      expect(state1.sessionId).not.toBe(state2.sessionId);
    });
  });

  describe('Flow Detection', () => {
    test('should detect active login flow', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      expect(window.__kbbMultiPageLogin.isInLoginFlow()).toBe(true);
    });

    test('should return false when no flow active', () => {
      expect(window.__kbbMultiPageLogin.isInLoginFlow()).toBe(false);
    });

    test('should expire flow after 30 minutes', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      
      // Manually set old timestamp
      const state = window.__kbbMultiPageLogin.getFlowState();
      state.startTime = Date.now() - (31 * 60 * 1000);
      sessionStorage.setItem('kbb_login_flow', JSON.stringify(state));
      
      expect(window.__kbbMultiPageLogin.isInLoginFlow()).toBe(false);
    });
  });

  describe('Flow Step Recording', () => {
    test('should record flow steps', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      window.__kbbMultiPageLogin.recordFlowStep('https://example.com/verify');
      window.__kbbMultiPageLogin.recordFlowStep('https://example.com/dashboard');
      
      const state = window.__kbbMultiPageLogin.getFlowState();
      expect(state.steps.length).toBe(3);
      expect(state.steps[1].url).toBe('https://example.com/verify');
      expect(state.steps[2].url).toBe('https://example.com/dashboard');
    });
  });

  describe('Page Type Detection', () => {
    test('should detect login form', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" name="username">
          <input type="password" name="password">
          <button type="submit">Login</button>
        </form>
      `;
      
      expect(window.__kbbMultiPageLogin.hasLoginForm()).toBe(true);
    });

    test('should not detect login form when missing', () => {
      document.body.innerHTML = '<div>No form here</div>';
      expect(window.__kbbMultiPageLogin.hasLoginForm()).toBe(false);
    });

    test('should detect intermediate page (OTP)', () => {
      document.body.innerHTML = `
        <form>
          <input type="text" name="otp_code">
          <button>Verify</button>
        </form>
      `;
      
      expect(window.__kbbMultiPageLogin.isIntermediatePage()).toBe(true);
    });

    test('should detect success page', () => {
      document.body.innerHTML = '<h1>Welcome to Dashboard</h1>';
      expect(window.__kbbMultiPageLogin.isSuccessPage()).toBe(true);
    });
  });

  describe('Flow Analysis', () => {
    test('should analyze login flow', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      window.__kbbMultiPageLogin.recordFlowStep('https://example.com/verify');
      window.__kbbMultiPageLogin.recordFlowStep('https://example.com/dashboard');
      
      const analysis = window.__kbbMultiPageLogin.analyzeFlow();
      expect(analysis.stepCount).toBe(3);
      expect(analysis.urls.length).toBe(3);
      expect(analysis.domainChanges).toBe(0);
    });

    test('should detect domain changes', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      window.__kbbMultiPageLogin.recordFlowStep('https://auth.example.com/verify');
      window.__kbbMultiPageLogin.recordFlowStep('https://example.com/dashboard');
      
      const analysis = window.__kbbMultiPageLogin.analyzeFlow();
      expect(analysis.domainChanges).toBe(2);
    });

    test('should estimate remaining steps', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      
      document.body.innerHTML = `
        <form>
          <input type="text" name="otp_code">
          <button>Verify</button>
        </form>
      `;
      
      const remaining = window.__kbbMultiPageLogin.estimateRemainingSteps();
      expect(remaining).toBe(1);
    });
  });

  describe('Flow Completion', () => {
    test('should complete flow', () => {
      window.__kbbMultiPageLogin.initializeFlow('https://example.com/login');
      expect(window.__kbbMultiPageLogin.isInLoginFlow()).toBe(true);
      
      window.__kbbMultiPageLogin.completeFlow();
      expect(window.__kbbMultiPageLogin.isInLoginFlow()).toBe(false);
    });
  });
});
