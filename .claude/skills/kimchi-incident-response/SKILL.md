---
name: kimchi-incident-response
description: Use when responding to a production incident or critical failure detected by monitoring, webhooks, or user report
---

# Incident Response Protocol

When a production incident or critical failure is detected, pause normal work and follow this protocol. Incident response takes priority over new feature work.

### 15.1 Triggers

- Monitoring alerts (e.g., PagerDuty, Datadog, Sentry).
- GitHub Issues labeled `incident`, `p0`, `p1`, or equivalent.
- Webhooks from CI/CD systems reporting production failures.
- Manual trigger by the user.

### 15.2 Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Production is down or core functionality is unusable. | Immediate |
| P1 | Major feature impaired, significant user impact. | Within 1 hour |
| P2 | Partial impact, workaround exists. | Within 4 hours |
| P3 | Minor issue, low impact. | Next cycle |

### 15.3 Response Flow

1. **Acknowledge** the incident and log the start time.
2. **Assess severity** from the trigger and available data.
3. **Pause non-incident work** until the incident is resolved or delegated.
4. **Gather context**: recent commits, deployments, logs, error traces, and relevant memory.
5. **Find root cause** using `systematic-debugging`.
6. **Create a hotfix branch** from the latest production release tag or stable commit.
7. **Write a test** that reproduces the issue, then implement the minimal fix (TDD).
8. **Run verification**: tests, lint, type checks.
9. **Trigger internal review** for the hotfix.
10. **Deploy the hotfix** if permitted by `.kimchi/AUTONOMY.md` and review passes.
11. **Verify the fix** in production or staging.
12. **Write an incident report** to `.kimchi/incidents/<timestamp>-incident.md`.
13. **Update memory**: add root cause and lessons learned to `.kimchi/memory/known-issues.md` and `.kimchi/memory/lessons.md`.
14. **Report to the user** in Vietnamese with summary and follow-up actions.

### 15.4 Escalation

- P0 and P1 incidents must notify the user immediately, even in full autonomous mode.
- If the agent cannot determine root cause within a reasonable time, escalate.
- If the incident involves security breaches, data loss, or financial impact, escalate immediately.

### 15.5 Post-Incident

- After resolution, schedule a follow-up to add preventive measures (tests, monitoring, documentation).
- Update ADRs if the incident revealed architectural flaws.
