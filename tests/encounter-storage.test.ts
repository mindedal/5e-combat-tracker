import { beforeEach, describe, expect, it } from "bun:test";
import {
  buildRecordFromState,
  deleteSavedEncounter,
  loadSavedEncounters,
  saveEncounterRecord,
} from "../app/lib/encounter-storage";
import type { CombatState } from "../app/lib/combat-logic";

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
  ],
  activeIndex: 0,
  round: 1,
  started: true,
};

describe("encounter-storage", () => {
  beforeEach(() => {
    setTestStorage();
  });

  it("returns an empty list when no saves exist", () => {
    const result = loadSavedEncounters();
    expect(result.ok).toBeTrue();
    if (!result.ok) return;
    expect(result.value).toHaveLength(0);
  });

  it("saves and loads encounter records", () => {
    const record = buildRecordFromState(sampleState, "Goblin Fight");
    const saved = saveEncounterRecord(record);
    expect(saved.ok).toBeTrue();

    const loaded = loadSavedEncounters();
    expect(loaded.ok).toBeTrue();
    if (!loaded.ok) return;
    expect(loaded.value[0]?.id).toBe(record.id);
  });

  it("deletes saved encounters", () => {
    const record = buildRecordFromState(sampleState, "Goblin Fight");
    saveEncounterRecord(record);

    const deleted = deleteSavedEncounter(record.id);
    expect(deleted.ok).toBeTrue();
    if (!deleted.ok) return;
    expect(deleted.value).toHaveLength(0);
  });

  it("reports invalid saved data", () => {
    const storage = (globalThis as { localStorage: Storage }).localStorage;
    storage.setItem("combat-tracker-saved-v1", "{not-json}");

    const result = loadSavedEncounters();
    expect(result.ok).toBeFalse();
  });
});
