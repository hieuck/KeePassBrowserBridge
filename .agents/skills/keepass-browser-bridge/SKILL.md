```markdown
---
name: keepass-browser-bridge
description: Use when contributing to the KeePassBrowserBridge codebase and needing its conventions for file naming, imports/exports, commit messages, and testing.
---

# KeePassBrowserBridge Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the KeePassBrowserBridge JavaScript codebase, which is built with the Vue framework. You'll learn about file naming, import/export styles, commit message conventions, and how to write and run tests. This guide is ideal for contributors looking to maintain consistency and productivity in this project.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `keepassBridge.js`, `userSettings.vue`

### Import Style
- Use **relative imports** for modules within the project.
  - Example:
    ```js
    import { fetchCredentials } from './apiUtils';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```js
    // In apiUtils.js
    export function fetchCredentials() { ... }
    ```

### Commit Message Patterns
- Commit types are **mixed**, with common prefixes such as `chore` and `test`.
- Average commit message length: **55 characters**.
  - Example:  
    ```
    chore: update dependencies to latest versions
    test: add tests for credential fetch logic
    ```

## Workflows

### Code Contribution
**Trigger:** When adding features, fixing bugs, or making improvements  
**Command:** `/contribute`

1. Create a new branch for your work.
2. Follow the coding conventions for file naming, imports, and exports.
3. Write or update tests as needed (see Testing Patterns).
4. Use a descriptive commit message with a relevant prefix (`chore`, `test`, etc.).
5. Open a pull request for review.

### Testing
**Trigger:** When you want to verify code changes or add new tests  
**Command:** `/test`

1. Identify or create a test file matching the `*.test.*` pattern.
2. Write tests for your components or utilities.
3. Run the test suite using the project's test runner (framework unknown; check project scripts).
4. Ensure all tests pass before merging changes.

## Testing Patterns

- **Test File Naming:**  
  Test files follow the `*.test.*` pattern, e.g., `apiUtils.test.js`.
- **Framework:**  
  The specific testing framework is not identified; check the project documentation or `package.json` for details.
- **Test Structure:**  
  Place tests alongside the code they validate, using named exports and relative imports as in the main codebase.

  Example:
  ```js
  // apiUtils.test.js
  import { fetchCredentials } from './apiUtils';

  test('fetchCredentials returns expected data', () => {
    // test implementation
  });
  ```

## Commands
| Command      | Purpose                                      |
|--------------|----------------------------------------------|
| /contribute  | Start a new code contribution workflow       |
| /test        | Run or add tests for the codebase            |
```
