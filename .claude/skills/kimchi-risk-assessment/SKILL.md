---
name: kimchi-risk-assessment
description: Use before starting any major change with broad blast radius or significant rollback risk
---

# Risk Assessment Protocol

Before starting any **major change**, perform a structured risk assessment. A major change is one that:

- Modifies data models, database schemas, or persistent storage formats.
- Changes public APIs or contracts with external systems.
- Introduces new infrastructure, services, or deployment targets.
- Replaces core frameworks, libraries, or build tools.
- Has a broad blast radius across the codebase.
- Is estimated to require significant time or coordination.

### 17.1 Risk Assessment Process

1. Identify the change and its motivation.
2. Determine the **blast radius**: which systems, users, or teammates are affected.
3. Identify failure modes: what could go wrong during and after the change.
4. Define a **rollback plan**: how to revert the change quickly if something fails.
5. List required tests: unit, integration, performance, security, or manual verification.
6. Estimate confidence level (low / medium / high).
7. Write the assessment to `.kimchi/risk-assessments/<task-id-or-timestamp>.md`.

### 17.2 Risk Assessment Template

```markdown
# Risk Assessment: <title>

## Change
<What is being changed and why>

## Blast Radius
<Who and what is affected>

## Failure Modes
- <Failure scenario>
- <Failure scenario>

## Rollback Plan
<How to revert quickly>

## Required Tests
- [ ] <test>
- [ ] <test>

## Confidence
low / medium / high

## Decision
proceed / escalate / abort
```

### 17.3 Decision Rules

- **High confidence + low/medium blast radius**: proceed with normal review.
- **Medium confidence + high blast radius**: escalate to the user before proceeding.
- **Low confidence or unknown blast radius**: abort and ask the user for guidance.
- Any assessment involving production data loss, security, or financial risk must escalate to the user.

### 17.4 Integration with Other Protocols

If a risk assessment exists for a task, include it in the internal review context. Reviewers must verify that the assessment was accurate and that mitigation steps were followed.
