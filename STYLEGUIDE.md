# Style Guide

This guide defines how code in this repository should look, read, and evolve. It is intentionally opinionated. The goal is not only consistent formatting, but code that is easy to understand, safe to change, and cheap to review.

The standard is simple:

- code should be clear before it is clever
- structure should reveal intent
- side effects should be visible
- boundaries should be explicit
- small changes should stay small

## Scope

Apply this guide to:

- `frontend/src/**`
- `backend/functions/**`
- `backend/shared/**`
- `scripts/**`

Do not perform style-only rewrites in generated files, imported data, archived assets, or historical SQL/data files unless the task explicitly calls for cleanup.

## Core Principles

### 1. Optimize for readability

Every file should answer three questions quickly:

- what problem does this code solve
- where does the important logic live
- what can fail or mutate state

Prefer code that can be understood top to bottom without mental backtracking.

### 2. Keep responsibilities narrow

Each function, component, hook, store, or module should have one clear reason to change.

Good signs:

- a function name can describe the whole body
- a component mostly renders one view concern
- a store manages one slice of shared state
- a model method performs one database operation or one sync step

Bad signs:

- one function validates input, fetches data, transforms it, updates UI state, logs analytics, and handles navigation
- one component owns rendering, data loading, retry logic, persistence, and domain rules

### 3. Prefer explicitness over magic

Avoid hidden coupling.

- make data flow obvious
- keep side effects close to the code that depends on them
- prefer straightforward control flow over clever abstraction
- do not hide domain behavior inside overly generic helpers

### 4. Preserve local consistency

Repository-wide standards matter, but local consistency matters more while editing a specific area.

If a folder already follows a clear pattern, stay consistent with that pattern unless you are deliberately standardizing the whole area.

## Clean Code Rules

### Naming

Names should explain purpose, not implementation trivia.

- prefer domain names over generic names such as `data`, `handler`, `value`, `temp`
- use names that reveal meaning, for example `resetItemsByBlockId` instead of `resetBlock`
- avoid abbreviations unless they are already established in the project, such as `db`, `rpc`, `SRS`
- avoid misleading names like `helper`, `manager`, `utils` when a more specific noun exists

Use these naming defaults:

- components, classes, types, enums: `PascalCase`
- functions, variables, hooks, store actions: `camelCase`
- exported constant maps: `UPPER_SNAKE_CASE`
- SQL and persisted database fields: `snake_case`

File naming:

- React components: `PascalCase.tsx`
- utilities, hooks, models: follow the existing local convention in the folder
- tests: colocated under `tests/` using `*.test.ts` or `*.test.tsx`

### Functions

Functions should be small, direct, and intention-revealing.

- prefer guard clauses over nested `if` pyramids
- keep the number of branches small
- prefer one level of abstraction per function
- extract helper functions when a block needs its own name
- pass the minimum data needed, not whole objects by default

A function usually needs refactoring when:

- the name no longer covers all its behavior
- comments are needed to explain control flow
- there are several unrelated sections inside the body
- you need to scroll to understand it

### Control Flow

- prefer early return over deep nesting
- prefer straightforward branching over compact ternary chains when readability drops
- keep exceptional paths visually separate from the happy path
- avoid boolean flag combinations that create unclear behavior

### Comments

Comments are a last resort for explaining code that could not be made obvious.

Use comments for:

- non-obvious business rules
- architectural constraints
- external API or storage quirks
- warnings about intentional tradeoffs

Do not use comments for:

- narrating obvious steps
- compensating for poor naming
- describing stale implementation details

If code needs explanation, first try to rename or extract.

## Project Architecture Rules

### Frontend

The frontend is a strict TypeScript React application with a local-first architecture. Preserve that shape.

- components render UI
- hooks coordinate reusable interaction logic
- stores manage shared client state
- database models and sync utilities own persistence behavior
- monitoring helpers own application logging

Do not move database writes, sync orchestration, or monitoring policy into presentational components.

### Components

- prefer function components
- keep route-level components thin
- extract reusable or domain-heavy logic into hooks or feature modules
- keep JSX shallow enough to scan quickly
- prefer composition over giant configurable components

Component props should be:

- minimal
- explicit
- hard to misuse

Use `Readonly` props types when practical.

### Hooks

Hooks should encapsulate reusable behavior, not act as vague service containers.

- names must start with `use`
- expose a small, stable API
- keep effect setup and cleanup obvious
- prefer `useEffectEvent` where it reduces stale-closure risk and clarifies event handling

### Zustand Stores

- one store should own one concern
- state and actions should be explicit
- keep imperative side effects limited and intentional
- do not let stores become dumping grounds for unrelated workflow logic

When behavior becomes heavily async, branching, or domain-oriented, consider moving the logic into a dedicated module and calling it from the store.

### Data Layer

The Dexie model layer is part of the architecture, not an implementation detail.

- all IndexedDB reads and writes belong under `frontend/src/database/**`
- model methods should be domain-specific and explicit
- shared data conversion belongs in utilities, not duplicated in callers
- sync logic should remain centralized
- multi-write operations should use transactions when atomicity matters

Treat null-replacement values and sync timestamps as part of the persistence contract. Do not casually change their meaning.

## TypeScript Standards

The frontend runs in strict mode. Write code that works with that constraint, not around it.

- avoid `any`
- use `unknown` when type is truly unknown, then narrow explicitly
- prefer explicit return types on exported functions and model methods
- use `import type` for type-only imports
- prefer narrow unions and `as const` over loose strings
- keep nullability explicit
- do not patch over broken typing with broad assertions unless there is no local alternative

Runtime validation still matters. Use existing assertion helpers at public boundaries where invalid inputs would otherwise create hidden failures.

## Error Handling and Logging

Errors should either be handled meaningfully or allowed to fail loudly. Silent failure is not acceptable.

### Error handling

- validate inputs early
- throw explicit errors when invariants are broken
- handle errors at the layer that can make a useful decision
- keep user-facing recovery at the UI boundary

Recommended pattern:

1. lower layers validate and throw
2. orchestration layers add context when needed
3. UI boundaries show user feedback and log the failure

### Logging

Use the existing monitoring boundary.

- use `reportError` for failures worth monitoring
- use `reportInfo` for operational diagnostics and significant lifecycle events
- avoid raw `console.*` calls in app code outside the monitoring layer
- log enough context to debug, but do not log sensitive payloads carelessly

Do not add logging that only duplicates what the code already says unless it provides operational value.

## Async and Side Effects

Async code should make ordering and failure behavior obvious.

- prefer `async` and `await`
- use `Promise.all` when all results are required
- use `Promise.allSettled` when partial failure is acceptable and should be inspected
- keep async functions focused on one responsibility
- separate pure transformation from effectful operations when practical

Side effects should be easy to spot. If a function mutates state, writes to storage, logs, dispatches events, and returns data, the reader should see that immediately from structure and naming.

## Formatting

Formatting supports readability; it is not the goal by itself.

### Frontend TypeScript

Follow the established formatter and linting setup:

- semicolons enabled
- single quotes
- trailing commas `all`
- `printWidth: 100`
- `tabWidth: 2`
- Tailwind class sorting through `prettier-plugin-tailwindcss`

Do not create noisy diffs by reordering imports or reformatting untouched code without a reason.

### Backend TypeScript

- when editing an existing file, match its local style first
- for new files, prefer the frontend TypeScript formatting defaults

### Python Scripts

- use 4 spaces for new code
- prefer small helpers and clear runner entry points
- avoid style-only rewrites in old scripts unless already editing them for behavior

## File and Module Boundaries

- prefer `@/` imports in frontend code for `src` modules
- avoid deep relative paths when alias imports are clearer
- avoid circular dependencies
- keep modules cohesive: one file should usually expose one primary concept
- do not create shared abstractions too early; duplicate once, abstract later when the pattern is stable

## Testing

Tests are part of maintainability, not a cleanup step at the end.

- add or update tests when behavior changes
- colocate tests in existing `tests/` folders
- test behavior and contracts, not implementation trivia
- mock infrastructure boundaries deliberately
- cover failure paths where business logic depends on them

High-value tests in this repository usually cover:

- model and sync behavior
- store actions and state transitions
- hook behavior
- route-level UI flows
- error handling and fallback states

## Review Heuristics

Before merging, check these questions:

- can a new reader understand the main path quickly
- are names specific and honest
- is each function doing one coherent job
- are side effects obvious
- is data access still in the data layer
- is logging routed through the monitoring helpers
- are errors handled at the correct boundary
- did the change avoid unnecessary churn
- does changed behavior have adequate tests

If the answer to any of these is no, refactor before adding more code.

## Repository Defaults

When there is no stronger local convention, default to:

- 2 spaces in TypeScript
- semicolons
- single quotes
- explicit exported types
- functional React components
- `@/` imports in frontend
- colocated tests in `tests/`
- `reportError` and `reportInfo` for application logging

## What To Avoid

- large style-only rewrites in unrelated files
- generic abstractions that hide domain behavior
- broad `any` usage
- raw `console.*` calls in frontend feature code
- components that fetch, mutate, navigate, and render all at once without structure
- model methods that hide multiple unrelated side effects
- comments that explain code that should have been renamed
- renaming or reorganizing code only for taste

## Final Rule

Prefer code that the next maintainer can trust at a glance.

In this repository, clean code means:

- explicit responsibilities
- readable control flow
- narrow abstractions
- strong boundaries
- predictable side effects
- minimal surprise
