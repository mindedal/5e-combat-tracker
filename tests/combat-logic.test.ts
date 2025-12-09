import { describe, expect, it } from "bun:test";
import {
  advanceTurn,
  clampAllHp,
  parseHpInput,
  sortCombatants,
  startCombat,
  type Combatant,
  type CombatState,
  updateCombatantHp,
} from "../app/lib/combat-logic";

describe("combat logic", () => {
  const sample: Combatant[] = [
    { id: "a", name: "Goblin", initiative: 12, maxHp: 7, currentHp: 7, armorClass: 13 },
    { id: "b", name: "Rogue", initiative: 18, maxHp: 24, currentHp: 24, armorClass: 15 },
    { id: "c", name: "Cleric", initiative: 18, maxHp: 22, currentHp: 22, armorClass: 16 },
  ];

  it("sorts by initiative then name", () => {
    const sorted = sortCombatants(sample);
    expect(sorted.map((c) => c.id)).toEqual(["c", "b", "a"]);
  });

  it("starts combat with round 1 and first combatant active", () => {
    const state: CombatState = { combatants: sample, activeIndex: -1, round: 1, started: false };
    const next = startCombat(state);
    expect(next.started).toBeTrue();
    expect(next.round).toBe(1);
    expect(next.activeIndex).toBe(0);
    expect(next.combatants[0].id).toBe("c");
  });

  it("advances turn and increments round on wrap", () => {
    const state: CombatState = { combatants: sortCombatants(sample), activeIndex: 1, round: 1, started: true };
    const next = advanceTurn(state);
    expect(next.activeIndex).toBe(2);
    const wrapped = advanceTurn({ ...next, activeIndex: 2 });
    expect(wrapped.activeIndex).toBe(0);
    expect(wrapped.round).toBe(2);
  });

  it("parses HP input deltas and clamps", () => {
    expect(parseHpInput(10, 20, "-5")).toBe(5);
    expect(parseHpInput(10, 20, "+7")).toBe(17);
    expect(parseHpInput(5, 20, "999")).toBe(20);
    expect(parseHpInput(5, 20, "-999")).toBe(0);
    expect(parseHpInput(5, 20, "abc")).toBe(5);
  });

  it("updates combatant HP via input", () => {
    const updated = updateCombatantHp(sample, "a", "-3");
    const goblin = updated.find((c) => c.id === "a");
    expect(goblin?.currentHp).toBe(4);
  });

  it("clamps HP values across combatants", () => {
    const mutated: Combatant[] = [
      { ...sample[0], currentHp: -5 },
      { ...sample[1], currentHp: 999 },
    ];
    const clamped = clampAllHp(mutated);
    expect(clamped[0].currentHp).toBe(0);
    expect(clamped[1].currentHp).toBe(mutated[1].maxHp);
  });
});
