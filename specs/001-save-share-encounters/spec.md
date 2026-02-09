# Feature Specification: Encounter Persistence & Shareable Sessions

**Feature Branch**: `001-save-share-encounters`  
**Created**: 2026-02-09  
**Status**: Draft  
**Input**: User description: "Encounter Persistence + Shareable Sessions. Let users save encounters (party + monsters + initiative + HP + conditions) to local storage file, and generate a shareable link for co-DMs or players. Value: makes the app usable beyond one-off sessions."

**Constitution Alignment**: All solutions MUST use Bun tooling, Next.js App Router (RSC-first; justify any Client Component), TypeScript strict with zero `any`, Tailwind utility classes (no CSS-in-JS), named exports with kebab-case paths and PascalCase components, URL search params for shareable state, and `bun test` for testing. Any deviations require explicit approval in this spec.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Save and Restore an Encounter (Priority: P1)

As a DM, I want to save the current encounter state to my device so I can reopen it later and continue play without rebuilding.

**Why this priority**: This is the core value—persistence makes the app usable across multiple sessions.

**Independent Test**: Can be fully tested by saving an encounter, refreshing/reopening the app, and restoring the saved encounter with identical state.

**Acceptance Scenarios**:

1. **Given** an active encounter with party members, monsters, initiative order, HP values, and conditions, **When** the user saves the encounter, **Then** a saved entry is created that includes all encounter data.
2. **Given** a saved encounter entry, **When** the user loads it, **Then** the encounter state is restored exactly as saved (participants, initiative, HP, conditions).

---

### User Story 2 - Share an Encounter Snapshot (Priority: P2)

As a DM, I want a shareable link that lets a co-DM or player open the encounter snapshot on their own device.

**Why this priority**: Sharing increases collaboration and reduces setup time for others who need access to the same encounter.

**Independent Test**: Can be fully tested by generating a link, opening it in a fresh session, and confirming the encounter state is available.

**Acceptance Scenarios**:

1. **Given** an active encounter, **When** the user generates a shareable link, **Then** the link can be copied and shared.
2. **Given** a valid shareable link, **When** a recipient opens it, **Then** the encounter snapshot is available to load on their device.
3. **Given** an invalid or corrupted shareable link, **When** a recipient opens it, **Then** they see a clear error message and no existing local data is overwritten.

### Edge Cases

- Storage is unavailable, full, or blocked on the device.
- Saved encounter data is missing fields (e.g., a participant without HP) or is partially corrupted.
- A shareable link is too long to be copied fully or is truncated.
- Encounter data format changes between versions and older saves are incompatible.
- Multiple saved encounters have the same name or no name.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST allow users to save the complete encounter state, including party members, monsters, initiative order, HP values, and conditions.
- **FR-002**: System MUST present a list of saved encounters that can be selected to load.
- **FR-003**: System MUST restore a saved encounter so that all tracked data matches the saved state.
- **FR-004**: System MUST allow users to generate a shareable link for an encounter snapshot.
- **FR-005**: System MUST allow recipients to open a shareable link and access the encounter snapshot for loading.
- **FR-006**: System MUST handle invalid or corrupted shareable links gracefully without data loss.
- **FR-007**: Users MUST be able to delete saved encounters from their device.
- **FR-008**: System MUST detect incompatible encounter data versions and provide a safe fallback (e.g., refusal to load with a clear message).

### Key Entities _(include if feature involves data)_

- **Encounter**: A saved combat state with name, timestamps, round/turn info, and participant list.
- **Participant**: A player character or monster with HP, conditions, and initiative position.
- **Condition**: A status applied to a participant with name and remaining duration (if any).
- **Shareable Snapshot**: A portable representation of an encounter that can be loaded on another device.

## Assumptions

- Saving is device-based and does not require user accounts.
- A shareable link represents a snapshot at the time of creation and does not provide live synchronization between devices.
- Shared snapshots expose the same encounter details as the primary view; player-only views are out of scope for this feature.

## Dependencies

- No external services or accounts are required for this feature.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Users can save and restore an encounter in under 1 minute without loss of encounter data.
- **SC-002**: At least 95% of shared links open successfully and present the intended encounter snapshot within 10 seconds.
- **SC-003**: At least 90% of users complete the save-and-restore flow on their first attempt.
- **SC-004**: Users report at least a 50% reduction in time to resume a previously run encounter.
