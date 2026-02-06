---
name: Format and Preview Commit Message
description: Display commit message in a clear, readable format before requesting confirmation
tools: [ask_user]
---

# Commit Message Display and Preview Handler

This handler is responsible for formatting and displaying the commit message in a way that users can clearly see and understand before confirmation.

## Display Format and Storage

**File Storage Location**: `~/.copilot/session-state/{session_id}/commit_preview.txt`

**Why session temporary directory?**
- Does NOT pollute the project directory
- Will NOT be tracked by git
- Automatically cleaned up when session ends
- User can easily locate it in their session folder

The commit message MUST be displayed in a clear, readable format that shows:
1. The complete subject line
2. The complete body (if present)
3. Statistics about the changes

### Plain Text Format (User-Friendly)

```
════════════════════════════════════════════════════════════
                     COMMIT MESSAGE PREVIEW
════════════════════════════════════════════════════════════

TYPE: SUBJECT

BODY TEXT LINE 1
BODY TEXT LINE 2
BODY TEXT LINE 3
... (all body text visible)

────────────────────────────────────────────────────────────
Files: 3 changed | +167 insertions | -6 deletions
  • .agents/skills/git-conventional-commits/SKILL.md
  • .agents/skills/git-conventional-commits/handlers/...
  • TEST.md
════════════════════════════════════════════════════════════
```

### Display Rules

1. **Storage**: Save to `~/.copilot/session-state/{session_id}/commit_preview.txt`
2. **Header**: Section label "COMMIT MESSAGE PREVIEW"
3. **Subject Line**: `{TYPE}: {SUBJECT}` on single line
4. **Body Text**: Plain text, each line fully visible, no truncation
5. **Statistics**: File counts and line changes
6. **File List**: Simple bullet list of changed files
7. **Format**: Plain text with simple line separators (no box drawing)
8. **Whitespace**: Adequate line breaks for scannability

## Validation Before Display

Before displaying, validate:
- ✅ Subject line exists and is ≤ 50 characters
- ✅ Subject line is capitalized
- ✅ Subject line does not end with period
- ✅ Subject uses imperative mood
- ✅ Subject starts with valid commit type

## Confirmation Mechanism

After clear display, use ask_user with these choices:

```
Question: "Please review the commit message saved in 
~/.copilot/session-state/{session_id}/commit_preview.txt
Do you want to proceed with this commit?"

Choices:
  - ✅ Yes, confirm and commit
  - ❌ No, cancel commit
```

## Implementation Example

When the user sees the display, they must be able to:
1. Read the entire subject line clearly
2. Read the entire body (no truncation or "..." indicators)
3. See what files are being changed
4. Make an informed decision to confirm or cancel

Only proceed with git commit if user selects "✅ Yes, confirm and commit".

If user selects "❌ No, cancel commit", return control without executing git commit.
