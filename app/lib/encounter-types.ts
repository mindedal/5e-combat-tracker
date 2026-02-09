export type Condition = {
  id: string;
  name: string;
  remainingRounds: number | null;
};

export type EncounterParticipant = {
  id: string;
  type: "pc" | "monster";
  name: string;
  initiative: number;
  armorClass: number;
  hp: {
    current: number;
    max: number;
    temp?: number | null;
  };
  conditions: Condition[];
};

export type Encounter = {
  id: string;
  name: string | null;
  version: number;
  round: number;
  activeIndex: number;
  started: boolean;
  participants: EncounterParticipant[];
  createdAt: string;
  updatedAt: string;
};

export type EncounterSnapshot = {
  version: number;
  encodedAt: string;
  encounter: Encounter;
};

export type SavedEncounterRecord = {
  id: string;
  name: string | null;
  savedAt: string;
  encounter: Encounter;
};

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isBoolean = (value: unknown): value is boolean =>
  typeof value === "boolean";

const isCondition = (value: unknown): value is Condition => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    isString(value.name) &&
    (value.remainingRounds === null || isNumber(value.remainingRounds))
  );
};

const isParticipant = (value: unknown): value is EncounterParticipant => {
  if (!isRecord(value)) return false;
  if (!isString(value.id) || !isString(value.name)) return false;
  if (!isString(value.type) || (value.type !== "pc" && value.type !== "monster")) {
    return false;
  }
  if (!isNumber(value.initiative) || !isNumber(value.armorClass)) return false;
  if (!isRecord(value.hp)) return false;
  if (!isNumber(value.hp.current) || !isNumber(value.hp.max)) return false;
  if (
    value.hp.temp !== undefined &&
    value.hp.temp !== null &&
    !isNumber(value.hp.temp)
  ) {
    return false;
  }
  if (!Array.isArray(value.conditions)) return false;
  return value.conditions.every(isCondition);
};

const isEncounter = (value: unknown): value is Encounter => {
  if (!isRecord(value)) return false;
  return (
    isString(value.id) &&
    (value.name === null || isString(value.name)) &&
    isNumber(value.version) &&
    isNumber(value.round) &&
    isNumber(value.activeIndex) &&
    isBoolean(value.started) &&
    Array.isArray(value.participants) &&
    value.participants.every(isParticipant) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  );
};

export const parseEncounterSnapshot = (
  value: unknown,
): ParseResult<EncounterSnapshot> => {
  if (!isRecord(value)) {
    return { ok: false, error: "Snapshot is not an object." };
  }
  if (!isNumber(value.version)) {
    return { ok: false, error: "Snapshot version is invalid." };
  }
  if (!isString(value.encodedAt)) {
    return { ok: false, error: "Snapshot missing encodedAt." };
  }
  if (!isEncounter(value.encounter)) {
    return { ok: false, error: "Snapshot encounter is invalid." };
  }
  return {
    ok: true,
    value: {
      version: value.version,
      encodedAt: value.encodedAt,
      encounter: value.encounter,
    },
  };
};

export const parseSavedEncounterRecords = (
  value: unknown,
): ParseResult<SavedEncounterRecord[]> => {
  if (!Array.isArray(value)) {
    return { ok: false, error: "Saved encounters payload is not an array." };
  }

  const records: SavedEncounterRecord[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      return { ok: false, error: "Saved encounter record is invalid." };
    }
    if (!isString(entry.id)) {
      return { ok: false, error: "Saved encounter id is missing." };
    }
    if (entry.name !== null && entry.name !== undefined && !isString(entry.name)) {
      return { ok: false, error: "Saved encounter name is invalid." };
    }
    if (!isString(entry.savedAt)) {
      return { ok: false, error: "Saved encounter timestamp is missing." };
    }
    if (!isEncounter(entry.encounter)) {
      return { ok: false, error: "Saved encounter data is invalid." };
    }

    records.push({
      id: entry.id,
      name: entry.name ?? null,
      savedAt: entry.savedAt,
      encounter: entry.encounter,
    });
  }

  return { ok: true, value: records };
};
