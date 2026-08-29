import type { EnemyTypeId } from "@/lib/enemy-types";

/** Player-recruitable army units (also used as night-wave types). */
export type ArmyUnitId =
  | "peon"
  | "archer"
  | "knight"
  | "catapult"
  | "dragon";

export const ARMY_UNIT_IDS: ArmyUnitId[] = [
  "peon",
  "archer",
  "knight",
  "catapult",
  "dragon",
];

export type ArmyUnitCost = {
  food: number;
};

export const ARMY_UNIT_COSTS: Record<ArmyUnitId, ArmyUnitCost> = {
  peon: { food: 1 },
  archer: { food: 10 },
  knight: { food: 20 },
  catapult: { food: 35 },
  dragon: { food: 60 },
};

export type ArmyRoster = Record<ArmyUnitId, number>;

export function createEmptyArmy(): ArmyRoster {
  return {
    peon: 0,
    archer: 0,
    knight: 0,
    catapult: 0,
    dragon: 0,
  };
}

export function armyTotal(army: ArmyRoster): number {
  let total = 0;
  for (const id of ARMY_UNIT_IDS) {
    total += army[id];
  }
  return total;
}

export function canAffordUnit(
  unitId: ArmyUnitId,
  resources: { food: number },
): boolean {
  return resources.food >= ARMY_UNIT_COSTS[unitId].food;
}

/** Narrow army unit ids for shared enemy model / walker IDs. */
export function isArmyUnitId(typeId: EnemyTypeId): typeId is ArmyUnitId {
  return (
    typeId === "peon" ||
    typeId === "archer" ||
    typeId === "knight" ||
    typeId === "catapult" ||
    typeId === "dragon"
  );
}
