---
name: requesting-code-review
description: Use when a change is ready for peer review and you need to prepare and dispatch a review request to a Reviewer subagent or human reviewer.
---

# Requesting Code Review

Prepare a review package that makes it easy for a reviewer to understand, validate, and safely decide on a change.

## When to Use

- A feature, fix, or refactor is complete and locally verified.
- A high-risk or irreversible action requires an independent review per `kimchi-internal-review`.
- The change touches CI/CD, security, dependencies, public APIs, or user data.

## Preparation

1. **Confirm readiness**
   - All tests pass.
   - Linting and type-checking pass.
   - The change is self-contained and the diff is reviewable.

2. **Produce the review package**
   - **Summary**: what changed and why.
   - **Motivation**: the problem or opportunity being addressed.
   - **Diff**: concise, focused changes; avoid unrelated churn.
   - **Risk assessment**: security, compatibility, performance, or operational risks.
   - **Rollback plan**: how to revert or mitigate if the change causes issues.
   - **Verification evidence**: test output, screenshots, or logs.
   - **Open questions**: anything the reviewer should pay special attention to.

3. **Choose reviewers**
   - Spawn a `Reviewer` subagent with the `receiving-code-review` skill loaded.
   - For cross-domain changes, spawn multiple reviewers in parallel (Correctness, Security, Architecture, Tests).
   - Ensure reviewers are independent and do not see each other's output before writing their own.

4. **Dispatch the request**
   - Provide the review package and the specific review focus.
   - Ask for a clear verdict: approve, request changes, or block.
   - Request reasoning and specific findings.

## Review Outcomes

- **Approve with no material concerns**: proceed with the planned action.
- **Request changes**: address findings, re-verify, and re-run the affected review.
- **Block**: stop and escalate to the user if the concern cannot be resolved autonomously.
