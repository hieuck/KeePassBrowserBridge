---
name: kimchi-internal-review
description: Use before high-risk or irreversible autonomous actions such as merge, deploy, dependency changes, or secrets handling
---

# Internal Review Protocol (Replaces Routine Human Approval)

For high-risk or irreversible actions, do not ask the user for routine approval. Instead, spawn a `Reviewer` subagent and follow `requesting-code-review` / `receiving-code-review`.

### When to Trigger Internal Review

- Merging a pull request.
- Force-pushing or rewriting history.
- Deploying to any environment.
- Deleting a main/release branch or important tag.
- Adding, removing, or upgrading dependencies.
- Changing CI/CD configuration, secrets handling, or authentication.
- Any action that is hard to undo or affects teammates/production.

### Review Process

1. Pause the action.
2. Prepare a shared review context: diff, motivation, rollback plan, risk assessment, and relevant project memory.
3. Spawn a **Review Panel** of specialized subagents in parallel. Each reviewer must load `receiving-code-review` and focus on one domain:
   - **Correctness Reviewer**: Does the change do what it claims? Are there logic errors or edge cases?
   - **Security Reviewer**: Are there secrets, injection risks, permission issues, or unsafe dependencies?
   - **Architecture / Performance Reviewer**: Is the design sound, scalable, and consistent with project conventions?
   - **Test / Verification Reviewer**: Are tests sufficient, correct, and covering edge cases?
4. Collect all reviews and aggregate the results.
5. If **all reviewers approve** with no material concerns, execute the action and log the decision.
6. If **any reviewer raises material concerns**, address them and re-run the review for the affected domain. If you cannot resolve the concerns autonomously, escalate to the user.
7. If **reviewers disagree**, prioritize Security > Correctness > Architecture > Test coverage. Escalate to the user if the disagreement cannot be resolved.

### Reviewer Independence

- Reviewers must not see each other's reviews before writing their own.
- The agent orchestrating the review must not bias reviewers with leading questions.
- Each reviewer's output must include: verdict (approve / request changes / block), reasoning, and specific findings.
