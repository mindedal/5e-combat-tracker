import { describe, expect, it } from "bun:test";
import { decodeEncounterSnapshot, encodeEncounterSnapshot } from "../app/lib/encounter-share";
import { STORAGE_VERSION } from "../app/lib/encounter-constants";
import type { EncounterSnapshot } from "../app/lib/encounter-types";

const sampleSnapshot: EncounterSnapshot = {
  version: STORAGE_VERSION,
  encodedAt: new Date().toISOString(),
  encounter: {
    id: "enc-1",
    name: "Shared Encounter",
    version: STORAGE_VERSION,
    round: 1,
    activeIndex: 0,
    started: true,
    participants: [
      {
        id: "c1",
        type: "monster",
        name: "Goblin",
        initiative: 12,
        armorClass: 13,
        hp: { current: 7, max: 7, temp: null },
        conditions: [],
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
};

describe("encounter share flow", () => {
  it("decodes valid payloads", () => {
    const encoded = encodeEncounterSnapshot(sampleSnapshot);
    expect(encoded.ok).toBeTrue();
    if (!encoded.ok) return;

    const decoded = decodeEncounterSnapshot(encoded.payload);
    expect(decoded.ok).toBeTrue();
  });

  it("rejects invalid payloads", () => {
    const decoded = decodeEncounterSnapshot("not-a-payload");
    expect(decoded.ok).toBeFalse();
  });
});
