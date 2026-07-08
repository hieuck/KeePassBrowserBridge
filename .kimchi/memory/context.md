# Project Context

Keywords: project, purpose, tech-stack, default-branch, package-manager, build, test

## Basics

- **Project name**: KeePass Browser Bridge
- **Purpose**: Browser extension bridge between KeePass 2.x and Chrome/Firefox, with a KeePass C# plugin backend.
- **Default branch**: main (auto-detected; never hardcode)

## Tech stack

- **Language**: JavaScript / TypeScript (browser extension), C# (KeePass plugin)
- **Framework**: Vue 3 (browser extension popup/options), Web Components (inline picker/prompts), Chrome Manifest V3 + Firefox
- **Package manager**: npm
- **Build tool**: Vite (extension bundles), PowerShell release scripts, .NET / MSBuild (C# plugin)
- **Test framework**: Vitest (unit tests), Playwright (E2E across Chromium/Firefox/Edge/WebKit)

## Common commands

- Install dependencies: `npm install`
- Run tests: `npm test` (Vitest unit tests)
- Run E2E: `npm run test:e2e:chromium` / `npm run test:e2e:firefox`
- Run lint: `npm run lint`
- Build extension: `npm run build:vue && npm run build:components`
- Full release build: `npm run build:release` (PowerShell)
- Verify: `npm run verify` (PowerShell script)
