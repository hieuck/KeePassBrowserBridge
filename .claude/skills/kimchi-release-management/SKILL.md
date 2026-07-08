---
name: kimchi-release-management
description: Use when creating a release, bumping version, generating changelog, or deploying as part of a release cycle
---

# Release Management

When permitted by `.kimchi/AUTONOMY.md`, the agent may manage releases automatically as part of the continuous operation cycle.

### 13.1 Permitted Actions

- Generate a changelog from conventional commits since the last release.
- Bump the version following semantic versioning:
  - `patch`: auto if `bump-version-patch` is in `allowed-actions`.
  - `minor`: auto if `bump-version-minor` is in `allowed-actions`.
  - `major`: requires explicit human approval, even in full continuous mode.
- Create an annotated git tag (e.g., `v1.2.3`).
- Create a GitHub Release with release notes.
- Deploy to staging and/or production as part of the release if configured.

### 13.2 Requirements

- All tests, lint, type checks, and builds must pass before creating a release.
- The release must pass internal review.
- Changelog and version bump must be committed to the default branch via PR or direct commit if permitted.
- Tags must follow the format `v{major}.{minor}.{patch}`.
- Deploy-on-release requires `deploy.<env>.enabled: true` in `.kimchi/AUTONOMY.md` and a verified rollback plan.

### 13.3 Release Cycle

1. After a PR is merged into the default branch, evaluate whether a release is warranted.
2. Determine the version bump type from conventional commits.
3. Update `CHANGELOG.md` and version files (e.g., `package.json`, `pyproject.toml`).
4. Commit/tag the release.
5. Create the GitHub Release.
6. Deploy if configured and tests pass.
7. Update `.kimchi/MEMORY.md` with any release-related decisions.
8. Log every step and report the release summary to the user.
