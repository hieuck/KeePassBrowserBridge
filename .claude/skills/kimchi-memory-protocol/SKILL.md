---
name: kimchi-memory-protocol
description: Use when reading, updating, or organizing project memory in .kimchi/MEMORY.md and .kimchi/memory/
---

# Project Memory & Decision Log

Use `.kimchi/MEMORY.md` as the project's long-term memory. It compensates for the agent's lack of cross-session context and helps future cycles make better decisions.

### 14.1 What to Record

Record information that future cycles should remember:
- Project purpose, tech stack, and key conventions.
- Architecture decisions and their rationale.
- Known issues, workarounds, and technical debt.
- Lessons learned from failures or surprises.
- Active workstreams and open PRs/branches.

### 14.2 Memory Structure

Prefer a **modular memory structure** over a single large file. Use `.kimchi/MEMORY.md` as the index/table of contents and store detailed sections in `.kimchi/memory/`:

```
.kimchi/
  MEMORY.md                 # Index + table of contents
  memory/
    context.md              # Project purpose, tech stack, default branch
    adrs.md                 # Architecture decisions
    conventions.md          # Code style, branch naming, conventions
    known-issues.md         # Bugs, limitations, workarounds
    lessons.md              # Lessons learned
    workstreams.md          # Active workstreams and open branches/PRs
```

If only `.kimchi/MEMORY.md` exists, treat it as both index and content.

### 14.3 Memory Retrieval Protocol

Do not read the entire memory corpus unless it is small. Instead, retrieve relevant sections on demand.

1. **Read the index first.** Always read `.kimchi/MEMORY.md` to understand the memory structure and locate relevant sections.
2. **Identify relevant topics.** Based on the current task, decide which memory files or sections are likely relevant.
3. **Search before reading.** Use `grep` or filename search to locate keywords related to the task within `.kimchi/memory/`.
4. **Read only relevant sections.** Load the specific files or sections that match the task. Skip unrelated content.
5. **Update selectively.** After completing the task, update only the memory files or sections affected by the work.

Example retrieval flow:
```bash
# 1. Read the index
cat .kimchi/MEMORY.md

# 2. Search for relevant terms
grep -R "authentication" .kimchi/memory/
grep -R "database" .kimchi/memory/

# 3. Read only matching files
read .kimchi/memory/adrs.md
read .kimchi/memory/known-issues.md
```

### 14.4 When to Update

Update memory whenever a cycle produces new knowledge:
- After making an architecture decision.
- After discovering a bug pattern or workaround.
- After changing conventions or tooling.
- After a release with notable changes.
- After any surprise that future cycles should avoid.

Update the relevant modular file or section. Do not dump everything into `.kimchi/MEMORY.md` if modular files exist.

### 14.5 Format

- Keep each memory file concise and structured.
- Start every memory file with a short summary and a list of keywords for searchability.
- Use the template in `.kimchi/MEMORY.md` and `.kimchi/memory/*.md`.
- Prefer short bullet points over long narratives.
- Update existing entries rather than appending duplicates.
