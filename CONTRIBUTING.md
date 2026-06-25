# Contributing to KeePass Browser Bridge

## Development Setup

1. Clone the repository
2. `npm install` — install JS dependencies
3. `npm run build:all` — build Vue components + Web Components
4. `npm run dev` — start dev server for E2E tests

## Testing

```powershell
npm test                  # vitest unit tests (401+)
npm run test:e2e:chromium # Playwright E2E
.\scripts\verify.ps1       # Full verification
```

## Code Style

- Vue 3 + Composition API for popup/options
- Web Components (Shadow DOM) for inline picker + prompts
- Ant Design Vue for UI components
- PascalCase for C# protocol models, camelCase for JS

## Pull Request Process

1. Write failing test first (TDD)
2. Implement the fix/feature
3. Verify all tests pass
4. Update README if adding features
5. Submit PR with description of changes

## Testing Requirements

- All existing tests must pass
- New features require new tests
- C# changes require `dotnet build` (0 errors)
- Changes to bridge protocol require protocol model updates
