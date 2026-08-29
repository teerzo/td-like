import { globalTileWorldPosition } from "@/lib/global-grid";
import { TILE_SPACING } from "@/lib/terrain";
import {
  getAttackRangeWorldFromTiles,
  HILL_TOWER_RANGE_BONUS_TILES,
  type TowerStats,
} from "@/lib/tower-types";

export const TOWER_MUZZLE_Y = 0.9;

export function getEffectiveAttackRangeTiles(
  stats: TowerStats,
  onHill = false,
) {
  return (
    stats.attackRangeTiles + (onHill ? HILL_TOWER_RANGE_BONUS_TILES : 0)
  );
}

export function isWithinTowerStatsRange(
  towerGx: number,
  towerGz: number,
  enemyX: number,
  enemyZ: number,
  stats: TowerStats,
  onHill = false,
) {
  const { x, z } = globalTileWorldPosition(towerGx, towerGz);
  const rangeWorld = getAttackRangeWorldFromTiles(
    getEffectiveAttackRangeTiles(stats, onHill),
  );

  return Math.hypot(enemyX - x, enemyZ - z) <= rangeWorld;
}

export function getTowerMuzzlePosition(
  gx: number,
  gz: number,
  groundY = 0,
): [number, number, number] {
  const { x, z } = globalTileWorldPosition(gx, gz);

  return [x, TOWER_MUZZLE_Y + groundY, z];
}

export function getEnemiesInAoe(
  impactX: number,
  impactZ: number,
  aoeTiles: number,
  enemyPositions: ReadonlyMap<number, [number, number, number]>,
  directTargetId?: number,
) {
  if (aoeTiles <= 0) {
    return directTargetId === undefined ? [] : [directTargetId];
  }

  const aoeRadius = aoeTiles * TILE_SPACING;
  const hitIds: number[] = [];

  for (const [enemyId, position] of enemyPositions) {
    const [enemyX, , enemyZ] = position;

    if (Math.hypot(enemyX - impactX, enemyZ - impactZ) <= aoeRadius) {
      hitIds.push(enemyId);
    }
  }

  if (directTargetId !== undefined && !hitIds.includes(directTargetId)) {
    hitIds.push(directTargetId);
  }

  return hitIds;
}
