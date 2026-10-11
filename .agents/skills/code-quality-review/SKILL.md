# Code Review Skill

## Purpose
Perform pragmatic code reviews focused on meaningful issues affecting correctness, security, maintainability, and performance.

## Review Checklist

### 1. Requirements
- Verify requirements are met.

### 2. Code Formatting
- Check formatting consistency.
- Flag unnecessary whitespace only when significant.

### 3. Best Practices
- Follow Single Responsibility Principle (SRP).
- Handle errors appropriately and log when necessary.
- Avoid magic values, unnecessary comments, and excessive nesting.

### 4. Maintainability
- Ensure code is readable and follows DRY.
- Flag overly complex or lengthy methods/classes.

### 5. Performance
- Identify meaningful performance issues.

### 6. Architecture
- Identify security risks.
- Follow Separation of Concerns.
- Ensure relevant parameters are configurable.
- Use feature flags when appropriate.

### 7. Testing
- Check unit and manual test coverage.
- Verify edge cases and invalid inputs.
- Ensure input validation and sanitization where necessary.
- Check peer review status when available.

### 8. Documentation
- Check essential documentation.
- Ensure README.md reflects significant changes.

## Review Guidelines
- Prioritize bugs, security risks, and maintainability problems.
- Avoid nitpicking minor formatting or stylistic preferences.
- Do not suggest unnecessary abstractions or refactoring.
- Respect existing project conventions.
- Report only actionable findings with meaningful impact.
- Do not claim tests passed unless verified.

## Output Format
For each finding, include:
- **Severity:** Critical / Major / Minor
- **Location:** File and line number
- **Issue:** Brief explanation
- **Fix:** Recommended solution

If no meaningful issues are found, state **"No significant issues found."**

Keep the review concise and practical.

