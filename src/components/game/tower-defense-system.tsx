"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { RefObject } from "react";

import {
  getTowerMuzzlePosition,
  isWithinTowerStatsRange,
} from "@/lib/tower-combat";
import { getTowerStats, type TowerTypeId } from "@/lib/tower-types";

export type PlacedTower = {
  id: number;
  gx: number;
  gz: number;
  typeId: TowerTypeId;
};

export type FiredProjectile = {
  id: number;
  towerId: number;
  targetEnemyId: number;
  typeId: TowerTypeId;
  damage: number;
  aoeTiles: number;
  speed: number;
  from: [number, number, number];
  to: [number, number, number];
};

type TowerDefenseSystemProps = {
  towers: PlacedTower[];
  enemyPositionsRef: RefObject<Map<number, [number, number, number]>>;
  pendingTargetIdsRef: RefObject<Set<number>>;
  enemyIds: number[];
  onFireProjectile: (projectile: FiredProjectile) => void;
};

export function TowerDefenseSystem({
  towers,
  enemyPositionsRef,
  pendingTargetIdsRef,
  enemyIds,
  onFireProjectile,
}: TowerDefenseSystemProps) {
  const cooldownsRef = useRef(new Map<number, number>());
  const nextProjectileIdRef = useRef(0);

  useFrame((_, delta) => {
    const positions = enemyPositionsRef.current;
    if (!positions || towers.length === 0 || enemyIds.length === 0) {
      return;
    }

    for (const tower of towers) {
      const stats = getTowerStats(tower.typeId);
      const currentCooldown = cooldownsRef.current.get(tower.id) ?? 0;

      if (currentCooldown > 0) {
        cooldownsRef.current.set(tower.id, currentCooldown - delta);
        continue;
      }

      let nearestEnemyId: number | null = null;
      let nearestDistance = Number.POSITIVE_INFINITY;
      const towerMuzzle = getTowerMuzzlePosition(tower.gx, tower.gz);

      for (const enemyId of enemyIds) {
        if (pendingTargetIdsRef.current?.has(enemyId)) {
          continue;
        }

        const enemyPosition = positions.get(enemyId);
        if (!enemyPosition) {
          continue;
        }

        const [enemyX, , enemyZ] = enemyPosition;

        if (!isWithinTowerStatsRange(tower.gx, tower.gz, enemyX, enemyZ, stats)) {
          continue;
        }

        const distance = Math.hypot(
          enemyX - towerMuzzle[0],
          enemyZ - towerMuzzle[2],
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestEnemyId = enemyId;
        }
      }

      if (nearestEnemyId === null) {
        continue;
      }

      const targetPosition = positions.get(nearestEnemyId);
      if (!targetPosition) {
        continue;
      }

      const from = getTowerMuzzlePosition(tower.gx, tower.gz);
      const to: [number, number, number] = [
        targetPosition[0],
        targetPosition[1] + 0.2,
        targetPosition[2],
      ];

      const projectileId = nextProjectileIdRef.current;
      nextProjectileIdRef.current += 1;

      onFireProjectile({
        id: projectileId,
        towerId: tower.id,
        targetEnemyId: nearestEnemyId,
        typeId: stats.id,
        damage: stats.damage,
        aoeTiles: stats.projectileAoeTiles,
        speed: stats.projectileSpeed,
        from,
        to,
      });

      pendingTargetIdsRef.current?.add(nearestEnemyId);
      cooldownsRef.current.set(tower.id, stats.attackCooldown);
    }
  });

  return null;
}
