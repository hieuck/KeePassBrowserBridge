# Project Instructions for Claude Code

This repository uses the Kimchi autonomous agent for routine development tasks. When you work in this project, coordinate with the Kimchi setup rather than override it.

## Communication

- Communicate with the user in **Vietnamese**.
- All code, comments, commit messages, PR titles/descriptions, and documentation must be in **English**.

## Source of Truth

Before any action, read:

1. `.kimchi/AGENTS.md` — project-level operating rules.
2. `.kimchi/AUTONOMY.md` — autonomy opt-in and allowed actions.
3. `.kimchi/MEMORY.md` — project memory index.
4. Relevant files under `.kimchi/memory/` for the current task.

## How to Work Here

- Use the conventions in `.kimchi/memory/conventions.md`.
- Follow TDD for features and bugfixes.
- Run verification (tests, lint, type checks) before claiming work is done.
- Prefer the dedicated tools (`read`, `edit`, `write`, `grep`, `find`, `ls`) over raw shell commands.
- For high-risk actions (merge, deploy, dependency changes), defer to the internal review protocol defined in `.kimchi/AGENTS.md`.
- Update `.kimchi/memory/` when you learn something future work should remember.
- Write concise status updates in Vietnamese to the user.

## What Not to Do

- Do not duplicate Kimchi's autonomous workflows unless explicitly asked.
- Do not ignore the guardrails in `.kimchi/AGENTS.md`.
- Do not expose secrets in logs, PR descriptions, or external services.
- Do not run destructive commands on `main`, `master`, `release/*`, or protected branches without explicit user approval.
