---
name: Format and Preview Commit Message
description: Display commit message in a clear, readable format before requesting confirmation
tools: [ask_user]
---

# Commit Message Display and Preview Handler

This handler is responsible for formatting and displaying the commit message in a way that users can clearly see and understand before confirmation.

## Display Format

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

1. **Header**: Section label "COMMIT MESSAGE PREVIEW"
2. **Subject Line**: `{TYPE}: {SUBJECT}` on single line
3. **Body Text**: Plain text, each line fully visible, no truncation
4. **Statistics**: File counts and line changes
5. **File List**: Simple bullet list of changed files
6. **Format**: Plain text with simple line separators (no box drawing)
7. **Whitespace**: Adequate line breaks for scannability

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
Question: "Do you want to proceed with this commit?"

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
