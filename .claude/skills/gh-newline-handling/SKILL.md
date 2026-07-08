---
name: gh-newline-handling
description: Use when creating or updating GitHub PRs, issues, or comments with the gh CLI to avoid mangled newlines
---

# GitHub CLI Newline Handling

## Problem

When using the GitHub CLI (`gh`) to create or update pull requests, issues, or comments, inline `\n` escape sequences are often interpreted literally or mangled by Windows shells. This produces broken bodies with visible `\n` characters instead of actual line breaks.

## Rule

Never pass raw `\n` literals inside `--body`. Use one of the approaches below.

## Approach 1: `--body-file` with a Temporary File (Preferred)

Write the body to `.kimchi/tmp/` inside the repository, then reference it with `--body-file` or `-F`. Clean up the file after the command succeeds.

### Bash/Git Bash

```bash
mkdir -p .kimchi/tmp
if ! grep -q "^\.kimchi/tmp/$" .gitignore 2>/dev/null; then
  echo ".kimchi/tmp/" >> .gitignore
fi
tmpfile=".kimchi/tmp/gh-pr-$(date +%s)-body.md"
cat > "$tmpfile" << 'EOF'
## Summary

Brief description of the change.

## Changes

- Change one
- Change two
EOF
gh pr create --title "feat: add new feature" --body-file "$tmpfile"
rm -f "$tmpfile"
```

### PowerShell

```powershell
New-Item -ItemType Directory -Force -Path ".kimchi/tmp" | Out-Null
$pattern = ".kimchi/tmp/"
if (-not (Test-Path ".gitignore") -or -not (Select-String -Path ".gitignore" -Pattern $pattern -SimpleMatch -Quiet)) {
    Add-Content -Path ".gitignore" -Value $pattern
}
$timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$tmpfile = ".kimchi/tmp/gh-pr-$timestamp-body.md"
@"
## Summary

Brief description of the change.

## Changes

- Change one
- Change two
"@ | Set-Content -NoNewline -Path $tmpfile
gh pr create --title "feat: add new feature" --body-file $tmpfile
Remove-Item -Path $tmpfile -Force
```

## Approach 2: Build the Body in the Shell

If `--body-file` is unavailable, build the body with shell tools instead of embedding `\n`.

### Bash/Git Bash

```bash
body=$(printf '%s\n' "## Summary" "" "Description here." "" "## Changes" "- item one" "- item two")
gh pr create --title "feat: add new feature" --body "$body"
```

### PowerShell

```powershell
$body = @"
## Summary

Description here.

## Changes

- item one
- item two
"@
gh pr create --title "feat: add new feature" --body $body
```

## Naming Convention for Temporary Files

Use descriptive names to avoid collisions when multiple PRs, issues, or comments are created in the same cycle:

- `.kimchi/tmp/gh-pr-<number>-body.md`
- `.kimchi/tmp/gh-pr-<number>-comment-<seq>.md`
- `.kimchi/tmp/gh-pr-<number>-review.md`
- `.kimchi/tmp/gh-issue-<number>-body.md`
- `.kimchi/tmp/gh-issue-<number>-comment-<seq>.md`
- If no stable number exists: `.kimchi/tmp/gh-<timestamp>-<purpose>.md`

## Verification

After posting, open the PR/issue/comment on GitHub and verify that newlines are rendered correctly. If newlines are missing or displayed as `\n`, fix the generation method and retry.

## What to Avoid

```bash
# BAD
gh pr create --title "feat: x" --body "line1\nline2\nline3"
```
