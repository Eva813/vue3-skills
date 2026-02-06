---
name: git-conventional-commits
description: Professional git commit workflow with Conventional Commits format. Enforces commit type categorization (feat, fix, docs, style, refactor, perf, test, build, ci, chore), validates messages against the 7 rules of great commits, previews before committing, and supports multiple languages. Use when you need to create high-quality, traceable git commits.
license: MIT
metadata:
  author: User
  version: '1.0.0'
---

# Git Conventional Commits Skill

Professional git commit workflow that enforces best practices and conventions.

## Features

- **Conventional Commits Format**: Categorize commits by type (feat, fix, docs, style, refactor, perf, test, build, ci, chore)
- **Message Validation**: Adheres to the 7 rules of great git commits:
  - Separate subject from body with a blank line
  - Limit the subject line to 50 characters
  - Capitalize the subject line
  - Do not end the subject line with a period
  - Use the imperative mood in the subject line
  - Wrap the body at 72 characters
  - Use the body to explain what and why vs. how
- **Auto-Detection**: Intelligently detects commit type based on file changes
- **Preview & Confirmation**: Shows formatted commit message before committing
- **Multi-Language Support**: English and Traditional Chinese (繁體中文)

## Commit Types

| Type | Description |
|------|-------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting, white-space, or semi-colon changes (no code meaning change) |
| `refactor` | A code change that neither fixes a bug nor adds a feature |
| `perf` | Code that improves performance |
| `test` | Adding missing tests or correcting existing ones |
| `build` | Changes to build-related components or dependencies |
| `ci` | Changes to the CI/CD setup |
| `chore` | Routine tasks or maintenance |

## When to Use

Reference this skill when you need to:

- Create a git commit with proper conventional format
- Ensure commit messages follow best practices
- Auto-detect the type of change being committed
- Preview and confirm commit messages before finalizing
- Support multiple commit message languages

## Example Usage

```bash
# Invoke the skill when you have staged or unstaged changes
# The skill will:
# 1. Auto-detect commit type based on changes
# 2. Prompt for subject line (max 50 chars)
# 3. Optionally prompt for body (wrapped at 72 chars)
# 4. Show formatted message for preview
# 5. Request confirmation
# 6. Execute git commit
```

## Configuration

- **Default Language**: English
- **Commit Body**: Optional (automatically included when explaining "why" for complex changes)
- **Message Validation**: All messages validated against 7 rules before committing
