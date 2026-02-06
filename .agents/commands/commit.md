---
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), ask_user, view
description: Create a git commit with mandatory preview and user confirmation
---

## Context

- Current git status: !`git status`
- Current git diff (staged and unstaged changes): !`git diff HEAD`
- Current branch: !`git branch --show-current`
- Recent commits: !`git log --oneline -10`

## Your task

Create a single git commit following Conventional Commits format with MANDATORY preview and user confirmation before execution.

### Step 1: Analyze and Stage Changes
1. Review the git status and diff
2. Detect the commit type (feat, fix, docs, style, refactor, perf, test, build, ci, chore)
3. Stage appropriate files using `git add`
4. Get file statistics: `git diff --cached --stat`

### Step 2: Generate Commit Message
Create the message in this format:
```
{type}: {subject}

{body explaining what and why}
```

Rules:
- Subject: max 50 chars, capitalized, imperative mood, no period
- Body: wrap at 72 chars, explain WHAT and WHY (not HOW)

### Step 3: Create Preview File
Generate a plain text file showing the full message (do not truncate). Example:

```
════════════════════════════════════════════════════════════
                    COMMIT MESSAGE PREVIEW
════════════════════════════════════════════════════════════

{type}: {subject}

{body - all lines visible}
{body - all lines visible}

────────────────────────────────────────────────────────────
Files: X changed | +Y insertions | -Z deletions
  • file1
  • file2
════════════════════════════════════════════════════════════
```

Save this preview to a temporary file or display it directly.

### Step 4: Request User Confirmation
Use ask_user tool with choices:
- ✅ Yes, confirm and commit
- ❌ No, cancel commit

The user must explicitly approve before proceeding.

### Step 5: Execute Commit ONLY if Confirmed
If user chose "✅ Yes, confirm and commit":
```
git commit -m "{type}: {subject}" -m "{body}"
```

If user chose "❌ No, cancel commit":
Return without executing git commit and inform user that commit was cancelled.

## CRITICAL REQUIREMENTS

- DO NOT skip the preview step
- DO NOT skip the confirmation step
- Show the COMPLETE commit message (no truncation, no "..." indicators)
- Wait for explicit user approval via ask_user before git commit
- Only execute git commit if user explicitly confirms