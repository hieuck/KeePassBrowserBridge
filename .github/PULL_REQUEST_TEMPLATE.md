## Description

Brief description of the change for the KeePass Browser Bridge browser extension and/or KeePass C# plugin.

## Changes

- Change one
- Change two

## Motivation

Why is this change needed? Link any related issues:

- Closes #
- Related to #

## Testing

- [ ] `npm test` (Vitest unit tests) passes
- [ ] `npm run test:e2e:chromium` (Playwright E2E Chromium) passes
- [ ] `npm run lint` (ESLint) passes
- [ ] C# plugin build passes (`dotnet build src/` or `scripts/build-release.ps1`)
- [ ] Manual testing in Chrome MV3
- [ ] Manual testing in Firefox (if affected)

## Browser / Plugin Impact

- [ ] Chrome MV3 extension
- [ ] Firefox extension
- [ ] KeePass C# plugin / bridge protocol
- [ ] No runtime impact (docs, build, repo hygiene only)

## Security & Compatibility

- [ ] No secrets, credentials, or private keys committed
- [ ] Passkeys / WebAuthn behavior considered (if applicable)
- [ ] Backward compatible with existing KeePass plugin versions

## Checklist

- [ ] Code follows project conventions (`.claude/skills/keepass-browser-bridge/SKILL.md`)
- [ ] Tests added or updated for the affected code
- [ ] `CHANGELOG.md` updated
- [ ] Documentation updated (`README.md`, `docs/`, inline comments, etc.)
- [ ] i18n strings updated (`extension/_locales/`) if user-facing text changed
