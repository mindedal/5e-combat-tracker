# Tasks: Encounter Persistence & Shareable Sessions

**Input**: Design documents from `/specs/001-save-share-encounters/`  
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Required by constitution. All tests MUST run with `bun test`.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal shared setup for persistence/share features

- [x] T001 Create storage/version constants in `app/lib/encounter-constants.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core helpers and schemas that must exist before user stories

- [x] T002 [P] Define encounter snapshot types and validation helpers in `app/lib/encounter-types.ts`
- [x] T003 [P] Implement base64url encode/decode utilities with size calculation in `app/lib/encounter-share.ts`
- [x] T004 [P] Implement safe localStorage read/write helpers in `app/lib/encounter-storage.ts`
- [x] T005 Add versioned storage migration/compatibility handling in `app/lib/encounter-storage.ts`
- [x] T006 Add share payload size guard and error mapping in `app/lib/encounter-share.ts`
- [x] T006A [P] Add unit tests for base64url encode/decode and size guards in `tests/encounter-share.test.ts`
- [x] T006B [P] Add unit tests for localStorage helpers (read/write/migrate/invalid data) in `tests/encounter-storage.test.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Save and Restore an Encounter (Priority: P1) 🎯 MVP

**Goal**: Save the current encounter to local storage and restore it later.

**Independent Test**: Save an encounter, reload the app, and restore it with identical participants, initiative, HP, and conditions.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create save encounter panel (name + save action) in `app/components/save-encounter-panel.tsx`
- [x] T008 [P] [US1] Create saved encounters list (load/delete actions) in `app/components/saved-encounters-list.tsx`
- [x] T009 [US1] Wire save/load/delete actions to storage helpers in `app/page.tsx`
- [x] T010 [US1] Add storage-unavailable and save-error messaging in `app/components/save-encounter-panel.tsx`
- [x] T011 [US1] Add load/delete confirmation handling in `app/page.tsx`

### Tests for User Story 1

- [x] T011A [P] [US1] Add unit tests for save/load/delete flows using storage helpers in `tests/encounter-persistence.test.ts`

**Checkpoint**: User Story 1 is fully functional and testable independently

---

## Phase 4: User Story 2 - Share an Encounter Snapshot (Priority: P2)

**Goal**: Generate a shareable link and allow recipients to load the snapshot safely.

**Independent Test**: Generate a link, open it in a fresh session, and load the snapshot without overwriting data on invalid links.

### Implementation for User Story 2

- [x] T012 [P] [US2] Create share button with copy-to-clipboard and oversize error handling in `app/components/share-encounter-button.tsx`
- [x] T013 [P] [US2] Create shared snapshot preview with load action in `app/components/shared-snapshot-preview.tsx`
- [x] T014 [US2] Parse share payload from URL search params and validate in `app/page.tsx`
- [x] T015 [US2] Connect load-from-share flow to encounter state with invalid-payload safeguards in `app/page.tsx`

### Tests for User Story 2

- [x] T015A [P] [US2] Add unit tests for share payload parsing and invalid-link handling in `tests/encounter-share-flow.test.ts`

**Checkpoint**: User Story 2 is fully functional and testable independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T016 [P] Update quickstart steps to match final UI labels in `specs/001-save-share-encounters/quickstart.md`
- [x] T017 Add user-facing version mismatch messaging in `app/page.tsx`
- [x] T018 Run quickstart.md validation against implemented flows in `specs/001-save-share-encounters/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: Depend on Foundational completion
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2)
- **User Story 2 (P2)**: Can start after Foundational (Phase 2)

### Parallel Opportunities

- Phase 2 tasks T002–T004 can run in parallel (different files)
- User Story 1 components (T007–T008) can run in parallel
- User Story 2 components (T012–T013) can run in parallel

---

## Parallel Example: User Story 1

Task: "Create save encounter panel (name + save action) in `app/components/save-encounter-panel.tsx`"  
Task: "Create saved encounters list (load/delete actions) in `app/components/saved-encounters-list.tsx`"

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. Validate User Story 1 independently

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. User Story 1 → Validate and demo
3. User Story 2 → Validate and demo
4. Polish and cross-cutting updates

### Parallel Team Strategy

- One developer handles foundational helpers (Phase 2)
- Another developer begins US1 components once Phase 2 completes
- A third developer can tackle US2 components in parallel after Phase 2
