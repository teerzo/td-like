import {
  getResourceLabel,
  type ResourceCostLine,
  type ResourceId,
} from "@/components/game/resource-icon";
import type { EnemyTypeId } from "@/lib/enemy-types";

/** Player-recruitable army units (also used as night-wave types). */
export type ArmyUnitId =
  | "peon"
  | "bat"
  | "archer"
  | "knight"
  | "catapult"
  | "dragon";

export const ARMY_UNIT_IDS: ArmyUnitId[] = [
  "peon",
  "bat",
  "archer",
  "knight",
  "catapult",
  "dragon",
];

export type ArmyUnitCost = {
  food: number;
  gold?: number;
  iron?: number;
  wood?: number;
  stone?: number;
};

export type ArmyResources = {
  gold: number;
  iron: number;
  wood: number;
  stone: number;
  food: number;
};

const COST_RESOURCES: ResourceId[] = ["food", "gold", "iron", "wood", "stone"];

export const ARMY_UNIT_COSTS: Record<ArmyUnitId, ArmyUnitCost> = {
  peon: { food: 1 },
  bat: { food: 2 },
  archer: { food: 10, wood: 4 },
  knight: { food: 20, iron: 6 },
  catapult: { food: 35, stone: 8 },
  dragon: { food: 60, gold: 10 },
};

export type ArmyRoster = Record<ArmyUnitId, number>;

export function createEmptyArmy(): ArmyRoster {
  return {
    peon: 0,
    bat: 0,
    archer: 0,
    knight: 0,
    catapult: 0,
    dragon: 0,
  };
}

export function createEmptyArmyResources(): ArmyResources {
  return {
    gold: 0,
    iron: 0,
    wood: 0,
    stone: 0,
    food: 0,
  };
}

export function armyTotal(army: ArmyRoster): number {
  let total = 0;
  for (const id of ARMY_UNIT_IDS) {
    total += army[id];
  }
  return total;
}

/** Gold paid at wave end per unit sent (independent of kills). */
export const ARMY_UNIT_GOLD_INCOME: Record<ArmyUnitId, number> = {
  peon: 1,
  bat: 1,
  archer: 1,
  knight: 1,
  catapult: 1,
  dragon: 1,
};

export function armyGoldIncome(army: ArmyRoster): number {
  let total = 0;
  for (const id of ARMY_UNIT_IDS) {
    total += army[id] * ARMY_UNIT_GOLD_INCOME[id];
  }
  return total;
}

export function getUnitCostAmount(
  cost: ArmyUnitCost,
  resource: ResourceId,
): number {
  return cost[resource] ?? 0;
}

export function getUnitCostLines(unitId: ArmyUnitId): ResourceCostLine[] {
  const cost = ARMY_UNIT_COSTS[unitId];
  const lines: ResourceCostLine[] = [];
  for (const resource of COST_RESOURCES) {
    const amount = getUnitCostAmount(cost, resource);
    if (amount > 0) {
      lines.push({ resource, amount });
    }
  }
  return lines;
}

export function canAffordUnit(
  unitId: ArmyUnitId,
  resources: ArmyResources,
): boolean {
  const cost = ARMY_UNIT_COSTS[unitId];
  return COST_RESOURCES.every(
    (resource) => resources[resource] >= getUnitCostAmount(cost, resource),
  );
}

export function spendUnitCost(
  resources: ArmyResources,
  unitId: ArmyUnitId,
): ArmyResources {
  const cost = ARMY_UNIT_COSTS[unitId];
  return {
    gold: resources.gold - (cost.gold ?? 0),
    iron: resources.iron - (cost.iron ?? 0),
    wood: resources.wood - (cost.wood ?? 0),
    stone: resources.stone - (cost.stone ?? 0),
    food: resources.food - cost.food,
  };
}

export function armyResourcesSpent(army: ArmyRoster): ArmyResources {
  const spent = createEmptyArmyResources();
  for (const id of ARMY_UNIT_IDS) {
    const count = army[id];
    if (count <= 0) {
      continue;
    }
    const cost = ARMY_UNIT_COSTS[id];
    spent.food += count * cost.food;
    spent.gold += count * (cost.gold ?? 0);
    spent.iron += count * (cost.iron ?? 0);
    spent.wood += count * (cost.wood ?? 0);
    spent.stone += count * (cost.stone ?? 0);
  }
  return spent;
}

export function armyFoodSpent(army: ArmyRoster): number {
  return armyResourcesSpent(army).food;
}

export function missingUnitCostHint(
  unitId: ArmyUnitId,
  resources: ArmyResources,
): string {
  const missing = getUnitCostLines(unitId).filter(
    (line) => resources[line.resource] < line.amount,
  );
  if (missing.length === 0) {
    return "";
  }

  return `Need ${missing
    .map(
      (line) =>
        `x${line.amount} ${getResourceLabel(line.resource).toLowerCase()}`,
    )
    .join(", ")}`;
}

/** Narrow army unit ids for shared enemy model / walker IDs. */
export function isArmyUnitId(typeId: EnemyTypeId): typeId is ArmyUnitId {
  return (
    typeId === "peon" ||
    typeId === "bat" ||
    typeId === "archer" ||
    typeId === "knight" ||
    typeId === "catapult" ||
    typeId === "dragon"
  );
}
