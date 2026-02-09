import { beforeEach, describe, expect, it } from "bun:test";
import type { CombatState } from "../app/lib/combat-logic";
import {
  buildRecordFromState,
  loadSavedEncounters,
  restoreCombatState,
  saveEncounterRecord,
} from "../app/lib/encounter-storage";

type StorageEntry = { key: string; value: string };

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear() {
    this.store.clear();
  }

  getItem(key: string) {
    return this.store.get(key) ?? null;
  }

  key(index: number) {
    const entries: StorageEntry[] = Array.from(this.store.entries()).map(
      ([entryKey, value]) => ({ key: entryKey, value })
    );
    return entries[index]?.key ?? null;
  }

  removeItem(key: string) {
    this.store.delete(key);
  }

  setItem(key: string, value: string) {
    this.store.set(key, value);
  }
}

const setTestStorage = () => {
  (globalThis as { localStorage: Storage }).localStorage = new MemoryStorage();
};

const sampleState: CombatState = {
  combatants: [
    {
      id: "a",
      name: "Goblin",
      initiative: 12,
      maxHp: 7,
      currentHp: 7,
      armorClass: 13,
    },
    {
      id: "b",
      name: "Rogue",
      initiative: 18,
      maxHp: 24,
      currentHp: 24,
      armorClass: 15,
    },
  ],
  activeIndex: 0,
  round: 2,
  started: true,
};

describe("encounter persistence flow", () => {
  beforeEach(() => {
    setTestStorage();
  });

  it("saves and restores combat state", () => {
    const record = buildRecordFromState(sampleState, "Goblin Fight");
    const saved = saveEncounterRecord(record);
    expect(saved.ok).toBeTrue();

    const loaded = loadSavedEncounters();
    expect(loaded.ok).toBeTrue();
    if (!loaded.ok) return;

    const restored = restoreCombatState(loaded.value[0].encounter);
    expect(restored.round).toBe(sampleState.round);
    expect(restored.activeIndex).toBe(sampleState.activeIndex);
    expect(restored.combatants[0].name).toBe("Rogue");
  });
});
