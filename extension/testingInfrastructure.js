// Testing Infrastructure Setup
// Configuration for Jest/Vitest, Playwright, and CI/CD

// package.json additions for testing
const testingConfig = {
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "playwright": "^1.40.0",
    "@playwright/test": "^1.40.0",
    "typescript": "^5.0.0",
    "@types/node": "^20.0.0",
    "ts-jest": "^29.0.0",
    "jest": "^29.0.0"
  },
  "scripts": {
    "test": "vitest run",
    "test:ui": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "lint": "eslint src/ --ext .ts,.js",
    "build": "vite build",
    "prepare": "husky install"
  },
  "vitest": {
    "test": {
      "globals": true,
      "environment": "jsdom",
      "setupFiles": "./tests/setup.js",
      "include": ["tests/**/*.test.{js,ts}", "extension/tests/**/*.test.mjs"],
      "coverage": {
        "provider": "istanbul",
        "reporter": ["text", "json", "html"],
        "exclude": ["node_modules/", "tests/", "dist/", "*.config.{js,ts}"]
      }
    }
  }
};

// GitHub Actions workflow
const githubWorkflow = `
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        browser: [chromium, firefox, webkit]

    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: \${{ matrix.node-version }}
    - name: Install dependencies
      run: npm ci
    - name: Run unit tests
      run: npm test
    - name: Run E2E tests
      run: npm run test:e2e
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.json
        flags: unittests
        name: codecov-umbrella
`;

$testingInfrastructure = @'
// Testing Infrastructure Module
// Placeholder for testing setup documentation

window.__kbbTestingInfo = {
  // Testing framework information
  frameworks: {
    unit: 'Vitest/Jest',
    integration: 'Playwright',
    e2e: 'Playwright'
  },
  
  // Test directories
  directories: {
    unit: 'tests/',
    integration: 'tests/extension/',
    e2e: 'tests/e2e/'
  },
  
  // Commands
  commands: {
    unitTests: 'npm test',
    uiTests: 'npm run test:ui',
    e2eTests: 'npm run test:e2e',
    lint: 'npm run lint',
    build: 'npm run build'
  },
  
  // Coverage thresholds
  coverage: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80
  }
};

console.log('Testing infrastructure initialized');
