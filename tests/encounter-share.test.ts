import { describe, expect, it } from "bun:test";
import {
  MAX_SHARE_PAYLOAD_LENGTH,
  MAX_TOTAL_URL_LENGTH,
  STORAGE_VERSION,
} from "../app/lib/encounter-constants";
import {
  buildShareUrl,
  decodeEncounterSnapshot,
  encodeEncounterSnapshot,
} from "../app/lib/encounter-share";
import type { EncounterSnapshot } from "../app/lib/encounter-types";

const sampleSnapshot: EncounterSnapshot = {
  version: STORAGE_VERSION,
  encodedAt: new Date().toISOString(),
  encounter: {
    id: "enc-1",
    name: "Goblin Ambush",
    version: STORAGE_VERSION,
    round: 1,
    activeIndex: 0,
    started: true,
    participants: [
      {
        id: "c1",
        type: "monster",
        name: "Goblin",
        initiative: 14,
        armorClass: 13,
        hp: { current: 7, max: 7, temp: null },
        conditions: [],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

describe("encounter-share", () => {
  it("encodes and decodes a snapshot", () => {
    const encoded = encodeEncounterSnapshot(sampleSnapshot);
    expect(encoded.ok).toBeTrue();
    if (!encoded.ok) return;

    const decoded = decodeEncounterSnapshot(encoded.payload);
    expect(decoded.ok).toBeTrue();
    if (!decoded.ok) return;

    expect(decoded.value.encounter.name).toBe("Goblin Ambush");
    expect(decoded.value.encounter.participants).toHaveLength(1);
  });

  it("rejects payloads that exceed the size limit", () => {
    const largeName = "x".repeat(MAX_SHARE_PAYLOAD_LENGTH * 2);
    const oversized: EncounterSnapshot = {
      ...sampleSnapshot,
      encounter: {
        ...sampleSnapshot.encounter,
        name: largeName,
      },
    };

    const encoded = encodeEncounterSnapshot(oversized);
    expect(encoded.ok).toBeFalse();
  });

  it("guards against oversized share URLs", () => {
    const payload = "a".repeat(MAX_TOTAL_URL_LENGTH * 2);
    const result = buildShareUrl("https://example.com", payload);
    expect(result.ok).toBeFalse();
  });
});
