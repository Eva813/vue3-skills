---
name: Create Git Commit with Preview
description: Create a conventional commit with mandatory preview and user confirmation
tools: [bash, ask_user]
---

# Git Conventional Commit Handler (with Preview & Confirmation)

This handler implements the complete Conventional Commits workflow with mandatory preview before submission.

## Workflow

### Phase 1: Analyze Current State
Gather git status and determine what needs to be committed.

```bash
git status --short
git diff --cached
git diff
```

### Phase 2: Stage Changes
Based on analysis, stage the appropriate files:
```bash
git add [files]
```

### Phase 3: Determine Commit Type
Using the rules in `rules/commit-types.md`, detect the appropriate commit type from the staged changes:
- **feat**: New features (new files, new APIs)
- **fix**: Bug fixes (changes to existing functionality)
- **docs**: Documentation only (README, .md files)
- **style**: Formatting changes (no logic change)
- **refactor**: Code restructuring (no logic change)
- **perf**: Performance optimizations
- **test**: Test additions/fixes
- **build**: Build system changes (package.json, tsconfig, etc.)
- **ci**: CI/CD changes (.github/workflows)
- **chore**: Maintenance, configuration, no functional change

### Phase 4: Generate Commit Message
Create the commit message following Conventional Commits format:

**Format**: `{type}: {subject}`

**Rules** (from `rules/message-validation.md`):
1. Subject line: max 50 characters (including type prefix)
2. Capitalize first letter after type
3. No period at end of subject
4. Use imperative mood (Add, Fix, not Added, Adds)
5. Optional body: explain WHAT and WHY, not HOW
6. Body: wrap at 72 characters
7. Blank line between subject and body

**Examples**:
- ✅ `feat: Add user authentication system`
- ✅ `fix: Prevent race condition in event handler`
- ❌ `feat: add user authentication system` (not capitalized)
- ❌ `feat: Added user authentication system.` (not imperative, has period)

### Phase 5: Display Preview and Request Confirmation

Display the formatted message to the user in a clear, readable format:

```
┌─────────────────────────────────────────────────────────┐
│              📋 COMMIT MESSAGE PREVIEW                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ {type}: {subject}                                       │
│                                                          │
│ {body line 1}                                           │
│ {body line 2}                                           │
│ {body line 3}                                           │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ 📊 Changes: {file count} files, {lines} insertions      │
└─────────────────────────────────────────────────────────┘
```

**Display Implementation**:
1. Use a clear box format with border characters (┌─┬┐│├┼┤└┴┘)
2. Show full subject line at the top
3. Show complete body text (all lines visible)
4. Show statistics about changed files
5. Leave adequate whitespace so text is readable
6. Use emoji icons for visual clarity (📋 for preview, ✅/❌ for actions)

**Then use ask_user tool** with explicit choices:
- `✅ Confirm and commit`
- `❌ Cancel commit`

The user must be able to READ the entire commit message clearly in the terminal/UI before being asked to confirm.

### Phase 6: Execute Commit (Only if Confirmed)
If user confirms, execute:
```bash
git commit -m "{type}: {subject}" -m "{body}"
```

If user cancels, abort with clear message without committing.

## Example Flow

```
$ git status
  Changes not staged for commit:
    modified: src/auth.js

$ [Tool analyzes] → Detects "fix" type

$ [Tool generates]
  fix: Resolve token expiration bug

  Added refresh token logic to handle expired
  sessions automatically. This prevents users
  from being logged out unexpectedly.

$ [Tool displays preview and asks]
  ✅ Confirm and commit
  ❌ Cancel and edit

$ [User confirms]

$ git commit -m "fix: Resolve token expiration bug" -m "Added refresh token logic..."
  [main abc1234] fix: Resolve token expiration bug
```

## Implementation Notes

- Always show preview before committing
- Wait for explicit user confirmation via ask_user tool
- Never auto-commit without user approval
- Validate message against all 7 rules before preview
- Support both English and Traditional Chinese message language
