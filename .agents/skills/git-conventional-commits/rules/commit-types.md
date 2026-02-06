# Commit Type Detection Rules

## Auto-Detection Logic

Based on the git diff, automatically detect the most appropriate commit type:

### feat (New Feature)
- New files added to src/, features/, or components/
- New functions or classes with significant functionality
- New exports or APIs added

### fix (Bug Fix)
- Changes to existing src/ or component files
- Modifications to error handling
- Changes that fix broken functionality

### docs (Documentation)
- Changes to .md files (README, docs/, etc.)
- Changes to code comments or docstrings
- JSDoc/TypeDoc updates
- No changes to actual source code

### style (Formatting)
- Changes to formatting (spaces, tabs, semicolons)
- Changes to linting configuration
- No changes to code logic or meaning

### refactor (Code Refactoring)
- Restructuring code without changing functionality
- Renaming variables/functions without changing behavior
- Reorganizing imports or file structure

### perf (Performance)
- Optimizations to algorithms
- Caching implementations
- Bundle size reductions
- Performance-specific changes

### test (Tests)
- Changes to test files (*.test.ts, *.spec.ts, __tests__/)
- Adding new test cases
- Fixing existing tests

### build (Build Changes)
- Changes to package.json, package-lock.json
- Changes to build scripts (webpack, vite, tsconfig, etc.)
- Changes to dependency versions

### ci (CI/CD Changes)
- Changes to .github/workflows/
- Changes to CI configuration files
- Changes to deployment configurations

### chore (Maintenance)
- Changes to .gitignore
- Changes to configuration files that don't fit other categories
- Routine maintenance tasks
- Dependency updates that don't affect functionality

## Detection Fallback

If auto-detection is uncertain, ask the user to select from the list above.
