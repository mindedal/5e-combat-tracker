# Implementation Plan: Encounter Persistence & Shareable Sessions

**Branch**: `001-save-share-encounters` | **Date**: 2026-02-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-save-share-encounters/spec.md`

**Note**: This plan follows Bun/Next.js/TypeScript/Tailwind defaults enforced by the constitution.

## Summary

Deliver encounter persistence and shareable session links by storing a versioned encounter snapshot in local storage and encoding snapshots into URL search params for collaboration. The share link uses base64url JSON with strict length checks to ensure cross-browser reliability. Client components are used only for interactive save/load/share controls and local storage access.

## Technical Context

**Language/Version**: TypeScript (strict, zero `any`)  
**Primary Dependencies**: Next.js App Router, React (RSC-first), Tailwind CSS, Bun tooling (required)  
**Storage**: localStorage (versioned) + URL search params for shareable state  
**Testing**: Bun test runner (`bun test`)  
**Target Platform**: Web (Next.js App Router)  
**Project Type**: Web (App Router, React Server Components by default)  
**Performance Goals**: Save/load and share-link encode/decode complete within 200–500 ms for typical encounters; shared link opens to a loadable snapshot within 10 seconds.  
**Constraints**: URL query payloads ≤ ~1,500 chars (total URL ≤ ~2,000); localStorage quota variability (5–10 MB typical); offline-capable; no external services.  
**Scale/Scope**: Single-device usage with dozens of saved encounters, each with ≤ 50 participants and typical condition counts.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- **Tooling**: All commands MUST use Bun (`bun install`, `bun run`, `bun test`). npm/yarn/pnpm are forbidden in plans, specs, scripts, and CI.
- **Framework**: Next.js App Router required. RSC-first; justify any Client Component (`"use client"`) by documenting the user interactivity that requires it.
- **Language**: TypeScript strict; `any` is forbidden. No JavaScript files.
- **UI & Naming**: Tailwind utility classes only (no CSS-in-JS). Components use named exports, files/folders are kebab-case, React components are PascalCase.
- **State**: Use URL search params for shareable/persistent state; `useState` only for transient UI; avoid global state libraries unless explicitly required by the spec.
- **Simplicity & Dependencies**: Prefer standard library/Bun-native APIs; any new dependency must be justified in the plan/spec before use.
- **Testing**: Tests run with `bun test` (unit/integration). Plans must enumerate required tests and their placement.

**Status**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/001-save-share-encounters/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
app/
├── globals.css
├── layout.tsx
├── page.tsx
└── lib/
   └── combat-logic.ts

public/

tests/
└── combat-logic.test.ts
```

**Structure Decision**: Single Next.js App Router project using the existing `app/` directory. New feature code will live in `app/` and `app/lib/`, with tests in `tests/`.

## Phase 0: Research

**Output**: [research.md](./research.md)

Key decisions:

- Share links use base64url-encoded JSON snapshots with strict length checks.
- localStorage persistence uses versioned payloads and safe read/write helpers.
- URL search params read in `page.tsx`; client components handle interactions.

## Phase 1: Design & Contracts

**Data model**: [data-model.md](./data-model.md)  
**Contracts**: [contracts/encounter-snapshots.openapi.yaml](./contracts/encounter-snapshots.openapi.yaml)  
**Quickstart**: [quickstart.md](./quickstart.md)

**Client Component Justifications**:

- Save/load/share buttons require event handlers, clipboard access, and local storage access.
- Share link parsing on the client may be needed for user confirmation flows.

**Post-Design Constitution Check**: PASS

## Phase 2: Implementation Plan

1. **Schema & storage helpers**

- Define versioned snapshot and save record types.
- Implement safe localStorage helpers with try/catch and version checks.

2. **Shareable link encoding/decoding**

- Implement base64url encode/decode helpers.
- Enforce payload length limits and surface user-facing errors when exceeded.

3. **UI integration**

- Add save/load/share UI controls (client components).
- Surface saved encounter list with load/delete actions.
- Detect share params on load and provide a preview + load action.

4. **Error handling & migrations**

- Handle invalid/corrupted snapshots without overwriting local data.
- Add version checks for saved data and show compatibility warnings.

5. **Testing**

- Unit tests for encode/decode helpers and payload size validation.
- Unit tests for localStorage helpers (read/write/migrate/invalid data).
- Update existing combat logic tests if new fields are added.

## Complexity Tracking

No constitution violations identified.
