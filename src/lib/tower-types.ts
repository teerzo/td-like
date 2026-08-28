import { TILE_SPACING } from "@/lib/terrain";

export type TowerTypeId = "rook";

export type TowerStats = {
  id: TowerTypeId;
  label: string;
  attackRangeTiles: number;
  attackCooldown: number;
  projectileSpeed: number;
  projectileAoeTiles: number;
  damage: number;
};

export const TOWER_TYPES: Record<TowerTypeId, TowerStats> = {
  rook: {
    id: "rook",
    label: "Rook Tower",
    attackRangeTiles: 3,
    attackCooldown: 0.75,
    projectileSpeed: 14,
    projectileAoeTiles: 0,
    damage: 1,
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
