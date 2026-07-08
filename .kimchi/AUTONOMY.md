---
mode: full-continuous
owner: <your-github-username>

# Allowed autonomous actions.
# Remove any action you do not want the agent to perform automatically.
allowed-actions:
  - merge-pr
  - deploy-staging
  # - deploy-production   # uncomment only when you trust the agent fully
  - add-dependency
  # - handle-secrets  # requires explicit human approval per AGENTS.md section 13
  - create-release
  - bump-version-patch
  - bump-version-minor
  # - bump-version-major  # uncomment only after careful consideration; requires human approval by default
  - respond-to-incident
  - deploy-hotfix
  - write-incident-report
  - run-retrospective
  - architecture-review
  - risk-assessment

# Where to find work.
task-sources:
  - github-issues-label: agent-ready
  - github-projects
  - todo-file: TODO.md

# What triggers are accepted.
# The agent itself does not schedule; this documents expected triggers.
trigger: any

# Deployment configuration.
deploy:
  staging:
    command: npm run deploy:staging
    enabled: true
    on-release: true
  production:
    command: npm run deploy:production
    enabled: false
    on-release: false

# Release configuration.
release:
  changelog-file: CHANGELOG.md
  version-file: package.json
  tag-prefix: v
  auto-release-on-main-merge: true
  # major-bump-requires-human: true  # always true, documented here for clarity

# Incident response configuration.
incident:
  # Severity levels that the agent can auto-respond to.
  auto-respond:
    - p2
    - p3
  # Severity levels that require immediate human notification.
  escalate-immediately:
    - p0
    - p1
  # Labels that mark an issue as an incident.
  labels:
    - incident
    - p0
    - p1
    - p2
    - p3

# Retrospective configuration.
retrospective:
  enabled: true
  schedule: "0 18 * * 0"  # Every Sunday at 18:00 UTC
  log-retention-days: 90

# Risk assessment configuration.
risk-assessment:
  enabled: true
  # Types of changes that always require a risk assessment.
  required-for:
    - database-schema-change
    - api-breaking-change
    - framework-migration
    - new-service-or-module
    - major-dependency-change
  # Directory to store risk assessment files.
  output-dir: .kimchi/risk-assessments

# Notification / reporting.
report-language: vi
log-dir: .kimchi/logs
---

# Autonomy Configuration

This file opts the repository into Kimchi full continuous operation mode.

## Before enabling

1. Read `.kimchi/AGENTS.md` carefully.
2. Start with `allowed-actions` limited to safe actions (no deploy, no merge, no release, no incident response).
3. Run in shadow or semi-autonomous mode for several cycles before enabling full autonomy.
4. Ensure `.kimchi/logs/`, `.kimchi/tmp/`, `.kimchi/incidents/`, `.kimchi/retrospectives/`, and `.kimchi/risk-assessments/` are ignored in `.gitignore`.

## How to disable

Delete this file or change `mode` to `disabled`.
