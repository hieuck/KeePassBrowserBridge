---
name: kimchi-retrospectives
description: Use when running the weekly agent retrospective and writing improvement proposals
---

# Automatic Retrospectives

At the end of every week, run a retrospective to improve the agent's effectiveness. This replaces the human-led team retrospective with a structured self-review.

### 16.1 Trigger

- GitHub Actions scheduled cron job (e.g., every Sunday).
- Manual trigger by the user.

### 16.2 Process

1. Collect cycle logs from `.kimchi/logs/` for the past week.
2. Aggregate metrics:
   - Total cycles run.
   - Tasks completed, failed, and blocked.
   - Average time per task.
   - Most common failure reasons.
3. Identify patterns:
   - Recurring bugs or error types.
   - Tasks that frequently get stuck.
   - Areas where memory was incomplete or misleading.
   - Conventions that were violated or unclear.
4. Propose improvements:
   - Updates to `.kimchi/memory/`.
   - Changes to conventions or workflows.
   - Suggestions for better tests or monitoring.
5. Write the retrospective to `.kimchi/retrospectives/<YYYY-MM-DD>.md`.
6. Report findings to the user in Vietnamese.

### 16.3 Format

```markdown
# Retrospective: <date range>

## Metrics
- Cycles: X
- Completed: Y
- Failed: Z
- Blocked: W

## Wins
- <What went well>

## Issues
- <What went wrong or slowed us down>

## Patterns
- <Recurring themes>

## Proposed Improvements
- <Actionable changes>

## Action Items
- [ ] <item>
```

### 16.4 Acting on Retrospectives

If a proposed improvement is small and safe, implement it in the next cycle. If it requires significant changes or new conventions, create an issue or task and follow the normal planning workflow.
