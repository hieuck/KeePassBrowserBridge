---
name: kimchi-git-workflow
description: Use when creating branches, committing, pushing, opening PRs, merging, or deleting branches in a Kimchi-managed repository
---

# Git Workflow

Use GitHub Flow. Follow the steps below for every change.

## 1. Prepare the Workspace

Decide whether you need isolation:

- If the current workspace is clean and isolation is unnecessary, work in place.
- If isolation is beneficial, invoke `using-git-worktrees` and follow it. Remember that worktree location in a Kimchi-managed repository must stay inside the repository (`.worktrees/<branch>/` or `worktrees/<branch>/`).

## 2. Keep the Default Branch Up to Date

- Detect the default branch dynamically. Never hardcode `main` or `master`.
- Run `git fetch origin`.
- Ensure the local default branch is up to date with `git pull origin <default-branch>` or by checking out the latest remote tracking branch.

## 3. Create a Feature Branch

- Create the feature branch from the updated default branch.
- Use descriptive branch names:
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `refactor/<short-description>`

## 4. Implement and Commit

- Make small, focused commits with English messages following conventional commits.
- Stage files explicitly by name. Never use `git add -A` or `git add .`.
- Never skip hooks (`--no-verify`) unless explicitly instructed by the user.

## 5. Push the Feature Branch

- Use `git push -u origin <branch-name>` for the first push.
- Use `git push` for subsequent pushes.
- Do not force-push unless required after a rebase and the internal review protocol approves it.

## 6. Keep the Branch Up to Date with the Default Branch

Before opening or merging a PR:

- Prefer `git rebase origin/<default-branch>` for a clean history, or `git merge origin/<default-branch>` if the project discourages rebasing.
- After rebasing, force-push only with `--force-with-lease` and only after internal review.

## 7. Open a Pull Request

- Create a PR from the feature branch to the default branch.
- Use English for the PR title and description.
- Follow `gh-newline-handling` when using `gh` to create or update PRs.
- Include a clear summary, motivation, and verification evidence.

## 8. Merge After Review

- Ensure all required checks pass.
- Invoke `kimchi-internal-review` for high-risk or irreversible changes.
- Merge only after review passes.
- For low-risk changes where autonomy is permitted, you may merge after internal review. Otherwise, wait for explicit approval.

## 9. Delete the Feature Branch

After merging:

- Delete the remote feature branch: `git push origin --delete <branch-name>`.
- Delete the local feature branch: `git branch -d <branch-name>`.
- If a worktree was used, remove it with `git worktree remove <path>` and clean up the directory.

## 10. Never on Protected Branches

Never run destructive commands (`git reset --hard`, `git push --force`, `git branch -D`, `git clean -f`) on `main`, `master`, `release/*`, or protected branches without explicit user approval.
