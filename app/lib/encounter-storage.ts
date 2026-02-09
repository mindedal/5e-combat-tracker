import {
  ACTIVE_STATE_KEY,
  SAVED_ENCOUNTERS_KEY,
  STORAGE_VERSION,
} from "./encounter-constants";
import {
  parseSavedEncounterRecords,
  type Encounter,
  type EncounterSnapshot,
  type SavedEncounterRecord,
} from "./encounter-types";
import {
  clampAllHp,
  sortCombatants,
  type CombatState,
  type Combatant,
} from "./combat-logic";

export type StorageResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const getStorage = (): Storage | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  if ("localStorage" in globalThis) {
    const storage = (globalThis as { localStorage?: Storage }).localStorage;
    return storage ?? null;
  }
  return null;
};

export const checkStorageAvailability = (): StorageResult<true> => {
  const storage = getStorage();
  if (!storage) {
    return { ok: false, error: "Local storage is unavailable." };
  }
  try {
    const testKey = "__combat_tracker_test__";
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return { ok: true, value: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage is blocked";
    return { ok: false, error: message };
  }
};

const safeRead = (key: string): StorageResult<string | null> => {
  const storage = getStorage();
  if (!storage) {
    return { ok: false, error: "Local storage is unavailable." };
  }
  try {
    return { ok: true, value: storage.getItem(key) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage read failed";
    return { ok: false, error: message };
  }
};

const safeWrite = (key: string, value: string): StorageResult<true> => {
  const storage = getStorage();
  if (!storage) {
    return { ok: false, error: "Local storage is unavailable." };
  }
  try {
    storage.setItem(key, value);
    return { ok: true, value: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Storage write failed";
    return { ok: false, error: message };
  }
};

export const loadActiveCombatState = (): StorageResult<CombatState | null> => {
  const readResult = safeRead(ACTIVE_STATE_KEY);
  if (!readResult.ok) return readResult;
  if (!readResult.value) return { ok: true, value: null };

  try {
    const parsed = JSON.parse(readResult.value) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return { ok: true, value: null };
    }
    const state = parsed as CombatState;
    return { ok: true, value: state };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid stored state";
    return { ok: false, error: message };
  }
};

export const saveActiveCombatState = (
  state: CombatState,
): StorageResult<true> => {
  return safeWrite(ACTIVE_STATE_KEY, JSON.stringify(state));
};

export const loadSavedEncounters = (): StorageResult<SavedEncounterRecord[]> => {
  const readResult = safeRead(SAVED_ENCOUNTERS_KEY);
  if (!readResult.ok) return readResult;
  if (!readResult.value) return { ok: true, value: [] };

  let parsed: unknown;
  try {
    parsed = JSON.parse(readResult.value) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid saved encounters data";
    return { ok: false, error: message };
  }

  return parseSavedEncounterRecords(parsed);
};

export const saveEncounterRecord = (
  record: SavedEncounterRecord,
): StorageResult<SavedEncounterRecord[]> => {
  const existingResult = loadSavedEncounters();
  if (!existingResult.ok) return existingResult;
  const updated = [record, ...existingResult.value.filter((item) => item.id !== record.id)];
  const writeResult = safeWrite(SAVED_ENCOUNTERS_KEY, JSON.stringify(updated));
  if (!writeResult.ok) return { ok: false, error: writeResult.error };
  return { ok: true, value: updated };
};

export const deleteSavedEncounter = (id: string): StorageResult<SavedEncounterRecord[]> => {
  const existingResult = loadSavedEncounters();
  if (!existingResult.ok) return existingResult;
  const updated = existingResult.value.filter((item) => item.id !== id);
  const writeResult = safeWrite(SAVED_ENCOUNTERS_KEY, JSON.stringify(updated));
  if (!writeResult.ok) return { ok: false, error: writeResult.error };
  return { ok: true, value: updated };
};

const combatantToParticipant = (combatant: Combatant): Encounter["participants"][number] => ({
  id: combatant.id,
  type: "monster",
  name: combatant.name,
  initiative: combatant.initiative,
  armorClass: combatant.armorClass,
  hp: {
    current: combatant.currentHp,
    max: combatant.maxHp,
    temp: null,
  },
  conditions: [],
});

const participantToCombatant = (participant: Encounter["participants"][number]): Combatant => ({
  id: participant.id,
  name: participant.name,
  initiative: participant.initiative,
  maxHp: participant.hp.max,
  currentHp: participant.hp.current,
  armorClass: participant.armorClass,
});

export const buildEncounterFromState = (
  state: CombatState,
  name: string | null,
  nowIso: string,
): Encounter => {
  const normalizedCombatants = clampAllHp(sortCombatants(state.combatants));
  return {
    id: crypto.randomUUID(),
    name,
    version: STORAGE_VERSION,
    round: Math.max(state.round, 1),
    activeIndex: state.activeIndex,
    started: state.started,
    participants: normalizedCombatants.map(combatantToParticipant),
    createdAt: nowIso,
    updatedAt: nowIso,
  };
};

export const buildSnapshotFromState = (
  state: CombatState,
  name: string | null,
): EncounterSnapshot => {
  const nowIso = new Date().toISOString();
  return {
    version: STORAGE_VERSION,
    encodedAt: nowIso,
    encounter: buildEncounterFromState(state, name, nowIso),
  };
};

export const buildRecordFromState = (
  state: CombatState,
  name: string | null,
): SavedEncounterRecord => {
  const nowIso = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    savedAt: nowIso,
    encounter: buildEncounterFromState(state, name, nowIso),
  };
};

export const restoreCombatState = (encounter: Encounter): CombatState => {
  const combatants = encounter.participants.map(participantToCombatant);
  const activeIndex = Math.min(
    Math.max(encounter.activeIndex, encounter.started ? 0 : -1),
    combatants.length - 1,
  );
  return {
    combatants,
    activeIndex: combatants.length === 0 ? -1 : activeIndex,
    round: Math.max(encounter.round, 1),
    started: encounter.started,
  };
};
