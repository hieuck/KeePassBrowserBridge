---
name: kimchi-event-driven-ops
description: Use when waiting for CI, PR checks, deployments, or webhook callbacks
---

# Event-Driven Operations

Avoid fixed `sleep` delays when waiting for external processes such as CI runs, PR checks, deployments, or webhook callbacks. Prefer event-driven or blocking mechanisms that return as soon as the result is available.

### Preferred Approaches

1. **Use `gh run watch` to wait for a GitHub Actions workflow run.**
   ```bash
   gh run watch <run-id>
   ```

2. **Use `gh pr checks --watch` to wait for PR checks.**
   ```bash
   gh pr checks <pr-number> --watch
   ```

3. **Use webhooks or callback triggers** when available, instead of polling.

4. **If polling is unavoidable**, use exponential backoff with a maximum number of attempts rather than a single long sleep:
   ```bash
   for i in 1 2 4 8 16; do
     if gh pr checks <pr-number> --fail; then
       break
     fi
     sleep $i
   done
   ```

### What to Avoid

- `sleep 60` or any fixed long sleep while waiting for CI.
- Repeatedly running the same status command every few seconds indefinitely.

### Logging

Log every wait, including the command used, the result, and the total elapsed time.
