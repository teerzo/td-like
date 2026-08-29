import type { DamageType } from "@/lib/damage-types";
import { TILE_SPACING } from "@/lib/terrain";

export type TowerTypeId = "rook" | "archer" | "mage";

export type TowerStats = {
  id: TowerTypeId;
  label: string;
  attackRangeTiles: number;
  attackCooldown: number;
  projectileSpeed: number;
  projectileAoeTiles: number;
  damage: number;
  damageType: DamageType;
  cost: number;
};

export const TOWER_TYPE_IDS: TowerTypeId[] = ["rook", "archer", "mage"];

export const STARTING_GOLD = 10;

/** Extra attack range (in tiles) when a tower sits on a raised hill. */
export const HILL_TOWER_RANGE_BONUS_TILES = 1.5;

export const TOWER_TYPES: Record<TowerTypeId, TowerStats> = {
  rook: {
    id: "rook",
    label: "Rook",
    attackRangeTiles: 3,
    attackCooldown: 0.75,
    projectileSpeed: 14,
    projectileAoeTiles: 0,
    damage: 1,
    damageType: "physical",
    cost: 10,
  },
  archer: {
    id: "archer",
    label: "Archer",
    attackRangeTiles: 5,
    attackCooldown: 0.45,
    projectileSpeed: 22,
    projectileAoeTiles: 0,
    damage: 1,
    damageType: "physical",
    cost: 10,
  },
  mage: {
    id: "mage",
    label: "Mage",
    attackRangeTiles: 3.5,
    attackCooldown: 1.1,
    projectileSpeed: 10,
    projectileAoeTiles: 1.25,
    damage: 2,
    damageType: "fire",
    cost: 10,
  },
};

export function getTowerStats(typeId: TowerTypeId): TowerStats {
  return TOWER_TYPES[typeId];
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
