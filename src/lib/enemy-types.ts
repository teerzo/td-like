import type { DamageType } from "@/lib/damage-types";

export type EnemyMovementType = "ground" | "flying";
export type EnemyTypeId =
  | "grunt"
  | "flyer"
  | "peon"
  | "archer"
  | "knight"
  | "catapult"
  | "dragon";

export const ENEMY_TYPE_IDS: EnemyTypeId[] = [
  "grunt",
  "flyer",
  "peon",
  "archer",
  "knight",
  "catapult",
  "dragon",
];

/** Night auto-spawn pool (computer inbound waves). */
export const NIGHT_WAVE_TYPE_IDS: EnemyTypeId[] = [
  "peon",
  "archer",
  "knight",
  "catapult",
  "dragon",
];

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
  peon: {
    id: "peon",
    label: "Peon",
    movementType: "ground",
    moveSpeed: 1.4,
    health: 1,
    armor: 0,
    immunities: [],
    goldReward: 1,
  },
  archer: {
    id: "archer",
    label: "Archer",
    movementType: "ground",
    moveSpeed: 1.35,
    health: 2,
    armor: 0,
    immunities: [],
    goldReward: 2,
  },
  knight: {
    id: "knight",
    label: "Knight",
    movementType: "ground",
    moveSpeed: 1.05,
    health: 4,
    armor: 1,
    immunities: [],
    goldReward: 3,
  },
  catapult: {
    id: "catapult",
    label: "Catapult",
    movementType: "ground",
    moveSpeed: 0.75,
    health: 5,
    armor: 0,
    immunities: [],
    goldReward: 4,
  },
  dragon: {
    id: "dragon",
    label: "Dragon",
    movementType: "flying",
    moveSpeed: 1.55,
    health: 6,
    armor: 1,
    immunities: [],
    goldReward: 6,
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
