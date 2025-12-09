# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command (Bun/Next.js/TypeScript/Tailwind defaults enforced by the constitution).

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (strict, zero `any`)  
**Primary Dependencies**: Next.js App Router, React (RSC-first), Tailwind CSS, Bun tooling (required)  
**Storage**: [if applicable, e.g., PostgreSQL, files or N/A]  
**Testing**: Bun test runner (`bun test`)  
**Target Platform**: Web (Next.js App Router)  
**Project Type**: Web (App Router, React Server Components by default)  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Tooling**: All commands MUST use Bun (`bun install`, `bun run`, `bun test`). npm/yarn/pnpm are forbidden in plans, specs, scripts, and CI.
- **Framework**: Next.js App Router required. RSC-first; justify any Client Component (`"use client"`) by documenting the user interactivity that requires it.
- **Language**: TypeScript strict; `any` is forbidden. No JavaScript files.
- **UI & Naming**: Tailwind utility classes only (no CSS-in-JS). Components use named exports, files/folders are kebab-case, React components are PascalCase.
- **State**: Use URL search params for shareable/persistent state; `useState` only for transient UI; avoid global state libraries unless explicitly required by the spec.
- **Simplicity & Dependencies**: Prefer standard library/Bun-native APIs; any new dependency must be justified in the plan/spec before use.
- **Testing**: Tests run with `bun test` (unit/integration). Plans must enumerate required tests and their placement.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
