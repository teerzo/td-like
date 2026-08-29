import type { DamageType } from "@/lib/damage-types";

export type EnemyMovementType = "ground" | "flying";
export type EnemyTypeId = "grunt" | "flyer";

export const ENEMY_TYPE_IDS: EnemyTypeId[] = ["grunt", "flyer"];

export type EnemyStats = {
  id: EnemyTypeId;
  label: string;
  movementType: EnemyMovementType;
  moveSpeed: number;
  health: number;
  armor: number;
  immunities: DamageType[];
  goldReward: number;
};

export const ENEMY_TYPES: Record<EnemyTypeId, EnemyStats> = {
  grunt: {
    id: "grunt",
    label: "Grunt",
    movementType: "ground",
    moveSpeed: 1.25,
    health: 1,
    armor: 0,
    immunities: [],
    goldReward: 1,
  },
  flyer: {
    id: "flyer",
    label: "Flyer",
    movementType: "flying",
    moveSpeed: 1.75,
    health: 1,
    armor: 0,
    immunities: [],
    goldReward: 1,
  },
};

export function getEnemyStats(typeId: EnemyTypeId): EnemyStats {
  return ENEMY_TYPES[typeId];
}

/** Apply immunity + armor; returns HP lost this hit. */
export function computeDamageTaken(
  stats: EnemyStats,
  amount: number,
  damageType: DamageType,
) {
  if (stats.immunities.includes(damageType)) {
    return 0;
  }

  return Math.max(0, amount - stats.armor);
}
