import type { DamageType } from "@/lib/damage-types";
import type { EnemyMovementType } from "@/lib/enemy-types";
import { TILE_SPACING } from "@/lib/terrain";

export type TowerTypeId = "cannon" | "archer" | "ballista" | "mage";

/** Combat specialty used for counter bonuses vs enemy roles. */
export type TowerRole = "bruiser" | "marksman" | "arcanist";

export type TowerTargetPriority = "nearest" | "lowestHp" | "highestHp";

export type TowerStats = {
  id: TowerTypeId;
  label: string;
  role: TowerRole;
  /** Which enemy movement types this tower can acquire and damage. */
  targetMovement: EnemyMovementType | "any";
  /** How in-range enemies are prioritized when acquiring a target. */
  targetPriority: TowerTargetPriority;
  attackRangeTiles: number;
  attackCooldown: number;
  projectileSpeed: number;
  projectileAoeTiles: number;
  damage: number;
  damageType: DamageType;
  cost: number;
  /** Extra iron to place this tower (0 if omitted). */
  ironCost?: number;
  /** Extra wood to place this tower (0 if omitted). */
  woodCost?: number;
};

export type TowerPlaceResourceCost = {
  resource: "gold" | "iron" | "wood";
  amount: number;
};

export const TOWER_TYPE_IDS: TowerTypeId[] = [
  "archer",
  "ballista",
  "mage",
  "cannon",
];

export const STARTING_GOLD = 10;

/** Extra attack range (in tiles) when a tower sits on a raised hill. */
export const HILL_TOWER_RANGE_BONUS_TILES = 1.5;

export const TOWER_TYPES: Record<TowerTypeId, TowerStats> = {
  cannon: {
    id: "cannon",
    label: "Cannon",
    role: "bruiser",
    targetMovement: "ground",
    targetPriority: "nearest",
    attackRangeTiles: 2,
    attackCooldown: 1.9,
    projectileSpeed: 14,
    projectileAoeTiles: 2,
    damage: 22,
    damageType: "physical",
    cost: 60,
    ironCost: 20,
    woodCost: 20,
  },
  archer: {
    id: "archer",
    label: "Archer",
    role: "marksman",
    targetMovement: "any",
    targetPriority: "lowestHp",
    attackRangeTiles: 3,
    attackCooldown: 1,
    projectileSpeed: 22,
    projectileAoeTiles: 0,
    damage: 2,
    damageType: "physical",
    cost: 2,
    woodCost: 2,
  },
  ballista: {
    id: "ballista",
    label: "Ballista",
    role: "bruiser",
    targetMovement: "any",
    targetPriority: "highestHp",
    attackRangeTiles: 3,
    attackCooldown: 2.4,
    projectileSpeed: 20,
    projectileAoeTiles: 0,
    damage: 42,
    damageType: "physical",
    cost: 45,
    ironCost: 15,
    woodCost: 15,
  },
  mage: {
    id: "mage",
    label: "Mage",
    role: "arcanist",
    targetMovement: "flying",
    targetPriority: "nearest",
    attackRangeTiles: 3,
    attackCooldown: 0.55,
    projectileSpeed: 10,
    projectileAoeTiles: 1.25,
    damage: 9,
    damageType: "fire",
    cost: 30,
    ironCost: 10,
    woodCost: 10,
  },
};

export function getTowerStats(typeId: TowerTypeId): TowerStats {
  return TOWER_TYPES[typeId];
}

export function getTowerIronCost(typeId: TowerTypeId): number {
  return getTowerStats(typeId).ironCost ?? 0;
}

export function getTowerWoodCost(typeId: TowerTypeId): number {
  return getTowerStats(typeId).woodCost ?? 0;
}

export function getTowerPlaceCosts(
  typeId: TowerTypeId,
): TowerPlaceResourceCost[] {
  const stats = getTowerStats(typeId);
  const costs: TowerPlaceResourceCost[] = [
    { resource: "gold", amount: stats.cost },
  ];
  const ironCost = getTowerIronCost(typeId);
  const woodCost = getTowerWoodCost(typeId);
  if (ironCost > 0) {
    costs.push({ resource: "iron", amount: ironCost });
  }
  if (woodCost > 0) {
    costs.push({ resource: "wood", amount: woodCost });
  }
  return costs;
}

export function canAffordTowerPlace(
  typeId: TowerTypeId,
  gold: number,
  wood: number,
  iron: number,
): boolean {
  return (
    gold >= getTowerStats(typeId).cost &&
    wood >= getTowerWoodCost(typeId) &&
    iron >= getTowerIronCost(typeId)
  );
}

export function canTowerTargetMovement(
  tower: Pick<TowerStats, "targetMovement">,
  movementType: EnemyMovementType,
): boolean {
  return (
    tower.targetMovement === "any" || tower.targetMovement === movementType
  );
}

export function formatTowerTargetHint(
  targetMovement: TowerStats["targetMovement"],
): string {
  return `Hits ${formatTowerTargetCategory(targetMovement)}`;
}

export function formatTowerTargetCategory(
  targetMovement: TowerStats["targetMovement"],
): string {
  if (targetMovement === "ground") {
    return "Ground";
  }
  if (targetMovement === "flying") {
    return "Air";
  }
  return "Ground & Air";
}

export function formatTowerTargetPriority(
  priority: TowerTargetPriority,
): string {
  switch (priority) {
    case "lowestHp":
      return "Targets lowest HP";
    case "highestHp":
      return "Targets highest HP";
    default:
      return "Targets nearest";
  }
}

export const MAX_TOWER_LEVEL = 3;

/** Gold to upgrade from `currentLevel` → currentLevel+1, or null if maxed. */
export function getTowerUpgradeCost(
  typeId: TowerTypeId,
  currentLevel: number,
): number | null {
  if (currentLevel < 1 || currentLevel >= MAX_TOWER_LEVEL) {
    return null;
  }

  const base = getTowerStats(typeId).cost;
  return Math.round(base * (1 + (currentLevel - 1) * 0.5));
}

/** Combat stats for a tower at a given upgrade level (1 = base). */
export function getTowerStatsAtLevel(
  typeId: TowerTypeId,
  level = 1,
): TowerStats {
  const base = getTowerStats(typeId);
  const steps = Math.max(0, Math.min(MAX_TOWER_LEVEL, level) - 1);

  return {
    ...base,
    attackRangeTiles: base.attackRangeTiles + steps * 0.5,
    damage: base.damage + steps,
    attackCooldown: Math.max(0.2, base.attackCooldown * (1 - steps * 0.08)),
  };
}

/** Half of gold spent on purchase + upgrades, rounded down. */
export function getTowerSellRefund(typeId: TowerTypeId, level = 1): number {
  let spent = getTowerStats(typeId).cost;
  const capped = Math.max(1, Math.min(MAX_TOWER_LEVEL, level));

  for (let current = 1; current < capped; current += 1) {
    spent += getTowerUpgradeCost(typeId, current) ?? 0;
  }

  return Math.floor(spent * 0.5);
}

export function getTowerAttackRangeWorld(stats: TowerStats) {
  return stats.attackRangeTiles * TILE_SPACING;
}

export function getAttackRangeWorldFromTiles(attackRangeTiles: number) {
  return attackRangeTiles * TILE_SPACING;
}

export function getProjectileTravelDuration(
  from: [number, number, number],
  to: [number, number, number],
  speed: number,
) {
  const distance = Math.hypot(
    to[0] - from[0],
    to[1] - from[1],
    to[2] - from[2],
  );

  if (speed <= 0) {
    return 0;
  }

  return distance / speed;
}
