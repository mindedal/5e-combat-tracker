import {
  MAX_SHARE_PAYLOAD_LENGTH,
  MAX_TOTAL_URL_LENGTH,
  SHARE_PARAM_KEY,
} from "./encounter-constants";
import {
  parseEncounterSnapshot,
  type Encounter,
  type EncounterParticipant,
  type EncounterSnapshot,
  type ParseResult,
} from "./encounter-types";

type CompactCondition = [string, string, number | null];
type CompactParticipant = [
  string,
  "pc" | "monster",
  string,
  number,
  number,
  number,
  number,
  number | null,
  CompactCondition[],
];

type CompactEncounter = {
  i: string;
  n?: string;
  v: number;
  r: number;
  a: number;
  s: 0 | 1;
  p: CompactParticipant[];
  c?: string;
  u?: string;
};

type CompactSnapshot = {
  v: number;
  t: string;
  e: CompactEncounter;
};

const toBase64 = (bytes: Uint8Array): ParseResult<string> => {
  if (typeof globalThis.Buffer === "function") {
    return { ok: true, value: globalThis.Buffer.from(bytes).toString("base64") };
  }
  if (typeof globalThis.btoa === "function") {
    let binary = "";
    bytes.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return { ok: true, value: globalThis.btoa(binary) };
  }
  return { ok: false, error: "Base64 encoding is not supported in this environment." };
};

const fromBase64 = (base64: string): ParseResult<Uint8Array> => {
  if (typeof globalThis.Buffer === "function") {
    return { ok: true, value: new Uint8Array(globalThis.Buffer.from(base64, "base64")) };
  }
  if (typeof globalThis.atob === "function") {
    const binary = globalThis.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return { ok: true, value: bytes };
  }
  return { ok: false, error: "Base64 decoding is not supported in this environment." };
};

const toBase64Url = (input: string): ParseResult<string> => {
  const encoder = new TextEncoder();
  const base64Result = toBase64(encoder.encode(input));
  if (!base64Result.ok) return base64Result;
  const base64 = base64Result.value;
  return {
    ok: true,
    value: base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, ""),
  };
};

const fromBase64Url = (input: string): ParseResult<string> => {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLength = padded.length % 4 === 0 ? 0 : 4 - (padded.length % 4);
  const base64 = padded + "=".repeat(padLength);
  const bytesResult = fromBase64(base64);
  if (!bytesResult.ok) return bytesResult;
  const decoder = new TextDecoder();
  return { ok: true, value: decoder.decode(bytesResult.value) };
};

export type ShareEncodeResult =
  | { ok: true; payload: string; size: number }
  | { ok: false; error: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const toCompactSnapshot = (snapshot: EncounterSnapshot): CompactSnapshot => {
  const encodedAt = snapshot.encodedAt;
  const encounter = snapshot.encounter;
  const compactParticipants: CompactParticipant[] = encounter.participants.map(
    (participant) => [
      participant.id,
      participant.type,
      participant.name,
      participant.initiative,
      participant.armorClass,
      participant.hp.current,
      participant.hp.max,
      participant.hp.temp ?? null,
      participant.conditions.map((condition) => [
        condition.id,
        condition.name,
        condition.remainingRounds,
      ]),
    ],
  );

  const compactEncounter: CompactEncounter = {
    i: encounter.id,
    v: encounter.version,
    r: encounter.round,
    a: encounter.activeIndex,
    s: encounter.started ? 1 : 0,
    p: compactParticipants,
  };

  if (encounter.name && encounter.name.trim()) {
    compactEncounter.n = encounter.name;
  }

  if (encounter.createdAt !== encodedAt) {
    compactEncounter.c = encounter.createdAt;
  }
  if (encounter.updatedAt !== encodedAt) {
    compactEncounter.u = encounter.updatedAt;
  }

  return {
    v: snapshot.version,
    t: encodedAt,
    e: compactEncounter,
  };
};

const parseCompactSnapshot = (value: unknown): ParseResult<EncounterSnapshot> => {
  if (!isRecord(value)) {
    return { ok: false, error: "Snapshot is not an object." };
  }
  if (!isNumber(value.v) || !isString(value.t) || !isRecord(value.e)) {
    return { ok: false, error: "Snapshot is missing required fields." };
  }

  const encounter = value.e as Record<string, unknown>;
  if (!isString(encounter.i) || !isNumber(encounter.v)) {
    return { ok: false, error: "Snapshot encounter is invalid." };
  }
  if (!isNumber(encounter.r) || !isNumber(encounter.a)) {
    return { ok: false, error: "Snapshot encounter round/index is invalid." };
  }
  if (!isNumber(encounter.s) || (encounter.s !== 0 && encounter.s !== 1)) {
    return { ok: false, error: "Snapshot encounter started flag is invalid." };
  }
  if (!Array.isArray(encounter.p)) {
    return { ok: false, error: "Snapshot participants are invalid." };
  }

  const createdAt = isString(encounter.c) ? encounter.c : value.t;
  const updatedAt = isString(encounter.u) ? encounter.u : value.t;
  const name = isString(encounter.n) ? encounter.n : null;

  const participants: EncounterParticipant[] = [];
  for (const entry of encounter.p) {
    if (!Array.isArray(entry) || entry.length < 7) {
      return { ok: false, error: "Snapshot participant is invalid." };
    }
    const [
      id,
      type,
      participantName,
      initiative,
      armorClass,
      currentHp,
      maxHp,
      tempHp,
      conditions,
    ] = entry as CompactParticipant;

    if (!isString(id) || !isString(participantName)) {
      return { ok: false, error: "Snapshot participant fields are invalid." };
    }
    if (type !== "pc" && type !== "monster") {
      return { ok: false, error: "Snapshot participant type is invalid." };
    }
    if (
      !isNumber(initiative) ||
      !isNumber(armorClass) ||
      !isNumber(currentHp) ||
      !isNumber(maxHp)
    ) {
      return { ok: false, error: "Snapshot participant stats are invalid." };
    }

    const safeTempHp =
      tempHp === null || tempHp === undefined || isNumber(tempHp)
        ? (tempHp ?? null)
        : null;
    const safeConditions: CompactCondition[] = Array.isArray(conditions)
      ? (conditions as CompactCondition[])
      : [];

    const expandedConditions = safeConditions
      .map((condition) => {
        if (!Array.isArray(condition) || condition.length < 3) return null;
        const [conditionId, conditionName, remainingRounds] = condition;
        if (!isString(conditionId) || !isString(conditionName)) return null;
        if (remainingRounds !== null && !isNumber(remainingRounds)) return null;
        return {
          id: conditionId,
          name: conditionName,
          remainingRounds,
        };
      })
      .filter((condition): condition is EncounterParticipant["conditions"][number] =>
        Boolean(condition),
      );

    participants.push({
      id,
      type,
      name: participantName,
      initiative,
      armorClass,
      hp: {
        current: currentHp,
        max: maxHp,
        temp: safeTempHp,
      },
      conditions: expandedConditions,
    });
  }

  const expandedEncounter: Encounter = {
    id: encounter.i,
    name,
    version: encounter.v,
    round: encounter.r,
    activeIndex: encounter.a,
    started: encounter.s === 1,
    participants,
    createdAt,
    updatedAt,
  };

  return {
    ok: true,
    value: {
      version: value.v,
      encodedAt: value.t,
      encounter: expandedEncounter,
    },
  };
};

export const encodeEncounterSnapshot = (
  snapshot: EncounterSnapshot,
): ShareEncodeResult => {
  const compact = toCompactSnapshot(snapshot);
  const serialized = JSON.stringify(compact);
  const encoded = toBase64Url(serialized);
  if (!encoded.ok) {
    return { ok: false, error: encoded.error };
  }
  const size = encoded.value.length;
  if (size > MAX_SHARE_PAYLOAD_LENGTH) {
    return {
      ok: false,
      error: "Snapshot is too large to share as a link. Try reducing participants.",
    };
  }
  return { ok: true, payload: encoded.value, size };
};

export const decodeEncounterSnapshot = (
  payload: string,
): ParseResult<EncounterSnapshot> => {
  const decoded = fromBase64Url(payload);
  if (!decoded.ok) return decoded;

  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded.value) as unknown;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown parse error";
    return { ok: false, error: `Snapshot payload is invalid JSON: ${message}` };
  }

  if (isRecord(parsed) && "version" in parsed) {
    return parseEncounterSnapshot(parsed);
  }
  return parseCompactSnapshot(parsed);
};

export const buildShareUrl = (baseUrl: string, payload: string): ShareEncodeResult => {
  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    return { ok: false, error: "Unable to build share URL." };
  }

  url.searchParams.set(SHARE_PARAM_KEY, payload);
  const finalUrl = url.toString();
  if (finalUrl.length > MAX_TOTAL_URL_LENGTH) {
    return {
      ok: false,
      error: "Share URL is too long for reliable use. Try reducing encounter size.",
    };
  }

  return { ok: true, payload: finalUrl, size: finalUrl.length };
};

export const getSharePayloadFromUrl = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get(SHARE_PARAM_KEY);
  } catch {
    return null;
  }
};

export const stripShareParam = (url: string): string => {
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete(SHARE_PARAM_KEY);
    return parsed.toString();
  } catch {
    return url;
  }
};
