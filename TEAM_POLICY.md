# Team Policy

This document defines the default engineering rules for this repository. It is intentionally short. When in doubt, follow this file first and use `STYLEGUIDE.md` for rationale and detail.

## Core Rule

Write code that is easy to understand, safe to change, and cheap to review.

## Non-Negotiables

- Prefer clarity over cleverness.
- Keep responsibilities narrow.
- Make side effects obvious.
- Preserve local consistency.
- Avoid unnecessary churn in unrelated files.

## Architecture Rules

- UI components render and compose UI.
- Hooks encapsulate reusable interaction logic.
- Zustand stores manage shared client state.
- Database reads, writes, and sync logic stay in `frontend/src/database/**`.
- Logging goes through `reportError` and `reportInfo`.

Do not move persistence, sync orchestration, or monitoring policy into presentational components.

## Clean Code Rules

- Use names that describe domain intent.
- Keep functions small enough that one name describes the whole body.
- Prefer guard clauses over deep nesting.
- Extract code when a block needs a comment to explain what it does.
- Do not hide business logic inside vague generic helpers.

## TypeScript Rules

- Keep frontend code strict-type-safe.
- Avoid `any`; use `unknown` and narrow explicitly.
- Prefer explicit return types on exported functions and model methods.
- Use `import type` for type-only imports.
- Keep nullability explicit.

## Error Handling Rules

- Validate inputs at public boundaries.
- Throw explicit errors when invariants are broken.
- Handle user-facing recovery at the UI edge.
- Log failures with context, but do not log sensitive payloads carelessly.
- Do not use raw `console.*` in frontend feature code.

## Async Rules

- Prefer `async` and `await`.
- Use `Promise.all` when all operations must succeed.
- Use `Promise.allSettled` when partial failure is acceptable.
- Keep async functions focused on one responsibility.

## Testing Rules

- Update tests when behavior changes.
- Test behavior and contracts, not implementation trivia.
- Cover failure paths when they matter to the feature.
- Keep tests colocated in `tests/` folders.

## Formatting Rules

Default frontend TypeScript formatting:

- 2 spaces
- semicolons
- single quotes
- trailing commas
- `@/` imports for frontend `src`

Match the local file style before introducing broader formatting cleanup.

## Review Checklist

Before merging, verify:

- the main path is easy to understand
- names are specific and honest
- each function has one coherent job
- side effects are visible
- data access remains in the data layer
- logging uses the monitoring helpers
- error handling is at the correct boundary
- changed behavior has adequate tests
- the diff does not include unnecessary style churn

## Default Decision

If two solutions both work, choose the one that is:

- simpler
- more explicit
- easier to test
- easier to remove later
