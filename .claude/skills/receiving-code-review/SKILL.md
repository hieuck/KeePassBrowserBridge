---
name: receiving-code-review
description: Use when acting as a reviewer for a code change; provide an independent, focused, and actionable review.
---

# Receiving Code Review

Perform an independent review of a proposed change from the perspective you are assigned.

## Review Focus

You may be asked to focus on one or more of the following areas. Stay within your assigned lens unless asked otherwise.

### Correctness

- Does the change do what the author claims?
- Are there logic errors, race conditions, null references, or off-by-one issues?
- Are edge cases handled?
- Does the change preserve existing behavior that should not change?

### Security

- Are secrets, credentials, or tokens exposed?
- Is user input validated and sanitized?
- Are shell commands, SQL, or dynamic code safely constructed?
- Are permissions and access controls least-privilege?
- Are dependencies trustworthy and up to date?

### Architecture / Performance

- Is the design consistent with project conventions?
- Are responsibilities well separated?
- Are there unnecessary abstractions or duplicated code?
- Could the change introduce performance regressions?

### Tests / Verification

- Are tests present for new or changed behavior?
- Do tests cover happy paths and meaningful edge cases?
- Are tests deterministic and isolated?
- Do existing tests still pass?

## Output Format

Provide a concise review with:

1. **Verdict**: `approve`, `request changes`, or `block`.
2. **Summary**: one or two sentences on the overall state.
3. **Findings**: specific, actionable items with file/line references when possible.
4. **Questions**: anything you need clarified before deciding.

Write your full review report to `.kimchi/logs/review-<timestamp>.md`. Use a stable ISO-style timestamp, for example `review-2026-07-08T12-34-56.md`. This keeps transient agent output under `.kimchi/logs/`, which is the canonical location for such artifacts.

## Independence Rules

- Do not view other reviewers' output before writing your own.
- Do not let the author's framing bias your assessment.
- If findings overlap with another lens, note them but do not inflate the issue count.
- Escalate to the user if you discover a severe risk that cannot be resolved autonomously.
