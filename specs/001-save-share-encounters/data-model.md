# Data Model: Encounter Persistence & Shareable Sessions

## Entities

### Encounter

- **Purpose**: Represents a saved combat state.
- **Fields**:
  - `id` (string, stable identifier)
  - `name` (string, optional display name)
  - `version` (number, schema version)
  - `round` (number)
  - `activeIndex` (number)
  - `started` (boolean)
  - `participants` (Participant[])
  - `createdAt` (ISO timestamp)
  - `updatedAt` (ISO timestamp)

### Participant

- **Purpose**: A combatant (PC or monster).
- **Fields**:
  - `id` (string)
  - `type` ("pc" | "monster")
  - `name` (string)
  - `initiative` (number)
  - `armorClass` (number)
  - `hp` (object)
    - `current` (number)
    - `max` (number)
    - `temp` (number, optional)
  - `conditions` (Condition[])

### Condition

- **Purpose**: Status affecting a participant.
- **Fields**:
  - `id` (string)
  - `name` (string)
  - `remainingRounds` (number | null)

### Shareable Snapshot

- **Purpose**: Portable representation used in URL sharing.
- **Fields**:
  - `version` (number)
  - `encodedAt` (ISO timestamp)
  - `encounter` (Encounter)

### Saved Encounter Record

- **Purpose**: Local persistence wrapper for display and management.
- **Fields**:
  - `id` (string)
  - `name` (string, optional)
  - `savedAt` (ISO timestamp)
  - `encounter` (Encounter)

## Relationships

- An **Encounter** has many **Participants**.
- A **Participant** has many **Conditions**.
- A **Shareable Snapshot** contains exactly one **Encounter**.
- A **Saved Encounter Record** contains exactly one **Encounter**.

## Validation Rules

- `id` fields are required and stable for updates and deletions.
- `hp.current` MUST be between 0 and `hp.max` (inclusive) when saving.
- `hp.current` MUST be between 0 and `hp.max` (inclusive) when saving.
- `round` MUST be >= 1; `activeIndex` MUST be -1 or within `participants` bounds.
- Conditions with no countdown use `remainingRounds = null`.
- `version` MUST be present for all saved data and snapshots.

## State Transitions

- **Save Encounter**: Encounter → Saved Encounter Record (add `savedAt`).
- **Load Encounter**: Saved Encounter Record → Active Encounter state.
- **Share Encounter**: Encounter → Shareable Snapshot (add `encodedAt`).
