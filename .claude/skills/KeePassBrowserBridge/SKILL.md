```markdown
# KeePassBrowserBridge Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the KeePassBrowserBridge TypeScript codebase. You'll learn how to structure files, write imports and exports, follow commit message conventions, and understand the project's approach to testing. This guide is ideal for contributors seeking to maintain consistency and quality in their code contributions.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names.
  - Example: `keepassBridge.ts`, `browserIntegration.test.ts`

### Import Style
- Use **relative imports** for referencing local files.
  - Example:
    ```typescript
    import { getCredentials } from './credentialsManager';
    ```

### Export Style
- Use **named exports** for all modules.
  - Example:
    ```typescript
    export function connectToKeePass() { ... }
    export const BRIDGE_PORT = 19455;
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use prefixes such as `docs:` for documentation changes.
- Keep commit messages concise (average: 60 characters).
  - Example:
    ```
    docs: update README with installation instructions
    ```

## Workflows

### Documentation Updates
**Trigger:** When updating or adding documentation files.
**Command:** `/update-docs`

1. Make your documentation changes in the appropriate `.md` or doc files.
2. Stage your changes:  
   ```
   git add <doc-file>
   ```
3. Commit using the `docs:` prefix:
   ```
   git commit -m "docs: clarify browser integration steps"
   ```
4. Push your changes to the repository.

### Adding or Modifying Code
**Trigger:** When implementing new features or fixing bugs.
**Command:** `/update-code`

1. Create or update TypeScript files using camelCase naming.
2. Use relative imports and named exports as per conventions.
3. Stage your changes:
   ```
   git add <file>
   ```
4. Commit with a descriptive message following the conventional format.
5. Push your changes.

### Running Tests
**Trigger:** When verifying code changes.
**Command:** `/run-tests`

1. Locate test files matching the `*.test.*` pattern.
2. Run the project's test runner (framework is unspecified; check project docs or `package.json` for details).
   - Example (if using Jest):
     ```
     npx jest
     ```

## Testing Patterns

- Test files follow the `*.test.*` naming pattern (e.g., `integration.test.ts`).
- The specific testing framework is not detected; check the repository for details.
- Place tests alongside source files or in a dedicated test directory.
- Example test file structure:
  ```typescript
  import { connectToKeePass } from './keepassBridge';

  describe('connectToKeePass', () => {
    it('should establish a connection', () => {
      // test implementation
    });
  });
  ```

## Commands
| Command        | Purpose                                      |
|----------------|----------------------------------------------|
| /update-docs   | Update or add documentation                  |
| /update-code   | Add or modify TypeScript code                |
| /run-tests     | Run the test suite                           |
```
