# Message Validation Rules

## The 7 Rules of a Great Git Commit Message

### 1. Separate subject from body with a blank line
- Subject line and body must be separated by exactly one blank line
- If no body, this rule is automatically satisfied

### 2. Limit the subject line to 50 characters
- Hard limit: 50 characters
- Warn if approaching limit (>45 chars)
- Format: `{type}: {subject}`
- Include the type and colon in the character count

### 3. Capitalize the subject line
- First letter after the type and colon must be capitalized
- Examples:
  - ✅ `feat: Add user authentication`
  - ❌ `feat: add user authentication`

### 4. Do not end the subject line with a period
- Subject line must NOT end with `.`
- Examples:
  - ✅ `feat: Add user authentication`
  - ❌ `feat: Add user authentication.`

### 5. Use the imperative mood in the subject line
- Use commands, as if requesting an action
- Present tense, not past tense
- Examples:
  - ✅ `feat: Add user authentication`
  - ✅ `fix: Prevent race condition`
  - ❌ `feat: Added user authentication`
  - ❌ `feat: Adds user authentication`

### 6. Wrap the body at 72 characters
- Each line in the body should not exceed 72 characters
- Helps with viewing in terminals and git log
- Only applies if body is present

### 7. Use the body to explain what and why vs. how
- Explain the motivation for the change
- Explain the impact/consequences
- Do NOT explain how the code works (that's what code is for)
- Use body for "what changed" and "why" - not implementation details

## Validation Messages

- **Subject too long**: "Subject line exceeds 50 characters (current: {length}). Please shorten."
- **Missing imperative mood**: "Subject should use imperative mood (e.g., 'Add' not 'Added')"
- **Period at end**: "Subject line should not end with a period (.)"
- **Not capitalized**: "Subject line should start with a capital letter"
- **Body too long**: "Body line {line_number} exceeds 72 characters (current: {length})"

## Language-Specific Rules

### English (en)
- Standard English grammar and conventions
- Capitalize proper nouns

### Traditional Chinese (zh-TW)
- Use simplified Chinese characters when appropriate
- No period (。) at the end of subject line (though Chinese typically uses it)
- Can use full-width punctuation in body
