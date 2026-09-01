import type { DamageType } from "@/lib/damage-types";

export type EnemyMovementType = "ground" | "flying";

/** Tags used for tower role counters. */
export type EnemyRole =
  | "swarm"
  | "skirmisher"
  | "armored"
  | "siege"
  | "flying";

export type EnemyTypeId =
  | "peon"
  | "bat"
  | "archer"
  | "knight"
  | "catapult"
  | "dragon";

export const ENEMY_TYPE_IDS: EnemyTypeId[] = [
  "peon",
  "bat",
  "archer",
  "knight",
  "catapult",
  "dragon",
];

/** Night auto-spawn pool (computer inbound waves). */
export const NIGHT_WAVE_TYPE_IDS: EnemyTypeId[] = [
  "peon",
  "bat",
  "archer",
  "knight",
  "catapult",
  "dragon",
];

export type EnemyStats = {
  id: EnemyTypeId;
  label: string;
  movementType: EnemyMovementType;
  roles: readonly EnemyRole[];
  moveSpeed: number;
  health: number;
  armor: number;
  immunities: DamageType[];
  goldReward: number;
};

export const ENEMY_TYPES: Record<EnemyTypeId, EnemyStats> = {
  peon: {
    id: "peon",
    label: "Peon",
    movementType: "ground",
    roles: ["swarm"],
    moveSpeed: 1.4,
    health: 10,
    armor: 0,
    immunities: [],
    goldReward: 1,
  },
  bat: {
    id: "bat",
    label: "Bat",
    movementType: "flying",
    roles: ["flying", "swarm"],
    moveSpeed: 1.1,
    health: 5,
    armor: 0,
    immunities: [],
    goldReward: 1,
  },
  archer: {
    id: "archer",
    label: "Archer",
    movementType: "ground",
    roles: ["skirmisher"],
    moveSpeed: 1.35,
    health: 15,
    armor: 0,
    immunities: [],
    goldReward: 1,
  },
  knight: {
    id: "knight",
    label: "Knight",
    movementType: "ground",
    roles: ["armored"],
    moveSpeed: 1.05,
    health: 32,
    armor: 2,
    immunities: [],
    goldReward: 1,
  },
  catapult: {
    id: "catapult",
    label: "Catapult",
    movementType: "ground",
    roles: ["siege"],
    moveSpeed: 0.75,
    health: 45,
    armor: 0,
    immunities: [],
    goldReward: 1,
  },
  dragon: {
    id: "dragon",
    label: "Dragon",
    movementType: "flying",
    roles: ["flying", "armored"],
    moveSpeed: 1.55,
    health: 28,
    armor: 2,
    immunities: [],
    goldReward: 1,
  },
};

export function getEnemyStats(typeId: EnemyTypeId): EnemyStats {
  return ENEMY_TYPES[typeId];
}

/** +8% move speed per wave after wave 1 (wave 1 = 1×). */
export const WAVE_MOVE_SPEED_BONUS_PER_LEVEL = 0.08;
export const WAVE_MOVE_SPEED_MAX_MULTIPLIER = 2.5;

export function getWaveMoveSpeedMultiplier(waveLevel: number): number {
  const steps = Math.max(0, waveLevel - 1);
  const multiplier = 1 + steps * WAVE_MOVE_SPEED_BONUS_PER_LEVEL;
  return Math.min(WAVE_MOVE_SPEED_MAX_MULTIPLIER, multiplier);
}

export function getEnemyMoveSpeedForWave(
  baseMoveSpeed: number,
  waveLevel: number,
): number {
  return baseMoveSpeed * getWaveMoveSpeedMultiplier(waveLevel);
}

/** Base ms between inbound spawns at wave 1; reduced each wave (faster spawns). */
export const WAVE_SPAWN_STAGGER_BASE_MS = 900;
export const WAVE_SPAWN_STAGGER_REDUCTION_PER_LEVEL = 0.04;
export const WAVE_SPAWN_STAGGER_MIN_MULTIPLIER = 0.45;

export function getWaveSpawnStaggerMs(waveLevel: number): number {
  const steps = Math.max(0, waveLevel - 1);
  const multiplier = Math.max(
    WAVE_SPAWN_STAGGER_MIN_MULTIPLIER,
    1 - steps * WAVE_SPAWN_STAGGER_REDUCTION_PER_LEVEL,
  );
  return Math.round(WAVE_SPAWN_STAGGER_BASE_MS * multiplier);
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
