export type Combatant = {
  id: string;
  name: string;
  initiative: number;
  maxHp: number;
  currentHp: number;
  armorClass: number;
};

export type CombatState = {
  combatants: Combatant[];
  activeIndex: number;
  round: number;
  started: boolean;
};

const clampHp = (value: number, maxHp: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  return Math.min(Math.max(value, 0), maxHp);
};

export const parseHpInput = (
  currentHp: number,
  maxHp: number,
  input: string,
): number => {
  const trimmed = input.trim();
  if (!trimmed) {
    return currentHp;
  }

  const sign = trimmed[0];
  const numericPortion = sign === "+" || sign === "-" ? trimmed.slice(1) : trimmed;
  const numericValue = Number.parseInt(numericPortion, 10);

  if (Number.isNaN(numericValue)) {
    return currentHp;
  }

  if (sign === "+" || sign === "-") {
    const delta = sign === "-" ? -numericValue : numericValue;
    return clampHp(currentHp + delta, maxHp);
  }

  return clampHp(numericValue, maxHp);
};

export const sortCombatants = (combatants: Combatant[]): Combatant[] =>
  [...combatants].sort((a, b) => {
    if (b.initiative !== a.initiative) {
      return b.initiative - a.initiative;
    }
    return a.name.localeCompare(b.name);
  });

export const startCombat = (state: CombatState): CombatState => {
  if (state.combatants.length === 0) {
    return {
      ...state,
      started: false,
      activeIndex: -1,
      round: 1,
    };
  }

  const sorted = sortCombatants(state.combatants);
  return {
    combatants: sorted,
    activeIndex: 0,
    round: 1,
    started: true,
  };
};

export const advanceTurn = (state: CombatState): CombatState => {
  const total = state.combatants.length;
  if (total === 0 || !state.started) {
    return state;
  }

  const nextIndex = (state.activeIndex + 1) % total;
  const wrapped = nextIndex === 0;
  return {
    ...state,
    activeIndex: nextIndex,
    round: state.round + (wrapped ? 1 : 0),
  };
};

export const upsertCombatant = (
  combatants: Combatant[],
  combatant: Combatant,
): Combatant[] => {
  const filtered = combatants.filter((c) => c.id !== combatant.id);
  return sortCombatants([...filtered, combatant]);
};

export const updateCombatantHp = (
  combatants: Combatant[],
  id: string,
  input: string,
): Combatant[] =>
  combatants.map((combatant) => {
    if (combatant.id !== id) {
      return combatant;
    }
    const nextHp = parseHpInput(combatant.currentHp, combatant.maxHp, input);
    return {
      ...combatant,
      currentHp: nextHp,
    };
  });

export const clampAllHp = (combatants: Combatant[]): Combatant[] =>
  combatants.map((combatant) => ({
    ...combatant,
    currentHp: clampHp(combatant.currentHp, combatant.maxHp),
  }));
