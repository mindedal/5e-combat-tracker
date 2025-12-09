# 5e Combat Tracker Constitution

## Core Principles

### I. Bun-Only Runtime & Tooling

- All install/run/test commands MUST use Bun (e.g., `bun install`, `bun run`, `bun test`).
- npm, yarn, and pnpm are forbidden for scripts, docs, and CI. Keep Bun lockfiles authoritative.
- Runtime assumptions, scripts, and docs MUST default to Bun; any deviation requires governance approval.

### II. Next.js App Router with RSC-First Delivery

- The framework is Next.js using the App Router. React Server Components are the default.
- Client Components (`"use client"`) are allowed only when user interactivity (hooks, event listeners) is required and MUST be justified in the plan/spec.
- Data fetching and composition should prefer server components to minimize client JavaScript.

### III. TypeScript Strictness, Zero `any`

- The language is TypeScript with `strict` mode enabled at all times.
- The `any` type is forbidden; use precise types, `unknown`, or generics with safe narrowing instead.
- Code and specs MUST assume TypeScript-first patterns; JavaScript files are not allowed.

### IV. Tailwind Utility-First UI & Naming Discipline

- Styling MUST use Tailwind CSS utility classes; CSS-in-JS libraries are forbidden.
- Components MUST use named exports (no `default` exports) to enable safe refactors.
- Files and folders MUST be kebab-case; React components MUST be PascalCase.

### V. State Discipline & Spec-Led Delivery

- Use URL search params for shareable or persistent state (filters, tabs, pagination). Use `useState` only for transient UI state.
- Avoid global state libraries (e.g., Redux) unless explicitly mandated in the spec.
- No "vibe coding": implementation MUST follow `implementation-plan.md`; change the spec/plan first when logic needs to change.
- Simplicity first: prefer the standard library and Bun-native APIs; avoid adding dependencies unless justified in the plan/spec.
- Testing MUST use Bun's native test runner (`bun test`) for unit and integration coverage.

## Additional Constraints

- Runtime: Bun is the sole package manager and executor; CI/CD MUST mirror local Bun commands.
- Framework: Next.js App Router only; adhere to RSC-first patterns.
- Language & Types: TypeScript strict, zero `any`; include explicit typing and narrowing.
- UI: Tailwind utility classes only; no CSS-in-JS; maintain kebab-case paths and PascalCase components; named exports required.
- State: URL search params for shareable state, `useState` for transient; avoid global state libs without explicit spec approval.
- Dependencies: Do not add packages if the same can be done with standard APIs or Bun built-ins.
- Testing: Use `bun test`; integration and unit suites should live alongside features when possible.

## Development Workflow & Quality Gates

- Constitution Check is mandatory before Phase 0 research and re-checked after Phase 1 design (see plan template gates).
- Plans/specs MUST document any Client Component justification, dependency additions, or state strategy choices.
- Code review MUST verify: Bun-only commands, RSC-first usage, Tailwind-only styling, named exports, kebab-case paths, PascalCase components, and absence of `any`.
- CI MUST run `bun test` and fail on constitution violations (naming, export form, prohibited tools, or styling breaches).
- Specs and plans MUST be updated before implementing any logic changes; deviations require governance approval.

## Governance

- This constitution supersedes other practices. Amendments require documented rationale, updated versioning, and migration notes in affected specs/plans.
- Versioning follows semantic rules: MAJOR for incompatible governance/principle changes, MINOR for new principles/sections, PATCH for clarifications.
- Ratification records the original adoption date; Last Amended is updated with every change.
- Reviews must include a Constitution compliance check; CI/QA pipelines SHOULD enforce these gates automatically.
- Runtime guidance (README, templates) must stay synchronized with this constitution after every amendment.

**Version**: 1.0.0 | **Ratified**: 2025-12-09 | **Last Amended**: 2025-12-09
