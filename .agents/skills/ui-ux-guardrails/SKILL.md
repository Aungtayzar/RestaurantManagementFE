# UI/UX Guardrails Skill

**Purpose:** Maintain consistent, accessible, responsive, and user-friendly UI/UX across the entire codebase.

## Rules

1. **Consistency:** Follow existing design patterns, colors, typography, spacing, and layouts.
2. **Reusability:** Reuse existing components before creating new ones.
3. **Design System:** Use established design tokens. Avoid arbitrary styling and hardcoded values.
4. **Responsiveness:** Ensure interfaces work across mobile, tablet, and desktop.
5. **Accessibility:** Follow WCAG 2.2 AA guidelines, including keyboard navigation, contrast, and semantic HTML.
6. **UX:** Keep navigation intuitive, interactions predictable, and interfaces simple.
7. **States:** Handle loading, empty, error, success, hover, focus, and disabled states where applicable.
8. **Visual Hierarchy:** Maintain consistent alignment, spacing, readability, and component sizing.
9. **Minimal Changes:** Avoid unnecessary redesigns or modifications to unrelated components.
10. **Validation:** Check responsiveness, accessibility, visual consistency, and functionality before completion.

## Colours and Typography
Use the established color palette and typography for all UI elements.
The establishhed palette and typography is defined in `main.css` and should be used consistently across the application. Avoid introducing new colors or typography unless absolutely necessary and approved.

## Workflow

1. Inspect existing UI components and patterns.
2. Reuse established styles and components.
3. Implement changes following project conventions.
4. Validate consistency, responsiveness, and accessibility.

**Core Principle:** Every new UI must look and behave like a natural part of the existing application. Never introduce inconsistent design patterns without a clear reason.
