"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { RefObject } from "react";

import type { DamageType } from "@/lib/damage-types";
import type { EnemyMovementType } from "@/lib/enemy-types";
import {
  getTowerMuzzlePosition,
  isWithinTowerStatsRange,
  pickTowerTarget,
} from "@/lib/tower-combat";
import {
  canTowerTargetMovement,
  getTowerStatsAtLevel,
  type TowerTypeId,
} from "@/lib/tower-types";

export type PlacedTower = {
  id: number;
  gx: number;
  gz: number;
  typeId: TowerTypeId;
  /** Upgrade level; 1 = base. */
  level?: number;
  /** Raised hill placement — grants attack range bonus. */
  onHill?: boolean;
  /** World Y of the tile top when placed on a hill. */
  groundY?: number;
};

export type FiredProjectile = {
  id: number;
  towerId: number;
  targetEnemyId: number;
  typeId: TowerTypeId;
  damage: number;
  damageType: DamageType;
  aoeTiles: number;
  speed: number;
  from: [number, number, number];
  to: [number, number, number];
};

type TowerDefenseSystemProps = {
  towers: PlacedTower[];
  enemyPositionsRef: RefObject<Map<number, [number, number, number]>>;
  pendingTargetIdsRef: RefObject<Set<number>>;
  enemyTargets: { id: number; movementType: EnemyMovementType; hp: number }[];
  onFireProjectile: (projectile: FiredProjectile) => void;
};

export function TowerDefenseSystem({
  towers,
  enemyPositionsRef,
  pendingTargetIdsRef,
  enemyTargets,
  onFireProjectile,
}: TowerDefenseSystemProps) {
  const cooldownsRef = useRef(new Map<number, number>());
  const nextProjectileIdRef = useRef(0);

  useFrame((_, delta) => {
    const positions = enemyPositionsRef.current;
    if (!positions || towers.length === 0 || enemyTargets.length === 0) {
      return;
    }

    for (const tower of towers) {
      const stats = getTowerStatsAtLevel(tower.typeId, tower.level ?? 1);
      const currentCooldown = cooldownsRef.current.get(tower.id) ?? 0;

      if (currentCooldown > 0) {
        cooldownsRef.current.set(tower.id, currentCooldown - delta);
        continue;
      }

      const candidates: { id: number; hp: number; distance: number }[] = [];
      const groundY = tower.groundY ?? 0;
      const towerMuzzle = getTowerMuzzlePosition(tower.gx, tower.gz, groundY);

      for (const { id: enemyId, movementType, hp } of enemyTargets) {
        if (pendingTargetIdsRef.current?.has(enemyId)) {
          continue;
        }

        if (!canTowerTargetMovement(stats, movementType)) {
          continue;
        }

        const enemyPosition = positions.get(enemyId);
        if (!enemyPosition) {
          continue;
        }

        const [enemyX, , enemyZ] = enemyPosition;

        if (
          !isWithinTowerStatsRange(
            tower.gx,
            tower.gz,
            enemyX,
            enemyZ,
            stats,
            !!tower.onHill,
          )
        ) {
          continue;
        }

        candidates.push({
          id: enemyId,
          hp,
          distance: Math.hypot(
            enemyX - towerMuzzle[0],
            enemyZ - towerMuzzle[2],
          ),
        });
      }

      const selectedEnemyId = pickTowerTarget(candidates, stats.targetPriority);

      if (selectedEnemyId === null) {
        continue;
      }

      const targetPosition = positions.get(selectedEnemyId);
      if (!targetPosition) {
        continue;
      }

      const from = getTowerMuzzlePosition(tower.gx, tower.gz, groundY);
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
        targetEnemyId: selectedEnemyId,
        typeId: stats.id,
        damage: stats.damage,
        damageType: stats.damageType,
        aoeTiles: stats.projectileAoeTiles,
        speed: stats.projectileSpeed,
        from,
        to,
      });

      pendingTargetIdsRef.current?.add(selectedEnemyId);
      cooldownsRef.current.set(tower.id, stats.attackCooldown);
    }
  });

  return null;
}
