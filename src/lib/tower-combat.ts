import { globalTileWorldPosition } from "@/lib/global-grid";
import { TILE_SPACING } from "@/lib/terrain";
import {
  getTowerAttackRangeWorld,
  type TowerStats,
} from "@/lib/tower-types";

export const TOWER_MUZZLE_Y = 0.9;

export function isWithinTowerStatsRange(
  towerGx: number,
  towerGz: number,
  enemyX: number,
  enemyZ: number,
  stats: TowerStats,
) {
  const { x, z } = globalTileWorldPosition(towerGx, towerGz);

  return (
    Math.hypot(enemyX - x, enemyZ - z) <= getTowerAttackRangeWorld(stats)
  );
}

export function getTowerMuzzlePosition(
  gx: number,
  gz: number,
): [number, number, number] {
  const { x, z } = globalTileWorldPosition(gx, gz);

  return [x, TOWER_MUZZLE_Y, z];
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
