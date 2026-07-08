---
name: kimchi-continuous-mode
description: Use when running in or configuring full continuous autonomous mode, including opt-in, triggers, task sources, execution flow, and stop conditions
---

# Full Continuous Operation Mode

This mode grants full autonomous operation within a repository. It requires explicit opt-in because it allows the agent to merge, deploy, add dependencies, and handle secrets without further human approval.

### 3.1 Opt-In Requirement

Continuous mode is **DISABLED by default**. Enable it by creating `.kimchi/AUTONOMY.md` in the repository root:

```markdown
---
mode: full-continuous
allowed-actions:
  - merge-pr
  - deploy-staging
  - deploy-production
  - add-dependency
  - handle-secrets
task-sources:
  - github-issues-label: agent-ready
  - github-projects
  - todo-file: TODO.md
trigger: any
owner: <your-name>
---
```

Alternatively, set the environment variable `KIMCHI_FULL_AUTONOMY=1` and point `KIMCHI_AUTONOMY_CONFIG` to a valid config file.

If the opt-in file or variable is missing, fall back to section 2 behavior: autonomous within a given task, but no self-directed continuous operation.

### 3.2 Trigger Sources

External infrastructure must trigger each cycle. Acceptable triggers:
- GitHub Actions scheduled workflow (cron).
- Local cron / Task Scheduler / launchd.
- GitHub webhook on issue, comment, or project event.
- Manual trigger by the user.

The agent does not run continuously in the same process. Each trigger starts one cycle, the agent performs one task, then exits.

### 3.3 Task Sources

Check task sources in priority order:
1. GitHub Issues with the configured label (e.g., `agent-ready`).
2. GitHub Projects columns (e.g., `Ready` or `Todo`).
3. `TODO.md` or the configured backlog file in the repository root.
4. Inline comments with `TODO(agent):` in recently modified code.

If no suitable task is found, the cycle ends immediately. Do not invent work.

### 3.4 Execution Flow

For each cycle:
1. Load `using-superpowers` and all relevant skills.
2. Retrieve relevant project memory using the Memory Retrieval Protocol.
3. Select the highest-priority task.
4. Load `writing-plans` and create a todo list.
5. Implement using TDD.
6. Run verification.
7. Trigger internal review for high-risk actions.
8. Push the branch, open a PR, and merge if the review passes.
9. Deploy if configured and tests pass.
10. Update the task source (close issue, move card, check off TODO).
11. Update project memory if the cycle produced new knowledge worth remembering.
12. Write a concise summary to `.kimchi/logs/<timestamp>-cycle.md`.
13. Exit.

### 3.5 Permitted Autonomous Actions

When full continuous mode is enabled, the agent may:
- Merge its own PRs after internal review passes.
- Deploy to staging and/or production if configured.
- Add new dependencies after verifying license, compatibility, and security.
- Read and write secrets/credentials files inside the repository (e.g., `.env.local`) as required by the task, but only within the repository boundary.
- Force-push to its own feature branch if necessary after rebase, using `--force-with-lease`.

### 3.6 Absolute Guardrails (Still Apply)

Even in full continuous mode, the agent must NEVER:
- Delete the repository or wipe the working directory.
- Expose secrets outside the repository (no pasting into logs, PR descriptions, or external services).
- Run commands that could cause financial loss or irreversible data loss.
- Perform destructive operations on `main`, `master`, `release/*`, or protected branches without explicit recovery capability.
- Attack, scan, or interact with external systems beyond the configured CI/CD pipeline.

### 3.7 Audit & Reporting

- Log every autonomous decision to `.kimchi/logs/<timestamp>-cycle.md`.
- Record every merged PR, deployment, and dependency addition.
- Report to the user in Vietnamese at the end of each cycle.
- If a cycle fails or encounters ambiguity, log the reason and exit. Do not silently retry.

### 3.8 Stop Conditions

Stop the cycle and escalate to the user if:
- No opt-in is present.
- No suitable task is found.
- Internal review rejects the change.
- Tests or checks fail after reasonable retries.
- A secret leak or security issue is suspected.
- Deployment fails or rollback is required.
