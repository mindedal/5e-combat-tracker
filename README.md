## 5e Combat Tracker

A lightweight, Bun-powered Next.js app for running D&D 5e initiative with local-only storage. Add combatants, track turns and rounds, and adjust hit points quickly during play.

### Features

- Add combatants with initiative, max HP, and AC; sorting is automatic (initiative desc, then name).
- Start combat to set the active combatant and round counter; advance turn cycles and increments rounds on wrap.
- Adjust HP inline with absolute values (e.g., `12`) or deltas (`-5`, `+3`) with clamping to 0…max.
- State persists in `localStorage`; clearing wipes the encounter.

### Tech stack

- Next.js App Router, React 19, TypeScript
- Tailwind CSS 4 (utility styling)
- Bun for install, dev server, and tests

### Getting started

Prereq: [Bun](https://bun.sh/) installed.

1. Install deps: `bun install`
2. Start dev server: `bun dev` then open http://localhost:3000
3. Build for production: `bun run build` (served via `bun start`)

### Using the tracker

1. Add each combatant with name, initiative, max HP, and AC.
2. Click **Start Combat** to lock the order and highlight the active turn.
3. Use **Next Turn** to advance; the round counter increments on wrap.
4. Adjust HP in the input with numbers (set) or `+/-` deltas, then **Apply** or press Enter; values clamp between 0 and max.
5. **Clear** resets everything, including persisted state.

### Testing & linting

- Run tests: `bun test`
- Lint: `bun lint`
